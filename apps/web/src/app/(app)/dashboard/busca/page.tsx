import { Suspense } from 'react';
import { Card } from '@pgb/ui';
import BuscaClient from './busca-client';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function fetchSearchResults(query: string) {
  if (!query) return [];
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
    const url = new URL('/search', baseUrl);
    url.searchParams.set('q', query);

    const res = await fetch(url.toString(), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching search results:', error);
    return [];
  }
}

export default async function BuscaPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === 'string' ? searchParams.q : '';

  const results = await fetchSearchResults(q);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resultados da Busca</h1>
        <p className="text-slate-500">
          {q ? (
            <>Mostrando resultados para: <span className="font-semibold text-slate-900">"{q}"</span></>
          ) : (
            'Digite algo na barra superior para pesquisar.'
          )}
        </p>
      </div>

      <Suspense fallback={
        <Card className="p-12 flex flex-col items-center justify-center text-slate-500 animate-pulse">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-4" />
          Buscando informações...
        </Card>
      }>
        <BuscaClient query={q} initialResults={results} />
      </Suspense>
    </div>
  );
}
