import type { FastifyInstance } from 'fastify';
import { getSACSeries, createTicket } from '../controllers/sacController';
import { execute, select } from '../db/query';
import { OWNER } from '../utils/env';
import { extractCodcli, handleAuthError } from '../utils/auth';
import { getOrSetCache, invalidateCache } from '../utils/ttlCache';
import { sendToUser } from '../utils/websocketManager';
import { COMMENTS_SELECT_SQL, mapCommentRow, normalizeStatus, parseTicketId } from './sac-helpers';
import type { CommentRow } from './sac-helpers';

const TICKETS_LIST_TTL_MS = 30_000;
const TICKET_DETAIL_TTL_MS = 30_000;

type TicketListQuery = {
  dateFrom?: string;
  dateTo?: string;
  status?: 'todos' | 'em_andamento' | 'finalizado' | 'pendente';
  orderNumber?: string | number;
  invoiceNumber?: string | number;
  page?: string | number;
  pageSize?: string | number;
};

type TicketListRow = {
  NUMTICKET: number;
  DTABERTURA: Date | string;
  DTFINALIZA?: Date | string | null;
  NUMPED?: number | null;
  NUMNOTA?: number | null;
  RELATOCLIENTE?: string | null;
  STATUS?: string | null;
  TOTAL_COUNT?: number | null;
};

type TicketDetailRow = {
  NUMTICKET: number;
  DTABERTURA: Date | string;
  DTFINALIZA?: Date | string | null;
  NUMPED?: number | null;
  NUMNOTA?: number | null;
  RELATOCLIENTE?: string | null;
  STATUS?: string | null;
  CODFILIAL?: string | number | null;
};

type TicketTimelineRow = {
  NUMSEQ: number;
  DTMOV?: Date | string | null;
  DTMOV_FINAL?: Date | string | null;
  DESCRICAO?: string | null;
  STATUS?: string | null;
};

function buildPendingStatusWhere() {
  return `
    BRSACC.DTFINALIZA IS NULL
    AND NVL(BRSACC.STATUS, '') IN ('Aberto', 'Inicial', 'ABERTO', 'INICIAL', 'aberto', 'inicial')
  `;
}

