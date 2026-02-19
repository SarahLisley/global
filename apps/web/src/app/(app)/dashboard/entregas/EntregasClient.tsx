'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@pgb/ui';
import { useFilters } from '../../../../hooks/useFilters';
import { useSearchParams } from 'next/navigation';

export type Entrega = {
  id: string;
  nroPedido: string;
  filial: string;
  nroNF?: string;
  vlrTotal: number;
  prevEntrega?: string;
  dtAgendamento?: string;
  dtEntrega?: string;
  transportadora?: string;
  status?: string;
  rastreio?: string;
  dominio?: string;
};

export type TimelineEvent = {
  when: string;
  occurrence: string;
  description: string;
  city: string;
  destinatario?: string;
  nomeRecebedor?: string;
  docRecebedor?: string;
  dominio?: string;
};

const fmtBR = new Intl.DateTimeFormat('pt-BR');
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface EntregasClientProps {
  initialData: Entrega[];
  total: number;
  page: number;
  pageSize: number;
  searchParams: {
    dtInicial: string;
    dtFinal: string;
    pedido: string;
    nf: string;
    status: string;
  };
}

export default function EntregasClient({ initialData, total, page, pageSize, searchParams }: EntregasClientProps) {


  // State local apenas para inputs de filtro antes de aplicar
  const { filters, setFilter, updateFilters, clearFilters, isNavigationLoading } = useFilters({
    initialFilters: {
      dtInicial: searchParams.dtInicial,
      dtFinal: searchParams.dtFinal,
      pedido: searchParams.pedido,
      nf: searchParams.nf,
      status: searchParams.status || 'todos',
      page: String(page),
    },
    persistence: {
      type: 'cookie',
      keyPrefix: 'entregas',
      fields: ['dtInicial', 'dtFinal', 'pedido', 'nf', 'status'],
    },
  });

  // Timeline state
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineNumTrans, setTimelineNumTrans] = useState<string | null>(null);

  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Sync state with props
  React.useEffect(() => {
    // Optional
  }, [initialData, page, total]);

  function onPesquisar() {
    setOpen({});
    updateFilters({ page: '1' });
  }

  function onLimpar() {
    const hoje = new Date().toISOString().slice(0, 10);
    const trintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // Standardize default
    setOpen({});
    clearFilters({
      dtInicial: trintaDias,
      dtFinal: hoje,
      pedido: '',
      nf: '',
      status: 'todos',
      page: '1',
    });
  }

  function toggleRow(id: string) {
    setOpen((s) => ({ ...s, [id]: !s[id] }));
  }

  function onPageChange(newPage: number) {
    updateFilters({ page: String(newPage) });
  }

  // Timeline logic client-side is fine kept as is
  async function openTimeline(numTrans: string) {
    setTimelineOpen(true);
    setTimelineLoading(true);
    setTimelineError(null);
    setTimelineEvents([]);
    setTimelineNumTrans(numTrans);
    try {
      const res = await fetch(`/api/dashboard/entregas/${encodeURIComponent(numTrans)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setTimelineEvents(body.timeline || []);
    } catch (e: any) {
      console.error('[timeline] fetch failed:', e);
      setTimelineError(e?.message || 'Erro ao carregar rastreio');
    } finally {
      setTimelineLoading(false);
    }
  }

  function closeTimeline() {
    setTimelineOpen(false);
    setTimelineEvents([]);
    setTimelineError(null);
    setTimelineNumTrans(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rastreio de Entregas</h1>
          <p className="text-slate-500 mt-1">Acompanhe o status e a previsão de entrega dos seus pedidos.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Período e Status */}
            <div className="md:col-span-5 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Período de Emissão
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:border-blue-500 transition-all">
                  <label htmlFor="dtInicial" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">De</label>
                  <input
                    id="dtInicial"
                    type="date"
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                    value={filters.dtInicial}
                    onChange={(e) => setFilter('dtInicial', e.target.value)}
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:border-blue-500 transition-all">
                  <label htmlFor="dtFinal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Até</label>
                  <input
                    id="dtFinal"
                    type="date"
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                    value={filters.dtFinal}
                    onChange={(e) => setFilter('dtFinal', e.target.value)}
                  />
                </div>
              </div>

              {/* Status Radio Group */}
              <div className="pt-2"> {/* Added spacing container for radio group */}
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value="todos"
                      checked={filters.status === 'todos'}
                      onChange={() => setFilter('status', 'todos')}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Todos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value="entregue"
                      checked={filters.status === 'entregue'}
                      onChange={() => setFilter('status', 'entregue')}
                      className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Entregues</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value="pendente"
                      checked={filters.status === 'pendente'}
                      onChange={() => setFilter('status', 'pendente')}
                      className="w-4 h-4 text-amber-500 border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Pendentes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value="devolvido"
                      checked={filters.status === 'devolvido'}
                      onChange={() => setFilter('status', 'devolvido')}
                      className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Devoluções</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Identificação */}
            <div className="md:col-span-7 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Identificação
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:border-blue-500 transition-all">
                  <label htmlFor="pedido" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Pedido</label>
                  <input
                    id="pedido"
                    type="text"
                    placeholder="Ex.: 15025165"
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                    value={filters.pedido}
                    onChange={(e) => setFilter('pedido', e.target.value)}
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:border-blue-500 transition-all">
                  <label htmlFor="nf" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Nota Fiscal</label>
                  <input
                    id="nf"
                    type="text"
                    placeholder="Ex.: NF-12345"
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                    value={filters.nf}
                    onChange={(e) => setFilter('nf', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end pt-4 border-t border-slate-200 gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button type="button" onClick={onPesquisar} loading={isNavigationLoading} className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-2 group outline-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500 group-hover:text-blue-600 transition-colors">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Pesquisar
              </Button>
              <Button type="button" variant="secondary" onClick={onLimpar} className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-2 group outline-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500 group-hover:text-red-600 transition-colors">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {initialData.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">Nenhuma entrega encontrada</h3>
            <p className="text-slate-500 mt-1 max-w-sm">Tente ajustar os filtros selecionados.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-300 ${isNavigationLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Título da Tabela */}
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                Entregas Localizadas
              </h2>
            </div>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Nro Pedido</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Filial</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Nro NF</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Vlr. Total</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Prev. Entrega</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Dt Agendamento</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Dt Entrega</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Transportadora</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialData.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{e.nroPedido}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        {e.filial}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {e.nroNF ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          <span className="font-medium">{e.nroNF}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{fmtBRL.format(e.vlrTotal)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.prevEntrega ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {fmtBR.format(new Date(e.prevEntrega))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.dtAgendamento ? fmtBR.format(new Date(e.dtAgendamento)) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.dtEntrega ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          {fmtBR.format(new Date(e.dtEntrega))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {e.status === 'Entregue' ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md w-fit border border-slate-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          Entregue
                        </div>
                      ) : e.status === 'Em trânsito' ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-md w-fit border border-blue-100 whitespace-nowrap">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Em trânsito
                        </div>
                      ) : e.status === 'Aguardando coleta' ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-md w-fit border border-amber-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                          Aguardando
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md w-fit border border-slate-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                          Agendado
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {e.transportadora ? (
                        <span className="text-slate-900 font-medium">{e.transportadora}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        onClick={() => openTimeline(e.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>Mostrando página <span className="font-bold text-slate-900">{page}</span> de <span className="font-bold text-slate-900">{totalPages}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) { pageNum = i + 1; }
                  else if (page <= 3) { pageNum = i + 1; }
                  else if (page >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                  else { pageNum = page - 2 + i; }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${page === pageNum
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
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Timeline - unchanged logic, just visual tweaks */}
      {timelineOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all" onClick={closeTimeline}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Timeline da Entrega</h3>
                <p className="text-sm text-slate-500">Acompanhe o histórico do transporte</p>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={closeTimeline}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {/* ... rest of timeline is fine, fits style ... */}
            <div className="p-6 overflow-y-auto">
              {timelineLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Carregando eventos...</p>
                </div>
              ) : timelineError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center">
                  {timelineError}
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Nenhum evento registrado para esta entrega.
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                  {timelineEvents.map((ev, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"></div>
                      <div className="text-xs font-semibold text-blue-600 mb-1">{fmtBR.format(new Date(ev.when))}</div>
                      <div className="text-base font-bold text-slate-800 mb-1">{ev.occurrence || 'Evento'}</div>
                      <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="mb-1">{ev.description}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ev.city && <Badge variant="secondary" className="text-xs py-0.5">{ev.city}</Badge>}
                          {ev.destinatario && <Badge variant="outline" className="text-xs py-0.5">Dest: {ev.destinatario}</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end">
              <Button variant="secondary" onClick={closeTimeline} className="hover:bg-slate-200">Fechar Visualização</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
