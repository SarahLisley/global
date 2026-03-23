import type { FastifyInstance } from 'fastify';
import { select, execute } from '../db/query';
import { OWNER } from '../utils/env';
import { extractCodcli, handleAuthError } from '../utils/auth';

type Notification = {
  id: string;
  type: 'sac' | 'boleto' | 'pedido';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  meta?: Record<string, any>;
};

export default async function notificationsRoutes(app: FastifyInstance) {

  // GET / — retorna notificações derivadas dos dados reais do Oracle
  app.get('/', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const notifications: Notification[] = [];

      // Buscar IDs de notificações já lidas no banco
      let readRows: { NOTIF_ID: string }[] = [];
      try {
        readRows = await select<{ NOTIF_ID: string }>(
          `SELECT NOTIF_ID FROM ${OWNER}.BRSACC_NOTIF_READ WHERE CODCLI = :CODCLI`,
          { CODCLI: codcli }
        );
      } catch (e) {
        app.log.warn({ err: e }, 'Notifications: BRSACC_NOTIF_READ query failed. Table might not exist.');
      }
      const readIds = new Set(readRows.map(r => r.NOTIF_ID));

      // 1. Tickets SAC com atividade recente (últimos 7 dias)
      try {
        const sacRows = await select<any>(`
          SELECT
            B.NUMTICKET,
            B.RELATOCLIENTE,
            B.STATUS,
            B.DTABERTURA,
            B.DTFINALIZA
          FROM ${OWNER}.BRSACC B
          WHERE B.CODCLI = :CODCLI
            AND B.NUMTICKET = B.NUMTICKETPRINC
            AND NVL(B.STATUS,'') <> 'Cancelado'
            AND (
              TRUNC(B.DTABERTURA) >= TRUNC(SYSDATE) - 7
              OR (B.DTFINALIZA IS NOT NULL AND TRUNC(B.DTFINALIZA) >= TRUNC(SYSDATE) - 7)
            )
          ORDER BY B.DTABERTURA DESC
          FETCH FIRST 5 ROWS ONLY
        `, { CODCLI: codcli });

        sacRows.forEach((r: any) => {
          const isClosed = !!r.DTFINALIZA;
          const nid = `sac-${r.NUMTICKET}`;
          notifications.push({
            id: nid,
            type: 'sac',
            title: isClosed ? 'Ticket SAC finalizado' : 'Ticket SAC em andamento',
            description: r.RELATOCLIENTE
              ? (r.RELATOCLIENTE as string).substring(0, 100)
              : `Ticket #${r.NUMTICKET}`,
            timestamp: (r.DTFINALIZA || r.DTABERTURA)
              ? new Date(r.DTFINALIZA || r.DTABERTURA).toISOString()
              : new Date().toISOString(),
            read: readIds.has(nid),
            meta: { ticketId: r.NUMTICKET, status: isClosed ? 'finalizado' : 'em_andamento' },
          });
        });
      } catch (e) {
        app.log.warn({ err: e }, 'Notifications: SAC query failed');
      }

      // 2. Boletos próximos do vencimento (próximos 10 dias) ou vencidos recentemente (últimos 3 dias)
      try {
        const boletoRows = await select<any>(`
          SELECT
            P.NUMTRANSVENDA,
            P.DUPLIC,
            P.PREST,
            P.VALOR,
            P.DTVENC
          FROM ${OWNER}.PCPREST P
          WHERE P.CODCLI = :CODCLI
            AND P.DTPAG IS NULL
            AND P.DTCANCEL IS NULL
            AND P.CODCOB NOT IN ('DESD','CANC')
            AND P.DTVENC BETWEEN TRUNC(SYSDATE) - 3 AND TRUNC(SYSDATE) + 10
          ORDER BY P.DTVENC ASC
          FETCH FIRST 5 ROWS ONLY
        `, { CODCLI: codcli });

        boletoRows.forEach((r: any) => {
          const venc = new Date(r.DTVENC);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const isOverdue = venc < hoje;
          const diffDays = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

          let desc = '';
          if (isOverdue) {
            desc = `Boleto R$ ${Number(r.VALOR).toFixed(2)} vencido há ${Math.abs(diffDays)} dia(s)`;
          } else if (diffDays === 0) {
            desc = `Boleto R$ ${Number(r.VALOR).toFixed(2)} vence hoje`;
          } else {
            desc = `Boleto R$ ${Number(r.VALOR).toFixed(2)} vence em ${diffDays} dia(s)`;
          }

          const nid = `boleto-${r.NUMTRANSVENDA}-${r.PREST}`;
          notifications.push({
            id: nid,
            type: 'boleto',
            title: isOverdue ? 'Boleto vencido' : 'Boleto próximo do vencimento',
            description: desc,
            timestamp: venc.toISOString(),
            read: readIds.has(nid),
            meta: { valor: Number(r.VALOR), vencimento: venc.toISOString(), overdue: isOverdue },
          });
        });
      } catch (e) {
        app.log.warn({ err: e }, 'Notifications: Boleto query failed');
      }

      // 3. Pedidos recentes faturados (últimos 3 dias)
      try {
        const pedidoRows = await select<any>(`
          SELECT
            P.NUMPED,
            P.VLTOTAL,
            P.DATA,
            P.DTFAT,
            P.NUMNOTA
          FROM ${OWNER}.PCPEDC P
          WHERE P.CODCLI = :CODCLI
            AND P.DTFAT IS NOT NULL
            AND TRUNC(P.DTFAT) >= TRUNC(SYSDATE) - 3
            AND P.POSICAO NOT IN ('C')
          ORDER BY P.DTFAT DESC
          FETCH FIRST 5 ROWS ONLY
        `, { CODCLI: codcli });

        pedidoRows.forEach((r: any) => {
          const nid = `pedido-${r.NUMPED}`;
          notifications.push({
            id: nid,
            type: 'pedido',
            title: 'Pedido faturado',
            description: `Pedido #${r.NUMPED} — NF ${r.NUMNOTA || 'N/A'} — R$ ${Number(r.VLTOTAL ?? 0).toFixed(2)}`,
            timestamp: r.DTFAT ? new Date(r.DTFAT).toISOString() : new Date().toISOString(),
            read: readIds.has(nid),
            meta: { numped: r.NUMPED, numnota: r.NUMNOTA, valor: Number(r.VLTOTAL ?? 0) },
          });
        });
      } catch (e) {
        app.log.warn({ err: e }, 'Notifications: Pedidos query failed');
      }

      // Ordenar por timestamp mais recente
      notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return reply.send({ notifications, total: notifications.length });
    } catch (err: any) {
      return handleAuthError(err, reply);
    }
  });

  // POST /read — marca uma ou mais notificações como lidas no banco
  app.post('/read', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const { ids } = req.body as { ids: string[] };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({ error: 'IDs de notificação são obrigatórios' });
      }

      // Inserir ignorando duplicatas (o UNIQUE_NOTIF_READ do plano impede duas vezes a mesma)
      for (const nid of ids) {
        try {
          await execute(
            `INSERT INTO ${OWNER}.BRSACC_NOTIF_READ (CODCLI, NOTIF_ID) VALUES (:CODCLI, :NID)`,
            { CODCLI: codcli, NID: nid.substring(0, 100) }
          );
        } catch (e) {
          // Ignora erro de PK violada (já lida)
        }
      }

      return reply.send({ ok: true });
    } catch (err: any) {
      return handleAuthError(err, reply);
    }
  });
}
