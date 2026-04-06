import type { FastifyInstance } from 'fastify';
import { getDocsValidity } from '../controllers/docsController';
import { getDocsValidityFast } from '../controllers/docsControllerFast';
import { extractCodcli, handleAuthError } from '../utils/auth';

export default async function docsRoutes(app: FastifyInstance) {
  app.get('/validity', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
      const docs = await getDocsValidity({ codcli, tipo });
      return reply.send({ docs });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // Nova rota ultra rápida
  app.get('/validity-fast', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
      const docs = await getDocsValidityFast({ codcli, tipo });
      return reply.send({ docs });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
