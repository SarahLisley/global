import type { FastifyInstance } from 'fastify';
import { getDashboardSummary, getDashboardKpis } from '../controllers/dashboardController';
import { extractCodcli } from '../utils/auth';

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get('/summary', async (_req, reply) => {
    const data = await getDashboardSummary();
    return reply.send(data);
  });

  app.get('/kpis', async (req, reply) => {
    try {
      const { codcli: tokenCodcli, tipo } = extractCodcli(req);
      const q = req.query as { email?: string; codcli?: string | number };
      const effectiveCodcli = tokenCodcli ?? q?.codcli;
      
      const data = await getDashboardKpis({ 
        email: q?.email, 
        codcli: effectiveCodcli,
        tipo 
      });
      return reply.send(data);
    } catch (err) {
      return reply.status(400).send({ error: (err as any).error || (err as Error).message });
    }
  });
}