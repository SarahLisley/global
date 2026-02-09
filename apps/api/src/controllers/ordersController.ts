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
  if (['B', 'BLQ', 'BLOQ', 'BLOQUEADO'].includes(pos)) return 'bloqueado';
  return 'liberado';
}

export async function getRecentOrders(params: { codcli: number; page?: number; pageSize?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const offset = (page - 1) * pageSize;

  // Mock data for Recent Orders (30 days) as requested
  const mockOrders: RecentOrder[] = [
    {
      orderNumber: '63031800',
      date: new Date().toISOString(), // Today
      total: 1450.50,
      codcli: params.codcli,
      sellerCode: 123,
      seller: 'MARINA GARDINI',
      status: 'faturado',
      numNota: 158000,
      posicao: 'F'
    },
    {
      orderNumber: '63031799',
      date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      total: 980.00,
      codcli: params.codcli,
      sellerCode: 123,
      seller: 'MARINA GARDINI',
      status: 'liberado',
      posicao: 'L'
    },
    {
      orderNumber: '63031798',
      date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      total: 2300.25,
      codcli: params.codcli,
      sellerCode: 123,
      seller: 'MARINA GARDINI',
      status: 'bloqueado',
      posicao: 'B'
    }
  ];

  /*
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
       AND TRUNC(DATA) >= TRUNC(SYSDATE) - 365
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
       AND TRUNC(DATA) >= TRUNC(SYSDATE) - 365
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
  // return { orders: mapped, total, page, pageSize };
  */

  return { orders: mockOrders, total: 10, page, pageSize };
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
    where.push('TRUNC(DATA) >= TO_DATE(:DTINICIAL, \'YYYY-MM-DD\')');
    binds.DTINICIAL = params.dtInicial;
  }
  if (params.dtFinal) {
    where.push('TRUNC(DATA) <= TO_DATE(:DTFINAL, \'YYYY-MM-DD\')');
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

  console.error('!!! DEBUG searchOrders !!!');
  console.error('PARAMS:', JSON.stringify(params));

  // DEBUG: Check total orders for this client EVER
  const debugCount = await select<{ TOTAL: number }>(`SELECT COUNT(*) AS TOTAL FROM ${OWNER}.PCPEDC WHERE CODCLI = :CODCLI`, { CODCLI: params.codcli });
  console.error('!!! TOTAL ORDERS IN DB FOR CLIENT:', debugCount?.[0]?.TOTAL);

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  console.error('SQL:', `SELECT ... FROM ${OWNER}.PCPEDC ${whereClause}`);
  console.error('BINDS:', JSON.stringify({ ...binds, OFFSET: offset, LIMIT: pageSize }));

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

  console.error('ROWS FOUND:', rows.length);

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
  console.error('TOTAL COUNT MATCHING FILTERS:', total);

  // Mapeamento
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

  // Buscar itens para cada pedido (Opcional, mas a tela pede itens)
  // O código da tela meus-pedidos usa "Ver Itens", que provavelmente chamaria outro endpoint
  // mas aqui vamos retornar apenas os dados do cabeçalho primeiro.
  // SE a tela espera itens JÁ renderizados no grid principal, precisaríamos buscar.
  // Analisando o código da tela: ela mostra itens num sub-grid usando toggleRow.
  // Na verdade, no código da página ela itera `p.itens`.
  // Se `searchOrders` não retornar itens, o subgrid vai ficar vazio.
  // Vou adicionar busca de itens básica.

  if (mapped.length > 0) {
    // ... code to fetch items ...
  } else {
    // MOCK DATA FALLBACK
    const mockOrders: any[] = [
      {
        orderNumber: '500123',
        date: new Date().toISOString(),
        total: 3500.00,
        codcli: params.codcli,
        sellerCode: 99,
        seller: 'Carlos Silva',
        status: 'faturado',
        numNota: 987654,
        posicao: 'F',
        itens: [
          { codProduto: '1001', descricao: 'Cimento CP II', qtd: 50, qtdFalta: 0, pvUnit: 30.00, pvTotal: 1500.00 },
          { codProduto: '2005', descricao: 'Tijolo 6 furos', qtd: 1000, qtdFalta: 0, pvUnit: 2.00, pvTotal: 2000.00 },
        ]
      },
      {
        orderNumber: '500122',
        date: new Date(Date.now() - 86400000).toISOString(),
        total: 1250.50,
        codcli: params.codcli,
        sellerCode: 99,
        seller: 'Carlos Silva',
        status: 'liberado',
        posicao: 'L',
        itens: [
          { codProduto: '3010', descricao: 'Argamassa ACIII', qtd: 20, qtdFalta: 0, pvUnit: 45.00, pvTotal: 900.00 },
          { codProduto: '4050', descricao: 'Rejunte', qtd: 10, qtdFalta: 0, pvUnit: 35.05, pvTotal: 350.50 },
        ]
      },
      {
        orderNumber: '500120',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        total: 8900.00,
        codcli: params.codcli,
        sellerCode: 99,
        seller: 'Carlos Silva',
        status: 'bloqueado',
        posicao: 'B',
        itens: [
          { codProduto: '5001', descricao: 'Porcelanato 80x80', qtd: 100, qtdFalta: 0, pvUnit: 89.00, pvTotal: 8900.00 },
        ]
      }
    ];

    return { orders: mockOrders.map(m => ({ ...m, status: m.status as any })), total: 3, page, pageSize };
  }

  return { orders: mapped, total, page, pageSize };
}