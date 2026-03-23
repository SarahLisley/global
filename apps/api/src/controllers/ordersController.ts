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
  itens?: OrderItem[];
};

export type OrderItem = {
  codProduto: string;
  descricao: string;
  qtd: number;
  qtdFalta: number;
  pvUnit: number;
  pvTotal: number;
};

function mapStatus(row: any): 'faturado' | 'bloqueado' | 'liberado' {
  const pos = (row.POSICAO ?? '').toString().toUpperCase();
  const hasNota = row.NUMNOTA != null || row.DTFAT != null;
  if (hasNota) return 'faturado';
  if (['B', 'BLQ', 'BLOQ', 'BLOQUEADO'].includes(pos)) return 'bloqueado';
  return 'liberado';
}

function mapOrderRow(r: any): RecentOrder {
  return {
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
  };
}

export async function getRecentOrders(params: { codcli: number; page?: number; pageSize?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const offset = (page - 1) * pageSize;

  // Query com LEFT JOIN (sem subquery) e COUNT(*) OVER() (sem query extra de contagem)
  const rows = await select<any>(
    `
    SELECT P.NUMPED,
           P.DATA,
           P.VLTOTAL,
           P.CODCLI,
           P.CODUSUR,
           U.NOME AS VENDEDOR,
           P.DTENTREGA,
           P.VLATEND,
           P.VLDESCONTO,
           P.VLFRETE,
           P.NUMNOTA,
           P.NUMTRANSVENDA,
           P.POSICAO,
           P.DTFAT,
           COUNT(*) OVER() AS TOTAL_COUNT
      FROM ${OWNER}.PCPEDC P
      LEFT JOIN ${OWNER}.PCUSUARI U ON U.CODUSUR = P.CODUSUR
     WHERE P.CODCLI = :CODCLI
       AND TRUNC(P.DATA) >= TRUNC(SYSDATE) - 30
     ORDER BY P.DATA DESC
     OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
    `,
    { CODCLI: params.codcli, OFFSET: offset, LIMIT: pageSize }
  );

  const total = Number(rows[0]?.TOTAL_COUNT ?? 0);
  const mapped = rows.map(mapOrderRow);

  return { orders: mapped, total, page, pageSize };
}

export async function searchOrders(params: {
  codcli: number;
  dtInicial?: string;
  dtFinal?: string;
  pedido?: string | number;
  nf?: string | number;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const offset = (page - 1) * pageSize;

  const binds: any = { CODCLI: params.codcli };
  const where: string[] = ['P.CODCLI = :CODCLI'];

  if (params.dtInicial) {
    where.push('P.DATA >= TO_DATE(:DTINICIAL, \'YYYY-MM-DD\')');
    binds.DTINICIAL = params.dtInicial;
  }
  if (params.dtFinal) {
    where.push('P.DATA <= TO_DATE(:DTFINAL || \' 23:59:59\', \'YYYY-MM-DD HH24:MI:SS\')');
    binds.DTFINAL = params.dtFinal;
  }
  if (params.pedido) {
    where.push('P.NUMPED = :NUMPED');
    binds.NUMPED = params.pedido;
  }
  if (params.nf) {
    where.push('P.NUMNOTA = :NUMNOTA');
    binds.NUMNOTA = params.nf;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Query com LEFT JOIN e COUNT(*) OVER()
  const rows = await select<any>(
    `
    SELECT P.NUMPED,
           P.DATA,
           P.VLTOTAL,
           P.CODCLI,
           P.CODUSUR,
           U.NOME AS VENDEDOR,
           P.DTENTREGA,
           P.VLATEND,
           P.VLDESCONTO,
           P.VLFRETE,
           P.NUMNOTA,
           P.NUMTRANSVENDA,
           P.POSICAO,
           P.DTFAT,
           COUNT(*) OVER() AS TOTAL_COUNT
      FROM ${OWNER}.PCPEDC P
      LEFT JOIN ${OWNER}.PCUSUARI U ON U.CODUSUR = P.CODUSUR
     ${whereClause}
     ORDER BY P.DATA DESC
     OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
    `,
    { ...binds, OFFSET: offset, LIMIT: pageSize }
  );

  const total = Number(rows[0]?.TOTAL_COUNT ?? 0);

  // Mapeamento dos cabeçalhos
  const mapped: RecentOrder[] = rows.map((r: any) => ({
    ...mapOrderRow(r),
    itens: [] as OrderItem[],
  }));

  // Buscar itens usando bind variables dinâmicos (sem interpolação de strings)
  if (mapped.length > 0) {
    const orderNumbers = mapped.map(o => Number(o.orderNumber));
    const itemBinds: Record<string, number> = {};
    const placeholders = orderNumbers.map((num, i) => {
      const key = `ORD_${i}`;
      itemBinds[key] = num;
      return `:${key}`;
    });

    try {
      const itemsRows = await select<any>(
        `
        SELECT I.NUMPED,
               I.CODPROD,
               P.DESCRICAO,
               I.QT,
               I.QTFALTA,
               I.PVENDA,
               I.PVENDA * I.QT AS PVTOTAL
          FROM ${OWNER}.PCPEDI I
          LEFT JOIN ${OWNER}.PCPRODUT P ON P.CODPROD = I.CODPROD
         WHERE I.NUMPED IN (${placeholders.join(',')})
         ORDER BY I.NUMSEQ
        `,
        itemBinds
      );

      // Agrupar itens por pedido
      const itemsMap = new Map<string, OrderItem[]>();
      itemsRows.forEach((item: any) => {
        const ped = String(item.NUMPED);
        if (!itemsMap.has(ped)) itemsMap.set(ped, []);
        itemsMap.get(ped)?.push({
          codProduto: String(item.CODPROD),
          descricao: item.DESCRICAO,
          qtd: Number(item.QT),
          qtdFalta: Number(item.QTFALTA ?? 0),
          pvUnit: Number(item.PVENDA),
          pvTotal: Number(item.PVTOTAL)
        });
      });

      // Associar itens aos pedidos
      mapped.forEach(order => {
        order.itens = itemsMap.get(order.orderNumber) || [];
      });
    } catch (error: any) {
      // Log will be handled by Fastify's error handler
    }
  }

  return { orders: mapped, total, page, pageSize };
}

