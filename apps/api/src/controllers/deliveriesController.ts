import { select } from '../db/query';
import { OWNER } from '../utils/env';
import { getOrSetCache } from '../utils/ttlCache';

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

type DeliveryRow = {
  NUMNOTA?: string | number | null;
  NUMTRANSVENDA: string | number;
  DESTINATARIO?: string | null;
  NUMPED?: string | number | null;
  DATA_HORA?: Date | string | null;
  DOMINIO?: string | null;
  FILIAL?: string | number | null;
  CIDADE?: string | null;
  OCORRENCIA?: string | null;
  DESCRICAO?: string | null;
  DATA_HORA_EFETIVA?: Date | string | null;
  PREVENTREGA?: Date | string | null;
  NOME_RECEBEDOR?: string | null;
  NRO_DOC_RECEBEDOR?: string | null;
  TRANSPORTADORA?: string | null;
  VLTOTAL?: number | null;
  TOTAL_COUNT?: number | null;
};

type DeliveryTimelineRow = {
  DATA_HORA?: Date | string | null;
  DATA_HORA_EFETIVA?: Date | string | null;
  OCORRENCIA?: string | null;
  DESCRICAO?: string | null;
  CIDADE?: string | null;
  DESTINATARIO?: string | null;
  NOME_RECEBEDOR?: string | null;
  NRO_DOC_RECEBEDOR?: string | null;
  DOMINIO?: string | null;
};

const DELIVERIES_TTL_MS = 30_000;
const DELIVERY_TIMELINE_TTL_MS = 60_000;

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function buildStatusWhere(status?: string) {
  if (!status || status === 'todos') {
    return '';
  }

  if (status === 'entregue') {
    return 'AND R.DATA_HORA_EFETIVA IS NOT NULL';
  }

  if (status === 'agendado') {
    return `
      AND R.DATA_HORA_EFETIVA IS NULL
      AND R.OCORRENCIA_NORMALIZADA NOT LIKE '%transit%'
      AND R.OCORRENCIA_NORMALIZADA NOT LIKE '%trânsito%'
      AND R.OCORRENCIA_NORMALIZADA NOT LIKE '%transito%'
      AND R.OCORRENCIA_NORMALIZADA NOT LIKE '%coleta%'
    `;
  }

  if (status === 'em trânsito') {
    return `
      AND R.DATA_HORA_EFETIVA IS NULL
      AND (
        R.OCORRENCIA_NORMALIZADA LIKE '%transit%'
        OR R.OCORRENCIA_NORMALIZADA LIKE '%trânsito%'
        OR R.OCORRENCIA_NORMALIZADA LIKE '%transito%'
      )
    `;
  }

  if (status === 'aguardando coleta') {
    return `
      AND R.DATA_HORA_EFETIVA IS NULL
      AND R.OCORRENCIA_NORMALIZADA LIKE '%coleta%'
    `;
  }

  return '';
}

function buildDeliveryCacheKey(params: {
  codcli: number;
  dateFrom?: string;
  dateTo?: string;
  nf?: string | number;
  pedido?: string | number;
  status?: string;
  page: number;
  pageSize: number;
}) {
  return JSON.stringify({
    codcli: params.codcli,
    dateFrom: params.dateFrom ?? null,
    dateTo: params.dateTo ?? null,
    nf: params.nf ?? null,
    pedido: params.pedido ?? null,
    status: params.status ?? null,
    page: params.page,
    pageSize: params.pageSize,
  });
}

