'use client';

import React, { useState } from 'react';
import { Card, Button } from '@pgb/ui';
import { useFilters } from '../../../../hooks/useFilters';
import { Search } from 'lucide-react';

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
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, Item[]>>(() =>
    initialPedidos.reduce<Record<string, Item[]>>((acc, pedido) => {
      if (pedido.itens) acc[pedido.id] = pedido.itens;
      return acc;
    }, {})
  );
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({});
  const [itemsError, setItemsError] = useState<Record<string, string>>({});

  React.useEffect(() => {
    setItemsByOrder((current) => {
      const next = { ...current };
      for (const pedido of initialPedidos) {
        if (pedido.itens && !next[pedido.id]) {
          next[pedido.id] = pedido.itens;
        }
      }
      return next;
    });
  }, [initialPedidos]);

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

  async function loadItems(id: string) {
    if (itemsByOrder[id] || itemsLoading[id]) return;

    setItemsLoading((current) => ({ ...current, [id]: true }));
    setItemsError((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    try {
      const res = await fetch(`/api/meus-pedidos/${encodeURIComponent(id)}/items`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Nao foi possivel carregar os itens.');
      }

      setItemsByOrder((current) => ({
        ...current,
        [id]: Array.isArray(data?.items) ? data.items : [],
      }));
    } catch (error: any) {
      setItemsError((current) => ({
        ...current,
        [id]: error?.message || 'Nao foi possivel carregar os itens.',
      }));
    } finally {
      setItemsLoading((current) => ({ ...current, [id]: false }));
    }
  }

  async function toggleRow(id: string) {
    const willOpen = !open[id];
    setOpen((current) => ({ ...current, [id]: willOpen }));

    if (willOpen && itemsByOrder[id] === undefined) {
      await loadItems(id);
    }
  }

  function onPageChange(newPage: number) {
    updateFilters({ page: String(newPage) });
  }

  const totalPages = Math.max(1, Math.ceil(initialTotal / pageSize));

  const handleExportCSV = () => {
    if (initialPedidos.length === 0) return;

    const headers = [
      'Pedido',
      'NF',
      'Trans. Venda',
      'Posicao',
      'Data',
      'Filial',
      'Valor Total'
    ];

    const rows = initialPedidos.map(p => [
      p.nroPedido,
      p.nroNF || '-',
      p.nroTransVenda || '-',
      p.posicao || 'Normal',
      new Date(p.data).toLocaleDateString('pt-BR'),
      p.filial || '-',
      (p.vlrTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    ].join(';'));

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_bravo_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Meus Pedidos</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Consulte seus pedidos, notas fiscais e status de faturamento.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="p-6 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/50 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-4">
              <div className="font-semibold text-sm text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Periodo de Emissao
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-1 border border-slate-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="dtInicial" className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 pt-1">De</label>
                  <input
                    id="dtInicial"
                    type="date"
                    className="block w-full border-0 p-0 text-slate-900 dark:text-white px-2 pb-1 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-0 focus:outline-none text-sm"
                    value={filters.dtInicial}
                    onChange={(e) => setFilter('dtInicial', e.target.value)}
                  />
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-1 border border-slate-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="dtFinal" className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 pt-1">Ate</label>
                  <input
                    id="dtFinal"
                    type="date"
                    className="block w-full border-0 p-0 text-slate-900 dark:text-white px-2 pb-1 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-0 focus:outline-none text-sm"
                    value={filters.dtFinal}
                    onChange={(e) => setFilter('dtFinal', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="font-semibold text-sm text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Search size={16} className="text-blue-500" />
                Identificacao
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-1 border border-slate-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="pedido" className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 pt-1">Pedido</label>
                  <input
                    id="pedido"
                    type="text"
                    placeholder="Ex.: 15025165"
                    className="block w-full border-0 p-0 text-slate-900 dark:text-white px-2 pb-1 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-0 focus:outline-none text-sm"
                    value={filters.pedido}
                    onChange={(e) => setFilter('pedido', e.target.value)}
                  />
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-1 border border-slate-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <label htmlFor="nf" className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-2 pt-1">Nota Fiscal</label>
                  <input
                    id="nf"
                    type="text"
                    placeholder="Ex.: NF-12345"
                    className="block w-full border-0 p-0 text-slate-900 dark:text-white px-2 pb-1 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:ring-0 focus:outline-none text-sm"
                    value={filters.nf}
                    onChange={(e) => setFilter('nf', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end pt-4 border-t border-slate-200 dark:border-zinc-800 gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button type="button" onClick={onPesquisar} loading={isNavigationLoading} className="flex-1 sm:flex-none bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-1.5 group outline-none">
                <Search size={16} className="text-blue-500" />
                Pesquisar
              </Button>
              <Button type="button" onClick={onLimpar} className="flex-1 sm:flex-none bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 font-medium px-6 rounded-full flex items-center justify-center gap-2 group outline-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500 group-hover:text-red-600 dark:text-red-500 transition-colors">
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
            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900/40 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 dark:text-zinc-500">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-zinc-100">Nenhum pedido encontrado</h3>
            <p className="text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">Tente ajustar os filtros ou o periodo da busca.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity duration-300 ${isNavigationLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="px-6 pt-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                Pedidos Localizados
              </h2>

              <Button
                onClick={handleExportCSV}
                className="bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-sm text-xs font-bold px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                disabled={initialPedidos.length === 0 || isNavigationLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar (CSV)
              </Button>
            </div>

            <table className="w-full text-left text-sm text-slate-600 dark:text-zinc-400">
              <thead className="bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Nro Pedido</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Nro NF</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Nro Trans. Venda</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Posicao</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Data</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Filial</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Vlr. Total</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap text-center">Itens</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap w-24">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {initialPedidos.map((pedido) => {
                  const pedidoItems = itemsByOrder[pedido.id] ?? pedido.itens;
                  const isItemsLoading = !!itemsLoading[pedido.id];
                  const itemError = itemsError[pedido.id];

                  return (
                    <React.Fragment key={pedido.id}>
                      <tr className={`hover:bg-blue-50/50 dark:bg-blue-950/20 transition-colors ${open[pedido.id] ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-zinc-100">{pedido.nroPedido}</td>
                        <td className="px-6 py-4">{pedido.nroNF || '-'}</td>
                        <td className="px-6 py-4">{pedido.nroTransVenda || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md w-fit border border-slate-200 dark:border-zinc-800">
                            <div className={`w-1.5 h-1.5 rounded-full ${pedido.posicao === 'Faturado' || pedido.posicao === 'F'
                              ? 'bg-emerald-500'
                              : pedido.posicao === 'Cancelado' || pedido.posicao === 'C'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                              }`}></div>
                            {pedido.posicao || 'Normal'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(pedido.data).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4">{pedido.filial || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-zinc-100">{fmtBRL.format(pedido.vlrTotal ?? 0)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 py-1 px-2 rounded font-medium text-xs border border-slate-200 dark:border-zinc-800">
                            {pedido.nroItens ?? pedidoItems?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${open[pedido.id] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/40 hover:text-slate-700 dark:hover:text-zinc-200 dark:text-zinc-300'}`}
                            onClick={() => void toggleRow(pedido.id)}
                            title={open[pedido.id] ? 'Ocultar itens' : 'Ver itens'}
                          >
                            {open[pedido.id] ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                            )}
                          </button>
                        </td>
                      </tr>

                      {open[pedido.id] && (
                        <tr className="bg-slate-50/50 dark:bg-zinc-900/50 animate-in fade-in slide-in-from-top-1">
                          <td colSpan={9} className="p-0 border-b border-slate-200 dark:border-zinc-800">
                            <div className="py-4 px-6 bg-slate-50 dark:bg-zinc-900/40 shadow-inner">
                              <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                                Itens do Pedido
                              </h4>
                              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100 dark:border-zinc-800/50">
                                      <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-zinc-400">Cod. Produto</th>
                                      <th className="px-4 py-2 text-left font-medium text-slate-800 dark:text-zinc-200">Descricao</th>
                                      <th className="px-4 py-2 text-center font-medium text-slate-600 dark:text-zinc-400">Qtd</th>
                                      <th className="px-4 py-2 text-center font-medium text-slate-600 dark:text-zinc-400">Qtd Falta</th>
                                      <th className="px-4 py-2 text-center font-medium text-slate-600 dark:text-zinc-400">P. Venda Unit.</th>
                                      <th className="px-4 py-2 text-right font-medium text-slate-800 dark:text-zinc-200">P. Venda Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                                    {isItemsLoading ? (
                                      <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-zinc-400">
                                          Carregando itens do pedido...
                                        </td>
                                      </tr>
                                    ) : itemError ? (
                                      <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-red-600 dark:text-red-400">
                                          {itemError}
                                        </td>
                                      </tr>
                                    ) : pedidoItems && pedidoItems.length > 0 ? (
                                      pedidoItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/40">
                                          <td className="px-4 py-2 text-slate-600 dark:text-zinc-400 font-mono text-xs">{item.codProduto}</td>
                                          <td className="px-4 py-2 font-medium text-slate-800 dark:text-zinc-200">{item.descricao}</td>
                                          <td className="px-4 py-2 text-center text-slate-600 dark:text-zinc-400">{item.qtd}</td>
                                          <td className="px-4 py-2 text-center text-red-500 font-medium">{item.qtdFalta > 0 ? item.qtdFalta : '-'}</td>
                                          <td className="px-4 py-2 text-center text-slate-600 dark:text-zinc-400">{fmtBRL.format(item.pvUnit)}</td>
                                          <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-zinc-200">{fmtBRL.format(item.pvTotal)}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-zinc-400">
                                          Sem itens registrados para este pedido.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                  <tfoot className="bg-slate-50 dark:bg-zinc-900/40 border-t border-slate-100 dark:border-zinc-800/50">
                                    <tr>
                                      <td colSpan={5} className="px-4 py-2 text-right font-bold text-slate-700 dark:text-zinc-300 uppercase text-xs tracking-wider">Total do Pedido:</td>
                                      <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-zinc-100">{fmtBRL.format(pedido.vlrTotal ?? 0)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {initialTotal > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 dark:bg-zinc-900/40 border-t border-slate-200 dark:border-zinc-800">
            <div className="text-sm text-slate-600 dark:text-zinc-400 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>Mostrando pagina <span className="font-bold text-slate-900 dark:text-zinc-100">{initialPage}</span> de <span className="font-bold text-slate-900 dark:text-zinc-100">{totalPages}</span></span>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled={initialPage <= 1} onClick={() => onPageChange(initialPage - 1)}>
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
                        : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/40'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled={initialPage >= totalPages} onClick={() => onPageChange(initialPage + 1)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
