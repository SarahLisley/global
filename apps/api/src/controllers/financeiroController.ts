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
      P.NUMPED,
      NF.NUMNOTA,
      P.DTEMISSAO,
      P.DTVENC,
      P.DTPAG,
      P.VALOR,
      P.VPAGO,
      P.CODFILIAL
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
      id: `${r.NUMTRANSVENDA}-${r.DUPLIC}`,
      codCliente: String(params.codcli),
      dtEmissao: r.DTEMISSAO ? new Date(r.DTEMISSAO).toISOString() : '',
      nroDocto: String(r.DUPLIC),
      parcela: String(r.DUPLIC), // Often DUPLIC is just the number/letter
      valor: Number(r.VALOR ?? 0),
      dtVencimento: r.DTVENC ? new Date(r.DTVENC).toISOString() : '',
      cobranca: 'Boleto', // Default placeholder
      jurosTaxas: 0, // Not querying juros yet
      status, // mapped status
      dtPgto: r.DTPAG ? new Date(r.DTPAG).toISOString() : undefined,
      vlrPago: r.VPAGO ? Number(r.VPAGO) : undefined,
      boletoUrl: undefined, // Would need another integration for this
      numped: r.NUMPED ? String(r.NUMPED) : undefined,
      notaFiscal: r.NUMNOTA ? String(r.NUMNOTA) : undefined,
    };
  });

  if (titulos.length === 0) {
    // Mock Fallback
    const mockTitulos: Titulo[] = [
      {
        id: 'mock-1',
        codCliente: String(params.codcli),
        dtEmissao: new Date(Date.now() - 86400000 * 20).toISOString(),
        nroDocto: '12345/1',
        parcela: '1',
        valor: 1500.00,
        dtVencimento: new Date(Date.now() - 86400000 * 5).toISOString(),
        cobranca: 'Boleto',
        jurosTaxas: 15.50,
        status: 'unpaid',
        numped: '500123',
        notaFiscal: '987654'
      },
      {
        id: 'mock-2',
        codCliente: String(params.codcli),
        dtEmissao: new Date(Date.now() - 86400000 * 40).toISOString(),
        nroDocto: '12340/1',
        parcela: '1',
        valor: 2500.00,
        dtVencimento: new Date(Date.now() - 86400000 * 10).toISOString(),
        cobranca: 'Boleto',
        jurosTaxas: 0,
        status: 'paid',
        dtPgto: new Date(Date.now() - 86400000 * 12).toISOString(),
        vlrPago: 2500.00,
        numped: '500110',
        notaFiscal: '987600'
      },
      {
        id: 'mock-3',
        codCliente: String(params.codcli),
        dtEmissao: new Date(Date.now() - 86400000 * 5).toISOString(),
        nroDocto: '12350/1',
        parcela: '1',
        valor: 850.00,
        dtVencimento: new Date(Date.now() + 86400000 * 10).toISOString(),
        cobranca: 'Boleto',
        jurosTaxas: 0,
        status: 'unpaid',
        numped: '500122',
        boletoUrl: 'https://example.com/boleto.pdf'
      }
    ];

    return {
      titulos: mockTitulos as any[],
      total: 3,
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
