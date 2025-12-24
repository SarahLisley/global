import type { FastifyInstance } from 'fastify';
import { getConnection } from '../db/pool';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  app.get('/health/db', async (_req, reply) => {
    try {
      const conn = await getConnection();
      try {
        const res = await conn.execute(`SELECT 1 AS OK FROM DUAL`);
        await conn.close();
        return reply.code(200).send({ ok: true, db: res?.rows?.[0]?.[0] === 1 });
      } catch (e: any) {
        await conn.close();
        return reply.code(503).send({ ok: false, error: e?.message || 'DB query failed' });
      }
    } catch (e: any) {
      return reply.code(503).send({ ok: false, error: e?.message || 'DB connection failed' });
    }
  });
}