'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, FormField, Input, Badge } from '@pgb/ui';

type Status = 'all' | 'unpaid' | 'paid';

type Titulo = {
  id: string;
  codCliente: string;
  dtEmissao: string;
  nroDocto: string;
  parcela: string;
  valor: number;
  dtVencimento: string;
  cobranca: string;
  jurosTaxas: number;
  dtPgto?: string;
  vlrPago?: number;
  boletoUrl?: string;
  numped?: string;
  notaFiscal?: string;
};

const fmtBR = new Intl.DateTimeFormat('pt-BR');
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FinanceiroPage() {
  const hoje = useMemo(() => new Date(), []);
  const trintaDiasAtras = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), []);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const [dtInicial, setDtInicial] = useState(toISODate(trintaDiasAtras));
  const [dtFinal, setDtFinal] = useState(toISODate(hoje));
  const [status, setStatus] = useState<Status>('all');
  const [numped, setNumped] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');

  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  async function fetchTitulos(nextPage = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dtInicial,
        dtFinal,
        status,
        page: String(nextPage),
        pageSize: String(pageSize),
      });

      if (numped.trim()) {
        params.append('numped', numped.trim());
      }

      if (notaFiscal.trim()) {
        params.append('nf', notaFiscal.trim());
      }

      const res = await fetch(`/api/financeiro?${params.toString()}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Falha ao carregar títulos: ${res.status}`);
      }

      const data = await res.json();
      setTitulos(data.titulos || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Erro ao carregar títulos');
      setTitulos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTitulos(1);
  }, []);

  function onPesquisar() {
    fetchTitulos(1);
  }

  function onLimpar() {
    setDtInicial(toISODate(trintaDiasAtras));
    setDtFinal(toISODate(hoje));
    setStatus('all');
    setNumped('');
    setNotaFiscal('');
    fetchTitulos(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financeiro</h1>
          <p className="text-slate-500 mt-1">Gerencie seus títulos, boletos e histórico financeiro.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Período */}
            <div className="md:col-span-5 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Período de Vencimento
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="dtInicial" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">De</label>
                  <input
                    id="dtInicial"
                    type="date"
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                    value={dtInicial}
                    onChange={(e) => setDtInicial(e.target.value)}
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="dtFinal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Até</label>
                  <input
                    id="dtFinal"
                    type="date"
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                    value={dtFinal}
                    onChange={(e) => setDtFinal(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Identificação e Status */}
            <div className="md:col-span-7 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Filtros
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="numped" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Pedido</label>
                  <input
                    id="numped"
                    type="text"
                    placeholder="Número..."
                    value={numped}
                    onChange={(e) => setNumped(e.target.value)}
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

                {/* Status Radio Group as styled buttons/segments */}
                <div className="col-span-2 lg:col-span-1 flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setStatus('all')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded transition-all ${status === 'all' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('paid')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded transition-all ${status === 'paid' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Pagos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('unpaid')}
                    className={`flex-1 text-xs font-medium py-1.5 rounded transition-all ${status === 'unpaid' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Abertos
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end pt-4 border-t border-slate-200 gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button type="button" onClick={onPesquisar} loading={loading} className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-2 group outline-none">
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

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 animate-spin">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">Carregando dados financeiro...</h3>
          </div>
        ) : titulos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">Nenhum título encontrado</h3>
            <p className="text-slate-500 mt-1 max-w-sm">Tente ajustar os filtros ou o período da busca.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Títulos Localizados
                </h2>
              </div>
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Documento</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Parcela</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Emissão</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Vencimento</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Valor</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Cobrança</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {titulos.map((t) => {
                    const vencido = !t.dtPgto && new Date(t.dtVencimento) < new Date();

                    return (
                      <tr key={t.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{t.nroDocto}</div>
                          <div className="flex flex-col gap-1 mt-1.5">
                            {t.numped && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                  <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                                <span>Ped: {t.numped}</span>
                              </div>
                            )}
                            {t.notaFiscal && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                                <span>NF: {t.notaFiscal}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">{t.parcela}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{fmtBR.format(new Date(t.dtEmissao))}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={vencido && !t.dtPgto ? "font-semibold text-red-600 flex items-center gap-1" : "text-slate-600"}>
                            {vencido && !t.dtPgto && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
                            {fmtBR.format(new Date(t.dtVencimento))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{fmtBRL.format(t.valor)}</div>
                          {t.jurosTaxas > 0 && (
                            <div className="text-xs text-red-500 mt-0.5 font-medium">
                              +{fmtBRL.format(t.jurosTaxas)} juros
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-normal bg-slate-50 text-slate-600 border-slate-200">
                            {t.cobranca}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {t.dtPgto ? (
                            <Badge variant="success" className="gap-1 pl-1.5 pr-2.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              Pago em {fmtBR.format(new Date(t.dtPgto))}
                            </Badge>
                          ) : vencido ? (
                            <Badge variant="destructive" className="gap-1 pl-1.5 pr-2.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="9" x2="12" y2="13"></line><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                              Vencido
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1 pl-1.5 pr-2.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              A Vencer
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {t.boletoUrl && !t.dtPgto && (
                            <a
                              href={t.boletoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                              </svg>
                              Boleto
                            </a>
                          )}
                          {t.dtPgto && t.vlrPago && (
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 italic">
                              Pago: {fmtBRL.format(t.vlrPago)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {total > 0 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  Mostrando página <span className="font-medium text-slate-900">{page}</span> de <span className="font-medium text-slate-900">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all" disabled={page <= 1} onClick={() => fetchTitulos(page - 1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all" disabled={page >= totalPages} onClick={() => fetchTitulos(page + 1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}