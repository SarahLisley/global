'use client';

import { Card, Button } from '@pgb/ui';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const getRelativeTimeInfo = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { text: '', color: '' };
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `(há ${Math.abs(diffDays)} dias)`, color: 'text-red-500' };
    if (diffDays <= 7) return { text: `(em ${diffDays} dias)`, color: 'text-amber-500' };
    return { text: `(em ${diffDays} dias)`, color: 'text-gray-400' };
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
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

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDocs.slice(start, start + itemsPerPage);
  }, [filteredDocs, currentPage, itemsPerPage]);

  const stats = useMemo(() => ({
    total: docs.length,
    vencidos: docs.filter(d => d.status === 'vencido').length,
    proximos: docs.filter(d => d.status === 'proximo_vencer').length,
    validos: docs.filter(d => d.status === 'valido').length,
  }), [docs]);

  const statusBadge = (s: Doc['status']) => {
    const dot = {
      valido: "bg-emerald-500",
      proximo_vencer: "bg-amber-500",
      vencido: "bg-red-500"
    };
    const label = {
      valido: "Válido",
      proximo_vencer: "Próx. vencimento",
      vencido: "Vencido"
    };

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-semibold border border-gray-100 bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 shadow-sm transition-all whitespace-nowrap">
        <span className={clsx("w-1.5 h-1.5 rounded-full", dot[s])} />
        {label[s]}
      </span>
    );
  };

  const sideBorderColor = (s: Doc['status']) => {
    if (s === 'vencido') return 'border-l-red-500';
    if (s === 'proximo_vencer') return 'border-l-amber-500';
    return 'border-l-emerald-500';
  };

  const filterRadios: { id: FilterStatus; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'vencido', label: 'Vencido' },
    { id: 'proximo_vencer', label: 'Vencimento Próximo' },
    { id: 'valido', label: 'Válido' },
  ];

  return (
    <Card className="overflow-hidden border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-zinc-900 p-0">
      {/* Header Premium */}
      <div className="p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-400 dark:text-zinc-500 shadow-inner">
              <FileText size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Validade de Documentos</h2>
              <p className="text-sm text-gray-400 font-medium tracking-tight">Fique atento aos prazos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Filtros Estilo Radio + Paginação Info */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div className="flex flex-wrap items-center gap-6">
            {filterRadios.map((radio) => {
              const active = filterStatus === radio.id;
              
              return (
                <button
                  key={radio.id}
                  onClick={() => handleFilterChange(radio.id)}
                  className="flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    active 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-gray-200 dark:border-zinc-700 group-hover:border-blue-200"
                  )}>
                    {active && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-in zoom-in-50 duration-300" />}
                  </div>
                  <span className={clsx(
                    "text-sm font-semibold transition-colors whitespace-nowrap",
                    active ? "text-slate-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-500 group-hover:text-gray-600"
                  )}>
                    {radio.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 whitespace-nowrap">Exibir</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-2 pr-10 text-sm font-bold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
              >
                <option value={5}>5 itens</option>
                <option value={10}>10 itens</option>
                <option value={20}>20 itens</option>
                <option value={50}>50 itens</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Header das Colunas (Label de Tabela Minimalista) */}
        <div className="grid grid-cols-12 gap-4 px-6 mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-zinc-600">
          <div className="col-span-5 lg:col-span-4">DOCUMENTO</div>
          <div className="col-span-3 lg:col-span-3">VENCIMENTO</div>
          <div className="col-span-2 lg:col-span-3">REFERÊNCIA</div>
          <div className="col-span-2 lg:col-span-2 text-right">STATUS</div>
        </div>

        {/* Itens Estilizados (Row Cards) */}
        <div className="space-y-3.5 mb-8">
          {paginatedDocs.length > 0 ? (
            paginatedDocs.map((d, index) => {
              const relTime = getRelativeTimeInfo(d.dueDate);
              // Key ultra-única para evitar erros de renderização e garantir integridade da lista
              const itemKey = `doc-v-${index}-${d.description.slice(0, 10)}-${d.docNumber}`;
              
              return (
                <div
                  key={itemKey}
                  className={clsx(
                    "grid grid-cols-12 items-center gap-4 py-3 sm:py-5 px-6 bg-white dark:bg-zinc-900 border border-gray-50 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-md hover:shadow-gray-100/50 dark:hover:shadow-none rounded-xl border-l-[6px] transition-all duration-300 group",
                    sideBorderColor(d.status)
                  )}
                >
                  {/* Nome do Documento */}
                  <div className="col-span-5 lg:col-span-4 min-w-0">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate block hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={(e) => !d.url && e.preventDefault()}
                    >
                      {d.description}
                    </a>
                  </div>

                  {/* Vencimento */}
                  <div className="col-span-3 lg:col-span-3 whitespace-nowrap">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
                        {new Date(d.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                      <span className={clsx("text-xs font-medium", relTime.color)}>
                        {relTime.text}
                      </span>
                    </div>
                  </div>

                  {/* Referência (Copiar) */}
                  <div className="col-span-2 lg:col-span-3 hidden sm:block">
                     <button
                        onClick={() => handleCopy(d.docNumber)}
                        className="inline-flex items-center gap-2 group/copy text-gray-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 transition-all"
                        title="Copiar referência"
                      >
                        <span className="text-sm font-medium tracking-tight truncate max-w-[120px]">
                          {d.docNumber}
                        </span>
                        {copied === d.docNumber
                          ? <Check size={14} className="text-emerald-500" />
                          : <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                        }
                      </button>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2 sm:col-span-2 text-right">
                    {statusBadge(d.status)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center bg-gray-50/50 dark:bg-zinc-800/10 rounded-2xl border-2 border-dashed border-gray-100 dark:border-zinc-800">
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <Search size={48} strokeWidth={1} />
                <div>
                  <p className="font-bold text-slate-800 dark:text-zinc-300">Nenhum documento encontrado</p>
                  <p className="text-sm">Ajuste os filtros ou mude o termo de pesquisa.</p>
                </div>
                <Button
                  onClick={() => { handleSearchChange(''); handleFilterChange('todos'); }}
                  variant="secondary"
                  className="rounded-full px-8 dark:bg-zinc-800"
                >
                  Limpar tudo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Paginação Redenhado */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-50 dark:border-zinc-800 mb-2">
          <div className="text-sm font-medium text-gray-400 dark:text-zinc-500 select-none">
            Mostrando <span className="text-slate-900 dark:text-zinc-200 font-bold">
              {filteredDocs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span> a <span className="text-slate-900 dark:text-zinc-200 font-bold">
              {Math.min(currentPage * itemsPerPage, filteredDocs.length)}
            </span> de <span className="text-slate-900 dark:text-zinc-200 font-bold">{filteredDocs.length}</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}