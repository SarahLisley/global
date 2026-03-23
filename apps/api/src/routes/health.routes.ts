import type { FastifyInstance } from 'fastify';
import { getConnection } from '../db/pool';

export default async function healthRoutes(app: FastifyInstance) {
  // Liveness — sempre responde
  app.get('/health', async (_req, reply) => {
    let dbOk = false;
    try {
      const conn = await getConnection();
      try {
        await conn.execute('SELECT 1 FROM DUAL');
        dbOk = true;
      } finally {
        await conn.close();
      }
    } catch { /* db indisponível */ }

    const mem = process.memoryUsage();
    const status = dbOk ? 200 : 503;
    return reply.code(status).send({
      ok: dbOk,
      uptime: Math.floor(process.uptime()),
      memoryMB: Math.round(mem.rss / 1024 / 1024),
      db: dbOk ? 'connected' : 'disconnected',
    });
  });

  // Readiness — verifica conexão ao banco em detalhe
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