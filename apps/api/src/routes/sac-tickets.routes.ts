import type { FastifyInstance } from 'fastify';
import { getSACSeries, createTicket } from '../controllers/sacController';
import { select, insertReturning, execute } from '../db/query';
import { OWNER } from '../utils/env';
import { extractCodcli, handleAuthError } from '../utils/auth';
import path from 'path';
import fs from 'fs';

const SAC_UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'sac');

// Garante que o diretório existe
if (!fs.existsSync(SAC_UPLOADS_DIR)) {
  fs.mkdirSync(SAC_UPLOADS_DIR, { recursive: true });
}

function normalizeStatus(status: any, dtFinaliza: any): 'pendente' | 'em_andamento' | 'finalizado' {
  if (dtFinaliza != null) return 'finalizado';
  const s = String(status ?? '').trim().toLowerCase();
  if (['em andamento', 'andamento', 'aguardando'].includes(s)) return 'em_andamento';
  if (['aberto', 'inicial'].includes(s)) return 'pendente';
  return 'em_andamento';
}

/** Mapeia uma linha de BRSACC_COMMENTS para o formato de resposta da API */
function mapCommentRow(c: any) {
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
    authorType: c.TIPO_AUTOR === 'S' ? 'suporte' : (c.TIPO_AUTOR === 'W' ? 'winthor' : 'cliente'),
    type: (c.TIPO_MSG === 'N' ? 'note' : 'message') as 'note' | 'message',
    content,
    isPublic: c.PUBLICO === 'S',
    attachment: c.ANEXO_PATH
      ? {
        filename: c.ANEXO_FILENAME,
        url: `/sac/attachments/${c.ANEXO_PATH}`,
      }
      : undefined,
    createdAt: new Date(c.DTCRIACAO).toISOString(),
  };
}

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

      const binds: Record<string, any> = { CODCLI: codcli };
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
      return handleAuthError(err, reply);
    }
  });

  // ────────── Detalhe do ticket ──────────

  app.get('/tickets/:id', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
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
          DTCRIACAO,
          NVL(PUBLICO, 'N') AS PUBLICO
        FROM ${OWNER}.BRSACC_COMMENTS 
        WHERE NUMTICKET = :NUMTICKET 
        ORDER BY DTCRIACAO ASC`,
        { NUMTICKET: numTicket }
      );

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
      const id = String((req.params as any)?.id ?? '').trim();
      if (!/^\d+$/.test(id)) return reply.status(400).send({ error: 'ID inválido' });
      const numTicket = Number(id);

      const rows = await execute(
        `UPDATE ${OWNER}.BRSACC 
         SET STATUS = 'Finalizado', DTFINALIZA = SYSDATE 
         WHERE NUMTICKET = :NUMTICKET AND CODCLI = :CODCLI AND DTFINALIZA IS NULL`,
        { NUMTICKET: numTicket, CODCLI: codcli }
      );

      if (rows === 0) {
        const check = await select(
          `SELECT NUMTICKET, DTFINALIZA FROM ${OWNER}.BRSACC WHERE NUMTICKET = :ID`,
          { ID: numTicket }
        );
        if (check.length === 0) return reply.status(404).send({ error: 'Ticket não encontrado' });
        if ((check[0] as any).DTFINALIZA) return reply.status(400).send({ error: 'Ticket já está finalizado' });
        return reply.status(403).send({ error: 'Sem permissão' });
      }

      return reply.send({ ok: true });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Listar comentários ──────────

  app.get('/tickets/:id/comments', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const id = String((req.params as any)?.id ?? '').trim();
      if (!/^\d+$/.test(id)) return reply.status(400).send({ error: 'ID inválido' });
      const numTicket = Number(id);

      const rows = await select<any>(
        `SELECT 
          ID,
          AUTOR,
          TIPO_AUTOR,
          TIPO_MSG,
          CONTEUDO,
          ANEXO_FILENAME,
          ANEXO_PATH,
          DTCRIACAO,
          NVL(PUBLICO, 'N') AS PUBLICO
        FROM ${OWNER}.BRSACC_COMMENTS 
        WHERE NUMTICKET = :NUMTICKET 
        ORDER BY DTCRIACAO ASC`,
        { NUMTICKET: numTicket }
      );

      const comments = rows.map(mapCommentRow);

      return reply.send({ ok: true, comments });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Criar comentário ──────────

  app.post('/tickets/:id/comments', async (req, reply) => {
    try {
      const { codcli, payload } = extractCodcli(req);
      const userName = String(payload?.name ?? payload?.email ?? 'Cliente');
      const id = String((req.params as any)?.id ?? '').trim();
      if (!/^\d+$/.test(id)) return reply.status(400).send({ error: 'ID inválido' });
      const numTicket = Number(id);

      const body = (req.body ?? {}) as {
        content?: string;
        type?: 'message' | 'note';
        isPublic?: boolean;
        attachment?: { filename: string; path: string };
      };
      if (!body.content || !String(body.content).trim()) {
        return reply.status(400).send({ error: 'Conteúdo do comentário é obrigatório' });
      }

      const content = String(body.content).trim().slice(0, 1000);
      const msgType = body.type === 'note' ? 'N' : 'M';
      const publico = body.isPublic ? 'S' : 'N';

      app.log.info({ numTicket, codcli, userName, contentLength: content.length, msgType, publico }, 'Creating comment');

      const newId = await insertReturning<number>(
        `INSERT INTO ${OWNER}.BRSACC_COMMENTS (
          NUMTICKET, CODCLI, AUTOR, TIPO_AUTOR, TIPO_MSG, CONTEUDO, DTCRIACAO, PUBLICO, ANEXO_FILENAME, ANEXO_PATH
        )
         VALUES (
          :NUMTICKET, :CODCLI, :AUTOR, 'C', :TIPO_MSG, :CONTEUDO, SYSTIMESTAMP, :PUBLICO, :ANEXO_FILENAME, :ANEXO_PATH
         )`,
        {
          NUMTICKET: numTicket,
          CODCLI: codcli,
          AUTOR: userName,
          TIPO_MSG: msgType,
          CONTEUDO: content,
          PUBLICO: publico,
          ANEXO_FILENAME: body.attachment?.filename || null,
          ANEXO_PATH: body.attachment?.path || null,
        },
        'ID'
      );



      const newComment = {
        id: String(newId ?? Date.now()),
        author: userName,
        authorType: 'cliente' as const,
        type: (msgType === 'N' ? 'note' : 'message') as 'note' | 'message',
        content,
        isPublic: publico === 'S',
        attachment: body.attachment ? {
          filename: body.attachment.filename,
          url: `/sac/attachments/${body.attachment.path}`,
        } : undefined,
        createdAt: new Date().toISOString(),
      };

      app.log.info({ numTicket, codcli, commentId: newId, msgType }, 'Comment created');

      return reply.send({ ok: true, comment: newComment });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Simular Winthor (DEV ONLY) ──────────

  app.post('/tickets/:id/simulate-winthor', async (req, reply) => {
    // DEV ONLY — bloqueia em produção
    if (process.env.NODE_ENV === 'production') {
      return reply.status(404).send({ error: 'Not found' });
    }
    try {
      const { codcli } = extractCodcli(req);
      const id = String((req.params as any)?.id ?? '').trim();
      const numTicket = Number(id);

      const body = (req.body ?? {}) as { attachment?: { filename: string; path: string } };

      const newId = await insertReturning<number>(
        `INSERT INTO ${OWNER}.BRSACC_COMMENTS (NUMTICKET, CODCLI, AUTOR, TIPO_AUTOR, TIPO_MSG, CONTEUDO, DTCRIACAO, PUBLICO, ANEXO_FILENAME, ANEXO_PATH)
             VALUES (:NUMTICKET, 0, 'Winthor ERP', 'W', 'M', 'O pedido foi sincronizado com sucesso no ERP.', SYSTIMESTAMP, 'S', :ANEXO_FILENAME, :ANEXO_PATH)`,
        {
          NUMTICKET: numTicket,
          ANEXO_FILENAME: body.attachment?.filename || null,
          ANEXO_PATH: body.attachment?.path || null
        },
        'ID'
      );

      return reply.send({
        ok: true,
        comment: {
          id: String(newId),
          author: 'Winthor ERP',
          authorType: 'winthor',
          type: 'message',
          content: 'O pedido foi sincronizado com sucesso no ERP.',
          isPublic: true,
          attachment: body.attachment ? {
            filename: body.attachment.filename,
            url: `/sac/attachments/${body.attachment.path}`,
          } : undefined,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Editar comentário ──────────

  app.put('/tickets/:id/comments/:commentId', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
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
      return handleAuthError(err, reply);
    }
  });

  // ────────── Apagar comentário ──────────

  app.delete('/tickets/:id/comments/:commentId', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const id = String((req.params as any)?.id ?? '').trim();
      const commentId = String((req.params as any)?.commentId ?? '').trim();

      if (!/^\d+$/.test(id) || !/^\d+$/.test(commentId)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const query = `DELETE FROM ${OWNER}.BRSACC_COMMENTS WHERE ID = :ID AND CODCLI = :CODCLI AND TIPO_AUTOR = 'C'`;
      const binds = { ID: Number(commentId), CODCLI: codcli };

      app.log.info({ query, binds }, 'Deleting comment');

      const rows = await execute(query, binds);

      app.log.info({ rowsAffected: rows }, 'Delete result');

      if (rows === 0) {
        const check = await select(
          `SELECT ID, CODCLI, TIPO_AUTOR FROM ${OWNER}.BRSACC_COMMENTS WHERE ID = :ID`,
          { ID: Number(commentId) }
        );
        app.log.warn({ check }, 'Comment not found or no permission');

        return reply.status(404).send({ error: 'Comentário não encontrado ou sem permissão para apagar' });
      }

      return reply.send({ ok: true });
    } catch (err) {
      app.log.error({ err }, 'Delete comment error');
      return handleAuthError(err, reply);
    }
  });

  // ────────── Upload de Anexo ──────────

  app.post('/tickets/:id/attachments', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const id = String((req.params as any)?.id ?? '');

      const data = await (req as any).file();
      if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado' });

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Max 5MB para SAC
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send({ error: 'Arquivo muito grande. Máximo 5MB.' });
      }

      const ext = path.extname(data.filename);
      const random = Math.random().toString(36).substring(2, 8);
      const filenameOnDisk = `ticket_${id}_${Date.now()}_${random}${ext}`;
      const filepath = path.join(SAC_UPLOADS_DIR, filenameOnDisk);

      fs.writeFileSync(filepath, buffer);

      return reply.send({
        ok: true,
        filename: data.filename,
        path: filenameOnDisk,
        url: `/sac/attachments/${filenameOnDisk}`,
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Servir Anexo ──────────

  app.get('/attachments/:filename', async (req, reply) => {
    try {
      const filename = (req.params as { filename: string }).filename;

      // Proteção contra path traversal
      const resolved = path.resolve(SAC_UPLOADS_DIR, filename);
      if (!resolved.startsWith(SAC_UPLOADS_DIR)) {
        return reply.status(400).send({ error: 'Caminho inválido' });
      }

      if (!fs.existsSync(resolved)) {
        return reply.status(404).send({ error: 'Arquivo não encontrado' });
      }

      const stream = fs.createReadStream(resolved);
      // Tentativa de inferir mime type simples
      const ext = path.extname(filename).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
      };

      return reply
        .header('Content-Type', mimeMap[ext] || 'application/octet-stream')
        .header('Content-Disposition', `inline; filename="${filename}"`)
        .send(stream);
    } catch (err) {
      return reply.status(500).send({ error: 'Erro ao ler arquivo' });
    }
  });

  // ────────── NPS ──────────

  app.get('/tickets/:id/nps', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const id = String((req.params as any)?.id ?? '');

      const rows = await select<any>(
        `SELECT ID, SCORE, FEEDBACK, DTCRIACAO 
         FROM ${OWNER}.BRSACC_NPS 
         WHERE NUMTICKET = :NUMTICKET AND CODCLI = :CODCLI`,
        { NUMTICKET: Number(id), CODCLI: codcli }
      );

      return reply.send({ ok: true, rated: rows.length > 0, nps: rows[0] || null });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.post('/tickets/:id/nps', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const id = String((req.params as any)?.id ?? '');
      const body = (req.body ?? {}) as { score: number; feedback?: string };

      if (body.score < 0 || body.score > 10) {
        return reply.status(400).send({ error: 'Score deve ser entre 0 e 10' });
      }

      // Tenta criar a tabela se não existir (lazy creation para ambiente BRAVO)
      try {
        await execute(
          `CREATE TABLE ${OWNER}.BRSACC_NPS (
            ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            NUMTICKET NUMBER NOT NULL,
            CODCLI NUMBER NOT NULL,
            SCORE NUMBER(2) NOT NULL,
            FEEDBACK VARCHAR2(1000),
            DTCRIACAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          {}
        );
      } catch (e) {
        // Ignora se já existir
      }

      await execute(
        `INSERT INTO ${OWNER}.BRSACC_NPS (NUMTICKET, CODCLI, SCORE, FEEDBACK)
         VALUES (:NUMTICKET, :CODCLI, :SCORE, :FEEDBACK)`,
        {
          NUMTICKET: Number(id),
          CODCLI: codcli,
          SCORE: body.score,
          FEEDBACK: body.feedback || null
        }
      );

      return reply.send({ ok: true });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
