'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button, Card, FormField, Input, Badge } from '@pgb/ui';
import { searchTicketsAction } from './actions';

type Filters = {
  dateFrom?: string;
  dateTo?: string;
  status?: 'todos' | 'em_andamento' | 'finalizado';
  orderNumber?: string;
  invoiceNumber?: string;
};

type Ticket = {
  id: string;
  openedAt: string;
  closedAt?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  subject: string;
  status: 'pendente' | 'em_andamento' | 'finalizado';
};

export default function TicketsPage() {
  const [filters, setFilters] = useState<Filters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    status: 'todos',
  });
  const [results, setResults] = useState<Ticket[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSearch = () => {
    startTransition(async () => {
      const res = await searchTicketsAction(filters);
      if (!res.ok) {
        setErrorMsg(res.message ?? 'Falha na busca');
        setResults([]); // força renderização do empty state
      } else {
        setErrorMsg(null);
        setResults(res.list as Ticket[]);
      }
    });
  };

  const onClear = () => {
    setFilters({
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      dateTo: new Date().toISOString().slice(0, 10),
      status: 'todos',
      orderNumber: '',
      invoiceNumber: '',
    });
    setResults(null);
    setErrorMsg(null);
  };

  const statusBadge = (s: Ticket['status']) => {
    if (s === 'finalizado') return <Badge variant="success">Finalizado</Badge>;
    if (s === 'em_andamento') return <Badge variant="info">Em andamento</Badge>;
    return <Badge variant="warning">Pendente</Badge>;
  };

  useEffect(() => {
    onSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle de Relacionamento com Cliente</h1>
          <h2 className="text-base sm:text-xl font-semibold text-gray-700 mt-1">Meus Tickets</h2>
        </div>
        <Link href="/dashboard/sac/novo">
          <Button className="w-full sm:w-auto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Ticket
          </Button>
        </Link>
      </div>

      <Card className="p-4 sm:p-5 lg:p-6">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <div className="mb-3 sm:mb-4 font-medium text-sm sm:text-base text-slate-700">
              Período de Abertura dos Tickets
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <FormField label="Dt Inicial" htmlFor="dateFrom">
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </FormField>
              <FormField label="Dt Final" htmlFor="dateTo">
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </FormField>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={filters.status === 'todos'}
                  onChange={() => setFilters((f) => ({ ...f, status: 'todos' }))}
                  className="w-4 h-4 text-[#4a90e2] focus:ring-[#4a90e2]"
                />
                <span>Todos</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={filters.status === 'em_andamento'}
                  onChange={() => setFilters((f) => ({ ...f, status: 'em_andamento' }))}
                  className="w-4 h-4 text-[#4a90e2] focus:ring-[#4a90e2]"
                />
                <span>Em Andamento</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={filters.status === 'finalizado'}
                  onChange={() => setFilters((f) => ({ ...f, status: 'finalizado' }))}
                  className="w-4 h-4 text-[#4a90e2] focus:ring-[#4a90e2]"
                />
                <span>Finalizados</span>
              </label>
            </div>
          </div>

          <div>
            <div className="mb-3 sm:mb-4 font-medium text-sm sm:text-base text-slate-700">
              Nro do Pedido ou da Nota Fiscal
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <FormField label="Numped" htmlFor="orderNumber">
                <Input
                  id="orderNumber"
                  placeholder="Ex.: 15025165"
                  value={filters.orderNumber || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, orderNumber: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </FormField>
              <FormField label="Nota Fiscal" htmlFor="invoiceNumber">
                <Input
                  id="invoiceNumber"
                  placeholder="Ex.: NF-12345"
                  value={filters.invoiceNumber || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, invoiceNumber: e.target.value }))}
                  className="text-sm sm:text-base"
                />
              </FormField>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={onSearch}
              loading={isPending}
              className="w-full sm:w-auto"
            >
              Pesquisar
            </Button>
            <Button
              variant="secondary"
              onClick={onClear}
              className="w-full sm:w-auto"
            >
              Limpar Pesquisa
            </Button>
          </div>
        </div>
      </Card>

      {results !== null && (
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Tickets Localizados</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {results.length} {results.length === 1 ? 'ticket encontrado' : 'tickets encontrados'}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <svg width="48" height="48" className="sm:w-16 sm:h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="font-medium text-sm sm:text-base">Sem resultados</p>
                <p className="text-xs sm:text-sm">Ajuste os filtros e clique em Pesquisar</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 whitespace-nowrap">Nro do Ticket</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 whitespace-nowrap">Dt Abertura</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 whitespace-nowrap">Dt Finalização</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 whitespace-nowrap">Nro Pedido</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 whitespace-nowrap">Status</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 whitespace-nowrap">Relato</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 whitespace-nowrap">Ver Mais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap">
                        {new Date(ticket.openedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap">
                        {ticket.closedAt ? new Date(ticket.closedAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap">
                        {ticket.orderNumber || '—'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {statusBadge(ticket.status)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 max-w-xs truncate">
                        {ticket.subject}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/sac/${ticket.id}`}
                          className="text-[#4a90e2] hover:text-[#2563eb] font-medium hover:underline"
                        >
                          Ver mais
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}