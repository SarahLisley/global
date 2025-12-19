import { select } from '../db/query';
import { OWNER } from '../utils/env';

export type RecentOrder = {
  orderNumber: string;
  date: string;
  total: number;
  codcli: number;
  sellerCode: number;
  seller: string;
  dtEntrega?: string | null;
  vlatend?: number | null;
  desconto?: number | null;
  frete?: number | null;
  numNota?: number | null;
  numTransVenda?: number | null;
  posicao?: string | null;
  dtfat?: string | null;
  status: 'faturado' | 'bloqueado' | 'liberado';
};

function mapStatus(row: any): 'faturado' | 'bloqueado' | 'liberado' {
  const pos = (row.POSICAO ?? '').toString().toUpperCase();
  const hasNota = row.NUMNOTA != null || row.DTFAT != null;
  if (hasNota) return 'faturado';
  if (['B','BLQ','BLOQ','BLOQUEADO'].includes(pos)) return 'bloqueado';
  return 'liberado';
}

export async function getRecentOrders(params: { codcli: number }) {
  const rows = await select<any>(
    `
    SELECT NUMPED,
           DATA,
           VLTOTAL,
           CODCLI,
           CODUSUR,
           (SELECT pcusuari.nome FROM ${OWNER}.pcusuari WHERE pcusuari.codusur = pcpedc.codusur) AS VENDEDOR,
           DTENTREGA,
           VLATEND,
           VLDESCONTO,
           VLFRETE,
           NUMNOTA,
           NUMTRANSVENDA,
           POSICAO,
           DTFAT
      FROM ${OWNER}.PCPEDC
     WHERE CODCLI = :CODCLI
       AND TRUNC(DATA) >= TRUNC(SYSDATE) - 30
     ORDER BY DATA DESC FETCH FIRST 10 ROWS ONLY
    `,
    { CODCLI: params.codcli }
  );

  const mapped: RecentOrder[] = rows.map((r: any) => ({
    orderNumber: String(r.NUMPED),
    date: r.DATA,
    total: Number(r.VLTOTAL ?? 0),
    codcli: Number(r.CODCLI),
    sellerCode: Number(r.CODUSUR),
    seller: String(r.VENDEDOR ?? ''),
    dtEntrega: r.DTENTREGA ?? null,
    vlatend: r.VLATEND ?? null,
    desconto: r.VLDESCONTO ?? null,
    frete: r.VLFRETE ?? null,
    numNota: r.NUMNOTA ?? null,
    numTransVenda: r.NUMTRANSVENDA ?? null,
    posicao: r.POSICAO ?? null,
    dtfat: r.DTFAT ?? null,
    status: mapStatus(r),
  }));

  return mapped;
}