import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FinanceiroClient, { Titulo, Status } from './FinanceiroClient';
import FinanceiroLoading from './loading';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

async function getTitulos(searchParams: { [key: string]: string | string[] | undefined }) {
  const token = (await cookies()).get('pgb_session')?.value;
  if (!token) return { titulos: [], total: 0, page: 1 };

  const params = new URLSearchParams();
  const page = typeof searchParams.page === 'string' ? searchParams.page : '1';
  const pageSize = typeof searchParams.pageSize === 'string' ? searchParams.pageSize : '10';
  const dtInicial = typeof searchParams.dtInicial === 'string' ? searchParams.dtInicial : '';
  const dtFinal = typeof searchParams.dtFinal === 'string' ? searchParams.dtFinal : '';
  const status = typeof searchParams.status === 'string' ? searchParams.status : 'all';
  const numped = typeof searchParams.numped === 'string' ? searchParams.numped : '';
  const nf = typeof searchParams.nf === 'string' ? searchParams.nf : '';

  params.append('page', page);
  params.append('pageSize', pageSize);
  if (dtInicial) params.append('dtInicial', dtInicial);
  if (dtFinal) params.append('dtFinal', dtFinal);
  if (status && status !== 'all') params.append('status', status);
  if (numped) params.append('numped', numped);
  if (nf) params.append('nf', nf);

  try {
    const res = await fetch(`${API_BASE}/financeiro?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store', // Ensure fresh data on every request
    });

    if (!res.ok) {
      if (res.status === 401) {
        redirect('/login?from=/dashboard/financeiro');
      }
      console.error('Failed to fetch financeiro:', res.status, await res.text());
      return { titulos: [], total: 0, page: 1 };
    }

    const data = await res.json();
    return {
      titulos: data.titulos || [],
      total: data.total || 0,
      page: Number(page),
    };
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error fetching financeiro:', error);
    return { titulos: [], total: 0, page: 1 };
  }
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  // Default dates if not present
  const hoje = new Date();
  const trintaDiasAtras = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const cookieStore = await cookies();
  const savedDtInicial = cookieStore.get('financeiro_dtInicial')?.value;
  const savedDtFinal = cookieStore.get('financeiro_dtFinal')?.value;

  // Default to SearchParams -> Cookie -> Default logic
  const dtInicial = typeof resolvedParams.dtInicial === 'string'
    ? resolvedParams.dtInicial
    : (savedDtInicial || toISODate(trintaDiasAtras));

  const dtFinal = typeof resolvedParams.dtFinal === 'string'
    ? resolvedParams.dtFinal
    : (savedDtFinal || toISODate(hoje));

  const queryParams = {
    ...resolvedParams,
    dtInicial,
    dtFinal,
  };

  const data = await getTitulos(queryParams);

  return (
    <Suspense fallback={<FinanceiroLoading />}>
      <FinanceiroClient
        initialTitulos={data.titulos}
        initialTotal={data.total}
        initialPage={data.page}
        pageSize={10}
        searchParams={{
          dtInicial,
          dtFinal,
          status: (typeof resolvedParams.status === 'string' ? resolvedParams.status : 'all') as Status,
          numped: typeof resolvedParams.numped === 'string' ? resolvedParams.numped : '',
          nf: typeof resolvedParams.nf === 'string' ? resolvedParams.nf : '',
        }}
      />
    </Suspense>
  );
}