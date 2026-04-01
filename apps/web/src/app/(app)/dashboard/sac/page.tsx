import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import SACTicketsClient from './SACTicketsClient';
import { Status } from './types';
import { fetchTickets } from '../sacApi';

type SearchParams = { [key: string]: string | string[] | undefined };

function TicketsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-zinc-700 rounded w-64"></div>
          <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-48"></div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-zinc-700 rounded-full w-32"></div>
      </div>
      <div className="h-[400px] bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-800"></div>
    </div>
  );
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;

  const cookieStore = await cookies();

  // Defaults
  const hoje = new Date();
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  // Load from Cookies
  const cDateFrom = cookieStore.get('sac_tickets_dateFrom')?.value;
  const cDateTo = cookieStore.get('sac_tickets_dateTo')?.value;
  const cStatus = cookieStore.get('sac_tickets_status')?.value;

  // Priority: URL > Cookie > Default
  const dateFrom = typeof resolvedParams.dateFrom === 'string' ? resolvedParams.dateFrom : (cDateFrom || toISODate(trintaDiasAtras));
  const dateTo = typeof resolvedParams.dateTo === 'string' ? resolvedParams.dateTo : (cDateTo || toISODate(hoje));
  const status = typeof resolvedParams.status === 'string' ? resolvedParams.status : (cStatus || 'todos');

  const orderNumber = typeof resolvedParams.orderNumber === 'string' ? resolvedParams.orderNumber : '';
  const invoiceNumber = typeof resolvedParams.invoiceNumber === 'string' ? resolvedParams.invoiceNumber : '';

  const queryParams = {
    page: typeof resolvedParams.page === 'string' ? resolvedParams.page : '1',
    pageSize: typeof resolvedParams.pageSize === 'string' ? resolvedParams.pageSize : '10',
    dateFrom,
    dateTo,
    status,
    orderNumber,
    invoiceNumber,
  };

  const data = await fetchTickets(queryParams);

  return (
    <Suspense fallback={<TicketsLoading />}>
      <SACTicketsClient
        initialTickets={data.list}
        initialTotal={data.total}
        initialPage={data.page}
        pageSize={10}
        searchParams={{
          dateFrom,
          dateTo,
          status: status as Status,
          orderNumber,
          invoiceNumber,
        }}
      />
    </Suspense>
  );
}