'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, FormField, Input, Badge } from '@pgb/ui';

type Entrega = {
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

type TimelineEvent = {
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

export default function EntregasPage() {
  const hoje = useMemo(() => new Date(), []);
  const trintaDiasAtras = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), []);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const [dtInicial, setDtInicial] = useState(toISODate(trintaDiasAtras));
  const [dtFinal, setDtFinal] = useState(toISODate(hoje));
  const [pedidoNum, setPedidoNum] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'Agendado' | 'Em trânsito' | 'Aguardando coleta' | 'Entregue'>('todos');

  const [dados, setDados] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineNumTrans, setTimelineNumTrans] = useState<string | null>(null);

  const API_ROUTE = '/api/dashboard/entregas';

  async function fetchEntregas(nextPage = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dtInicial,
        dtFinal,
        page: String(nextPage),
        pageSize: String(pageSize),
      });
      if (pedidoNum.trim()) params.append('pedido', pedidoNum.trim());
      if (notaFiscal.trim()) params.append('nf', notaFiscal.trim());

      const res = await fetch(`${API_ROUTE}?${params.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      setDados(body.entregas || []);
      setTotal(body.total || 0);
      setPage(body.page || 1);
    } catch (e: any) {
      console.error('[entregas] fetch failed:', e);
      setError(e?.message || 'Erro ao carregar entregas');
      setDados([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function openTimeline(numTrans: string) {
    setTimelineOpen(true);
    setTimelineLoading(true);
    setTimelineError(null);
    setTimelineEvents([]);
    setTimelineNumTrans(numTrans);
    try {
      const res = await fetch(`${API_ROUTE}/${encodeURIComponent(numTrans)}`);
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

  useEffect(() => {
    fetchEntregas(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const dadosFiltrados = statusFiltro === 'todos' ? dados : dados.filter(d => d.status === statusFiltro);

  function onPesquisar() {
    fetchEntregas(1);
  }

  function onLimpar() {
    setDtInicial(toISODate(trintaDiasAtras));
    setDtFinal(toISODate(hoje));
    setPedidoNum('');
    setNotaFiscal('');
    setStatusFiltro('todos');
    fetchEntregas(1);
  }

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
            {/* Filtros de Data */}
            <div className="md:col-span-5 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Período de Emissão
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="dtInicial" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">De</label>
                  <input
                    id="dtInicial"
                    type="date"
                    value={dtInicial}
                    onChange={(e) => setDtInicial(e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="dtFinal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Até</label>
                  <input
                    id="dtFinal"
                    type="date"
                    value={dtFinal}
                    onChange={(e) => setDtFinal(e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Filtros de Identificação */}
            <div className="md:col-span-7 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Identificação
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="pedidoNum" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Pedido</label>
                  <input
                    id="pedidoNum"
                    type="text"
                    placeholder="Número..."
                    value={pedidoNum}
                    onChange={(e) => setPedidoNum(e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="notaFiscal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Nota Fiscal</label>
                  <input
                    id="notaFiscal"
                    type="text"
                    placeholder="Número..."
                    value={notaFiscal}
                    onChange={(e) => setNotaFiscal(e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200 gap-4">
            <div className="w-full sm:w-1/3">
              <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Status</label>
                <select
                  className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 focus:ring-0 focus:outline-none text-sm bg-transparent"
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value as any)}
                >
                  <option value="todos">Todos os Status</option>
                  <option value="Agendado">Agendado</option>
                  <option value="Em trânsito">Em trânsito</option>
                  <option value="Aguardando coleta">Aguardando coleta</option>
                  <option value="Entregue">Entregue</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={onPesquisar} loading={loading} className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-2 group outline-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500 group-hover:text-blue-600 transition-colors">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Pesquisar
              </Button>
              <Button onClick={onLimpar} className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-2 group outline-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500 group-hover:text-red-600 transition-colors">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {dadosFiltrados.length === 0 && !loading ? (
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
          <div className="overflow-x-auto">
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
                {loading ? (
                  // Skeleton
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={10} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  dadosFiltrados.map((e) => (
                    <tr key={e.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{e.nroPedido}</td>
                      <td className="px-6 py-4">{e.filial}</td>
                      <td className="px-6 py-4">{e.nroNF || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{fmtBRL.format(e.vlrTotal)}</td>
                      <td className="px-6 py-4">{e.prevEntrega ? fmtBR.format(new Date(e.prevEntrega)) : '-'}</td>
                      <td className="px-6 py-4">{e.dtAgendamento ? fmtBR.format(new Date(e.dtAgendamento)) : '-'}</td>
                      <td className="px-6 py-4">
                        {e.dtEntrega ? (
                          <span className="text-green-600 font-medium">{fmtBR.format(new Date(e.dtEntrega))}</span>
                        ) : ('-')}
                      </td>
                      <td className="px-6 py-4">
                        {e.status === 'Entregue' ? (
                          <Badge variant="success">Entregue</Badge>
                        ) : e.status === 'Em trânsito' ? (
                          <Badge variant="info">Em trânsito</Badge>
                        ) : e.status === 'Aguardando coleta' ? (
                          <Badge variant="warning">Aguardando</Badge>
                        ) : (
                          <Badge>Agendado</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {e.transportadora ? (
                          <div className="flex flex-col">
                            <span className="text-slate-900">{e.transportadora}</span>
                            {e.dominio && (
                              <a href={e.dominio} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1">
                                Rastrear
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                              </a>
                            )}
                          </div>
                        ) : ('-')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline inline-flex items-center gap-1"
                          onClick={() => openTimeline(e.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
                          Timeline
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Paginação */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Mostrando página <span className="font-medium text-slate-900">{page}</span> de <span className="font-medium text-slate-900">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all" disabled={page <= 1} onClick={() => fetchEntregas(page - 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all" disabled={page >= totalPages} onClick={() => fetchEntregas(page + 1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Timeline */}
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