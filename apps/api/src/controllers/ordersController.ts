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
  itens?: any[];
};

function mapStatus(row: any): 'faturado' | 'bloqueado' | 'liberado' {
  const pos = (row.POSICAO ?? '').toString().toUpperCase();
  const hasNota = row.NUMNOTA != null || row.DTFAT != null;
  if (hasNota) return 'faturado';
  if (['B', 'BLQ', 'BLOQ', 'BLOQUEADO'].includes(pos)) return 'bloqueado';
  return 'liberado';
}

export async function getRecentOrders(params: { codcli: number; page?: number; pageSize?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const offset = (page - 1) * pageSize;

  // Query principal com paginação
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
     ORDER BY DATA DESC
     OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
    `,
    { CODCLI: params.codcli, OFFSET: offset, LIMIT: pageSize }
  );

  // Query de contagem total
  const countRes = await select<{ TOTAL: number }>(
    `
    SELECT COUNT(*) AS TOTAL
      FROM ${OWNER}.PCPEDC
       WHERE CODCLI = :CODCLI
       AND TRUNC(DATA) >= TRUNC(SYSDATE) - 30
    `,
    { CODCLI: params.codcli }
  );
  const total = Number(countRes?.[0]?.TOTAL ?? 0);

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
  const where: string[] = ['CODCLI = :CODCLI'];

  if (params.dtInicial) {
    where.push('DATA >= TO_DATE(:DTINICIAL, \'YYYY-MM-DD\')');
    binds.DTINICIAL = params.dtInicial;
  }
  if (params.dtFinal) {
    // Adiciona 23:59:59 para pegar o dia todo se for apenas data
    where.push('DATA <= TO_DATE(:DTFINAL || \' 23:59:59\', \'YYYY-MM-DD HH24:MI:SS\')');
    binds.DTFINAL = params.dtFinal;
  }
  if (params.pedido) {
    where.push('NUMPED = :NUMPED');
    binds.NUMPED = params.pedido;
  }
  if (params.nf) {
    where.push('NUMNOTA = :NUMNOTA');
    binds.NUMNOTA = params.nf;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Query principal
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
     ${whereClause}
     ORDER BY DATA DESC
     OFFSET :OFFSET ROWS FETCH NEXT :LIMIT ROWS ONLY
    `,
    { ...binds, OFFSET: offset, LIMIT: pageSize }
  );

  // Contagem
  const countRes = await select<{ TOTAL: number }>(
    `
    SELECT COUNT(*) AS TOTAL
      FROM ${OWNER}.PCPEDC
     ${whereClause}
    `,
    binds
  );
  const total = Number(countRes?.[0]?.TOTAL ?? 0);
  // console.error('TOTAL COUNT MATCHING FILTERS:', total);

  // Mapeamento inicial dos cabeçalhos
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
    itens: []
  }));

  // Buscar itens para os pedidos encontrados
  if (mapped.length > 0) {
    const orderNumbers = mapped.map(o => Number(o.orderNumber));

    // Usando IN clause para buscar itens de todos os pedidos da página de uma vez
    // Oracle suporta até 1000 elementos no IN, aqui temos pagination size (default 10)
    // Para segurança, vamos fazer bind array ou string interpolation segura já que são números controlados

    const orderIdsStr = orderNumbers.join(',');

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
         WHERE I.NUMPED IN (${orderIdsStr})
         ORDER BY I.NUMSEQ
        `
      );

      // Agrupar itens por pedido
      const itemsMap = new Map<string, any[]>();
      itemsRows.forEach(item => {
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
      console.error('Failed to fetch items:', error);
    }
  }

  return { orders: mapped, total, page, pageSize };
}
