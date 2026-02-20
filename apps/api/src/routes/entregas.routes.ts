import type { FastifyInstance } from 'fastify';
import { getDeliveryTimeline, searchDeliveries } from '../controllers/deliveriesController';
import { extractCodcli, handleAuthError } from '../utils/auth';

export default async function entregasRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const q = req.query as {
        dtInicial?: string;
        dtFinal?: string;
        pedido?: string | number;
        nf?: string | number;
        status?: string;
        page?: string | number;
        pageSize?: string | number;
      };
      const page = Math.max(1, Number(q.page ?? 1));
      const pageSize = Math.max(1, Math.min(100, Number(q.pageSize ?? 10)));

      const { list, total } = await searchDeliveries({
        codcli,
        dateFrom: q.dtInicial,
        dateTo: q.dtFinal,
        nf: q.nf,
        pedido: q.pedido,
        status: q.status,
        page,
        pageSize,
      });

      return reply.send({ entregas: list, total, page, pageSize });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.get('/:numTrans', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const numTrans = Number((req.params as any)?.numTrans);
      if (!Number.isFinite(numTrans)) return reply.status(400).send({ error: 'numTrans inválido' });

      const timeline = await getDeliveryTimeline(numTrans, codcli);
      return reply.send({ timeline });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
