import { select } from '../db/query';
import { OWNER } from '../utils/env';
import { getOrSetCache } from '../utils/ttlCache';

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
  itemCount?: number;
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

function buildOrderBindParams(orderNumbers: number[]) {
  const binds: Record<string, number> = {};
  const placeholders = orderNumbers.map((num, index) => {
    const key = `ORD_${index}`;
    binds[key] = num;
    return `:${key}`;
  });

  return { binds, placeholders };
}

async function getOrderItemCounts(codcli: number | null, orderNumbers: number[]) {
  if (!codcli || orderNumbers.length === 0) return new Map<string, number>();

  const { binds, placeholders } = buildOrderBindParams(orderNumbers);
  const rows = await select<any>(
    `
    SELECT I.NUMPED, COUNT(*) AS ITEM_COUNT
      FROM ${OWNER}.PCPEDI I
      JOIN ${OWNER}.PCPEDC C
        ON C.NUMPED = I.NUMPED
     WHERE C.CODCLI = :CODCLI
       AND I.NUMPED IN (${placeholders.join(',')})
     GROUP BY I.NUMPED
    `,
    { CODCLI: codcli, ...binds }
  );

  return new Map<string, number>(
    rows.map((row: any) => [String(row.NUMPED), Number(row.ITEM_COUNT ?? 0)])
  );
}

async function getItemsForOrders(codcli: number | null, orderNumbers: number[]) {
  if (!codcli || orderNumbers.length === 0) return new Map<string, OrderItem[]>();

  const { binds, placeholders } = buildOrderBindParams(orderNumbers);
  const rows = await select<any>(
    `
    SELECT I.NUMPED,
           I.CODPROD,
           P.DESCRICAO,
           I.QT,
           I.QTFALTA,
           I.PVENDA,
           I.PVENDA * I.QT AS PVTOTAL
      FROM ${OWNER}.PCPEDI I
      JOIN ${OWNER}.PCPEDC C
        ON C.NUMPED = I.NUMPED
      LEFT JOIN ${OWNER}.PCPRODUT P
        ON P.CODPROD = I.CODPROD
     WHERE C.CODCLI = :CODCLI
       AND I.NUMPED IN (${placeholders.join(',')})
     ORDER BY I.NUMPED, I.NUMSEQ
    `,
    { CODCLI: codcli, ...binds }
  );

  const itemsMap = new Map<string, OrderItem[]>();
  rows.forEach((item: any) => {
    const orderNumber = String(item.NUMPED);
    if (!itemsMap.has(orderNumber)) itemsMap.set(orderNumber, []);
    itemsMap.get(orderNumber)?.push({
      codProduto: String(item.CODPROD),
      descricao: item.DESCRICAO,
      qtd: Number(item.QT),
      qtdFalta: Number(item.QTFALTA ?? 0),
      pvUnit: Number(item.PVENDA),
      pvTotal: Number(item.PVTOTAL),
    });
  });

  return itemsMap;
}

export async function getRecentOrders(params: { codcli: number | null; page?: number; pageSize?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const offset = (page - 1) * pageSize;

  if (!params.codcli) {
    return { orders: [], total: 0, page, pageSize };
  }

  return getOrSetCache(`orders:recent:${params.codcli}:${page}:${pageSize}`, 30_000, async () => {
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
         AND P.DATA >= TRUNC(SYSDATE) - 30
       ORDER BY P.DATA DESC
       OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
      `,
      { CODCLI: params.codcli, OFFSET: offset, LIMIT: pageSize }
    );

    const total = Number(rows[0]?.TOTAL_COUNT ?? 0);
    const mapped = rows.map(mapOrderRow);

    return { orders: mapped, total, page, pageSize };
  });
}

export async function searchOrders(params: {
  codcli: number | null;
  dtInicial?: string;
  dtFinal?: string;
  pedido?: string | number;
  nf?: string | number;
  page?: number;
  pageSize?: number;
  includeItems?: boolean;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const offset = (page - 1) * pageSize;

  if (!params.codcli) {
    return { orders: [], total: 0, page, pageSize };
  }

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
  const mapped: RecentOrder[] = rows.map((row: any) => ({
    ...mapOrderRow(row),
    itemCount: 0,
  }));

  if (mapped.length > 0) {
    const orderNumbers = mapped.map((order) => Number(order.orderNumber));

    try {
      const itemCounts = await getOrderItemCounts(params.codcli, orderNumbers);
      mapped.forEach((order) => {
        order.itemCount = itemCounts.get(order.orderNumber) ?? 0;
      });

      if (params.includeItems) {
        const itemsMap = await getItemsForOrders(params.codcli, orderNumbers);
        mapped.forEach((order) => {
          order.itens = itemsMap.get(order.orderNumber) || [];
        });
      }
    } catch (_error: any) {
      // Log will be handled by Fastify's error handler
    }
  }

  return { orders: mapped, total, page, pageSize };
}

export async function getOrderItems(params: { codcli: number | null; orderNumber: string | number }) {
  const orderNumber = Number(params.orderNumber);
  if (!Number.isFinite(orderNumber)) {
    throw new Error('Pedido invÃ¡lido');
  }

  const itemsMap = await getItemsForOrders(params.codcli, [orderNumber]);
  return itemsMap.get(String(orderNumber)) ?? [];
}
