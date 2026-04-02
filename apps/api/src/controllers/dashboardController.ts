import { select } from '../db/query';
import { OWNER } from '../utils/env';
import { getOrSetCache } from '../utils/ttlCache';
import type { DashboardSummary } from '@pgb/sdk';

type KPIs = {
  codcli: number;
  ordersLast30d: { totalAmount: number; totalOrders: number };
  receivablesOpen: { totalAmount: number };
  deliveries: { doneLast30d: number; doneToday: number };
};

async function resolveCodcli(params: { email?: string; codcli?: string | number }): Promise<number | null> {
  const { email, codcli } = params;
  if (codcli !== undefined && codcli !== null && `${codcli}`.trim() !== '') {
    return Number(codcli);
  }
  if (!email || !email.trim()) {
    return null;
  }

  const [row] = await select<{ CODCLI: number }>(
    `
    SELECT c.CODCLI
      FROM ${OWNER}.BRLOGINWEB l
      JOIN ${OWNER}.PCCLIENT c
        ON REPLACE(REPLACE(REPLACE(l.CGC, '/',''), '.',''), '-','')
         = REPLACE(REPLACE(REPLACE(c.CGCENT, '/',''), '.',''), '-','')
     WHERE UPPER(l.EMAIL) = :EMAIL
    `,
    { EMAIL: email.trim().toUpperCase() }
  );

  if (!row) {
    return null;
  }
  return Number(row.CODCLI);
}



export async function getDashboardKpis(params: { email?: string; codcli?: string | number }): Promise<KPIs> {
  const codcli = await resolveCodcli(params);
  
  if (!codcli) {
    return {
      codcli: 0,
      ordersLast30d: { totalAmount: 0, totalOrders: 0 },
      receivablesOpen: { totalAmount: 0 },
      deliveries: { doneLast30d: 0, doneToday: 0 },
    };
  }

  return getOrSetCache(`dashboard:kpis:${codcli}`, 30_000, async () => {
    const [ordersRows, receivablesRows, deliveriesRows] = await Promise.all([
      select<{ VLATENDIDO: number; QTPEDIDOS: number }>(
        `
        SELECT
          SUM(VLATEND) AS VLATENDIDO,
          COUNT(NUMPED) AS QTPEDIDOS
          FROM ${OWNER}.PCPEDC
         WHERE DATA >= TRUNC(SYSDATE) - 30
           AND POSICAO NOT IN ('C')
           AND CODCLI = :CODCLI
        `,
        { CODCLI: codcli }
      ),
      select<{ VALOR: number }>(
        `
        SELECT SUM(VALOR) AS VALOR
          FROM ${OWNER}.PCPREST
         WHERE CODCOB NOT IN ('DESD', 'CANC')
           AND DTCANCEL IS NULL
           AND DTPAG IS NULL
           AND CODCLI = :CODCLI
        `,
        { CODCLI: codcli }
      ),
      (async () => {
        try {
          return await select<{ ENTREGAS_30D: number; ENTREGAS_HOJE: number }>(
            `
            SELECT
              SUM(CASE WHEN a.DTENTREGA IS NOT NULL
                         AND a.DTENTREGA >= TRUNC(SYSDATE) - 30
                       THEN 1 ELSE 0 END) AS ENTREGAS_30D,
              SUM(CASE WHEN a.DTENTREGA IS NOT NULL
                         AND a.DTENTREGA >= TRUNC(SYSDATE)
                         AND a.DTENTREGA < TRUNC(SYSDATE) + 1
                       THEN 1 ELSE 0 END) AS ENTREGAS_HOJE
              FROM ${OWNER}.BRAGENDANF a
              JOIN ${OWNER}.PCNFSAID n
                ON n.NUMTRANSVENDA = a.NUMTRANSVENDA
             WHERE n.CODCLI = :CODCLI
            `,
            { CODCLI: codcli }
          );
        } catch (err: any) {
          const msg = err.message || String(err);
          if (msg.includes('ORA-00903') || msg.includes('ORA-00942')) {
            return [{ ENTREGAS_30D: 0, ENTREGAS_HOJE: 0 }];
          }
          throw err;
        }
      })(),
    ]);

    const orders = ordersRows[0];
    const receivables = receivablesRows[0];
    const deliveries = deliveriesRows[0];

    return {
      codcli,
      ordersLast30d: {
        totalAmount: orders?.VLATENDIDO ?? 0,
        totalOrders: orders?.QTPEDIDOS ?? 0,
      },
      receivablesOpen: {
        totalAmount: receivables?.VALOR ?? 0,
      },
      deliveries: {
        doneLast30d: deliveries?.ENTREGAS_30D ?? 0,
        doneToday: deliveries?.ENTREGAS_HOJE ?? 0,
      },
    };
  });
}

