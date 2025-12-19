import { Card } from '@pgb/ui';
import type { ReactElement } from 'react';
import { LineAreaChart } from '../../../components/charts/LineAreaChart';
import { RecentOrdersTable } from '../../../components/dashboard/RecentOrdersTable';
import { DocsValidity } from '../../../components/dashboard/DocsValidity';
import { fetchKpis, mapKpisToCards } from './dashboardApi';
import { fetchRecentOrders } from './ordersApi';
import { fetchDocsValidity } from './docsApi';
import { fetchSacSeries } from './sacApi';

export default async function DashboardPage(): Promise<ReactElement> {
  const raw = await fetchKpis();
  const kpis = mapKpisToCards(raw);
  const orders = await fetchRecentOrders();
  const docs = await fetchDocsValidity();
  const sacSeries = await fetchSacSeries();

  const hasNoSession =
    sacSeries.datasets[0].label.includes('sem sessão') ||
    sacSeries.datasets[0].label.includes('erro');

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, index) => {
          const icons: ReactElement[] = [
            <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>,
            <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>,
            <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>,
            <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>,
          ];
          const gradients = ['from-blue-500 to-blue-600','from-emerald-500 to-emerald-600','from-orange-500 to-orange-600','from-purple-500 to-purple-600'];
          return (
            <Card key={k.label} className="relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-slate-500 mb-1 sm:mb-2 truncate">{k.label}</div>
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1 truncate">{k.value}</div>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} text-white shadow-lg flex-shrink-0`}>
                    {icons[index % icons.length]}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tl from-gray-100 to-transparent opacity-50 rounded-tl-full" />
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">SAC - Séries (Hoje)</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Distribuição por hora</p>
            {hasNoSession && (
              <p className="mt-2 text-xs sm:text-sm text-amber-600">
                Não foi possível carregar as séries do SAC ({sacSeries.datasets[0].label.replace('Resolvidos ', '').replace(/\(|\)/g, '')}). Exibindo dados vazios.
              </p>
            )}
          </div>
          <LineAreaChart labels={sacSeries.labels} datasets={sacSeries.datasets} height={280} />
        </Card>

        <Card className="p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">SAC - Próximas ações</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Filtros e lista de tickets serão integrados</p>
          </div>
        </Card>
      </section>

      <section>
        <RecentOrdersTable orders={orders} />
      </section>

      <section>
        <DocsValidity docs={docs} />
      </section> 
    </div>
  );
}