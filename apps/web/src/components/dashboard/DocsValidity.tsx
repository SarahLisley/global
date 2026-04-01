'use client';

import { Card } from '@pgb/ui';
import { useState, useMemo } from 'react';
import { Search, X, FileText, CheckCircle2, AlertTriangle, XCircle, Copy, Check, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

type Doc = {
  description: string;
  dueDate: string;
  docNumber: string;
  status: 'valido' | 'vencido' | 'proximo_vencer';
  url?: string;
};

type FilterStatus = 'todos' | 'valido' | 'vencido' | 'proximo_vencer';

export function DocsValidity({ docs }: { docs: Doc[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    if (Math.abs(diffDays) > 60) {
      const diffMonths = Math.ceil(diffDays / 30);
      return rtf.format(diffMonths, 'month');
    }
    return rtf.format(diffDays, 'day');
  };

  const filteredDocs = useMemo(() => {
    let result = [...docs];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.description.toLowerCase().includes(term) ||
        d.docNumber.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'todos') {
      result = result.filter(d => d.status === filterStatus);
    }

    return result.sort((a, b) => {
      const priority = { vencido: 0, proximo_vencer: 1, valido: 2 };
      return priority[a.status] - priority[b.status];
    });
  }, [docs, searchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: docs.length,
    vencidos: docs.filter(d => d.status === 'vencido').length,
    proximos: docs.filter(d => d.status === 'proximo_vencer').length,
    validos: docs.filter(d => d.status === 'valido').length,
  }), [docs]);

  const statusBadge = (s: Doc['status']) => {
    if (s === 'valido') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 border border-emerald-200 dark:border-emerald-800/50">
        <CheckCircle2 size={12} />
        Válido
      </span>
    );
    if (s === 'proximo_vencer') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 border border-amber-200 dark:border-amber-800/50">
        <AlertTriangle size={12} />
        Próx. Venc.
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 border border-red-200 dark:border-red-800/50">
        <XCircle size={12} />
        Vencido
      </span>
    );
  };

  const statusIndicatorColor = (s: Doc['status']) => {
    if (s === 'vencido') return 'bg-red-500';
    if (s === 'proximo_vencer') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const filterTabs: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'todos', label: 'Todos', count: stats.total },
    { id: 'vencido', label: 'Vencidos', count: stats.vencidos },
    { id: 'proximo_vencer', label: 'A Vencer', count: stats.proximos },
    { id: 'valido', label: 'Válidos', count: stats.validos },
  ];

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-gray-50 dark:from-zinc-900 to-white dark:to-zinc-900 dark:to-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-500 dark:text-blue-400">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100">Validade de Documentos</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Gerencie seus prazos e conformidades</p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 sm:py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                title="Limpar busca"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {filterTabs.map((tab) => {
            const active = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                  active
                    ? "bg-gray-900 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                )}
              >
                {tab.label}
                <span className={clsx(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  active
                    ? "bg-white/20 dark:bg-zinc-900/30"
                    : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 dark:text-zinc-300 text-xs sm:text-sm whitespace-nowrap">Documento</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 dark:text-zinc-300 text-xs sm:text-sm whitespace-nowrap">Vencimento</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 dark:text-zinc-300 text-xs sm:text-sm whitespace-nowrap">Referência</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-700 dark:text-zinc-300 text-xs sm:text-sm whitespace-nowrap">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map((d) => (
                      <tr
                        key={d.description + d.docNumber}
                        className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group"
                      >
                        {/* Documento */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className={clsx("w-2 h-2 rounded-full shrink-0", statusIndicatorColor(d.status))} />
                            <a
                              href={d.url}
                              target="_blank"
                              rel="noreferrer"
                              className={clsx(
                                "text-xs sm:text-sm font-medium truncate max-w-[200px] sm:max-w-[280px]",
                                d.url
                                  ? "text-gray-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 dark:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                                  : "text-gray-600 dark:text-zinc-300 cursor-default"
                              )}
                              onClick={(e) => !d.url && e.preventDefault()}
                            >
                              {d.description}
                            </a>
                            {d.url && (
                              <ChevronRight size={14} className="text-gray-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors shrink-0" />
                            )}
                          </div>
                        </td>

                        {/* Vencimento */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-zinc-100">
                              {new Date(d.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                            <span className={clsx(
                              "text-[10px] sm:text-xs font-medium",
                              d.status === 'vencido' ? "text-red-500" : "text-gray-400 dark:text-zinc-500"
                            )}>
                              ({getRelativeTime(d.dueDate)})
                            </span>
                          </div>
                        </td>

                        {/* Referência */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCopy(d.docNumber)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group/copy"
                            title="Copiar referência"
                          >
                            <span className="text-xs font-mono text-gray-500 dark:text-zinc-400 group-hover/copy:text-gray-900 dark:group-hover/copy:text-zinc-200 transition-colors">
                              {d.docNumber}
                            </span>
                            {copied === d.docNumber
                              ? <Check size={12} className="text-emerald-500 dark:text-emerald-400" />
                              : <Copy size={12} className="text-gray-300 group-hover/copy:text-[#4a90e2] transition-colors" />
                            }
                          </button>
                        </td>

                        {/* Status */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {statusBadge(d.status)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-zinc-500">
                          <svg width="40" height="40" className="sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-zinc-300">Nenhum documento encontrado</p>
                          <p className="text-xs sm:text-sm">Tente ajustar seus filtros ou termo de busca.</p>
                          <button
                            onClick={() => { setSearchTerm(''); setFilterStatus('todos'); }}
                            className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-500 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-400 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 transition-colors"
                          >
                            Limpar filtros
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <span>
            Mostrando <span className="font-semibold text-gray-900 dark:text-zinc-100">{filteredDocs.length}</span> de{' '}
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{docs.length}</span> documentos
          </span>
        </div>
      </div>
    </Card>
  );
}