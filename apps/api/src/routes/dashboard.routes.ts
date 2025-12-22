import type { FastifyInstance } from 'fastify';
import { getDashboardSummary, getDashboardKpis } from '../controllers/dashboardController';
import { verifyToken } from '../utils/token';
import { env, OWNER } from '../utils/env';
import { getRecentOrders } from '../controllers/ordersController';
import { getDocsValidity } from '../controllers/docsController';
import { getSACSeries, createTicket } from '../controllers/sacController';
import { getDeliveryTimeline, searchDeliveries } from '../controllers/deliveriesController';
import { select } from '../db/query';

function normalizeStatus(status: any, dtFinaliza: any): 'pendente' | 'em_andamento' | 'finalizado' {
  if (dtFinaliza != null) return 'finalizado';
  const s = String(status ?? '').trim().toLowerCase();
  if (['em andamento', 'andamento', 'aguardando'].includes(s)) return 'em_andamento';
  if (['aberto', 'inicial'].includes(s)) return 'pendente';
  return 'em_andamento';
}

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get('/summary', async (_req, reply) => {
    const data = await getDashboardSummary();
    return reply.send(data);
  });

  app.get('/kpis', async (req, reply) => {
    try {
      let tokenCodcli: number | undefined;
      const auth = req.headers.authorization;
      if (auth?.startsWith('Bearer ')) {
        const t = auth.slice(7);
        const v = verifyToken(t, env.JWT_SECRET);
        if (v.ok && v.payload?.codcli != null) tokenCodcli = Number(v.payload.codcli);
      }
      const q = req.query as { email?: string; codcli?: string | number };
      const effectiveCodcli = tokenCodcli ?? q?.codcli;
      const data = await getDashboardKpis({ email: q?.email, codcli: effectiveCodcli });
      return reply.send(data);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get('/orders/recent', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });
      const data = await getRecentOrders({ codcli });
      return reply.send({ orders: data });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.get('/docs/validity', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });
      const docs = await getDocsValidity({ codcli });
      return reply.send({ docs });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.get('/sac/series', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });
      const series = await getSACSeries({ codcli });
      return reply.send(series);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.get('/sac/tickets', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

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

      const binds: Record<string, any> = { CODCLI: codcli };
      const where: string[] = [
        'BRSACC.CODCLI = :CODCLI',
        'BRSACC.NUMTICKET = BRSACC.NUMTICKETPRINC',
        "NVL(BRSACC.STATUS,'') <> 'Cancelado'"
      ];

      if (q.dateFrom) {
        where.push('TRUNC(BRSACC.DTABERTURA) >= TO_DATE(:DATE_FROM, \'YYYY-MM-DD\')');
        binds.DATE_FROM = q.dateFrom;
      }
      if (q.dateTo) {
        where.push('TRUNC(BRSACC.DTABERTURA) <= TO_DATE(:DATE_TO, \'YYYY-MM-DD\')');
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
          where.push("LOWER(TRIM(NVL(BRSACC.STATUS,''))) IN ('em andamento','andamento','aguardando')");
          where.push('BRSACC.DTFINALIZA IS NULL');
        }
      }

      app.log.info({ codcli, q }, 'SAC tickets query');

      const baseWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const rows = await select<any>(
        `
        SELECT
          BRSACC.NUMTICKET,
          BRSACC.DTABERTURA,
          BRSACC.DTFINALIZA,
          BRSACC.NUMPED,
          BRSACC.NUMNOTA,
          BRSACC.RELATOCLIENTE,
          BRSACC.STATUS
        FROM ${OWNER}.BRSACC
        ${baseWhere}
        ORDER BY BRSACC.DTABERTURA DESC
        OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
        `,
        { ...binds, OFFSET: offset, LIMIT: pageSize }
      );

      const countRows = await select<{ TOTAL: number }>(
        `
        SELECT COUNT(*) AS TOTAL
        FROM ${OWNER}.BRSACC
        ${baseWhere}
        `,
        binds
      );
      const total = Number(countRows?.[0]?.TOTAL ?? 0);

      const list = rows.map((r) => ({
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
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.get('/sac/tickets/:id', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const id = String((req.params as any)?.id ?? '').trim();
      if (!/^\d+$/.test(id)) return reply.status(400).send({ error: 'ID inválido' });
      const numTicket = Number(id);

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

      const timeline = history.map((h) => ({
        seq: Number(h.NUMSEQ),
        when: new Date(h.DTMOV ?? h.DTMOV_FINAL ?? r.DTABERTURA).toISOString(),
        description: String(h.DESCRICAO ?? ''),
        status: normalizeStatus(h.STATUS, h.DTMOV_FINAL),
      }));

      return reply.send({ ok: true, ticket, timeline });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.post('/sac/tickets', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const body = (req.body ?? {}) as { subject?: string; orderNumber?: string | number; invoiceNumber?: string | number; codfilial?: string };
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
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.get('/entregas', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const q = req.query as { dtInicial?: string; dtFinal?: string; pedido?: string | number; nf?: string | number; page?: string | number; pageSize?: string | number };
      const page = Math.max(1, Number(q.page ?? 1));
      const pageSize = Math.max(1, Math.min(100, Number(q.pageSize ?? 10)));

      const { list, total } = await searchDeliveries({
        codcli,
        dateFrom: q.dtInicial,
        dateTo: q.dtFinal,
        nf: q.nf,
        pedido: q.pedido,
        page,
        pageSize,
      });

      return reply.send({ entregas: list, total, page, pageSize });
    } catch (err) {
      // DB/SQL/infra: 500
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.get('/entregas/:numTrans', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const numTrans = Number((req.params as any)?.numTrans);
      if (!Number.isFinite(numTrans)) return reply.status(400).send({ error: 'numTrans inválido' });

      const timeline = await getDeliveryTimeline(numTrans, codcli);
      return reply.send({ timeline });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });
}