'use client';

import { Badge, Card } from '@pgb/ui';
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
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-md w-fit border border-emerald-100">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        Válido
      </div>
    );
    if (s === 'proximo_vencer') return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-md w-fit border border-amber-100">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
        Próx. vencimento
      </div>
    );
    if (s === 'vencido') return (
      <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-full w-fit border border-red-200">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
        Vencido
      </div>
    );
  };

  const icon = (s: Doc['status']) => {
    if (s === 'valido') return (
      <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" className="text-emerald-500" />
      </svg>
    );
    if (s === 'proximo_vencer') return (
      <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" className="text-amber-500" />
        <line x1="12" y1="8" x2="12" y2="12" className="text-amber-500" />
        <line x1="12" y1="16" x2="12.01" y2="16" className="text-amber-500" />
      </svg>
    );
    return (
      <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" className="text-red-500" />
        <line x1="15" y1="9" x2="9" y2="15" className="text-red-500" />
        <line x1="9" y1="9" x2="15" y2="15" className="text-red-500" />
      </svg>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header Responsivo */}
      <div className="p-4 sm:p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg flex-shrink-0">
            <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" className="text-slate-500" />
              <polyline points="14 2 14 8 20 8" className="text-slate-500" />
              <line x1="16" y1="13" x2="8" y2="13" className="text-slate-500" />
              <line x1="16" y1="17" x2="8" y2="17" className="text-slate-500" />
              <polyline points="10 9 9 9 8 9" className="text-slate-500" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Validade de Documentos</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Fique atento aos prazos</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {sortedDocs.map((d) => (
            <div
              key={d.description}
              className={`rounded-lg border bg-white shadow-sm transition-all group overflow-hidden ${d.status === 'vencido'
                ? 'border-l-4 border-l-red-300 border-y-slate-100 border-r-slate-100'
                : 'border-l-4 border-l-emerald-400 border-y-slate-100 border-r-slate-100 hover:shadow-md'
                }`}
            >
              <div className="p-4 sm:p-5">
                {/* Layout em coluna no mobile, grid no desktop */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex-shrink-0 self-start sm:self-center">
                    {icon(d.status)}
                  </div>

                  {/* Grid responsivo */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-y-4 sm:gap-x-6 items-center">

                    {/* Descrição - Foco Principal */}
                    <div className="sm:col-span-4">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Documento</div>
                      <a
                        href={d.url ?? '#'}
                        target={d.url ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className={`text-base font-semibold transition-colors ${!d.url ? 'cursor-default text-slate-700' : 'text-slate-900 hover:text-blue-600'}`}
                        onClick={(e) => {
                          if (!d.url) {
                            e.preventDefault();
                          }
                        }}
                      >
                        {d.description}
                      </a>
                    </div>

                    {/* Data de Validade */}
                    <div className="sm:col-span-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Vencimento</div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-medium ${d.status === 'vencido' ? 'text-slate-700' : 'text-slate-700'}`}>
                          {(() => {
                            const date = new Date(d.dueDate);
                            return isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
                          })()}
                        </span>
                        <span className={`text-xs ${d.status === 'vencido' ? 'text-red-400' : 'text-slate-400'}`}>
                          ({getRelativeTime(d.dueDate)})
                        </span>
                      </div>
                    </div>

                    {/* Número do Documento */}
                    <div className="sm:col-span-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Ref.</div>
                      <div className="flex items-center gap-2 group/copy cursor-pointer" onClick={() => handleCopy(d.docNumber)}>
                        <span className="font-mono text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {d.docNumber}
                        </span>
                        {copied === d.docNumber ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 group-hover/copy:text-blue-400 transition-colors"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
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