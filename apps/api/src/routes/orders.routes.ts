import type { FastifyInstance } from 'fastify';
import { getOrderItems, getRecentOrders, searchOrders } from '../controllers/ordersController';
import { extractCodcli, handleAuthError } from '../utils/auth';

export default async function ordersRoutes(app: FastifyInstance) {
  app.get('/recent', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const q = req.query as { page?: string; pageSize?: string };
      const page = q.page ? Number(q.page) : 1;
      const pageSize = q.pageSize ? Number(q.pageSize) : 10;

      const data = await getRecentOrders({ codcli, page, pageSize });
      return reply.send(data);
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.get('/:orderNumber/items', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const { orderNumber } = req.params as { orderNumber: string };
      const items = await getOrderItems({ codcli, orderNumber });
      return reply.send({ ok: true, items });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  app.get('/', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const q = req.query as any;
      const data = await searchOrders({
        codcli,
        dtInicial: q.dtInicial,
        dtFinal: q.dtFinal,
        pedido: q.pedido,
        nf: q.nf,
        page: Number(q.page),
        pageSize: Number(q.pageSize),
        includeItems: q.includeItems === '1',
      });
      return reply.send({
        ok: true,
        pedidos: data.orders.map((o) => ({
          id: o.orderNumber,
          nroPedido: o.orderNumber,
          nroNF: o.numNota,
          nroTransVenda: o.numTransVenda,
          posicao: o.posicao,
          data: o.date,
          filial: '1',
          codCliente: String(o.codcli),
          vendedor: o.seller,
          vlrTotal: o.total,
          vlrDesconto: o.desconto,
          vlrFrete: o.frete,
          nroItens: o.itemCount ?? 0,
          itens: q.includeItems === '1' ? (o as any).itens ?? [] : undefined,
        })),
        total: data.total,
        page: data.page,
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
