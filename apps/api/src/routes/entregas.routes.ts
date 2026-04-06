import type { FastifyInstance } from 'fastify';
import { getDeliveryTimeline, searchDeliveries } from '../controllers/deliveriesController';
import { updateDeliveryStatus, createDeliveryNote } from '../controllers/deliveriesControllerExtended';
import { extractCodcli, handleAuthError } from '../utils/auth';

export default async function entregasRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
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
        tipo,
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
      const { codcli, tipo } = extractCodcli(req);
      const numTrans = Number((req.params as any)?.numTrans);
      if (!Number.isFinite(numTrans)) return reply.status(400).send({ error: 'numTrans inválido' });

      const timeline = await getDeliveryTimeline(numTrans, codcli, tipo);
      return reply.send({ timeline });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // NOVO: Atualizar status da entrega
  app.put('/:numTrans/status', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
      const numTrans = Number((req.params as any)?.numTrans);
      if (!Number.isFinite(numTrans)) return reply.status(400).send({ error: 'numTrans inválido' });

      const body = req.body as {
        status: 'Entregue' | 'Em trânsito' | 'Aguardando coleta' | 'Agendado';
        dtEntrega?: string;
        nomeRecebedor?: string;
        docRecebedor?: string;
        observacoes?: string;
      };

      if (!body.status) {
        return reply.status(400).send({ error: 'Status é obrigatório' });
      }

      const result = await updateDeliveryStatus(numTrans, codcli, body, tipo);
      return reply.send(result);
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // NOVO: Adicionar nota/ocorrência na entrega
  app.post('/:numTrans/notes', async (req, reply) => {
    try {
      const { codcli, tipo } = extractCodcli(req);
      const numTrans = Number((req.params as any)?.numTrans);
      if (!Number.isFinite(numTrans)) return reply.status(400).send({ error: 'numTrans inválido' });

      const body = req.body as {
        ocorrencia: string;
        descricao: string;
        cidade?: string;
        dataHora?: string;
      };

      if (!body.occorrencia || !body.descricao) {
        return reply.status(400).send({ error: 'Ocorrência e descrição são obrigatórios' });
      }

      const result = await createDeliveryNote(numTrans, codcli, body, tipo);
      return reply.send(result);
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });
}
