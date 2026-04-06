'use client';

import { useMemo, useState } from 'react';
import { Badge, Card } from '@pgb/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

type Order = {
  orderNumber: string;
  seller: string;
  total: number;
  status: 'faturado' | 'bloqueado' | 'liberado';
};

export function RecentOrdersTable({
  orders,
  total,
  page,
  pageSize
}: {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('pageSize', String(newPageSize));
    params.set('page', '1'); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.seller.toLowerCase().includes(q)
    );
  }, [orders, query]);

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const statusBadge = (s: Order['status']) => {
    const dot = {
      faturado: "bg-emerald-500",
      liberado: "bg-blue-500",
      bloqueado: "bg-red-500"
    };
    const label = {
      faturado: "Faturado",
      liberado: "Liberado",
      bloqueado: "Bloqueado"
    };

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-semibold border border-gray-100 bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 shadow-sm transition-all whitespace-nowrap">
        <span className={clsx("w-1.5 h-1.5 rounded-full", dot[s])} />
        {label[s]}
      </span>
    );
  };

  const totalPages = Math.ceil(total / pageSize);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = total === 0 ? 0 : Math.min(startItem + orders.length - 1, total);

  return (
    <Card className="overflow-hidden border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-zinc-900 p-0 pb-6">
      {/* Header Premium */}
      <div className="p-6 pb-2">
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-1">Pedidos Recentes</h2>
        <p className="text-sm text-gray-400 font-medium tracking-tight">Últimos 30 Dias</p>
      </div>

      <div className="px-6 py-4">
        {/* Filtros Responsivos */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Exibir</span>
            <div className="relative">
              <select
                className="appearance-none bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-2 pr-10 text-sm font-bold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                {[10, 25, 50].map(n => <option key={n} value={n}>{n} itens</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-64 sm:ml-auto group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm text-slate-800 dark:text-zinc-100 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela Clean Premium */}
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <div className="inline-block min-w-full align-middle sm:px-2">
            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-zinc-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-800 dark:text-zinc-300 text-sm whitespace-nowrap">Nro Pedido</th>
                    <th className="px-6 py-4 font-semibold text-slate-800 dark:text-zinc-300 text-sm whitespace-nowrap">Vendedor</th>
                    <th className="px-6 py-4 font-semibold text-slate-800 dark:text-zinc-300 text-sm whitespace-nowrap">Valor Total</th>
                    <th className="px-6 py-4 font-semibold text-slate-800 dark:text-zinc-300 text-sm whitespace-nowrap">Posição</th>
                    <th className="px-6 py-4 font-semibold text-slate-800 dark:text-zinc-300 text-sm whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {filtered.map((o) => (
                    <tr key={o.orderNumber} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-zinc-100 text-sm whitespace-nowrap">{o.orderNumber}</td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-zinc-400 text-sm whitespace-nowrap">{o.seller}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-zinc-100 text-sm whitespace-nowrap">{fmt.format(o.total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{statusBadge(o.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/meus-pedidos?pedido=${o.orderNumber}`}
                          className="text-blue-500 hover:text-blue-700 font-semibold text-sm transition-colors flex items-center gap-1 group/link w-fit"
                        >
                          Ver <ChevronRight size={14} className="stroke-[3] transition-transform group-hover/link:translate-x-0.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-zinc-500">
                          <svg width="40" height="40" className="sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-zinc-300">Sem resultados</p>
                          <p className="text-xs sm:text-sm">Tente ajustar os filtros de busca</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Minimalista */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-zinc-500">
          <div className="select-none">
            Mostrando <span className="text-slate-900 dark:text-zinc-200 font-bold">{startItem}</span> a <span className="text-slate-900 dark:text-zinc-200 font-bold">{endItem}</span> de <span className="text-slate-900 dark:text-zinc-200 font-bold">{total}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Próxima"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </Card >
  );
}