function buildTicketListCacheKey(codcli: number | null, tipo: string | null, query: TicketListQuery, page: number, pageSize: number) {
  return JSON.stringify({
    codcli,
    tipo,
    dateFrom: query.dateFrom ?? null,
    dateTo: query.dateTo ?? null,
    status: query.status ?? null,
    orderNumber: query.orderNumber ?? null,
    invoiceNumber: query.invoiceNumber ?? null,
    page,
    pageSize,
  });
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function invalidateSacCaches(codcli: number | null, ticketId?: number) {
  if (codcli) {
    invalidateCache(`sac:tickets:${codcli}:`);
    invalidateCache(`sac:series:${codcli}`);
    if (ticketId != null) {
      invalidateCache(`sac:ticket:${codcli}:${ticketId}`);
    }
  }
  // Invalida cache global se houver
  invalidateCache(`sac:tickets:null:`);
}

export default async function sacRoutes(app: FastifyInstance) {
  app.get('/series', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
      const series = await getSACSeries({ codcli, tipo });
      return reply.send(series);
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.get('/tickets', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
      const isAdmin = tipo === 'A';
      const q = req.query as TicketListQuery;

      const page = Math.max(1, Number(q.page ?? 1));
      const pageSize = Math.max(1, Math.min(100, Number(q.pageSize ?? 20)));
      const offset = (page - 1) * pageSize;

      const payload = await getOrSetCache(
        `sac:tickets:${codcli}:${buildTicketListCacheKey(codcli, tipo, q, page, pageSize)}`,
        TICKETS_LIST_TTL_MS,
        async () => {
          const binds: Record<string, unknown> = {
            OFFSET: offset,
            LIMIT: pageSize,
          };

          const where: string[] = [
            'BRSACC.NUMTICKET = BRSACC.NUMTICKETPRINC',
            "NVL(BRSACC.STATUS,'') <> 'Cancelado'",
          ];

          if (codcli) {
            where.push('BRSACC.CODCLI = :CODCLI');
            binds.CODCLI = codcli;
          }

          if (q.dateFrom) {
            where.push("BRSACC.DTABERTURA >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD')");
            binds.DATE_FROM = q.dateFrom;
          }
          if (q.dateTo) {
            where.push("BRSACC.DTABERTURA < TO_DATE(:DATE_TO, 'YYYY-MM-DD') + 1");
            binds.DATE_TO = q.dateTo;
          }
          if (q.orderNumber) {
            where.push('BRSACC.NUMPED = :NUMPED');
            binds.NUMPED = Number(q.orderNumber);
          }
          if (q.invoiceNumber) {
            where.push('BRSACC.NUMNOTA = :NUMNOTA');
            binds.NUMNOTA = Number(q.invoiceNumber);
          }

          if (q.status && q.status !== 'todos') {
            if (q.status === 'finalizado') {
              where.push('BRSACC.DTFINALIZA IS NOT NULL');
            } else if (q.status === 'pendente') {
              where.push(buildPendingStatusWhere());
            } else if (q.status === 'em_andamento') {
              where.push('BRSACC.DTFINALIZA IS NULL');
            }
          }

          const rows = await select<TicketListRow>(
            `
            SELECT
              BRSACC.NUMTICKET,
              BRSACC.DTABERTURA,
              BRSACC.DTFINALIZA,
              BRSACC.NUMPED,
              BRSACC.NUMNOTA,
              BRSACC.RELATOCLIENTE,
              BRSACC.STATUS,
              COUNT(*) OVER() AS TOTAL_COUNT
            FROM ${OWNER}.BRSACC
            WHERE ${where.join(' AND ')}
            ORDER BY BRSACC.DTABERTURA DESC
            OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
            `,
            binds
          );

          const total = Number(rows[0]?.TOTAL_COUNT ?? 0);
          const list = rows.map((row) => ({
            id: String(row.NUMTICKET),
            openedAt: toIsoDate(row.DTABERTURA) ?? new Date().toISOString(),
            closedAt: toIsoDate(row.DTFINALIZA),
            orderNumber: row.NUMPED ?? undefined,
            invoiceNumber: row.NUMNOTA ?? undefined,
            subject: String(row.RELATOCLIENTE ?? ''),
            status: normalizeStatus(row.STATUS, row.DTFINALIZA),
          }));

          return { ok: true, list, page, pageSize, total };
        }
      );

      return reply.send(payload);
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.get('/tickets/:id', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
      const isAdmin = tipo === 'A';
      const numTicket = parseTicketId(req);

      const payload = await getOrSetCache(
        `sac:ticket:${codcli}:${numTicket}`,
        TICKET_DETAIL_TTL_MS,
        async () => {
          const rows = await select<TicketDetailRow>(
            `
            SELECT
              BRSACC.NUMTICKET,
              BRSACC.DTABERTURA,
              BRSACC.DTFINALIZA,
              BRSACC.NUMPED,
              BRSACC.NUMNOTA,
              BRSACC.RELATOCLIENTE,
              BRSACC.STATUS,
              BRSACC.CODFILIAL
            FROM ${OWNER}.BRSACC
            WHERE BRSACC.NUMTICKET = :NUMTICKET
              AND BRSACC.NUMTICKET = BRSACC.NUMTICKETPRINC
              ${codcli ? 'AND BRSACC.CODCLI = :CODCLI' : ''}
              AND NVL(BRSACC.STATUS,'') <> 'Cancelado'
            `,
            codcli ? { NUMTICKET: numTicket, CODCLI: codcli } : { NUMTICKET: numTicket }
          );

          if (!rows.length) {
            return null;
          }

          const row = rows[0];
          const history = await select<TicketTimelineRow>(
            `
            SELECT
              BRSACC.NUMSEQ,
              BRSACC.DTABERTURA AS DTMOV,
              BRSACC.DTFINALIZA AS DTMOV_FINAL,
              BRSACC.RELATOCLIENTE AS DESCRICAO,
              BRSACC.STATUS
            FROM ${OWNER}.BRSACC
            WHERE BRSACC.NUMTICKETPRINC = :NUMTICKET
              ${codcli ? 'AND BRSACC.CODCLI = :CODCLI' : ''}
              AND NVL(BRSACC.STATUS,'') <> 'Cancelado'
            ORDER BY BRSACC.NUMSEQ ASC
            `,
            codcli ? { NUMTICKET: numTicket, CODCLI: codcli } : { NUMTICKET: numTicket }
          );

          let commentRows: CommentRow[] = [];
          try {
            commentRows = await select<CommentRow>(COMMENTS_SELECT_SQL, { NUMTICKET: numTicket });
          } catch (err: any) {
            const msg = err.message || String(err);
            if (!msg.includes('ORA-00942') && !msg.includes('ORA-00903')) {
              throw err;
            }
            // Falha silenciosa: se a tabela BRSACC_COMMENTS não existir, retorna sem comentários.
          }

          const ticket = {
            id: String(row.NUMTICKET),
            openedAt: toIsoDate(row.DTABERTURA) ?? new Date().toISOString(),
            closedAt: toIsoDate(row.DTFINALIZA),
            orderNumber: row.NUMPED ?? undefined,
            invoiceNumber: row.NUMNOTA ?? undefined,
            subject: String(row.RELATOCLIENTE ?? ''),
            status: normalizeStatus(row.STATUS, row.DTFINALIZA),
            branch: row.CODFILIAL ? String(row.CODFILIAL) : undefined,
          };

          const timeline = history.map((item) => ({
            seq: Number(item.NUMSEQ),
            when: toIsoDate(item.DTMOV ?? item.DTMOV_FINAL ?? row.DTABERTURA) ?? new Date().toISOString(),
            description: String(item.DESCRICAO ?? ''),
            status: normalizeStatus(item.STATUS, item.DTMOV_FINAL),
          }));

          const comments = commentRows.map(mapCommentRow);

          return { ok: true, ticket, timeline, comments };
        }
      );

      if (!payload) {
        return reply.status(404).send({ error: 'Ticket não encontrado' });
      }

      return reply.send(payload);
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.post('/tickets', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
      const body = (req.body ?? {}) as {
        subject?: string;
        orderNumber?: string | number;
        invoiceNumber?: string | number;
        codfilial?: string;
      };

      if (!body.subject || !String(body.subject).trim()) {
        return reply.status(400).send({ error: 'Assunto (subject) é obrigatório' });
      }

      const created = await createTicket({
        codcli: codcli ?? (body as any).codcli, 
        subject: String(body.subject),
        orderNumber: body.orderNumber,
        invoiceNumber: body.invoiceNumber,
        codfilial: body.codfilial ?? '1',
        tipo,
      });

      invalidateSacCaches(codcli, created.numTicket);

      return reply.send({ ok: true, ticket: created });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.put('/tickets/:id/close', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const numTicket = parseTicketId(req);

      const rowsAffected = await execute(
        `UPDATE ${OWNER}.BRSACC
         SET STATUS = 'Finalizado', DTFINALIZA = SYSDATE
         WHERE NUMTICKET = :NUMTICKET 
           ${codcli ? 'AND BRSACC.CODCLI = :CODCLI' : ''} 
           AND DTFINALIZA IS NULL`,
        codcli ? { NUMTICKET: numTicket, CODCLI: codcli } : { NUMTICKET: numTicket }
      );

      if (rowsAffected === 0) {
        const check = await select(
          `SELECT NUMTICKET, DTFINALIZA FROM ${OWNER}.BRSACC WHERE NUMTICKET = :ID`,
          { ID: numTicket }
        );
        if (check.length === 0) return reply.status(404).send({ error: 'Ticket não encontrado' });
        if ((check[0] as any).DTFINALIZA) return reply.status(400).send({ error: 'Ticket já está finalizado' });
        return reply.status(403).send({ error: 'Sem permissão' });
      }

      invalidateSacCaches(codcli, numTicket);

      if (codcli) {
        sendToUser(codcli, {
          type: 'NOTIFICATION',
          message: `O Ticket #${numTicket} foi finalizado. Não esqueça de avaliar o nosso atendimento!`,
        });
      }

      return reply.send({ ok: true });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
