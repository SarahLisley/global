import { select } from '../db/query';
import { OWNER } from '../utils/env';

export type Delivery = {
  id: string;
  nroPedido: string;
  filial: string;
  nroNF?: string;
  vlrTotal: number;
  prevEntrega?: string;
  dtAgendamento?: string;
  dtEntrega?: string;
  transportadora?: string;
  status?: 'Entregue' | 'Em trânsito' | 'Aguardando coleta' | 'Agendado';
  rastreio?: string;
  descricao?: string;
  ocorrencia?: string;
  cidade?: string;
  destinatario?: string;
  nomeRecebedor?: string;
  docRecebedor?: string;
  dominio?: string; 
};

export async function searchDeliveries(params: {
  codcli: number;
  dateFrom?: string;
  dateTo?: string;
  nf?: string | number;
  pedido?: string | number;
  page: number;
  pageSize: number;
}) {
  const limit = Math.max(1, Math.min(100, params.pageSize));
  const offset = (Math.max(1, params.page) - 1) * limit;
  const startRow = offset + 1;
  const endRow = offset + limit;

  const binds: Record<string, any> = {
    CODCLI: params.codcli,
    DATE_FROM: params.dateFrom ?? null,
    DATE_TO: params.dateTo ?? null,
    NF: params.nf ?? null,
    PEDIDO: params.pedido ?? null,
    START_ROW: startRow,
    END_ROW: endRow,
  };

  const rows = await select<any>(
    `
    WITH base AS (
      SELECT
        L.NUMNOTA,
        L.NUMTRANSVENDA,
        L.DESTINATARIO,
        L.NUMPED,
        L.DATA_HORA,
        L.DOMINIO,
        L.FILIAL,
        L.CIDADE,
        L.OCORRENCIA,
        L.DESCRICAO,
        L.TIPO,
        L.DATA_HORA_EFETIVA,
        L.PREVENTREGA,
        L.NOME_RECEBEDOR,
        L.NRO_DOC_RECEBEDOR,
        N.TRANSPORTADORA,
        N.VLTOTAL,
        N.DTFAT,
        ROW_NUMBER() OVER (PARTITION BY L.NUMTRANSVENDA ORDER BY L.DATA_HORA_EFETIVA DESC NULLS LAST, L.DATA_HORA DESC NULLS LAST) AS RN
      FROM ${OWNER}.BRLOGSSW L
      JOIN ${OWNER}.PCNFSAID N
        ON N.NUMTRANSVENDA = L.NUMTRANSVENDA
      WHERE N.CODCLI = :CODCLI
        AND (:NF IS NULL OR N.NUMNOTA = :NF)
        AND (:PEDIDO IS NULL OR L.NUMPED = :PEDIDO)
        AND (:DATE_FROM IS NULL OR TRUNC(NVL(N.DTFAT, L.DATA_HORA)) >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD'))
        AND (:DATE_TO   IS NULL OR TRUNC(NVL(N.DTFAT, L.DATA_HORA)) <= TO_DATE(:DATE_TO, 'YYYY-MM-DD'))
    ),
    filt AS (
      SELECT b.*
      FROM base b
      WHERE b.RN = 1
    ),
    pag AS (
      SELECT
        f.*,
        ROW_NUMBER() OVER (ORDER BY NVL(f.DATA_HORA_EFETIVA, NVL(f.PREVENTREGA, f.DATA_HORA)) DESC NULLS LAST) AS RNO
      FROM filt f
    )
    SELECT *
    FROM pag
    WHERE RNO BETWEEN :START_ROW AND :END_ROW
    `,
    binds
  );

  const countRows = await select<{ TOTAL: number }>(
    `
    WITH base AS (
      SELECT
        ROW_NUMBER() OVER (PARTITION BY L.NUMTRANSVENDA ORDER BY L.DATA_HORA_EFETIVA DESC NULLS LAST, L.DATA_HORA DESC NULLS LAST) AS RN
      FROM ${OWNER}.BRLOGSSW L
      JOIN ${OWNER}.PCNFSAID N
        ON N.NUMTRANSVENDA = L.NUMTRANSVENDA
      WHERE N.CODCLI = :CODCLI
        AND (:NF IS NULL OR N.NUMNOTA = :NF)
        AND (:PEDIDO IS NULL OR L.NUMPED = :PEDIDO)
        AND (:DATE_FROM IS NULL OR TRUNC(NVL(N.DTFAT, L.DATA_HORA)) >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD'))
        AND (:DATE_TO   IS NULL OR TRUNC(NVL(N.DTFAT, L.DATA_HORA)) <= TO_DATE(:DATE_TO, 'YYYY-MM-DD'))
    )
    SELECT COUNT(*) AS TOTAL
    FROM base
    WHERE RN = 1
    `,
    {
      CODCLI: params.codcli,
      DATE_FROM: params.dateFrom ?? null,
      DATE_TO: params.dateTo ?? null,
      NF: params.nf ?? null,
      PEDIDO: params.pedido ?? null,
    }
  );

  const total = Number(countRows?.[0]?.TOTAL ?? 0);

  const toStatus = (r: any): Delivery['status'] => {
    if (r.DATA_HORA_EFETIVA) return 'Entregue';
    const s = String(r.OCORRENCIA ?? '').toLowerCase();
    if (s.includes('coleta')) return 'Aguardando coleta';
    if (s.includes('transit') || s.includes('trânsito') || s.includes('transito')) return 'Em trânsito';
    return 'Agendado';
  };

  const mapped: Delivery[] = rows.map((r: any) => ({
    id: String(r.NUMTRANSVENDA),
    nroPedido: r.NUMPED ? String(r.NUMPED) : '-',
    filial: r.FILIAL ? String(r.FILIAL) : '-',
    nroNF: r.NUMNOTA ?? undefined,
    vlrTotal: Number(r.VLTOTAL ?? 0),
    prevEntrega: r.PREVENTREGA ? new Date(r.PREVENTREGA).toISOString() : undefined,
    dtAgendamento: r.DATA_HORA ? new Date(r.DATA_HORA).toISOString() : undefined,
    dtEntrega: r.DATA_HORA_EFETIVA ? new Date(r.DATA_HORA_EFETIVA).toISOString() : undefined,
    transportadora: r.TRANSPORTADORA ?? undefined,
    status: toStatus(r),
    rastreio: undefined,
    descricao: r.DESCRICAO ?? undefined,
    ocorrencia: r.OCORRENCIA ?? undefined,
    cidade: r.CIDADE ?? undefined,
    destinatario: r.DESTINATARIO ?? undefined,
    nomeRecebedor: r.NOME_RECEBEDOR ?? undefined,
    docRecebedor: r.NRO_DOC_RECEBEDOR ?? undefined,
    dominio: r.DOMINIO ?? undefined, // novo
  }));

  return { list: mapped, total };
}

