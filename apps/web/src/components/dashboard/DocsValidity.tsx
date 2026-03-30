'use client';

import { Card } from '@pgb/ui';
import { useState, useMemo } from 'react';
import { Search, X, Filter, FileText, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Copy, Check } from 'lucide-react';
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

    // Busca por texto (nome ou número)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.description.toLowerCase().includes(term) || 
        d.docNumber.toLowerCase().includes(term)
      );
    }

    // Filtro por status
    if (filterStatus !== 'todos') {
      result = result.filter(d => d.status === filterStatus);
    }

    // Ordenação: vencido > proximo_vencer > valido
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

  const badge = (s: Doc['status']) => {
    if (s === 'valido') return (
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-50/80 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
        Válido
      </div>
    );
    if (s === 'proximo_vencer') return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-bold bg-amber-50/80 px-2 py-0.5 rounded-full ring-1 ring-amber-500/20">
        Próx. Venc.
      </div>
    );
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-red-500 font-bold bg-red-50/80 px-2 py-0.5 rounded-full ring-1 ring-red-500/20">
        Vencido
      </div>
    );
  };

  const statusTab = (id: FilterStatus, label: string, count: number, activeColor: string) => {
    const active = filterStatus === id;
    return (
      <button
        onClick={() => setFilterStatus(id)}
        className={clsx(
          "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
          active 
            ? `${activeColor} text-white shadow-md shadow-slate-200 dark:shadow-none scale-[1.03]` 
            : "bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
        )}
      >
        {label}
        <span className={clsx(
          "px-1.5 rounded-full text-[10px]",
          active ? "bg-white/20" : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400"
        )}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header com Busca */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100">Validade de Documentos</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Gerencie seus prazos e conformidades</p>
            </div>
          </div>

          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-10 bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 rounded-xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                title="Limpar busca"
              >
                <X size={14} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filtros de Status (Tabs) */}
        <div className="flex flex-wrap gap-2 pt-1">
          {statusTab('todos', 'Todos', stats.total, 'bg-slate-900 dark:bg-zinc-700')}
          {statusTab('vencido', 'Vencidos', stats.vencidos, 'bg-red-500')}
          {statusTab('proximo_vencer', 'A Vencer', stats.proximos, 'bg-amber-500')}
          {statusTab('valido', 'Válidos', stats.validos, 'bg-emerald-500')}
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-slate-50/30 dark:bg-zinc-900/30">
        {/* Header de colunas desktop */}
        {filteredDocs.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-12 gap-x-6 px-5 pb-3 text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold">
            <div className="sm:col-span-5">Documento</div>
            <div className="sm:col-span-3">Vencimento</div>
            <div className="sm:col-span-2">Referência</div>
            <div className="sm:col-span-2 text-right">Situação</div>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-2">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((d) => (
              <div
                key={d.description + d.docNumber}
                className={clsx(
                  "group relative rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-all hover:shadow-md hover:-translate-y-0.5",
                  d.status === 'vencido' && "border-l-[4px] border-l-red-500",
                  d.status === 'proximo_vencer' && "border-l-[4px] border-l-amber-500",
                  d.status === 'valido' && "border-l-[4px] border-l-emerald-500"
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-3 sm:gap-x-6 items-center">
                  {/* Nome do documento */}
                  <div className="sm:col-span-5 min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className={clsx(
                          "text-sm font-bold truncate transition-colors",
                          d.url ? "text-slate-800 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" : "text-slate-500 cursor-default"
                        )}
                        onClick={(e) => !d.url && e.preventDefault()}
                      >
                        {d.description}
                      </a>
                    </div>
                  </div>

                  {/* Data de Vencimento */}
                  <div className="sm:col-span-3">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 text-sm">
                      <span className="font-medium">
                        {new Date(d.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={clsx(
                        "text-[10px] font-medium",
                        d.status === 'vencido' ? "text-red-500" : "text-slate-400 dark:text-zinc-500"
                      )}>
                        ({getRelativeTime(d.dueDate)})
                      </span>
                    </div>
                  </div>

                  {/* Referência (Copy) */}
                  <div className="sm:col-span-2">
                    <button 
                      onClick={() => handleCopy(d.docNumber)}
                      className="flex items-center gap-1.5 p-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors group/row"
                      title="Copiar referência"
                    >
                      <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 group-hover/row:text-slate-900 dark:group-hover/row:text-zinc-200">{d.docNumber}</span>
                      {copied === d.docNumber ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-300 group-hover/row:text-blue-400" />}
                    </button>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2 flex justify-start sm:justify-end">
                    {badge(d.status)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-zinc-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
               <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-full mb-4">
                  <Search size={24} className="text-slate-300" />
               </div>
               <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-1">Nenhum documento encontrado</h3>
               <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 max-w-[200px]">Tente ajustar seus filtros ou termo de busca.</p>
               <button 
                onClick={() => { setSearchTerm(''); setFilterStatus('todos'); }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
               >
                 Limpar todos os filtros
               </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}