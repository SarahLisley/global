import type { FastifyInstance } from 'fastify';
import { searchGlobal } from '../controllers/searchController';
import { extractCodcli, handleAuthError } from '../utils/auth';

export default async function searchRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    try {
      let codcli;
      let tipo;
      try {
        const extracted = extractCodcli(req);
        codcli = extracted.codcli;
        tipo = extracted.tipo;
      } catch (e) {
        // Fallback or handle differently if Server Component didn't pass proper token
        // In local development you might want a default codcli if not provided by cookies
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          console.warn('Busca global: Token ausente, usando codcli padrão 1 para teste local.');
          codcli = 1; 
          tipo = 'C';
        } else {
          throw e;
        }
      }

      const q = req.query as { q?: string };

      const query = q.q?.trim() || '';
      if (!query) {
        return reply.send({ results: [] });
      }

      const results = await searchGlobal(query, codcli, tipo);
      return reply.send({ results });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
