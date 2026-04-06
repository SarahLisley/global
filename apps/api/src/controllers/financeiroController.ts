import { select } from '../db/query';
import { OWNER } from '../utils/env';
import { getOrSetCache } from '../utils/ttlCache';

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

const FINANCEIRO_TTL_MS = 30_000;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function normalizeDateFilter(value?: string) {
  if (!value) {
    return undefined;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function normalizeNumberFilter(value?: string) {
  if (!value) {
    return undefined;
  }

  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return undefined;
  }

  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function normalizePage(value: number | undefined, fallback: number, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.trunc(parsed), max);
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function emptyResult(page: number, pageSize: number) {
  return {
    titulos: [],
    total: 0,
    page,
    pageSize,
  };
}

export async function getTitulos(params: {
  codcli: number | null;
  tipo?: string | null;
  dtInicial?: string;
  dtFinal?: string;
  status?: string;
  numped?: string;
  nf?: string;
  page?: number;
  pageSize?: number;
}) {
  const isAdmin = params.tipo === 'A';
  const page = normalizePage(params.page, DEFAULT_PAGE);
  const pageSize = normalizePage(params.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const dtInicial = normalizeDateFilter(params.dtInicial);
  const dtFinal = normalizeDateFilter(params.dtFinal);
  const status = params.status === 'paid' || params.status === 'unpaid' ? params.status : 'all';
  const numped = normalizeNumberFilter(params.numped);
  const nf = normalizeNumberFilter(params.nf);
  const hasInvalidNumped = !!params.numped?.trim() && numped === undefined;
  const hasInvalidNf = !!params.nf?.trim() && nf === undefined;

  if (!params.codcli && !isAdmin) {
    return emptyResult(page, pageSize);
  }

  if (hasInvalidNumped || hasInvalidNf) {
    return emptyResult(page, pageSize);
  }

  return getOrSetCache(
    `financeiro:${JSON.stringify({
      codcli: params.codcli,
      tipo: params.tipo,
      dtInicial: dtInicial ?? null,
      dtFinal: dtFinal ?? null,
      status,
      numped: numped ?? null,
      nf: nf ?? null,
      page,
      pageSize,
    })}`,
    FINANCEIRO_TTL_MS,
    async () => {
      const binds: Record<string, any> = {};
      const where: string[] = ['1=1'];

      if (params.codcli) {
        where.push('P.CODCLI = :CODCLI');
        binds.CODCLI = params.codcli;
      }

      if (dtInicial) {
        where.push('P.DTVENC >= TO_DATE(:DTINICIAL, \'YYYY-MM-DD\')');
        binds.DTINICIAL = dtInicial;
      }
      if (dtFinal) {
        where.push('P.DTVENC < TO_DATE(:DTFINAL, \'YYYY-MM-DD\') + 1');
        binds.DTFINAL = dtFinal;
      }
      if (numped !== undefined) {
        where.push('P.NUMPED = :NUMPED');
        binds.NUMPED = numped;
      }
      if (nf !== undefined) {
        where.push('NF.NUMNOTA = :NUMNOTA');
        binds.NUMNOTA = nf;
      }

      if (status === 'paid') {
        where.push('P.DTPAG IS NOT NULL');
      } else if (status === 'unpaid') {
        where.push('P.DTPAG IS NULL');
      }

      binds.OFFSET = (page - 1) * pageSize;
      binds.LIMIT = pageSize;

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
          P.NOSSONUMBCO,
          P.LINHADIG,
          P.CODBARRA,
          P.NOMEARQUIVO,
          COUNT(*) OVER() AS TOTAL_COUNT
        FROM ${OWNER}.PCPREST P
        LEFT JOIN ${OWNER}.PCNFSAID NF ON NF.NUMTRANSVENDA = P.NUMTRANSVENDA
        WHERE ${where.join(' AND ')}
        ORDER BY P.DTVENC DESC, P.NUMTRANSVENDA DESC, P.PREST DESC
        OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
      `;

      const rows = await select<any>(query, binds);
      const total = Number(rows[0]?.TOTAL_COUNT ?? 0);
      const now = Date.now();

      const titulos = rows.map((r) => {
        const isPaid = !!r.DTPAG;
        let titleStatus: Titulo['status'] = isPaid ? 'paid' : 'unpaid';

        if (!isPaid && r.DTVENC && new Date(r.DTVENC).getTime() < now) {
          titleStatus = 'overdue';
        }

        return {
          id: `${r.NUMTRANSVENDA}-${r.PREST}`,
          codCliente: String(params.codcli),
          dtEmissao: toIsoDate(r.DTEMISSAO),
          nroDocto: String(r.DUPLIC),
          parcela: String(r.PREST),
          valor: Number(r.VALOR ?? 0),
          dtVencimento: toIsoDate(r.DTVENC),
          cobranca: 'Boleto',
          jurosTaxas: 0,
          status: titleStatus,
          dtPgto: toIsoDate(r.DTPAG) || undefined,
          vlrPago: r.VPAGO ? Number(r.VPAGO) : undefined,
          boletoUrl: r.NOMEARQUIVO ? `/financeiro/boletos/${r.NUMTRANSVENDA}-${r.PREST}` : undefined,
          linhaDigitavel: r.LINHADIG ? String(r.LINHADIG) : undefined,
          codigoBarras: r.CODBARRA ? String(r.CODBARRA) : undefined,
          nossoNumero: r.NOSSONUMBCO ? String(r.NOSSONUMBCO) : undefined,
          numped: r.NUMPED ? String(r.NUMPED) : undefined,
          notaFiscal: r.NUMNOTA ? String(r.NUMNOTA) : undefined,
        };
      });

      if (titulos.length === 0) {
        return emptyResult(page, pageSize);
      }

      return {
        titulos,
        total,
        page,
        pageSize,
      };
    }
  );
}
