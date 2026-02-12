'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@pgb/ui';
import { useFilters } from '../../../../hooks/useFilters';
import { useRouter, useSearchParams } from 'next/navigation';

export type Status = 'all' | 'unpaid' | 'paid';

export type Titulo = {
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
  linhaDigitavel?: string;
  codigoBarras?: string;
  nossoNumero?: string;
  numped?: string;
  notaFiscal?: string;
};

const fmtBR = new Intl.DateTimeFormat('pt-BR');
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface FinanceiroClientProps {
  initialTitulos: Titulo[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  searchParams: {
    dtInicial: string;
    dtFinal: string;
    numped: string;
    nf: string;
    status: Status;
  };
}

export default function FinanceiroClient({
  initialTitulos,
  initialTotal,
  initialPage,
  pageSize,
  searchParams,
}: FinanceiroClientProps) {
  const { filters, setFilter, updateFilters, clearFilters, isNavigationLoading } = useFilters({
    initialFilters: {
      dtInicial: searchParams.dtInicial,
      dtFinal: searchParams.dtFinal,
      status: searchParams.status,
      numped: searchParams.numped,
      nf: searchParams.nf,
      page: String(initialPage),
    },
    persistence: {
      type: 'cookie',
      keyPrefix: 'financeiro',
      fields: ['dtInicial', 'dtFinal'],
    },
  });

  // Sync state with props
  React.useEffect(() => {
    // Optional
  }, [initialTitulos, initialPage, initialTotal]);

  function onPesquisar() {
    updateFilters({ page: '1' });
  }

  function onLimpar() {
    const hoje = new Date().toISOString().slice(0, 10);
    clearFilters({
      dtInicial: hoje,
      dtFinal: hoje,
      status: 'all',
      numped: '',
      nf: '',
      page: '1',
    });
  }

  function onPageChange(newPage: number) {
    updateFilters({ page: String(newPage) });
  }

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

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

            {/* Período e Status */}
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
                    value={filters.dtInicial}
                    onChange={(e) => setFilter('dtInicial', e.target.value)}
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
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
              <div className="flex items-center gap-4 px-1 pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="status"
                    value="all"
                    checked={filters.status === 'all'}
                    onChange={() => setFilter('status', 'all')}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Todos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="status"
                    value="paid"
                    checked={filters.status === 'paid'}
                    onChange={() => setFilter('status', 'paid')}
                    className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Pagos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="status"
                    value="unpaid"
                    checked={filters.status === 'unpaid'}
                    onChange={() => setFilter('status', 'unpaid')}
                    className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Abertos</span>
                </label>
              </div>
            </div>

            {/* Identificação */}
            <div className="md:col-span-7 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Filtros
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="numped" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Pedido</label>
                  <input
                    id="numped"
                    type="text"
                    placeholder="Ex.: 15025165"
                    value={filters.numped}
                    onChange={(e) => setFilter('numped', e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
                  />
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="notaFiscal" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">Nota Fiscal</label>
                  <input
                    id="notaFiscal"
                    type="text"
                    placeholder="Ex.: NF-12345"
                    value={filters.nf}
                    onChange={(e) => setFilter('nf', e.target.value)}
                    className="block w-full border-0 p-0 text-slate-900 px-2 pb-1 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm"
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

        {initialTitulos.length === 0 ? (
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
          <div className={`transition-opacity duration-300 ${isNavigationLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Título da Tabela */}
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Títulos Localizados
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap text-xs uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap text-xs uppercase tracking-wider">Parcela</th>
                    <th className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap text-xs uppercase tracking-wider">Emissão</th>
                    <th className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap text-xs uppercase tracking-wider">Vencimento</th>
                    <th className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap text-xs uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap text-xs uppercase tracking-wider">Cobrança</th>
                    <th className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap text-xs uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialTitulos.map((t) => {
                    const vencido = !t.dtPgto && new Date(t.dtVencimento) < new Date();

                    return (
                      <tr key={t.id} className="group hover:bg-slate-50 transition-colors duration-200">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-900 text-[15px]">{t.nroDocto}</div>
                          <div className="flex flex-col gap-1.5 mt-2">
                            {t.numped && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                  <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                                <span>Ped: {t.numped}</span>
                              </div>
                            )}
                            {t.notaFiscal && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
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
                        <td className="px-6 py-5 text-slate-700 font-medium">{t.parcela}</td>
                        <td className="px-6 py-5 whitespace-nowrap text-slate-600">{fmtBR.format(new Date(t.dtEmissao))}</td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className={vencido && !t.dtPgto ? "font-medium text-red-600 flex items-center gap-1.5" : "text-slate-600"}>
                            {vencido && !t.dtPgto && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-pulse"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
                            {fmtBR.format(new Date(t.dtVencimento))}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-700 text-sm">{fmtBRL.format(t.valor)}</div>
                          {t.jurosTaxas > 0 && (
                            <div className="text-xs text-red-600 mt-1 font-semibold bg-red-50 px-2 py-0.5 rounded-md w-fit">
                              +{fmtBRL.format(t.jurosTaxas)} juros
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className="font-medium bg-slate-50 text-slate-700 border-slate-300 shadow-sm">
                            {t.cobranca}
                          </Badge>
                        </td>
                        <td className="px-6 py-5">
                          {t.dtPgto ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md w-fit border border-slate-200">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              Pago
                            </div>
                          ) : vencido ? (
                            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 px-2.5 py-1 rounded-md w-fit border border-red-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                              Vencido
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md w-fit border border-slate-200">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                              A Vencer
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2">
                            {t.boletoUrl ? (
                              <a
                                href={t.boletoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Baixar Boleto
                              </a>
                            ) : (
                              <button
                                disabled
                                className="inline-flex items-center gap-2 text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed"
                                title="Boleto ainda não gerado ou indisponível"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Indisponível
                              </button>
                            )}

                            {(t.linhaDigitavel || t.codigoBarras) ? (
                              <button
                                onClick={() => {
                                  const code = t.linhaDigitavel || t.codigoBarras;
                                  if (code) {
                                    navigator.clipboard.writeText(code);
                                    alert('Código de barras copiado!');
                                  }
                                }}
                                className="inline-flex items-center gap-2 text-slate-600 hover:text-green-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-green-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                title={t.linhaDigitavel || t.codigoBarras}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="5" width="20" height="14" rx="2" />
                                  <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                                Copiar Código
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {initialTotal > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="text-sm text-slate-600">
                  Mostrando <span className="font-bold text-slate-900">{(initialPage - 1) * pageSize + 1}</span> a <span className="font-bold text-slate-900">{Math.min(initialPage * pageSize, initialTotal)}</span> de <span className="font-bold text-slate-900">{initialTotal}</span> título(s)
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