export async function getDeliveryTimeline(numTrans: number, codcli: number) {
  const rows = await select<any>(
    `
    SELECT
      L.NUMNOTA,
      L.NUMTRANSVENDA,
      L.DESTINATARIO,
      L.NUMPED,
      L.DATA_HORA,
      L.DOMINIO,
      L.FILIAL,
      L.CIDADE,
      L.OCORRENCIA,
      L.DESCRICAO,
      L.TIPO,
      L.DATA_HORA_EFETIVA,
      L.PREVENTREGA,
      L.NOME_RECEBEDOR,
      L.NRO_DOC_RECEBEDOR
    FROM ${OWNER}.BRLOGSSW L
    JOIN ${OWNER}.PCNFSAID N
      ON N.NUMTRANSVENDA = L.NUMTRANSVENDA
    WHERE L.NUMTRANSVENDA = :NUMTRANS
      AND N.CODCLI = :CODCLI
    ORDER BY NVL(L.DATA_HORA_EFETIVA, L.DATA_HORA) ASC NULLS LAST
    `,
    { NUMTRANS: numTrans, CODCLI: codcli }
  );

  return rows.map(r => ({
    when: new Date(r.DATA_HORA_EFETIVA ?? r.DATA_HORA).toISOString(),
    occurrence: r.OCORRENCIA ?? '',
    description: r.DESCRICAO ?? '',
    city: r.CIDADE ?? '',
    destinatario: r.DESTINATARIO ?? '',
    nomeRecebedor: r.NOME_RECEBEDOR ?? '',
    docRecebedor: r.NRO_DOC_RECEBEDOR ?? '',
    dominio: r.DOMINIO ?? undefined,
  }));
}