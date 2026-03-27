import type { FastifyInstance } from 'fastify';
import { getSACSeries, createTicket } from '../controllers/sacController';
import { select, execute } from '../db/query';
import { OWNER } from '../utils/env';
import { extractCodcli, handleAuthError } from '../utils/auth';
import { sendToUser } from '../utils/websocketManager';
import { parseTicketId, normalizeStatus, mapCommentRow, COMMENTS_SELECT_SQL } from './sac-helpers';
import type { CommentRow } from './sac-helpers';

export default async function sacRoutes(app: FastifyInstance) {

  // ────────── Séries (gráfico) ──────────

  app.get('/series', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const series = await getSACSeries({ codcli });
      return reply.send(series);
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Listar tickets ──────────

  app.get('/tickets', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);

      const q = req.query as {
        dateFrom?: string;
        dateTo?: string;
        status?: 'todos' | 'em_andamento' | 'finalizado' | 'pendente';
        orderNumber?: string | number;
        invoiceNumber?: string | number;
        page?: string | number;
        pageSize?: string | number;
      };

      const page = Math.max(1, Number(q.page ?? 1));
      const pageSize = Math.max(1, Math.min(100, Number(q.pageSize ?? 20)));
      const offset = (page - 1) * pageSize;

      const binds: Record<string, unknown> = { CODCLI: codcli };
      const where: string[] = [
        'BRSACC.CODCLI = :CODCLI',
        'BRSACC.NUMTICKET = BRSACC.NUMTICKETPRINC',
        "NVL(BRSACC.STATUS,'') <> 'Cancelado'",
      ];

      if (q.dateFrom) {
        where.push("TRUNC(BRSACC.DTABERTURA) >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD')");
        binds.DATE_FROM = q.dateFrom;
      }
      if (q.dateTo) {
        where.push("TRUNC(BRSACC.DTABERTURA) <= TO_DATE(:DATE_TO, 'YYYY-MM-DD')");
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
          where.push("LOWER(TRIM(NVL(BRSACC.STATUS,''))) IN ('aberto','inicial')");
          where.push('BRSACC.DTFINALIZA IS NULL');
        } else if (q.status === 'em_andamento') {
          where.push('BRSACC.DTFINALIZA IS NULL');
        }
      }

      app.log.info({ codcli, q }, 'SAC tickets query');

      const baseWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';

      // Query única com COUNT(*) OVER() — elimina a necessidade de uma query separada para contagem
      const rows = await select<any>(
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
        ${baseWhere}
        ORDER BY BRSACC.DTABERTURA DESC
        OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
        `,
        { ...binds, OFFSET: offset, LIMIT: pageSize }
      );

      const total = Number(rows?.[0]?.TOTAL_COUNT ?? 0);

      const list = rows.map((r: any) => ({
        id: String(r.NUMTICKET),
        openedAt: new Date(r.DTABERTURA).toISOString(),
        closedAt: r.DTFINALIZA ? new Date(r.DTFINALIZA).toISOString() : undefined,
        orderNumber: r.NUMPED ?? undefined,
        invoiceNumber: r.NUMNOTA ?? undefined,
        subject: String(r.RELATOCLIENTE ?? ''),
        status: normalizeStatus(r.STATUS, r.DTFINALIZA),
      }));

      app.log.info({ count: rows.length, total }, 'SAC tickets result');

      return reply.send({ ok: true, list, page, pageSize, total });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Detalhe do ticket ──────────

  app.get('/tickets/:id', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const numTicket = parseTicketId(req);

      const rows = await select<any>(
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
          AND BRSACC.CODCLI = :CODCLI
          AND NVL(BRSACC.STATUS,'') <> 'Cancelado'
        `,
        { NUMTICKET: numTicket, CODCLI: codcli }
      );

      if (!rows.length) return reply.status(404).send({ error: 'Ticket não encontrado' });
      const r = rows[0];

      const ticket = {
        id: String(r.NUMTICKET),
        openedAt: new Date(r.DTABERTURA).toISOString(),
        closedAt: r.DTFINALIZA ? new Date(r.DTFINALIZA).toISOString() : undefined,
        orderNumber: r.NUMPED ?? undefined,
        invoiceNumber: r.NUMNOTA ?? undefined,
        subject: String(r.RELATOCLIENTE ?? ''),
        status: normalizeStatus(r.STATUS, r.DTFINALIZA),
        branch: r.CODFILIAL ? String(r.CODFILIAL) : undefined,
      };

      const history = await select<any>(
        `
        SELECT
          BRSACC.NUMSEQ,
          BRSACC.DTABERTURA AS DTMOV,
          BRSACC.DTFINALIZA AS DTMOV_FINAL,
          BRSACC.RELATOCLIENTE AS DESCRICAO,
          BRSACC.STATUS
        FROM ${OWNER}.BRSACC
        WHERE BRSACC.NUMTICKETPRINC = :NUMTICKET
          AND BRSACC.CODCLI = :CODCLI
          AND NVL(BRSACC.STATUS,'') <> 'Cancelado'
        ORDER BY BRSACC.NUMSEQ ASC
        `,
        { NUMTICKET: numTicket, CODCLI: codcli }
      );

      const timeline = history.map((h: any) => ({
        seq: Number(h.NUMSEQ),
        when: new Date(h.DTMOV ?? h.DTMOV_FINAL ?? r.DTABERTURA).toISOString(),
        description: String(h.DESCRICAO ?? ''),
        status: normalizeStatus(h.STATUS, h.DTMOV_FINAL),
      }));

      // Buscar comentários do ticket
      const commentRows = await select<CommentRow>(COMMENTS_SELECT_SQL, { NUMTICKET: numTicket });
      const comments = commentRows.map(mapCommentRow);

      return reply.send({ ok: true, ticket, timeline, comments });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Criar ticket ──────────

  app.post('/tickets', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
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
        codcli,
        subject: String(body.subject),
        orderNumber: body.orderNumber,
        invoiceNumber: body.invoiceNumber,
        codfilial: body.codfilial ?? '1',
      });

      return reply.send({ ok: true, ticket: created });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Fechar ticket ──────────

  app.put('/tickets/:id/close', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const numTicket = parseTicketId(req);

      const rowsAffected = await execute(
        `UPDATE ${OWNER}.BRSACC 
         SET STATUS = 'Finalizado', DTFINALIZA = SYSDATE 
         WHERE NUMTICKET = :NUMTICKET AND CODCLI = :CODCLI AND DTFINALIZA IS NULL`,
        { NUMTICKET: numTicket, CODCLI: codcli }
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

      sendToUser(codcli, {
        type: 'NOTIFICATION',
        message: `O Ticket #${numTicket} foi finalizado. Não esqueça de avaliar o nosso atendimento!`
      });

      return reply.send({ ok: true });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
