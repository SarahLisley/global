'use client';

import { useMemo, useState } from 'react';
import { Badge, Card } from '@pgb/ui';
import { useRouter, useSearchParams } from 'next/navigation';

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
    if (s === 'faturado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          Faturado
        </span>
      );
    }
    if (s === 'liberado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          Liberado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        Bloqueado
      </span>
    );
  };

  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = startItem + orders.length - 1;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header Responsivo */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Pedidos Recentes</h2>
        <p className="text-xs sm:text-sm text-gray-500">Últimos 30 Dias</p>
      </div>

      <div className="p-4 sm:p-6">
        {/* Filtros Responsivos */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Exibir</label>
            <select
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              {[10, 25, 50].map(n => <option key={n} value={n}>{n} itens</option>)}
            </select>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela com scroll horizontal no mobile */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Nro Pedido</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Vendedor</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Valor Total</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 text-xs sm:text-sm whitespace-nowrap">Posição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((o) => (
                    <tr key={o.orderNumber} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-xs sm:text-sm whitespace-nowrap">{o.orderNumber}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 text-xs sm:text-sm whitespace-nowrap">{o.seller}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-900 text-xs sm:text-sm whitespace-nowrap">{fmt.format(o.total)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">{statusBadge(o.status)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <svg width="40" height="40" className="sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <p className="font-medium text-sm sm:text-base">Sem resultados</p>
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

        {/* Footer Responsivo */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm text-gray-600">
          <span>
            Mostrando <span className="font-semibold text-gray-900">{total === 0 ? 0 : startItem}</span> a{' '}
            <span className="font-semibold text-gray-900">{endItem}</span> de{' '}
            <span className="font-semibold text-gray-900">{total}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 sm:p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 sm:p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Próxima"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Card >
  );
}