export async function searchDeliveries(params: {
  codcli: number;
  dateFrom?: string;
  dateTo?: string;
  nf?: string | number;
  pedido?: string | number;
  status?: string;
  page: number;
  pageSize: number;
}) {
  return getOrSetCache(
    `deliveries:${buildDeliveryCacheKey(params)}`,
    DELIVERIES_TTL_MS,
    async () => {
      const limit = Math.max(1, Math.min(100, params.pageSize));
      const offset = (Math.max(1, params.page) - 1) * limit;
      const startRow = offset + 1;
      const endRow = offset + limit;

      const binds: Record<string, unknown> = {
        CODCLI: params.codcli,
        DATE_FROM: params.dateFrom ?? null,
        DATE_TO: params.dateTo ?? null,
        NF: params.nf ?? null,
        PEDIDO: params.pedido ?? null,
        START_ROW: startRow,
        END_ROW: endRow,
      };

      const statusWhere = buildStatusWhere(params.status);

      const rows = await select<DeliveryRow>(
        `
        WITH raw AS (
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
            LOWER(NVL(L.OCORRENCIA, '')) AS OCORRENCIA_NORMALIZADA,
            N.TRANSPORTADORA,
            N.VLTOTAL,
            N.DTFAT
          FROM ${OWNER}.BRLOGSSW L
          JOIN ${OWNER}.PCNFSAID N
            ON N.NUMTRANSVENDA = L.NUMTRANSVENDA
          WHERE N.CODCLI = :CODCLI
            AND (:NF IS NULL OR N.NUMNOTA = :NF)
            AND (:PEDIDO IS NULL OR L.NUMPED = :PEDIDO)
            AND (
              :DATE_FROM IS NULL
              OR (
                N.DTFAT IS NOT NULL
                AND N.DTFAT >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD')
              )
              OR (
                N.DTFAT IS NULL
                AND L.DATA_HORA >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD')
              )
            )
            AND (
              :DATE_TO IS NULL
              OR (
                N.DTFAT IS NOT NULL
                AND N.DTFAT < TO_DATE(:DATE_TO, 'YYYY-MM-DD') + 1
              )
              OR (
                N.DTFAT IS NULL
                AND L.DATA_HORA < TO_DATE(:DATE_TO, 'YYYY-MM-DD') + 1
              )
            )
        ),
        base AS (
          SELECT
            R.*,
            ROW_NUMBER() OVER (
              PARTITION BY R.NUMTRANSVENDA
              ORDER BY NVL(R.DATA_HORA_EFETIVA, R.DATA_HORA) DESC NULLS LAST
            ) AS RN
          FROM raw R
          WHERE 1 = 1
            ${statusWhere}
        ),
        filt AS (
          SELECT
            B.*,
            COUNT(*) OVER () AS TOTAL_COUNT
          FROM base B
          WHERE B.RN = 1
        ),
        pag AS (
          SELECT
            F.*,
            ROW_NUMBER() OVER (
              ORDER BY NVL(F.DATA_HORA_EFETIVA, NVL(F.PREVENTREGA, F.DATA_HORA)) DESC NULLS LAST
            ) AS RNO
          FROM filt F
        )
        SELECT *
        FROM pag
        WHERE RNO BETWEEN :START_ROW AND :END_ROW
        `,
        binds
      );

      const total = Number(rows[0]?.TOTAL_COUNT ?? 0);

      const toStatus = (row: DeliveryRow): Delivery['status'] => {
        if (row.DATA_HORA_EFETIVA) return 'Entregue';

        const normalized = String(row.OCORRENCIA ?? '').toLowerCase();
        if (normalized.includes('coleta')) return 'Aguardando coleta';
        if (normalized.includes('transit') || normalized.includes('trânsito') || normalized.includes('transito')) {
          return 'Em trânsito';
        }

        return 'Agendado';
      };

      const list: Delivery[] = rows.map((row) => ({
        id: String(row.NUMTRANSVENDA),
        nroPedido: row.NUMPED ? String(row.NUMPED) : '-',
        filial: row.FILIAL ? String(row.FILIAL) : '-',
        nroNF: row.NUMNOTA ? String(row.NUMNOTA) : undefined,
        vlrTotal: Number(row.VLTOTAL ?? 0),
        prevEntrega: toIsoDate(row.PREVENTREGA),
        dtAgendamento: toIsoDate(row.DATA_HORA),
        dtEntrega: toIsoDate(row.DATA_HORA_EFETIVA),
        transportadora: row.TRANSPORTADORA ?? undefined,
        status: toStatus(row),
        rastreio: undefined,
        descricao: row.DESCRICAO ?? undefined,
        ocorrencia: row.OCORRENCIA ?? undefined,
        cidade: row.CIDADE ?? undefined,
        destinatario: row.DESTINATARIO ?? undefined,
        nomeRecebedor: row.NOME_RECEBEDOR ?? undefined,
        docRecebedor: row.NRO_DOC_RECEBEDOR ?? undefined,
        dominio: row.DOMINIO ?? undefined,
      }));

      return { list, total };
    }
  );
}

export async function getDeliveryTimeline(numTrans: number, codcli: number) {
  return getOrSetCache(
    `deliveryTimeline:${codcli}:${numTrans}`,
    DELIVERY_TIMELINE_TTL_MS,
    async () => {
      const rows = await select<DeliveryTimelineRow>(
        `
        SELECT
          L.DATA_HORA,
          L.DATA_HORA_EFETIVA,
          L.OCORRENCIA,
          L.DESCRICAO,
          L.CIDADE,
          L.DESTINATARIO,
          L.NOME_RECEBEDOR,
          L.NRO_DOC_RECEBEDOR,
          L.DOMINIO
        FROM ${OWNER}.BRLOGSSW L
        JOIN ${OWNER}.PCNFSAID N
          ON N.NUMTRANSVENDA = L.NUMTRANSVENDA
        WHERE L.NUMTRANSVENDA = :NUMTRANS
          AND N.CODCLI = :CODCLI
        ORDER BY NVL(L.DATA_HORA_EFETIVA, L.DATA_HORA) ASC NULLS LAST
        `,
        { NUMTRANS: numTrans, CODCLI: codcli }
      );

      return rows.map((row) => ({
        when: toIsoDate(row.DATA_HORA_EFETIVA ?? row.DATA_HORA) ?? new Date().toISOString(),
        occurrence: row.OCORRENCIA ?? '',
        description: row.DESCRICAO ?? '',
        city: row.CIDADE ?? '',
        destinatario: row.DESTINATARIO ?? '',
        nomeRecebedor: row.NOME_RECEBEDOR ?? '',
        docRecebedor: row.NRO_DOC_RECEBEDOR ?? '',
        dominio: row.DOMINIO ?? undefined,
      }));
    }
  );
}
