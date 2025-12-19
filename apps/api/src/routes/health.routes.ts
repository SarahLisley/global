import type { FastifyInstance } from 'fastify';
import { pingDb, serverTime } from '../controllers/health.controller';
import { select } from '../db/query';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));
  app.get('/db/ping', async () => await pingDb());
  app.get('/db/time', async () => await serverTime());

  app.get('/db/whoami', async () => {
    const rows = await select<{ USERNAME: string; CURRENT_SCHEMA: string; SERVICE_NAME: string }>(
      `SELECT 
         SYS_CONTEXT('USERENV','SESSION_USER') AS USERNAME,
         SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AS CURRENT_SCHEMA,
         SYS_CONTEXT('USERENV','SERVICE_NAME') AS SERVICE_NAME
       FROM DUAL`
    );
    return rows[0];
  });
}