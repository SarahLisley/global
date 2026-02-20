import type { FastifyInstance } from 'fastify';
import { getDashboardSummary, getDashboardKpis } from '../controllers/dashboardController';
import { verifyToken } from '../utils/token';
import { env } from '../utils/env';

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
}