import { Card } from '@pgb/ui';
import type { ReactElement } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { LineAreaChart } from '../../../components/charts/LineAreaChart';
import { RecentOrdersTable } from '../../../components/dashboard/RecentOrdersTable';
import { DocsValidity } from '../../../components/dashboard/DocsValidity';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { fetchKpis, mapKpisToCards } from './dashboardApi';
import { fetchRecentOrders } from './ordersApi';
import { fetchDocsValidityUltraFast } from './docsApiStreaming';
import { fetchSacSeries, fetchPendingTickets } from './sacApi';

/* ───────── Skeleton Components ───────── */

function KpiSkeleton() {
  return (
    <section className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="relative overflow-hidden p-4 sm:p-5 animate-pulse">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-200 dark:bg-zinc-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-20" />
              <div className="h-6 bg-slate-200 dark:bg-zinc-700 rounded w-28" />
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}

function ChartSkeleton() {
  return (
    <Card className="p-4 sm:p-6 animate-pulse">
      <div className="space-y-3 mb-4">
        <div className="h-5 bg-slate-200 dark:bg-zinc-700 rounded w-40" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-28" />
      </div>
      <div className="h-[280px] bg-slate-100 dark:bg-zinc-800 rounded-xl" />
    </Card>
  );
}

function TicketsSkeleton() {
  return (
    <Card className="flex flex-col p-4 sm:p-6 animate-pulse">
      <div className="space-y-3 mb-4">
        <div className="h-5 bg-slate-200 dark:bg-zinc-700 rounded w-40" />
        <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-28" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-zinc-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card className="p-0 overflow-hidden animate-pulse">
      <div className="p-4 sm:p-6 flex items-center justify-between">
        <div className="h-5 bg-slate-200 dark:bg-zinc-700 rounded w-40" />
        <div className="h-8 bg-slate-200 dark:bg-zinc-700 rounded w-24" />
      </div>
      <div className="px-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-t border-slate-100 dark:border-zinc-800/50">
            <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-24" />
            <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-32 flex-1" />
            <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-20" />
            <div className="h-6 bg-slate-200 dark:bg-zinc-700 rounded w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function DocsSkeleton() {
  return (
    <Card className="p-4 sm:p-6 animate-pulse">
      <div className="h-5 bg-slate-200 dark:bg-zinc-700 rounded w-48 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 border border-slate-100 dark:border-zinc-800/50 rounded-lg">
            <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-32" />
            <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-24" />
            <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-20" />
            <div className="h-6 bg-slate-200 dark:bg-zinc-700 rounded w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ───────── Async Section Components ───────── */

async function KpiSection() {
  const raw = await fetchKpis();
  const kpis = mapKpisToCards(raw);

  const icons: ReactElement[] = [
    <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
    <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>,
    <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>,
  ];
  const gradients = ['from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-orange-500 to-orange-600', 'from-purple-500 to-purple-600'];

  return (
    <section className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 lg:grid-cols-4">
      {kpis.map((k, index) => (
        <Card key={k.label} className="relative overflow-hidden group hover:shadow-xl transition-shadow duration-300 p-4 sm:p-5">
          <div className="flex items-center justify-start gap-3 sm:gap-4">
            <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} text-white shadow-lg flex-shrink-0`}>
              {icons[index % icons.length]}
            </div>
            <div className="flex-1 min-w-0" title={String(k.value)}>
              <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400 dark:text-zinc-400 mb-0.5">{k.label}</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-zinc-100 truncate">{k.value}</div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tl from-gray-100 dark:from-zinc-800/50 to-transparent opacity-50 rounded-tl-full" />
        </Card>
      ))}
    </section>
  );
}

async function SacChartSection() {
  const sacSeries = await fetchSacSeries();
  const hasNoSession =
    sacSeries.datasets[0].label.includes('sem sessão') ||
    sacSeries.datasets[0].label.includes('erro');

  return (
    <Card className="p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100 truncate">SAC - Séries (Hoje)</h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 truncate">Distribuição por hora</p>
        {hasNoSession && (
          <p className="mt-2 text-xs sm:text-sm text-amber-600 dark:text-amber-500">
            Não foi possível carregar as séries do SAC ({sacSeries.datasets[0].label.replace('Resolvidos ', '').replace(/\(|\)/g, '')}). Exibindo dados vazios.
          </p>
        )}
      </div>
      <LineAreaChart labels={sacSeries.labels} datasets={sacSeries.datasets} height={280} />
    </Card>
  );
}

async function PendingTicketsSection() {
  const pendingTickets = await fetchPendingTickets();

  return (
    <Card className="flex flex-col p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100 truncate">SAC - Próximas ações</h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 truncate">Tickets pendentes</p>
        </div>
        <Link href="/dashboard/sac?status=em_andamento" className="text-xs font-medium text-blue-600 dark:text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
          Ver todos →
        </Link>
      </div>

      {pendingTickets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 sm:py-10 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="p-3 bg-white dark:bg-zinc-900 dark:bg-zinc-800 rounded-full shadow-sm mb-3 ring-1 ring-gray-100 dark:ring-zinc-700">
            <svg width="24" height="24" className="text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">Tudo em dia!</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">Nenhum ticket pendente no momento.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2">
          {pendingTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/sac/${ticket.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 hover:border-blue-200 dark:border-blue-800/50 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:bg-blue-950/20 dark:hover:bg-blue-900/20 transition-all group"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${ticket.status === 'pendente' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-400">{ticket.subject}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  #{ticket.id} • {new Date(ticket.openedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

async function RecentOrdersSection({ page, pageSize }: { page: number; pageSize: number }) {
  const { orders, total } = await fetchRecentOrders(page, pageSize);
  return <RecentOrdersTable orders={orders} total={total} page={page} pageSize={pageSize} />;
}

async function DocsSection() {
  const docs = await fetchDocsValidityUltraFast();
  return <DocsValidity docs={docs} />;
}

/* ───────── Main Page ───────── */

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<ReactElement> {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const pageSize = Number(searchParams?.pageSize ?? 10);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ErrorBoundary>
        <Suspense fallback={<KpiSkeleton />}>
          <KpiSection />
        </Suspense>
      </ErrorBoundary>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ErrorBoundary>
          <Suspense fallback={<ChartSkeleton />}>
            <SacChartSection />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<TicketsSkeleton />}>
            <PendingTicketsSection />
          </Suspense>
        </ErrorBoundary>
      </section>

      <section>
        <ErrorBoundary>
          <Suspense fallback={<TableSkeleton />}>
            <RecentOrdersSection page={page} pageSize={pageSize} />
          </Suspense>
        </ErrorBoundary>
      </section>

      <section>
        <ErrorBoundary>
          <Suspense fallback={<DocsSkeleton />}>
            <DocsSection />
          </Suspense>
        </ErrorBoundary>
      </section>
    </div>
  );
}