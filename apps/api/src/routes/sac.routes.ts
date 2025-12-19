import type { FastifyInstance } from 'fastify';
import { searchTickets } from '../controllers/sacController';

export default async function sacRoutes(app: FastifyInstance) {
  app.get('/sac/tickets', async (req, reply) => {
    try {
      const rows = await searchTickets(req);
      return reply.send({ count: rows.length, items: rows });
    } catch (e: any) {
      req.log.error({ err: e }, 'SAC search failed');
      return reply.code(500).send({ message: 'Falha ao buscar tickets' });
    }
  });
}