let summaryCache: { data: DashboardSummary | null; expires: number } = { data: null, expires: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = Date.now();
  if (summaryCache.data && now < summaryCache.expires) {
    return summaryCache.data;
  }
  const [u] = await select<{ TOTAL: number; CLIENTES: number }>(
    `
    SELECT
      COUNT(*) AS TOTAL,
      SUM(CASE WHEN UPPER(TRIM(TIPO)) = 'C' THEN 1 ELSE 0 END) AS CLIENTES
    FROM ${OWNER}.BRLOGINWEB
    `
  );
  const usuarios_total = u?.TOTAL ?? 0;
  const usuarios_clientes = u?.CLIENTES ?? 0;
  const usuarios_outros = usuarios_total - usuarios_clientes;

  let nf_total_hoje = 0;
  let nf_erros_hoje = 0;
  let nf_sucesso_hoje = 0;
  let nf_ultimos7d = 0;

  try {
    const [n] = await select<{
      TOTAL_HOJE: number;
      ERROS_HOJE: number;
      SUCESSO_HOJE: number;
      ULT7D: number;
    }>(
      `
      SELECT
        SUM(CASE WHEN TRUNC(NVL(DATAPROCESSAMENTO, DATAATUALIZACAO)) = TRUNC(SYSDATE) THEN 1 ELSE 0 END) AS TOTAL_HOJE,
        SUM(CASE WHEN TRUNC(NVL(DATAPROCESSAMENTO, DATAATUALIZACAO)) = TRUNC(SYSDATE)
                  AND (NVL(ERROINTEGRACAO,0) <> 0 OR NVL(ERROORACLECODE,0) <> 0)
            THEN 1 ELSE 0 END) AS ERROS_HOJE,
        SUM(CASE WHEN TRUNC(NVL(DATAPROCESSAMENTO, DATAATUALIZACAO)) = TRUNC(SYSDATE)
                  AND (NVL(ERROINTEGRACAO,0) = 0 AND NVL(ERROORACLECODE,0) = 0)
            THEN 1 ELSE 0 END) AS SUCESSO_HOJE,
        SUM(CASE WHEN NVL(DATAPROCESSAMENTO, DATAATUALIZACAO) >= TRUNC(SYSDATE) - 6 THEN 1 ELSE 0 END) AS ULT7D
      FROM ${OWNER}.BRLOGNFENTI
      `
    );

    nf_total_hoje = n?.TOTAL_HOJE ?? 0;
    nf_erros_hoje = n?.ERROS_HOJE ?? 0;
    nf_sucesso_hoje = n?.SUCESSO_HOJE ?? 0;
    nf_ultimos7d = n?.ULT7D ?? 0;
  } catch (_) {
    // BRLOGNFENTI may not exist in all environments — silently ignore
  }

  const result: DashboardSummary = {
    usuarios_total,
    usuarios_clientes,
    usuarios_outros,
    nf_total_hoje,
    nf_erros_hoje,
    nf_sucesso_hoje,
    nf_ultimos7d,
    atualizado_em: new Date().toISOString(),
  };

  summaryCache = { data: result, expires: Date.now() + CACHE_TTL_MS };
  return result;
}
