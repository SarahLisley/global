import { select } from '../db/query';
import { OWNER } from '../utils/env';

export type Titulo = {
  id: string;
  codCliente: string;
  dtEmissao: string;
  nroDocto: string;
  parcela: string;
  valor: number;
  dtVencimento: string;
  cobranca: string;
  jurosTaxas: number;
  status: 'paid' | 'unpaid' | 'overdue';
  dtPgto?: string;
  vlrPago?: number;
  boletoUrl?: string;
  linhaDigitavel?: string;
  codigoBarras?: string;
  nossoNumero?: string;
  numped?: string;
  notaFiscal?: string;
};

export async function getTitulos(params: {
  codcli: number;
  dtInicial?: string;
  dtFinal?: string;
  status?: string;
  numped?: string;
  nf?: string;
  page?: number;
  pageSize?: number;
}) {
  const binds: Record<string, any> = { CODCLI: params.codcli };
  // Alias P for PCPREST, NF for PCNFSAID
  const where: string[] = ['P.CODCLI = :CODCLI'];

  if (params.dtInicial) {
    where.push('P.DTVENC >= TO_DATE(:DTINICIAL, \'YYYY-MM-DD\')');
    binds.DTINICIAL = params.dtInicial;
  }
  if (params.dtFinal) {
    where.push('P.DTVENC <= TO_DATE(:DTFINAL, \'YYYY-MM-DD\')');
    binds.DTFINAL = params.dtFinal;
  }
  if (params.numped) {
    where.push('P.NUMPED = :NUMPED');
    binds.NUMPED = Number(params.numped);
  }
  if (params.nf) {
    where.push('NF.NUMNOTA = :NUMNOTA');
    binds.NUMNOTA = Number(params.nf);
  }

  // Status mapping
  if (params.status && params.status !== 'all') {
    if (params.status === 'paid') {
      where.push('P.DTPAG IS NOT NULL');
    } else if (params.status === 'unpaid') {
      where.push('P.DTPAG IS NULL');
    }
  }

  const offset = ((params.page || 1) - 1) * (params.pageSize || 10);
  const limit = params.pageSize || 10;

  // Additional binds for pagination
  binds.OFFSET = offset;
  binds.LIMIT = limit;

  const query = `
    SELECT 
      P.NUMTRANSVENDA,
      P.DUPLIC,
      P.PREST,
      P.NUMPED,
      NF.NUMNOTA,
      P.DTEMISSAO,
      P.DTVENC,
      P.DTPAG,
      P.VALOR,
      P.VPAGO,
      P.CODFILIAL,
      P.CODCOB,
      P.NOSSONUMBCO,
      P.LINHADIG,
      P.CODBARRA,
      P.PASTAARQUIVOBOLETO,
      P.NOMEARQUIVO
    FROM ${OWNER}.PCPREST P
    LEFT JOIN ${OWNER}.PCNFSAID NF ON NF.NUMTRANSVENDA = P.NUMTRANSVENDA
    WHERE ${where.join(' AND ')}
    ORDER BY P.DTVENC DESC
    OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
  `;

  const rows = await select<any>(query, binds);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as TOTAL
    FROM ${OWNER}.PCPREST P
    LEFT JOIN ${OWNER}.PCNFSAID NF ON NF.NUMTRANSVENDA = P.NUMTRANSVENDA
    WHERE ${where.join(' AND ')}
  `;
  const countBinds = { ...binds };
  delete countBinds.OFFSET;
  delete countBinds.LIMIT;
  const countRes = await select<{ TOTAL: number }>(countQuery, countBinds);

  // DEBUG: Inspect boleto columns
  if (rows.length > 0) {
    console.log('DEBUG: BOLETO INFO:', rows.map((r: any) => ({
      id: r.NUMTRANSVENDA,
      nossoNum: r.NOSSONUMBCO,
      linhaDig: r.LINHADIG,
      arquivo: r.NOMEARQUIVO,
      pasta: r.PASTAARQUIVOBOLETO
    })).slice(0, 3));
  }

  const titulos = rows.map((r) => {
    const isPaid = !!r.DTPAG;
    let status: Titulo['status'] = isPaid ? 'paid' : 'unpaid';

    // Check if overdue
    if (!isPaid && new Date(r.DTVENC) < new Date()) {
      status = 'overdue'; // Will appear as unpaid/warning in frontend logic if not explicitly handled,
      // but frontend filters 'paid' | 'unpaid'.
      // Frontend logic: if (!dtPgto && vencido) shows warning.
    }

    return {
      id: `${r.NUMTRANSVENDA}-${r.PREST}`,
      codCliente: String(params.codcli),
      dtEmissao: r.DTEMISSAO ? new Date(r.DTEMISSAO).toISOString() : '',
      nroDocto: String(r.DUPLIC),
      parcela: String(r.PREST),
      valor: Number(r.VALOR ?? 0),
      dtVencimento: r.DTVENC ? new Date(r.DTVENC).toISOString() : '',
      cobranca: 'Boleto', // Default placeholder
      jurosTaxas: 0, // Not querying juros yet
      status, // mapped status
      dtPgto: r.DTPAG ? new Date(r.DTPAG).toISOString() : undefined,
      vlrPago: r.VPAGO ? Number(r.VPAGO) : undefined,
      boletoUrl: undefined, // Would need another integration for this
      linhaDigitavel: r.LINHADIG ? String(r.LINHADIG) : undefined,
      codigoBarras: r.CODBARRA ? String(r.CODBARRA) : undefined,
      nossoNumero: r.NOSSONUMBCO ? String(r.NOSSONUMBCO) : undefined,
      numped: r.NUMPED ? String(r.NUMPED) : undefined,
      notaFiscal: r.NUMNOTA ? String(r.NUMNOTA) : undefined,
    };
  });

  if (titulos.length === 0) {
    return {
      titulos: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10
    };
  }

  return {
    titulos,
    total: Number(countRes[0]?.TOTAL ?? 0),
    page: params.page || 1,
    pageSize: params.pageSize || 10
  };
}
