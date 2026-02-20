'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@pgb/ui'; // Added Badge import if needed, or remove if not used in updated code
import { useFilters } from '../../../../hooks/useFilters';
import { useRouter, useSearchParams } from 'next/navigation';

export type Item = {
  codProduto: string;
  descricao: string;
  qtd: number;
  qtdFalta: number;
  pvUnit: number;
  pvTotal: number;
};

export type Pedido = {
  id: string;
  nroPedido: string;
  nroNF?: string;
  nroTransVenda?: string;
  posicao?: string;
  data: string;
  filial?: string;
  codCliente?: string;
  vendedor?: string;
  vlrTotal?: number;
  vlrDesconto?: number;
  vlrFrete?: number;
  nroItens?: number;
  itens?: Item[];
};

const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface MeusPedidosClientProps {
  initialPedidos: Pedido[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  searchParams: {
    dtInicial: string;
    dtFinal: string;
    pedido: string;
    nf: string;
  };
}

export default function MeusPedidosClient({
  initialPedidos,
  initialTotal,
  initialPage,
  pageSize,
  searchParams,
}: MeusPedidosClientProps) {

  const { filters, setFilter, updateFilters, clearFilters, isNavigationLoading } = useFilters({
    initialFilters: {
      dtInicial: searchParams.dtInicial,
      dtFinal: searchParams.dtFinal,
      pedido: searchParams.pedido,
      nf: searchParams.nf,
      page: String(initialPage),
    },
    persistence: {
      type: 'cookie',
      keyPrefix: 'meuspedidos',
      fields: ['dtInicial', 'dtFinal', 'pedido', 'nf'],
    },
  });

  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Sync state with props
  React.useEffect(() => {
    // Optional: if you want to sync when props change from server, though useFilters handles initial
  }, [initialPedidos, initialPage, initialTotal]);

  function onPesquisar() {
    setOpen({});
    updateFilters({ page: '1' });
  }

  function onLimpar() {
    const hoje = new Date().toISOString().slice(0, 10);
    setOpen({});
    clearFilters({
      dtInicial: hoje,
      dtFinal: hoje,
      pedido: '',
      nf: '',
      page: '1',
    });
  }

  function toggleRow(id: string) {
    setOpen((s) => ({ ...s, [id]: !s[id] }));
  }

  function onPageChange(newPage: number) {
    updateFilters({ page: String(newPage) });
  }

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meus Pedidos</h1>
          <p className="text-slate-500 mt-1">Consulte seus pedidos, notas fiscais e status de faturamento.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Período */}
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
            </div>

            {/* Identificação */}
            <div className="md:col-span-7 space-y-4">
              <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Identificação
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
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
                <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
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
              <Button type="button" onClick={onLimpar} className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-2 group outline-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500 group-hover:text-red-600 transition-colors">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {initialPedidos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900">Nenhum pedido encontrado</h3>
            <p className="text-slate-500 mt-1 max-w-sm">Tente ajustar os filtros ou o período da busca.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-300 ${isNavigationLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Título da Tabela */}
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                Pedidos Localizados
              </h2>
            </div>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Nro Pedido</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Nro NF</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Nro Trans. Venda</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Posição</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Data</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Filial</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap">Vlr. Total</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap text-center">Itens</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 whitespace-nowrap w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialPedidos.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr className={`hover:bg-blue-50/50 transition-colors ${open[p.id] ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.nroPedido}</td>
                      <td className="px-6 py-4">{p.nroNF || '-'}</td>
                      <td className="px-6 py-4">{p.nroTransVenda || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {p.posicao || 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4">{p.filial || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{fmtBRL.format(p.vlrTotal ?? 0)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 py-1 px-2 rounded font-medium text-xs border border-slate-200">
                          {p.nroItens ?? p.itens?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${open[p.id] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                          onClick={() => toggleRow(p.id)}
                          title={open[p.id] ? 'Ocultar itens' : 'Ver itens'}
                        >
                          {open[p.id] ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                          )}
                        </button>
                      </td>
                    </tr>

                    {open[p.id] && p.itens && (
                      <tr className="bg-slate-50/50 animate-in fade-in slide-in-from-top-1">
                        <td colSpan={9} className="p-0 border-b border-slate-200">
                          <div className="py-4 px-6 bg-slate-50 shadow-inner">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                              Itens do Pedido
                            </h4>
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">Cod. Produto</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-800">Descrição</th>
                                    <th className="px-4 py-2 text-center font-medium text-slate-600">Qtd</th>
                                    <th className="px-4 py-2 text-center font-medium text-slate-600">Qtd Falta</th>
                                    <th className="px-4 py-2 text-center font-medium text-slate-600">P. Venda Unit.</th>
                                    <th className="px-4 py-2 text-right font-medium text-slate-800">P. Venda Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {p.itens.length > 0 ? p.itens.map((it, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                      <td className="px-4 py-2 text-slate-600 font-mono text-xs">{it.codProduto}</td>
                                      <td className="px-4 py-2 font-medium text-slate-800">{it.descricao}</td>
                                      <td className="px-4 py-2 text-center text-slate-600">{it.qtd}</td>
                                      <td className="px-4 py-2 text-center text-red-500 font-medium">{it.qtdFalta > 0 ? it.qtdFalta : '-'}</td>
                                      <td className="px-4 py-2 text-center text-slate-600">{fmtBRL.format(it.pvUnit)}</td>
                                      <td className="px-4 py-2 text-right font-medium text-slate-800">{fmtBRL.format(it.pvTotal)}</td>
                                    </tr>
                                  )) : (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Sem itens registrados para este pedido.</td></tr>
                                  )}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t border-slate-100">
                                  <tr>
                                    <td colSpan={5} className="px-4 py-2 text-right font-bold text-slate-700 uppercase text-xs tracking-wider">Total do Pedido:</td>
                                    <td className="px-4 py-2 text-right font-bold text-slate-900">{fmtBRL.format(p.vlrTotal ?? 0)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {initialTotal > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>Mostrando página <span className="font-bold text-slate-900">{initialPage}</span> de <span className="font-bold text-slate-900">{totalPages}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled={initialPage <= 1} onClick={() => onPageChange(initialPage - 1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>

              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) { pageNum = i + 1; }
                  else if (initialPage <= 3) { pageNum = i + 1; }
                  else if (initialPage >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                  else { pageNum = initialPage - 2 + i; }

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

              <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled={initialPage >= totalPages} onClick={() => onPageChange(initialPage + 1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
