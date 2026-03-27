import type { FastifyInstance } from 'fastify';
import { select, execute } from '../db/query';
import { OWNER } from '../utils/env';
import { extractCodcli, handleAuthError } from '../utils/auth';
import { parseTicketId } from './sac-helpers';

export default async function sacNpsRoutes(app: FastifyInstance) {

  // ────────── Consultar NPS ──────────

  app.get('/tickets/:id/nps', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const numTicket = parseTicketId(req);

      const rows = await select<any>(
        `SELECT ID, SCORE, FEEDBACK, DTCRIACAO 
         FROM ${OWNER}.BRSACC_NPS 
         WHERE NUMTICKET = :NUMTICKET AND CODCLI = :CODCLI`,
        { NUMTICKET: numTicket, CODCLI: codcli }
      );

      return reply.send({ ok: true, rated: rows.length > 0, nps: rows[0] || null });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Enviar NPS ──────────

  app.post('/tickets/:id/nps', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const numTicket = parseTicketId(req);
      const body = (req.body ?? {}) as { score?: number; feedback?: string };

      // Validação completa do score
      if (body.score == null || typeof body.score !== 'number' || !Number.isInteger(body.score)) {
        return reply.status(400).send({ error: 'Score deve ser um número inteiro' });
      }
      if (body.score < 0 || body.score > 10) {
        return reply.status(400).send({ error: 'Score deve ser entre 0 e 10' });
      }

      // Verificar se já existe avaliação (evita duplicatas)
      const existing = await select<any>(
        `SELECT ID FROM ${OWNER}.BRSACC_NPS 
         WHERE NUMTICKET = :NUMTICKET AND CODCLI = :CODCLI`,
        { NUMTICKET: numTicket, CODCLI: codcli }
      );

      if (existing.length > 0) {
        return reply.status(409).send({ error: 'Este ticket já foi avaliado' });
      }

      await execute(
        `INSERT INTO ${OWNER}.BRSACC_NPS (NUMTICKET, CODCLI, SCORE, FEEDBACK)
         VALUES (:NUMTICKET, :CODCLI, :SCORE, :FEEDBACK)`,
        {
          NUMTICKET: numTicket,
          CODCLI: codcli,
          SCORE: body.score,
          FEEDBACK: body.feedback ? String(body.feedback).trim().slice(0, 1000) : null,
        }
      );

      return reply.send({ ok: true });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
