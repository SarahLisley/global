import type { FastifyInstance } from 'fastify';
import { select, insertReturning, execute } from '../db/query';
import { OWNER } from '../utils/env';
import { extractCodcli, handleAuthError } from '../utils/auth';
import { parseTicketId, mapCommentRow, COMMENTS_SELECT_SQL, TICKET_OWNERSHIP_SQL } from './sac-helpers';
import type { CommentRow } from './sac-helpers';
import { sendToUser } from '../utils/websocketManager';

export default async function sacCommentsRoutes(app: FastifyInstance) {

  // ────────── Listar comentários ──────────

  app.get('/tickets/:id/comments', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const numTicket = parseTicketId(req);

      // Verificar propriedade do ticket
      const ownerCheck = await select<{ '1': number }>(TICKET_OWNERSHIP_SQL, { NUMTICKET: numTicket, CODCLI: codcli });
      if (!ownerCheck.length) {
        return reply.status(404).send({ error: 'Ticket não encontrado' });
      }

      const rows = await select<CommentRow>(COMMENTS_SELECT_SQL, { NUMTICKET: numTicket });
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
      const numTicket = parseTicketId(req);

      // Verificar propriedade do ticket
      const ownerCheck = await select<{ '1': number }>(TICKET_OWNERSHIP_SQL, { NUMTICKET: numTicket, CODCLI: codcli });
      if (!ownerCheck.length) {
        return reply.status(404).send({ error: 'Ticket não encontrado' });
      }

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

  // ────────── Editar comentário ──────────

  app.put('/tickets/:id/comments/:commentId', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const params = req.params as Record<string, string>;
      const commentId = String(params?.commentId ?? '').trim();
      parseTicketId(req); // valida o ID do ticket

      if (!/^\d+$/.test(commentId)) {
        return reply.status(400).send({ error: 'ID do comentário inválido' });
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
      const params = req.params as Record<string, string>;
      const commentId = String(params?.commentId ?? '').trim();
      parseTicketId(req); // valida o ID do ticket

      if (!/^\d+$/.test(commentId)) {
        return reply.status(400).send({ error: 'ID do comentário inválido' });
      }

      const query = `DELETE FROM ${OWNER}.BRSACC_COMMENTS WHERE ID = :ID AND CODCLI = :CODCLI AND TIPO_AUTOR = 'C'`;
      const binds = { ID: Number(commentId), CODCLI: codcli };

      app.log.info({ commentId, codcli }, 'Deleting comment');

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

  // ────────── Simular Winthor (DEV ONLY) ──────────

  app.post('/tickets/:id/simulate-winthor', async (req, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(404).send({ error: 'Not found' });
    }
    try {
      const { codcli } = extractCodcli(req);
      const numTicket = parseTicketId(req);

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

      sendToUser(codcli, {
        type: 'NOTIFICATION',
        message: `Nova atualização do Winthor (ERP) no ticket #${numTicket}`
      });

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
}
