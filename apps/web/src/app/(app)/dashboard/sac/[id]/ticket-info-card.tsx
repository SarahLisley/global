'use client';

import { useState } from 'react';
import { Card } from '@pgb/ui';

type TicketInfoCardProps = {
  ticket: {
    id: string;
    subject: string;
    branch?: string;
    orderNumber?: string;
    invoiceNumber?: string;
    closedAt?: string;
    openedAt: string;
  };
};

export function TicketInfoCard({ ticket }: TicketInfoCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string | undefined, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="p-5 sm:p-6 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Optional: Global copy or actions */}
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-500">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        Detalhes do Ticket
      </h2>

      <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group/item relative">
          <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Assunto</div>
          <div className="text-base font-medium text-gray-900 break-words">{ticket.subject || '—'}</div>
        </div>

        <div className="group/item relative">
          <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Filial</div>
          <div className="text-base text-gray-900 flex items-center gap-2">
            {ticket.branch ?? '—'}
          </div>
        </div>

        <div className="group/item relative">
          <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Número do Pedido</div>
          <div
            className="text-base font-mono text-gray-900 flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 dark:text-blue-500 transition-colors w-fit"
            onClick={() => handleCopy(ticket.orderNumber, 'order')}
            title="Clique para copiar"
          >
            {ticket.orderNumber ?? '—'}
            {ticket.orderNumber && (
              <span className="text-slate-300 dark:text-zinc-600 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {copiedField === 'order' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="group/item relative">
          <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Nota Fiscal</div>
          <div
            className="text-base font-mono text-gray-900 flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 dark:text-blue-500 transition-colors w-fit"
            onClick={() => handleCopy(ticket.invoiceNumber, 'invoice')}
            title="Clique para copiar"
          >
            {ticket.invoiceNumber ?? '—'}
            {ticket.invoiceNumber && (
              <span className="text-slate-300 dark:text-zinc-600 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {copiedField === 'invoice' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="group/item relative">
          <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Abertura</div>
          <div className="text-base text-gray-900">
            {formatDateTime(ticket.openedAt)}
          </div>
        </div>

        <div className="group/item relative">
          <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Finalização</div>
          <div className="text-base text-gray-900">
            {ticket.closedAt ? formatDateTime(ticket.closedAt) : (
              <span className="text-slate-400 dark:text-zinc-500 italic flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                Em aberto
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
