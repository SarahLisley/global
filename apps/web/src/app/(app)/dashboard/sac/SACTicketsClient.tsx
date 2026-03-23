'use client';

import React, { useTransition, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@pgb/ui';
import { useFilters } from '../../../../hooks/useFilters';
import { Ticket, Status } from './types';
import { Search } from 'lucide-react';

interface SACTicketsClientProps {
  initialTickets: Ticket[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  searchParams: {
    dateFrom: string;
    dateTo: string;
    status: Status;
    orderNumber: string;
    invoiceNumber: string;
  };
}

export default function SACTicketsClient({
  initialTickets,
  initialTotal,
  initialPage,
  pageSize,
  searchParams,
}: SACTicketsClientProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { filters, setFilter, updateFilters, clearFilters, isNavigationLoading } = useFilters({
    initialFilters: {
      dateFrom: searchParams.dateFrom,
      dateTo: searchParams.dateTo,
      status: searchParams.status,
      orderNumber: searchParams.orderNumber,
      invoiceNumber: searchParams.invoiceNumber,
      page: String(initialPage),
    },
    persistence: {
      type: 'cookie',
      keyPrefix: 'sac_tickets',
      fields: ['dateFrom', 'dateTo', 'status'],
    },
  });

  const onSearch = () => {
    updateFilters({ page: '1' });
  };

  const onClear = () => {
    const hoje = new Date().toISOString().slice(0, 10);

    clearFilters({
      dateFrom: hoje,
      dateTo: hoje,
      status: 'todos',
      orderNumber: '',
      invoiceNumber: '',
      page: '1',
    });
  };

  const onPageChange = (newPage: number) => {
    updateFilters({ page: String(newPage) });
  };

  const statusBadge = (s: Ticket['status']) => {
    if (s === 'finalizado') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md w-fit border border-slate-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          Finalizado
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md w-fit border border-slate-200 whitespace-nowrap">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
        Em andamento
      </div>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Controle de Relacionamento com Cliente</h1>
          <p className="text-slate-500 mt-1">Gerencie e acompanhe seus tickets.</p>
        </div>
        <Link href="/dashboard/sac/novo">
          <Button className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full group flex items-center justify-center gap-2 outline-none focus:outline-none focus:ring-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500 group-hover:text-blue-600 transition-colors">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Ticket
          </Button>
        </Link>
      </div>


      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Período
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="dateFrom" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">De</label>
                  <input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilter('dateFrom', e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="dateTo" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Até</label>
                  <input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilter('dateTo', e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Status Radio Group */}
              <div className="flex items-center gap-4 px-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="status"
                    checked={filters.status === 'todos'}
                    onChange={() => setFilter('status', 'todos')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Todos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="status"
                    checked={filters.status === 'em_andamento'}
                    onChange={() => setFilter('status', 'em_andamento')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Em Andamento</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="status"
                    checked={filters.status === 'finalizado'}
                    onChange={() => setFilter('status', 'finalizado')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Finalizados</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-1.5">
                <Search size={16} className="text-blue-500" />
                Identificação
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="orderNumber" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Número do Pedido</label>
                  <input
                    id="orderNumber"
                    type="text"
                    placeholder="Ex.: 15025165"
                    value={filters.orderNumber || ''}
                    onChange={(e) => setFilter('orderNumber', e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="invoiceNumber" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Nota Fiscal</label>
                  <input
                    id="invoiceNumber"
                    type="text"
                    placeholder="Ex.: NF-12345"
                    value={filters.invoiceNumber || ''}
                    onChange={(e) => setFilter('invoiceNumber', e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end pt-4 border-t border-slate-200 gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={onSearch}
                loading={isNavigationLoading}
                className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-1.5 group outline-none focus:outline-none focus:ring-0"
              >
                <Search size={16} className="text-blue-500" />
                Pesquisar
              </Button>
              <Button
                onClick={onClear}
                className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-2 group outline-none focus:outline-none focus:ring-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500 group-hover:text-red-600 transition-colors">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {initialTickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">Nenhum ticket encontrado</h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              Não encontramos tickets com os filtros selecionados. Tente ajustar o período ou limpar a busca.
            </p>
          </div>
        ) : (
          <div className={`transition-opacity duration-300 ${isNavigationLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Tickets Localizados
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap w-32">Ticket</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap w-36 text-center">Dt Abertura</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap w-36 text-center">Dt Finalização</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap w-36 text-center">Nro Pedido</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap w-36 text-center">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Assunto</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap text-left w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>#{ticket.id}</span>
                          <button
                            onClick={() => copyToClipboard(ticket.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                            title="Copiar ID"
                          >
                            {copiedId === ticket.id ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {new Date(ticket.openedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {ticket.closedAt ? new Date(ticket.closedAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-center">
                        {ticket.orderNumber || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          {statusBadge(ticket.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={ticket.subject}>
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <Link
                          href={`/dashboard/sac/${ticket.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline inline-flex items-center gap-1"
                        >
                          Detalhes
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {initialTotal > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>Mostrando página <span className="font-bold text-slate-900">{initialPage}</span> de <span className="font-bold text-slate-900">{totalPages}</span></span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    disabled={initialPage <= 1}
                    onClick={() => onPageChange(initialPage - 1)}
                    aria-label="Página anterior"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (initialPage <= 3) {
                        pageNum = i + 1;
                      } else if (initialPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = initialPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => onPageChange(pageNum)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${initialPage === pageNum
                            ? 'bg-blue-600 text-white border border-blue-600'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    disabled={initialPage >= totalPages}
                    onClick={() => onPageChange(initialPage + 1)}
                    aria-label="Próxima página"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
