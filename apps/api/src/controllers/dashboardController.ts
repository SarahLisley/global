import { select } from '../db/query';
import { OWNER } from '../utils/env';

type KPIs = {
  codcli: number;
  ordersLast30d: { totalAmount: number; totalOrders: number };
  receivablesOpen: { totalAmount: number };
  deliveries: { doneLast30d: number; doneToday: number };
};

export type DashboardSummary = {
  usuarios_total: number;
  usuarios_clientes: number;
  usuarios_outros: number;
  nf_total_hoje: number;
  nf_erros_hoje: number;
  nf_sucesso_hoje: number;
  nf_ultimos7d: number;
  atualizado_em: string;
};

async function resolveCodcli(params: { email?: string; codcli?: string | number }): Promise<number> {
  const { email, codcli } = params;
  if (codcli !== undefined && codcli !== null && `${codcli}`.trim() !== '') {
    return Number(codcli);
  }
  if (!email || !email.trim()) {
    throw new Error('Forneça ?email= ou ?codcli=');
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
    throw new Error('Não foi possível localizar o CODCLI a partir do e-mail informado.');
  }
  return Number(row.CODCLI);
}

export async function getDashboardKpis(params: { email?: string; codcli?: string | number }): Promise<KPIs> {
  const codcli = await resolveCodcli(params);

  const [orders] = await select<{ VLATENDIDO: number; QTPEDIDOS: number }>(
    `
    SELECT
      SUM(VLATEND) AS VLATENDIDO,
      COUNT(NUMPED) AS QTPEDIDOS
      FROM ${OWNER}.PCPEDC
     WHERE TRUNC(DATA) >= TRUNC(SYSDATE) - 30
       AND POSICAO NOT IN ('C')
       AND CODCLI = :CODCLI
    `,
    { CODCLI: codcli }
  );

  const [receivables] = await select<{ VALOR: number }>(
    `
    SELECT SUM(VALOR) AS VALOR
      FROM ${OWNER}.PCPREST
     WHERE CODCOB NOT IN ('DESD', 'CANC')
       AND DTCANCEL IS NULL
       AND DTPAG IS NULL
       AND CODCLI = :CODCLI
    `,
    { CODCLI: codcli }
  );

  const [deliveries] = await select<{ ENTREGAS_30D: number; ENTREGAS_HOJE: number }>(
    `
    SELECT
      SUM(CASE WHEN a.DTENTREGA IS NOT NULL
                 AND TRUNC(a.DTENTREGA) >= TRUNC(SYSDATE) - 30
               THEN 1 ELSE 0 END) AS ENTREGAS_30D,
      SUM(CASE WHEN a.DTENTREGA IS NOT NULL
                 AND TRUNC(a.DTENTREGA) = TRUNC(SYSDATE)
               THEN 1 ELSE 0 END) AS ENTREGAS_HOJE
      FROM ${OWNER}.BRAGENDANF a
      JOIN ${OWNER}.PCNFSAID n
        ON n.NUMTRANSVENDA = a.NUMTRANSVENDA
     WHERE n.CODCLI = :CODCLI
    `,
    { CODCLI: codcli }
  );

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
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
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
  } catch (e) {
    console.error('BRLOGNFENTI summary failed:', e);
  }

  return {
    usuarios_total,
    usuarios_clientes,
    usuarios_outros,
    nf_total_hoje,
    nf_erros_hoje,
    nf_sucesso_hoje,
    nf_ultimos7d,
    atualizado_em: new Date().toISOString(),
  };
}