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
  dominio?: string; // novo
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Controle de Relacionamento com Cliente</h1>
        <h2 className="text-xl font-semibold text-gray-800 mt-1">Entregas</h2>
      </div>

      {/* Filtros */}
      <Card className="p-5">
        <div className="text-sm text-slate-600 mb-4">Informe os dados para localizar suas entregas</div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Período */}
          <div>
            <div className="mb-3 font-medium text-slate-700">Período de Emissão</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Dt Inicial">
                <Input type="date" value={dtInicial} onChange={(e) => setDtInicial(e.target.value)} />
              </FormField>
              <FormField label="Dt Final">
                <Input type="date" value={dtFinal} onChange={(e) => setDtFinal(e.target.value)} />
              </FormField>
            </div>
          </div>

          {/* Pedido / NF */}
          <div>
            <div className="mb-3 font-medium text-slate-700">Pedido / Nota Fiscal</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Pedido">
                <Input placeholder="Número do pedido" value={pedidoNum} onChange={(e) => setPedidoNum(e.target.value)} />
              </FormField>
              <FormField label="Nota Fiscal">
                <Input placeholder="Número da NF" value={notaFiscal} onChange={(e) => setNotaFiscal(e.target.value)} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          <FormField label="Status">
            <select
              className="rounded-xl bg-slate-100/90 border border-slate-200 px-4 py-3 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-200 w-full"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value as any)}
            >
              <option value="todos">Todos</option>
              <option value="Agendado">Agendado</option>
              <option value="Em trânsito">Em trânsito</option>
              <option value="Aguardando coleta">Aguardando coleta</option>
              <option value="Entregue">Entregue</option>
            </select>
          </FormField>
        </div>

        {/* Botões */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={onPesquisar} loading={loading}>Pesquisar</Button>
          <Button type="button" variant="secondary" onClick={onLimpar}>Limpar Pesquisa</Button>
        </div>
      </Card>

      {/* Resultados */}
      <Card className="p-5">
        <div className="mb-4 font-medium text-slate-700">
          Agendamentos / Entregas Realizados {total > 0 && `(${total})`}
        </div>

        {error ? (
          <div className="py-8 text-center">
            <div className="text-red-600 mb-2">❌ Erro ao carregar entregas</div>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-slate-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-3" />
            <p>Carregando entregas...</p>
          </div>
        ) : dadosFiltrados.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            📦 Nenhuma entrega encontrada com os filtros aplicados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="py-2 px-2">Nro Pedido</th>
                    <th className="py-2 px-2">Filial</th>
                    <th className="py-2 px-2">Nro NF</th>
                    <th className="py-2 px-2">Vlr. Total</th>
                    <th className="py-2 px-2">Prev. Entrega</th>
                    <th className="py-2 px-2">Dt Agendamento</th>
                    <th className="py-2 px-2">Dt Entrega</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Transportadora</th>
                    <th className="py-2 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map((e) => (
                    <tr key={e.id} className="border-t hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{e.nroPedido}</td>
                      <td className="py-2 px-2">{e.filial}</td>
                      <td className="py-2 px-2">{e.nroNF || '-'}</td>
                      <td className="py-2 px-2 font-semibold">{fmtBRL.format(e.vlrTotal)}</td>
                      <td className="py-2 px-2">{e.prevEntrega ? fmtBR.format(new Date(e.prevEntrega)) : '-'}</td>
                      <td className="py-2 px-2">{e.dtAgendamento ? fmtBR.format(new Date(e.dtAgendamento)) : '-'}</td>
                      <td className="py-2 px-2">
                        {e.dtEntrega ? (
                          <span className="text-green-600 font-medium">{fmtBR.format(new Date(e.dtEntrega))}</span>
                        ) : ('-')}
                      </td>
                      <td className="py-2 px-2">
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
                      <td className="py-2 px-2">
                        {e.transportadora ? (
                          <div className="space-y-1">
                            <div>{e.transportadora}</div>
                            {e.dominio && (
                              <a
                                href={e.dominio}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#4a90e2] hover:underline"
                              >
                                🔗 Rastrear no site
                              </a>
                            )}
                          </div>
                        ) : ('-')}
                      </td>
                      <td className="py-2 px-2">
                        <button
                          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md focus: outline-none focus:ring-2 focus:ring-orange-300 whitespace-nowrap"
                          onClick={() => openTimeline(e.id)}
                        >
                          📜 Timeline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
              <div className="text-sm text-slate-700">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  disabled={page <= 1}
                  onClick={() => fetchEntregas(1)}
                >
                  {'<<'}
                </button>
                <button
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50 disabled: cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  disabled={page <= 1}
                  onClick={() => fetchEntregas(page - 1)}
                >
                  {'<'}
                </button>
                <button
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  disabled={page >= totalPages}
                  onClick={() => fetchEntregas(page + 1)}
                >
                  {'>'}
                </button>
                <button
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover: bg-slate-100 hover: border-slate-400 disabled: opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  disabled={page >= totalPages}
                  onClick={() => fetchEntregas(totalPages)}
                >
                  {'>>'}
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modal Timeline */}
      {timelineOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeTimeline}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="font-bold text-lg text-slate-900">Rastreio da entrega {timelineNumTrans}</div>
              <button
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={closeTimeline}
                aria-label="Fechar modal"
              >
                ✖
              </button>
            </div>
            <div className="p-4">
              {timelineLoading ? (
                <div className="text-center text-slate-500">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-3" />
                  <p>Carregando rastreio...</p>
                </div>
              ) : timelineError ? (
                <div className="text-center text-red-600">
                  ❌ {timelineError}
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="text-center text-slate-500">Nenhum evento encontrado</div>
              ) : (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {timelineEvents.map((ev, idx) => (
                    <li key={idx} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-all duration-200 shadow-sm">
                      <div className="text-sm font-medium text-slate-500 mb-1">{fmtBR.format(new Date(ev.when))}</div>
                      <div className="font-bold text-slate-900 mb-2">{ev.occurrence || '-'}</div>
                      {ev.description && <div className="text-sm text-slate-700 mb-2 leading-relaxed">{ev.description}</div>}
                      <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 mt-2">
                        {ev.city && <><span className="font-medium">Cidade:</span> {ev.city} · </>}
                        {ev.destinatario && <><span className="font-medium">Dest. :</span> {ev.destinatario} · </>}
                        {ev.nomeRecebedor && <><span className="font-medium">Recebedor:</span> {ev.nomeRecebedor} ({ev.docRecebedor || '—'})</>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end bg-slate-50">
              <Button type="button" variant="secondary" onClick={closeTimeline}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}