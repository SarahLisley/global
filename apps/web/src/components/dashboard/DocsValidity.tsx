'use client';

import { Card } from '@pgb/ui';
import { useState } from 'react';

type Doc = {
  description: string;
  dueDate: string;
  docNumber: string;
  status: 'valido' | 'vencido' | 'proximo_vencer';
  url?: string;
};

export function DocsValidity({ docs }: { docs: Doc[] }) {
  const [copied, setCopied] = useState<string | null>(null);

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

  // Sort docs by urgency: vencido > proximo_vencer > valido
  const sortedDocs = [...docs].sort((a, b) => {
    const priority = { vencido: 0, proximo_vencer: 1, valido: 2 };
    return priority[a.status] - priority[b.status];
  });

  const badge = (s: Doc['status']) => {
    if (s === 'valido') return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50/80 px-2.5 py-1 rounded-full w-fit">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        Válido
      </div>
    );
    if (s === 'proximo_vencer') return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50/80 px-2.5 py-1 rounded-full w-fit">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
        Próx. vencimento
      </div>
    );
    if (s === 'vencido') return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium bg-red-50/80 px-2.5 py-1 rounded-full w-fit">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
        Vencido
      </div>
    );
  };

  const borderColor = (s: Doc['status']) => {
    if (s === 'vencido') return 'border-l-red-400';
    if (s === 'proximo_vencer') return 'border-l-amber-400';
    return 'border-l-emerald-400';
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-slate-100 dark:bg-zinc-800/80 rounded-lg flex-shrink-0">
            <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" className="text-slate-500 dark:text-zinc-400" />
              <polyline points="14 2 14 8 20 8" className="text-slate-500 dark:text-zinc-400" />
              <line x1="16" y1="13" x2="8" y2="13" className="text-slate-500 dark:text-zinc-400" />
              <line x1="16" y1="17" x2="8" y2="17" className="text-slate-500 dark:text-zinc-400" />
              <polyline points="10 9 9 9 8 9" className="text-slate-500 dark:text-zinc-400" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-zinc-100 truncate">Validade de Documentos</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 truncate">Fique atento aos prazos</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Header de colunas — visível apenas no desktop */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-x-6 px-5 pb-3 text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
          <div className="sm:col-span-4">Documento</div>
          <div className="sm:col-span-3">Vencimento</div>
          <div className="sm:col-span-3">Referência</div>
          <div className="sm:col-span-2 text-right">Status</div>
        </div>

        {/* Lista de documentos */}
        <div className="space-y-2">
          {sortedDocs.map((d) => (
            <div
              key={d.description}
              className={`rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 border-l-[3px] ${borderColor(d.status)} transition-colors hover:bg-slate-50/60 dark:hover:bg-zinc-800/60`}
            >
              <div className="px-4 py-3 sm:px-5 sm:py-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">

                  {/* Grid responsivo */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-y-3 sm:gap-x-6 items-center">

                    {/* Documento */}
                    <div className="sm:col-span-4">
                      <span className="sm:hidden text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold block mb-0.5">Documento</span>
                      <a
                        href={d.url ?? '#'}
                        target={d.url ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className={`text-sm font-semibold transition-colors ${!d.url ? 'cursor-default text-slate-700 dark:text-zinc-300' : 'text-slate-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400'}`}
                        onClick={(e) => {
                          if (!d.url) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {d.description}
                      </a>
                    </div>

                    {/* Vencimento */}
                    <div className="sm:col-span-3">
                      <span className="sm:hidden text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold block mb-0.5">Vencimento</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm text-slate-600 dark:text-zinc-300">
                          {(() => {
                            const date = new Date(d.dueDate);
                            return isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
                          })()}
                        </span>
                        <span className={`text-[11px] ${d.status === 'vencido' ? 'text-red-400' : 'text-slate-400 dark:text-zinc-500'}`}>
                          ({getRelativeTime(d.dueDate)})
                        </span>
                      </div>
                    </div>

                    {/* Referência */}
                    <div className="sm:col-span-3">
                      <span className="sm:hidden text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold block mb-0.5">Referência</span>
                      <div className="flex items-center gap-1.5 group/copy cursor-pointer" onClick={() => handleCopy(d.docNumber)}>
                        <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
                          {d.docNumber}
                        </span>
                        {copied === d.docNumber ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 dark:text-zinc-600 group-hover/copy:text-blue-400 transition-colors flex-shrink-0"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="sm:col-span-2 flex justify-start sm:justify-end">
                      {badge(d.status)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}