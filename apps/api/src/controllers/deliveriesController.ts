import { select, execute } from '../db/query';
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
  codcli: number | null;
  tipo?: string | null;
  dateFrom?: string;
  dateTo?: string;
  nf?: string | number;
  pedido?: string | number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return JSON.stringify({
    codcli: params.codcli,
    tipo: params.tipo,
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
  codcli: number | null;
  tipo?: string | null;
  dateFrom?: string;
  dateTo?: string;
  pedido?: string | number;
  nf?: string | number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return getOrSetCache(
    `deliveries:${buildDeliveryCacheKey(params)}`,
    DELIVERIES_TTL_MS,
    async () => {
      try {
        const isAdmin = params.tipo === 'A';
        if (!params.codcli && !isAdmin) {
          return { list: [], total: 0 };
        }

        const page = Math.max(1, params.page ?? 1);
        const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 10));
        const offset = (page - 1) * pageSize;
        const startRow = offset + 1;
        const endRow = offset + pageSize;

        const binds: any = {
          START_ROW: startRow,
          END_ROW: endRow,
        };

        const where: string[] = ['1=1'];

        if (params.codcli) {
          where.push('N.CODCLI = :CODCLI');
          binds.CODCLI = params.codcli;
        }

        if (params.nf) {
          where.push('N.NUMNOTA = :NF');
          binds.NF = params.nf;
        }

        if (params.pedido) {
          where.push('L.NUMPED = :PEDIDO');
          binds.PEDIDO = params.pedido;
        }

        if (params.dateFrom) {
          where.push(`(
            (N.DTFAT IS NOT NULL AND N.DTFAT >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD'))
            OR (N.DTFAT IS NULL AND L.DATA_HORA >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD'))
          )`);
          binds.DATE_FROM = params.dateFrom;
        }

        if (params.dateTo) {
          where.push(`(
            (N.DTFAT IS NOT NULL AND N.DTFAT < TO_DATE(:DATE_TO, 'YYYY-MM-DD') + 1)
            OR (N.DTFAT IS NULL AND L.DATA_HORA < TO_DATE(:DATE_TO, 'YYYY-MM-DD') + 1)
          )`);
          binds.DATE_TO = params.dateTo;
        }

        const statusWhere = buildStatusWhere(params.status);

        let rows: DeliveryRow[] = [];
        try {
          rows = await select<DeliveryRow>(
            `
            WITH cte_raw AS (
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
              WHERE ${where.join(' AND ')}
            ),
            cte_base AS (
              SELECT
                R.*,
                ROW_NUMBER() OVER (
                  PARTITION BY R.NUMTRANSVENDA
                  ORDER BY NVL(R.DATA_HORA_EFETIVA, R.DATA_HORA) DESC NULLS LAST
                ) AS RN
              FROM cte_raw R
              WHERE 1 = 1
                ${statusWhere}
            ),
            cte_filt AS (
              SELECT
                B.*,
                COUNT(*) OVER () AS TOTAL_COUNT
              FROM cte_base B
              WHERE B.RN = 1
            ),
            cte_pag AS (
              SELECT
                F.*,
                ROW_NUMBER() OVER (
                  ORDER BY NVL(F.DATA_HORA_EFETIVA, NVL(F.PREVENTREGA, F.DATA_HORA)) DESC NULLS LAST
                ) AS RNO
              FROM cte_filt F
            )
            SELECT *
            FROM cte_pag
            WHERE RNO BETWEEN :START_ROW AND :END_ROW
            `,
            binds
          );
        } catch (err: any) {
          const msg = err.message || String(err);
          if (msg.includes('ORA-00903') || msg.includes('ORA-00942')) {
            console.warn('[DELIVERIES] Tabela BRLOGSSW não encontrada em ' + OWNER + '. Realizando consulta fallback em PCNFSAID.');

            const fallbackWhere: string[] = ['1=1'];
            const fbinds: any = { START_ROW: startRow, END_ROW: endRow };
            if (params.codcli) {
              fallbackWhere.push('N.CODCLI = :CODCLI');
              fbinds.CODCLI = params.codcli;
            }
            if (params.nf) {
              fallbackWhere.push('N.NUMNOTA = :NF');
              fbinds.NF = params.nf;
            }
            if (params.pedido) {
              fallbackWhere.push('N.NUMPED = :PEDIDO');
              fbinds.PEDIDO = params.pedido;
            }
            if (params.dateFrom) {
              fallbackWhere.push("N.DTFAT >= TO_DATE(:DATE_FROM, 'YYYY-MM-DD')");
              fbinds.DATE_FROM = params.dateFrom;
            }
            if (params.dateTo) {
              fallbackWhere.push("N.DTFAT < TO_DATE(:DATE_TO, 'YYYY-MM-DD') + 1");
              fbinds.DATE_TO = params.dateTo;
            }
            
            rows = await select<DeliveryRow>(
              `
              WITH cte_raw AS (
                SELECT
                  N.NUMNOTA,
                  N.NUMTRANSVENDA,
                  C.CLIENTE AS DESTINATARIO,
                  N.NUMPED,
                  N.DTFAT AS DATA_HORA,
                  NULL AS DOMINIO,
                  N.CODFILIAL AS FILIAL,
                  C.MUNICENT AS CIDADE,
                  'Faturado' AS OCORRENCIA,
                  'Nota fiscal emitida' AS DESCRICAO,
                  NULL AS TIPO,
                  N.DTENTREGA AS DATA_HORA_EFETIVA,
                  N.DTENTREGA AS PREVENTREGA,
                  NULL AS NOME_RECEBEDOR,
                  NULL AS NRO_DOC_RECEBEDOR,
                  'faturado' AS OCORRENCIA_NORMALIZADA,
                  N.TRANSPORTADORA,
                  N.VLTOTAL,
                  N.DTFAT
                FROM ${OWNER}.PCNFSAID N
                LEFT JOIN ${OWNER}.PCCLIENT C ON C.CODCLI = N.CODCLI
                WHERE ${fallbackWhere.join(' AND ')}
              ),
              cte_base AS (
                SELECT
                  R.*,
                  ROW_NUMBER() OVER (
                    PARTITION BY R.NUMTRANSVENDA
                    ORDER BY NVL(R.DATA_HORA_EFETIVA, R.DATA_HORA) DESC NULLS LAST
                  ) AS RN
                FROM cte_raw R
                WHERE 1 = 1
                  ${statusWhere}
              ),
              cte_filt AS (
                SELECT
                  B.*,
                  COUNT(*) OVER () AS TOTAL_COUNT
                FROM cte_base B
                WHERE B.RN = 1
              ),
              cte_pag AS (
                SELECT
                  F.*,
                  ROW_NUMBER() OVER (
                    ORDER BY NVL(F.DATA_HORA_EFETIVA, NVL(F.PREVENTREGA, F.DATA_HORA)) DESC NULLS LAST
                  ) AS RNO
                FROM cte_filt F
              )
              SELECT *
              FROM cte_pag
              WHERE RNO BETWEEN :START_ROW AND :END_ROW
              `,
              fbinds
            );
          } else {
            throw err;
          }
        }

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
      } catch (err: any) {
        throw err;
      }
    }
  );
}

