import type { FastifyInstance } from 'fastify';
import { getDocsValidity } from '../controllers/docsController';
import { extractCodcli, handleAuthError } from '../utils/auth';

export default async function docsRoutes(app: FastifyInstance) {
  app.get('/validity', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const docs = await getDocsValidity({ codcli });
      return reply.send({ docs });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
