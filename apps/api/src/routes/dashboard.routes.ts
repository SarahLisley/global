import type { FastifyInstance } from 'fastify';
import { getDashboardSummary, getDashboardKpis } from '../controllers/dashboardController';
import { verifyToken } from '../utils/token';
import { env, OWNER } from '../utils/env';
import { getRecentOrders, searchOrders } from '../controllers/ordersController';
import { getDocsValidity } from '../controllers/docsController';
import { getSACSeries, createTicket } from '../controllers/sacController';
import { getDeliveryTimeline, searchDeliveries } from '../controllers/deliveriesController';
import { select, insertReturning, execute } from '../db/query';
import { getTitulos } from '../controllers/financeiroController';

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

      const q = req.query as { page?: string, pageSize?: string };
      const page = q.page ? Number(q.page) : 1;
      const pageSize = q.pageSize ? Number(q.pageSize) : 10;

      const data = await getRecentOrders({ codcli, page, pageSize });
      return reply.send(data);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.get('/orders', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const q = req.query as any;
      const data = await searchOrders({
        codcli,
        dtInicial: q.dtInicial,
        dtFinal: q.dtFinal,
        pedido: q.pedido,
        nf: q.nf,
        page: Number(q.page),
        pageSize: Number(q.pageSize),
      });
      return reply.send({
        ok: true,
        pedidos: data.orders.map(o => ({
          id: o.orderNumber,
          nroPedido: o.orderNumber,
          nroNF: o.numNota,
          nroTransVenda: o.numTransVenda,
          posicao: o.posicao,
          data: o.date,
          filial: '1', // Mock or fetch
          codCliente: String(o.codcli),
          vendedor: o.seller,
          vlrTotal: o.total,
          vlrDesconto: o.desconto,
          vlrFrete: o.frete,
          nroItens: (o as any).itens?.length ?? 0,
          itens: (o as any).itens ?? []
        })),
        total: data.total,
        page: data.page
      });
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

      // Buscar comentários do ticket
      const commentRows = await select<any>(
        `SELECT 
          ID,
          AUTOR,
          TIPO_AUTOR,
          TIPO_MSG,
          CONTEUDO,
          ANEXO_FILENAME,
          ANEXO_PATH,
          DTCRIACAO
        FROM ${OWNER}.BRSACC_COMMENTS 
        WHERE NUMTICKET = :NUMTICKET 
        ORDER BY DTCRIACAO ASC`,
        { NUMTICKET: numTicket }
      );

      const comments = commentRows.map(c => {
        let content = '';
        if (c.CONTEUDO) {
          if (typeof c.CONTEUDO === 'string') {
            content = c.CONTEUDO;
          } else if (typeof c.CONTEUDO === 'object' && c.CONTEUDO.toString) {
            content = c.CONTEUDO.toString();
          }
        }
        return {
          id: String(c.ID),
          author: String(c.AUTOR ?? 'Sistema'),
          authorType: c.TIPO_AUTOR === 'S' ? 'suporte' : 'cliente',
          type: (c.TIPO_MSG === 'N' ? 'note' : 'message') as 'note' | 'message',
          content,
          attachment: c.ANEXO_PATH ? {
            filename: c.ANEXO_FILENAME,
            url: `/uploads/${c.ANEXO_PATH}`
          } : undefined,
          createdAt: new Date(c.DTCRIACAO).toISOString(),
        };
      });

      return reply.send({ ok: true, ticket, timeline, comments });
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

  // ---------- Comentários de Tickets ----------

  app.get('/sac/tickets/:id/comments', async (req, reply) => {
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

      // Busca comentários da tabela BRSACC_COMMENTS
      const rows = await select<any>(
        `SELECT 
          ID,
          AUTOR,
          TIPO_AUTOR,
          TIPO_MSG,
          CONTEUDO,
          ANEXO_FILENAME,
          ANEXO_PATH,
          DTCRIACAO
        FROM ${OWNER}.BRSACC_COMMENTS 
        WHERE NUMTICKET = :NUMTICKET 
        ORDER BY DTCRIACAO ASC`,
        { NUMTICKET: numTicket }
      );

      const comments = rows.map(r => {
        // Handle CLOB - may come as object with getData() or as string
        let content = '';
        if (r.CONTEUDO) {
          if (typeof r.CONTEUDO === 'string') {
            content = r.CONTEUDO;
          } else if (typeof r.CONTEUDO === 'object' && r.CONTEUDO.toString) {
            content = r.CONTEUDO.toString();
          }
        }

        return {
          id: String(r.ID),
          author: String(r.AUTOR ?? 'Sistema'),
          authorType: r.TIPO_AUTOR === 'S' ? 'suporte' : 'cliente',
          type: (r.TIPO_MSG === 'N' ? 'note' : 'message') as 'note' | 'message',
          content,
          attachment: r.ANEXO_PATH ? {
            filename: r.ANEXO_FILENAME,
            url: `/uploads/${r.ANEXO_PATH}`
          } : undefined,
          createdAt: new Date(r.DTCRIACAO).toISOString(),
        };
      });

      return reply.send({ ok: true, comments });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  app.post('/sac/tickets/:id/comments', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      const userName = String(v.payload?.name ?? v.payload?.email ?? 'Cliente');
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const id = String((req.params as any)?.id ?? '').trim();
      if (!/^\d+$/.test(id)) return reply.status(400).send({ error: 'ID inválido' });
      const numTicket = Number(id);

      const body = (req.body ?? {}) as { content?: string; type?: 'message' | 'note' };
      if (!body.content || !String(body.content).trim()) {
        return reply.status(400).send({ error: 'Conteúdo do comentário é obrigatório' });
      }

      const content = String(body.content).trim().slice(0, 1000);
      const msgType = body.type === 'note' ? 'N' : 'M'; // M=Message (Interact), N=Note (Anotação)

      console.log('[POST /sac/tickets/:id/comments] Inserting comment:', { numTicket, codcli, userName, contentLength: content.length, msgType });

      // Insere comentário no banco
      const newId = await insertReturning<number>(
        `INSERT INTO ${OWNER}.BRSACC_COMMENTS (NUMTICKET, CODCLI, AUTOR, TIPO_AUTOR, TIPO_MSG, CONTEUDO, DTCRIACAO)
         VALUES (:NUMTICKET, :CODCLI, :AUTOR, 'C', :TIPO_MSG, :CONTEUDO, SYSTIMESTAMP)`,
        {
          NUMTICKET: numTicket,
          CODCLI: codcli,
          AUTOR: userName,
          TIPO_MSG: msgType,
          CONTEUDO: content,
        },
        'ID'
      );

      console.log('[POST /sac/tickets/:id/comments] Insert result, newId:', newId);

      const newComment = {
        id: String(newId ?? Date.now()),
        author: userName,
        authorType: 'cliente' as const,
        type: (msgType === 'N' ? 'note' : 'message') as 'note' | 'message',
        content,
        createdAt: new Date().toISOString(),
      };

      app.log.info({ numTicket, codcli, commentId: newId, msgType }, 'Comment created');

      return reply.send({ ok: true, comment: newComment });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // ---------- Editar Comentário ----------
  app.put('/sac/tickets/:id/comments/:commentId', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const id = String((req.params as any)?.id ?? '').trim();
      const commentId = String((req.params as any)?.commentId ?? '').trim();
      if (!/^\d+$/.test(id) || !/^\d+$/.test(commentId)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const body = (req.body ?? {}) as { content?: string };
      if (!body.content || !String(body.content).trim()) {
        return reply.status(400).send({ error: 'Conteúdo do comentário é obrigatório' });
      }

      const content = String(body.content).trim().slice(0, 1000);

      // Verifica se o comentário pertence ao cliente
      const rows = await execute(
        `UPDATE ${OWNER}.BRSACC_COMMENTS 
         SET CONTEUDO = :CONTEUDO 
         WHERE ID = :ID AND CODCLI = :CODCLI AND TIPO_AUTOR = 'C'`,
        { CONTEUDO: content, ID: Number(commentId), CODCLI: codcli }
      );

      if (rows === 0) {
        return reply.status(404).send({ error: 'Comentário não encontrado ou sem permissão' });
      }

      return reply.send({ ok: true });
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // ---------- Apagar Comentário ----------
  app.delete('/sac/tickets/:id/comments/:commentId', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const id = String((req.params as any)?.id ?? '').trim();
      const commentId = String((req.params as any)?.commentId ?? '').trim();

      console.log(`[DELETE COMMENT] Request received. Ticket: ${id}, Comment: ${commentId}, CodCli: ${codcli}`);

      if (!/^\d+$/.test(id) || !/^\d+$/.test(commentId)) {
        console.log('[DELETE COMMENT] Invalid ID format');
        return reply.status(400).send({ error: 'ID inválido' });
      }

      // Apaga apenas comentários do próprio cliente
      const query = `DELETE FROM ${OWNER}.BRSACC_COMMENTS WHERE ID = :ID AND CODCLI = :CODCLI AND TIPO_AUTOR = 'C'`;
      const binds = { ID: Number(commentId), CODCLI: codcli };

      console.log('[DELETE COMMENT] Executing query:', query, binds);

      const rows = await execute(query, binds);

      console.log('[DELETE COMMENT] Rows affected:', rows);

      if (rows === 0) {
        // Tenta verificar se o comentário existe mas pertence a outro usuario/autor
        const check = await select(`SELECT ID, CODCLI, TIPO_AUTOR FROM ${OWNER}.BRSACC_COMMENTS WHERE ID = :ID`, { ID: Number(commentId) });
        console.log('[DELETE COMMENT] Check existence:', check);

        return reply.status(404).send({ error: 'Comentário não encontrado ou sem permissão para apagar' });
      }

      return reply.send({ ok: true });
    } catch (err) {
      console.error('[DELETE COMMENT] Error:', err);
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

  app.get('/financeiro', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Token ausente' });
      const t = auth.slice(7);
      const v = verifyToken(t, env.JWT_SECRET);
      if (!v.ok) return reply.status(401).send({ error: v.error });
      const codcli = Number(v.payload?.codcli);
      if (!codcli) return reply.status(400).send({ error: 'CODCLI inválido no token' });

      const q = req.query as any;
      const data = await getTitulos({
        codcli,
        dtInicial: q.dtInicial,
        dtFinal: q.dtFinal,
        status: q.status,
        numped: q.numped,
        nf: q.nf,
        page: Number(q.page),
        pageSize: Number(q.pageSize)
      });

      return reply.send(data);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });
  // DEBUG BOLETO ROUTE - REMOVE LATER
  app.get('/debug/boletos', async (req, reply) => {
    try {
      const rows = await select(
        `SELECT 
          NUMTRANSVENDA, 
          PREST, 
          DUPLIC, 
          LINHADIG, 
          CODBARRA, 
          NOSSONUMBCO, 
          NOMEARQUIVO, 
          PASTAARQUIVOBOLETO,
          DTVENC,
          VALOR
        FROM ${OWNER}.PCPREST 
        WHERE ROWNUM <= 10
        ORDER BY DTVENC DESC`
      );
      return reply.send(rows);
    } catch (e) {
      return reply.status(500).send(e);
    }
  });
}