export async function getDeliveryTimeline(numTransVenda: number, codcli: number | null, tipo?: string | null): Promise<any[]> {
  const isAdmin = tipo === 'A';
  if (!codcli && !isAdmin) return [];

  const binds: any = { NUMTRANSVENDA: numTransVenda };
  if (codcli) binds.CODCLI = codcli;

  // Removido cache ou setado TTL 0 para garantir "Tempo Real" nas buscas de timeline
  return getOrSetCache(
    `deliveryTimeline:${codcli}:${numTransVenda}`,
    0, // 0ms TTL = No cache (Busca em Tempo Real no banco de dados)
    async () => {
      try {
        const rows = await select<any>(
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
          WHERE L.NUMTRANSVENDA = :NUMTRANSVENDA
            ${codcli ? 'AND N.CODCLI = :CODCLI' : ''}
          ORDER BY NVL(L.DATA_HORA_EFETIVA, L.DATA_HORA) ASC NULLS LAST
          `,
          binds
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
      } catch (err: any) {
        const msg = err.message || String(err);
        if (msg.includes('ORA-00903') || msg.includes('ORA-00942')) {
          console.warn('[DELIVERIES TIMELINE] BRLOGSSW não encontrada em ' + OWNER + '. Realizando fallback de timeline em PCNFSAID.');
          
          // Fallback para gerar linha do tempo resumida apenas com base no faturamento
          const fallbackRows = await select<any>(
            `
            SELECT
              N.DTFAT AS DATA_HORA,
              N.DTENTREGA AS DATA_HORA_EFETIVA,
              'Faturado' AS OCORRENCIA,
              'Nota fiscal emitida e separada para transporte' AS DESCRICAO,
              C.MUNICENT AS CIDADE,
              C.CLIENTE AS DESTINATARIO
            FROM ${OWNER}.PCNFSAID N
            LEFT JOIN ${OWNER}.PCCLIENT C ON C.CODCLI = N.CODCLI
            WHERE N.NUMTRANSVENDA = :NUMTRANSVENDA
              ${codcli ? 'AND N.CODCLI = :CODCLI' : ''}
            `,
            binds
          );

          if (fallbackRows.length > 0) {
             const row = fallbackRows[0];
             const timeline = [];
             
             // Evento Base: Faturamento/Criação
             timeline.push({
               when: toIsoDate(row.DATA_HORA) ?? new Date().toISOString(),
               occurrence: row.OCORRENCIA,
               description: row.DESCRICAO,
               city: row.CIDADE ?? '',
               destinatario: row.DESTINATARIO ?? '',
               nomeRecebedor: '',
               docRecebedor: ''
             });

             // Evento Extra: Se a data de entrega estiver preenchida no ERP
             if (row.DATA_HORA_EFETIVA) {
               timeline.push({
                 when: toIsoDate(row.DATA_HORA_EFETIVA),
                 occurrence: 'Entregue',
                 description: 'Pedido finalizado e entregue ao destinatário',
                 city: row.CIDADE ?? '',
                 destinatario: row.DESTINATARIO ?? '',
                 nomeRecebedor: '',
                 docRecebedor: ''
               });
             }

             return timeline;
          }

          return [];
        }
        throw err;
      }
    }
  );
}
