import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MeusPedidosClient from './MeusPedidosClient';
import MeusPedidosLoading from './loading';
import { apiServer } from '../../../../lib/api';

async function getPedidos(searchParams: { [key: string]: string | string[] | undefined }) {
  const params = new URLSearchParams();
  const page = typeof searchParams.page === 'string' ? searchParams.page : '1';
  const pageSize = typeof searchParams.pageSize === 'string' ? searchParams.pageSize : '10';
  const dtInicial = typeof searchParams.dtInicial === 'string' ? searchParams.dtInicial : '';
  const dtFinal = typeof searchParams.dtFinal === 'string' ? searchParams.dtFinal : '';
  const pedido = typeof searchParams.pedido === 'string' ? searchParams.pedido : '';
  const nf = typeof searchParams.nf === 'string' ? searchParams.nf : '';

  params.append('page', page);
  params.append('pageSize', pageSize);
  if (dtInicial) params.append('dtInicial', dtInicial);
  if (dtFinal) params.append('dtFinal', dtFinal);
  if (pedido) params.append('pedido', pedido);
  if (nf) params.append('nf', nf);

  try {
    const data = await apiServer<{ pedidos: any[], total: number }>(`/orders?${params.toString()}`);
    return {
      pedidos: data.pedidos || [],
      total: data.total || 0,
      page: Number(page),
    };
  } catch (error: any) {
    if (error?.message === 'NOT_AUTHENTICATED' || error?.digest?.includes('NEXT_REDIRECT')) {
      redirect('/login?from=/dashboard/meus-pedidos');
    }
    console.error('Error fetching orders:', error);
    return { pedidos: [], total: 0, page: 1 };
  }
}

export default async function MeusPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  // Check cookies for defaults
  const cookieStore = await cookies();
  const cookieDtInicial = cookieStore.get('meuspedidos_dtInicial')?.value;
  const cookieDtFinal = cookieStore.get('meuspedidos_dtFinal')?.value;
  const cookiePedido = cookieStore.get('meuspedidos_pedido')?.value;
  const cookieNf = cookieStore.get('meuspedidos_nf')?.value;

  // Default dates if not present
  const hoje = new Date();
  const trintaDiasAtras = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  // Priority: Search Params > Cookie > Default
  const dtInicial = typeof resolvedParams.dtInicial === 'string' ? resolvedParams.dtInicial : (cookieDtInicial || toISODate(trintaDiasAtras));
  const dtFinal = typeof resolvedParams.dtFinal === 'string' ? resolvedParams.dtFinal : (cookieDtFinal || toISODate(hoje));
  const pedido = typeof resolvedParams.pedido === 'string' ? resolvedParams.pedido : (cookiePedido || '');
  const nf = typeof resolvedParams.nf === 'string' ? resolvedParams.nf : (cookieNf || '');

  const queryParams = {
    ...resolvedParams,
    dtInicial,
    dtFinal,
    pedido,
    nf,
  };

  const data = await getPedidos(queryParams);

  return (
    <Suspense fallback={<MeusPedidosLoading />}>
      <MeusPedidosClient
        initialPedidos={data.pedidos}
        initialTotal={data.total}
        initialPage={data.page}
        pageSize={10}
        searchParams={{
          dtInicial,
          dtFinal,
          pedido: typeof resolvedParams.pedido === 'string' ? resolvedParams.pedido : '',
          nf: typeof resolvedParams.nf === 'string' ? resolvedParams.nf : '',
        }}
      />
    </Suspense>
  );
}