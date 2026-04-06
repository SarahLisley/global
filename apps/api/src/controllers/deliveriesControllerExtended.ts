import { select, execute } from '../db/query';
import { OWNER } from '../utils/env';
import { getOrSetCache } from '../utils/ttlCache';

// NOVO: Atualizar status da entrega
export async function updateDeliveryStatus(
  numTransVenda: number,
  codcli: number | null,
  data: {
    status: 'Entregue' | 'Em trânsito' | 'Aguardando coleta' | 'Agendado';
    dtEntrega?: string;
    nomeRecebedor?: string;
    docRecebedor?: string;
    observacoes?: string;
  },
  tipo?: string | null
) {
  const isAdmin = tipo === 'A';
  if (!codcli && !isAdmin) {
    throw new Error('Não autorizado');
  }

  console.log(`[deliveries] Atualizando status ${numTransVenda} para ${data.status}`);

  // Buscar informações da entrega para validação
  const binds: any = { NUMTRANSVENDA: numTransVenda };
  if (codcli) binds.CODCLI = codcli;

  const existing = await select<any>(
    `
    SELECT L.NUMTRANSVENDA, N.CODCLI
    FROM ${OWNER}.BRLOGSSW L
    JOIN ${OWNER}.PCNFSAID N ON N.NUMTRANSVENDA = L.NUMTRANSVENDA
    WHERE L.NUMTRANSVENDA = :NUMTRANSVENDA
      ${codcli ? 'AND N.CODCLI = :CODCLI' : ''}
    `,
    binds
  );

  if (existing.length === 0) {
    throw new Error('Entrega não encontrada');
  }

  // Inserir novo registro de status
  const insertBinds: any = {
    NUMTRANSVENDA: numTransVenda,
    OCORRENCIA: data.status,
    DESCRICAO: data.observacoes || `Status atualizado para ${data.status}`,
    DATA_HORA: new Date(),
  };

  if (data.dtEntrega) {
    insertBinds.DATA_HORA_EFETIVA = new Date(data.dtEntrega);
  }

  if (data.nomeRecebedor) {
    insertBinds.NOME_RECEBEDOR = data.nomeRecebedor;
  }

  if (data.docRecebedor) {
    insertBinds.NRO_DOC_RECEBEDOR = data.docRecebedor;
  }

  const result = await execute(
    `
    INSERT INTO ${OWNER}.BRLOGSSW (
      NUMTRANSVENDA,
      OCORRENCIA,
      DESCRICAO,
      DATA_HORA,
      DATA_HORA_EFETIVA,
      NOME_RECEBEDOR,
      NRO_DOC_RECEBEDOR,
      TIPO
    ) VALUES (
      :NUMTRANSVENDA,
      :OCORRENCIA,
      :DESCRICAO,
      :DATA_HORA,
      :DATA_HORA_EFETIVA,
      :NOME_RECEBEDOR,
      :NRO_DOC_RECEBEDOR,
      'STATUS_UPDATE'
    )
    `,
    insertBinds
  );

  // Limpar cache relacionado
  const cache = require('../utils/ttlCache');
  cache.invalidateCache('deliveries:');
  cache.invalidateCache('deliveryTimeline:');

  console.log(`[deliveries] Status atualizado com sucesso: ${result} linhas afetadas`);

  return {
    success: true,
    message: 'Status atualizado com sucesso',
    rowsAffected: result,
  };
}

// NOVO: Adicionar nota/ocorrência na entrega
export async function createDeliveryNote(
  numTransVenda: number,
  codcli: number | null,
  data: {
    ocorrencia: string;
    descricao: string;
    cidade?: string;
    dataHora?: string;
  },
  tipo?: string | null
) {
  const isAdmin = tipo === 'A';
  if (!codcli && !isAdmin) {
    throw new Error('Não autorizado');
  }

  console.log(`[deliveries] Adicionando nota para ${numTransVenda}: ${data.ocorrencia}`);

  // Validar entrega existe
  const binds: any = { NUMTRANSVENDA: numTransVenda };
  if (codcli) binds.CODCLI = codcli;

  const existing = await select<any>(
    `
    SELECT L.NUMTRANSVENDA, N.CODCLI
    FROM ${OWNER}.BRLOGSSW L
    JOIN ${OWNER}.PCNFSAID N ON N.NUMTRANSVENDA = L.NUMTRANSVENDA
    WHERE L.NUMTRANSVENDA = :NUMTRANSVENDA
      ${codcli ? 'AND N.CODCLI = :CODCLI' : ''}
    `,
    binds
  );

  if (existing.length === 0) {
    throw new Error('Entrega não encontrada');
  }

  // Inserir nova ocorrência
  const insertBinds: any = {
    NUMTRANSVENDA: numTransVenda,
    OCORRENCIA: data.ocorrencia,
    DESCRICAO: data.descricao,
    DATA_HORA: data.dataHora ? new Date(data.dataHora) : new Date(),
  };

  if (data.cidade) {
    insertBinds.CIDADE = data.cidade;
  }

  const result = await execute(
    `
    INSERT INTO ${OWNER}.BRLOGSSW (
      NUMTRANSVENDA,
      OCORRENCIA,
      DESCRICAO,
      DATA_HORA,
      CIDADE,
      TIPO
    ) VALUES (
      :NUMTRANSVENDA,
      :OCORRENCIA,
      :DESCRICAO,
      :DATA_HORA,
      :CIDADE,
      'MANUAL_NOTE'
    )
    `,
    insertBinds
  );

  // Limpar cache
  const cache = require('../utils/ttlCache');
  cache.invalidateCache('deliveries:');
  cache.invalidateCache('deliveryTimeline:');

  console.log(`[deliveries] Nota adicionada com sucesso: ${result} linhas afetadas`);

  return {
    success: true,
    message: 'Nota adicionada com sucesso',
    rowsAffected: result,
  };
}
