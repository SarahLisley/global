import type { FastifyInstance } from 'fastify';
import { getTitulos } from '../controllers/financeiroController';
import { downloadBoleto } from '../controllers/boletosController';
import { select } from '../db/query';
import { OWNER } from '../utils/env';
import { extractCodcli, handleAuthError } from '../utils/auth';

export default async function financeiroRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const q = req.query as any;
      const data = await getTitulos({
        codcli,
        dtInicial: q.dtInicial,
        dtFinal: q.dtFinal,
        status: q.status,
        numped: q.numped,
        nf: q.nf,
        page: Number(q.page),
        pageSize: Number(q.pageSize),
      });

      return reply.send(data);
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.get('/boletos/:id', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const id = String((req.params as any)?.id ?? '');

      const { stream, filename, size, mimeType } = await downloadBoleto({ codcli, id });

      reply.header('Content-Type', mimeType);
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Content-Length', size);

      return reply.send(stream);
    } catch (err: any) {
      if (err?.status) return handleAuthError(err, reply);
      return reply.status(404).send({ error: (err as Error).message });
    }
  });

  // DEBUG BOLETO ROUTE - REMOVE LATER
  app.get('/debug/boletos', async (_req, reply) => {
    try {
      const rows = await select(
        `SELECT 
          NUMTRANSVENDA, 
          PREST, 
          DUPLIC, 
          LINHADIG, 
          CODBARRA, 
          NOSSONUMBCO, 
          NOMEARQUIVO, 
          PASTAARQUIVOBOLETO,
          DTVENC,
          VALOR
        FROM ${OWNER}.PCPREST 
        WHERE ROWNUM <= 10
        ORDER BY DTVENC DESC`
      );
      return reply.send(rows);
    } catch (e) {
      return reply.status(500).send(e);
    }
  });
}
