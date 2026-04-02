import type { FastifyInstance } from 'fastify';
import { executeMany, select } from '../db/query';
import { OWNER } from '../utils/env';
import { extractCodcli, handleAuthError } from '../utils/auth';
import { getOrSetCache, invalidateCache } from '../utils/ttlCache';

type Notification = {
  id: string;
  type: 'sac' | 'boleto' | 'pedido';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  meta?: Record<string, any>;
};

type ReadNotificationRow = {
  NOTIF_ID: string;
};

type SacNotificationRow = {
  NUMTICKET: number;
  RELATOCLIENTE?: string | null;
  STATUS?: string | null;
  DTABERTURA?: Date | string | null;
  DTFINALIZA?: Date | string | null;
};

type BoletoNotificationRow = {
  NUMTRANSVENDA: number;
  PREST: number;
  VALOR?: number | null;
  DTVENC?: Date | string | null;
};

type PedidoNotificationRow = {
  NUMPED: number;
  VLTOTAL?: number | null;
  DATA?: Date | string | null;
  DTFAT?: Date | string | null;
  NUMNOTA?: number | null;
};

const NOTIFICATIONS_TTL_MS = 30_000;

function toIsoTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export default async function notificationsRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);

      const payload = await getOrSetCache(
        `notifications:${codcli}`,
        NOTIFICATIONS_TTL_MS,
        async () => {
          const [readRows, sacRows, boletoRows, pedidoRows] = await Promise.all([
            select<ReadNotificationRow>(
              `SELECT NOTIF_ID FROM ${OWNER}.BRSACC_NOTIF_READ WHERE CODCLI = :CODCLI`,
              { CODCLI: codcli }
            ).catch((err) => {
              app.log.warn({ err }, 'Notifications: read-state query failed');
              return [];
            }),
            select<SacNotificationRow>(
              `
              SELECT
                B.NUMTICKET,
                B.RELATOCLIENTE,
                B.STATUS,
                B.DTABERTURA,
                B.DTFINALIZA
              FROM ${OWNER}.BRSACC B
              WHERE B.CODCLI = :CODCLI
                AND B.NUMTICKET = B.NUMTICKETPRINC
                AND NVL(B.STATUS, '') <> 'Cancelado'
                AND (
                  B.DTABERTURA >= TRUNC(SYSDATE) - 7
                  OR (B.DTFINALIZA IS NOT NULL AND B.DTFINALIZA >= TRUNC(SYSDATE) - 7)
                )
              ORDER BY B.DTABERTURA DESC
              FETCH FIRST 5 ROWS ONLY
              `,
              { CODCLI: codcli }
            ).catch((err) => {
              app.log.warn({ err }, 'Notifications: SAC query failed');
              return [];
            }),
            select<BoletoNotificationRow>(
              `
              SELECT
                P.NUMTRANSVENDA,
                P.PREST,
                P.VALOR,
                P.DTVENC
              FROM ${OWNER}.PCPREST P
              WHERE P.CODCLI = :CODCLI
                AND P.DTPAG IS NULL
                AND P.DTCANCEL IS NULL
                AND P.CODCOB NOT IN ('DESD', 'CANC')
                AND P.DTVENC BETWEEN TRUNC(SYSDATE) - 3 AND TRUNC(SYSDATE) + 10
              ORDER BY P.DTVENC ASC
              FETCH FIRST 5 ROWS ONLY
              `,
              { CODCLI: codcli }
            ).catch((err) => {
              app.log.warn({ err }, 'Notifications: boleto query failed');
              return [];
            }),
            select<PedidoNotificationRow>(
              `
              SELECT
                P.NUMPED,
                P.VLTOTAL,
                P.DATA,
                P.DTFAT,
                P.NUMNOTA
              FROM ${OWNER}.PCPEDC P
              WHERE P.CODCLI = :CODCLI
                AND P.DTFAT IS NOT NULL
                AND P.DTFAT >= TRUNC(SYSDATE) - 3
                AND P.POSICAO NOT IN ('C')
              ORDER BY P.DTFAT DESC
              FETCH FIRST 5 ROWS ONLY
              `,
              { CODCLI: codcli }
            ).catch((err) => {
              app.log.warn({ err }, 'Notifications: pedidos query failed');
              return [];
            }),
          ]);

          const readIds = new Set(readRows.map((row) => row.NOTIF_ID));
          const notifications: Notification[] = [];

          sacRows.forEach((row) => {
            const isClosed = !!row.DTFINALIZA;
            const id = `sac-${row.NUMTICKET}`;

            notifications.push({
              id,
              type: 'sac',
              title: isClosed ? 'Ticket SAC finalizado' : 'Ticket SAC em andamento',
              description: row.RELATOCLIENTE?.substring(0, 100) || `Ticket #${row.NUMTICKET}`,
              timestamp: toIsoTimestamp(row.DTFINALIZA || row.DTABERTURA),
              read: readIds.has(id),
              meta: {
                ticketId: row.NUMTICKET,
                status: isClosed ? 'finalizado' : 'em_andamento',
              },
            });
          });

          boletoRows.forEach((row) => {
            const dueDate = row.DTVENC ? new Date(row.DTVENC) : new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isOverdue = dueDate < today;
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
            const value = Number(row.VALOR ?? 0);

            let description = '';
            if (isOverdue) {
              description = `Boleto R$ ${value.toFixed(2)} vencido ha ${Math.abs(diffDays)} dia(s)`;
            } else if (diffDays === 0) {
              description = `Boleto R$ ${value.toFixed(2)} vence hoje`;
            } else {
              description = `Boleto R$ ${value.toFixed(2)} vence em ${diffDays} dia(s)`;
            }

            const id = `boleto-${row.NUMTRANSVENDA}-${row.PREST}`;
            notifications.push({
              id,
              type: 'boleto',
              title: isOverdue ? 'Boleto vencido' : 'Boleto proximo do vencimento',
              description,
              timestamp: toIsoTimestamp(dueDate),
              read: readIds.has(id),
              meta: {
                valor: value,
                vencimento: toIsoTimestamp(dueDate),
                overdue: isOverdue,
              },
            });
          });

          pedidoRows.forEach((row) => {
            const id = `pedido-${row.NUMPED}`;

            notifications.push({
              id,
              type: 'pedido',
              title: 'Pedido faturado',
              description: `Pedido #${row.NUMPED} - NF ${row.NUMNOTA || 'N/A'} - R$ ${Number(row.VLTOTAL ?? 0).toFixed(2)}`,
              timestamp: toIsoTimestamp(row.DTFAT || row.DATA),
              read: readIds.has(id),
              meta: {
                numped: row.NUMPED,
                numnota: row.NUMNOTA,
                valor: Number(row.VLTOTAL ?? 0),
              },
            });
          });

          notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          return {
            notifications,
            total: notifications.length,
          };
        }
      );

      return reply.send(payload);
    } catch (err: any) {
      return handleAuthError(err, reply);
    }
  });

  app.post('/read', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const { ids } = req.body as { ids: string[] };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ error: 'IDs de notificacao sao obrigatorios' });
      }

      const uniqueIds = [
        ...new Set(
          ids
            .map((id) => `${id}`.trim().slice(0, 100))
            .filter(Boolean)
        ),
      ];

      if (uniqueIds.length === 0) {
        return reply.status(400).send({ error: 'IDs de notificacao sao obrigatorios' });
      }

      try {
        await executeMany(
          `
          MERGE INTO ${OWNER}.BRSACC_NOTIF_READ target
          USING (SELECT :CODCLI AS CODCLI, :NID AS NOTIF_ID FROM DUAL) source
            ON (target.CODCLI = source.CODCLI AND target.NOTIF_ID = source.NOTIF_ID)
          WHEN NOT MATCHED THEN
            INSERT (CODCLI, NOTIF_ID)
            VALUES (source.CODCLI, source.NOTIF_ID)
          `,
          uniqueIds.map((notificationId) => ({
            CODCLI: codcli,
            NID: notificationId,
          }))
        );
      } catch (err) {
        app.log.warn({ err }, 'Notifications: batch read update failed');
      }

      invalidateCache(`notifications:${codcli}`);

      return reply.send({ ok: true, count: uniqueIds.length });
    } catch (err: any) {
      return handleAuthError(err, reply);
    }
  });
}
