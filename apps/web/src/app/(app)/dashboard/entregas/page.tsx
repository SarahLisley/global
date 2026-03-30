import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import EntregasClient from './EntregasClient';
import EntregasLoading from './loading';
import { apiServer } from '../../../../lib/api';

async function getEntregas(searchParams: { [key: string]: string | string[] | undefined }) {
  const params = new URLSearchParams();
  const page = typeof searchParams.page === 'string' ? searchParams.page : '1';
  const pageSize = typeof searchParams.pageSize === 'string' ? searchParams.pageSize : '10';
  const dtInicial = typeof searchParams.dtInicial === 'string' ? searchParams.dtInicial : '';
  const dtFinal = typeof searchParams.dtFinal === 'string' ? searchParams.dtFinal : '';
  const pedido = typeof searchParams.pedido === 'string' ? searchParams.pedido : '';
  const nf = typeof searchParams.nf === 'string' ? searchParams.nf : '';
  const status = typeof searchParams.status === 'string' ? searchParams.status : '';

  params.append('page', page);
  params.append('pageSize', pageSize);
  if (dtInicial) params.append('dtInicial', dtInicial);
  if (dtFinal) params.append('dtFinal', dtFinal);
  if (pedido) params.append('pedido', pedido);
  if (nf) params.append('nf', nf);
  // Backend expects 'status' query param if not 'todos' or 'all'
  if (status && status !== 'todos' && status !== 'all') params.append('status', status);

  try {
    const data = await apiServer<{ entregas: any[], total: number }>(`/entregas?${params.toString()}`);
    return {
      entregas: data.entregas || [],
      total: data.total || 0,
      page: Number(page),
    };
  } catch (error: any) {
    if (error?.message === 'NOT_AUTHENTICATED' || error?.digest?.includes('NEXT_REDIRECT')) {
      redirect('/login?from=/dashboard/entregas');
    }
    console.error('Error fetching entregas:', error);
    return { entregas: [], total: 0, page: 1 };
  }
}

export default async function EntregasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams; // Await searchParams as per Next.js 15+ (if applicable, but safe for 14 too)

  // Default dates if not present
  const hoje = new Date();
  const trintaDiasAtras = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  // Read cookies for persistence
  const cookieStore = await cookies();
  const cDtInicial = cookieStore.get('entregas_dtInicial')?.value;
  const cDtFinal = cookieStore.get('entregas_dtFinal')?.value;
  const cPedido = cookieStore.get('entregas_pedido')?.value;
  const cNf = cookieStore.get('entregas_nf')?.value;
  const cStatus = cookieStore.get('entregas_status')?.value;

  const dtInicial = typeof resolvedParams.dtInicial === 'string' ? resolvedParams.dtInicial : (cDtInicial || toISODate(trintaDiasAtras));
  const dtFinal = typeof resolvedParams.dtFinal === 'string' ? resolvedParams.dtFinal : (cDtFinal || toISODate(hoje));
  const pedido = typeof resolvedParams.pedido === 'string' ? resolvedParams.pedido : (cPedido || '');
  const nf = typeof resolvedParams.nf === 'string' ? resolvedParams.nf : (cNf || '');
  const status = typeof resolvedParams.status === 'string' ? resolvedParams.status : (cStatus || 'todos');

  // Prepare params for fetching
  const queryParams = {
    ...resolvedParams,
    dtInicial,
    dtFinal,
    pedido,
    nf,
    status
  };

  const data = await getEntregas(queryParams);

  return (
    <Suspense fallback={<EntregasLoading />}>
      <EntregasClient
        initialData={data.entregas}
        total={data.total}
        page={data.page}
        pageSize={10}
        searchParams={{
          dtInicial,
          dtFinal,
          pedido,
          nf,
          status,
        }}
      />
    </Suspense>
  );
}