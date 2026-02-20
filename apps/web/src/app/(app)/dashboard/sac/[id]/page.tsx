import Link from 'next/link';
import { Card, Badge, Button } from '@pgb/ui';
import { fetchTicketDetail } from '../detailApi';
import { TicketInfoCard } from './ticket-info-card';
import { CommentsSection } from './comments-section';


function statusBadge(s: 'em_andamento' | 'finalizado') {
  if (s === 'finalizado') return <Badge variant="success">Finalizado</Badge>;
  return <Badge variant="info">Em andamento</Badge>;
}

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetchTicketDetail(id);

  if (!res.ok) {
    return (
      <div className="space-y-4">


        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 mb-4">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Erro ao Carregar Ticket</h2>
            <p className="text-sm text-red-600 mb-6">{res.message || 'Não foi possível carregar as informações do ticket'}</p>
            <Link href="/dashboard/sac">
              <Button variant="secondary">Voltar para SAC</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { ticket, timeline, comments = [] } = res;

  const dates = [
    new Date(ticket.openedAt).getTime(),
    timeline.length > 0 ? new Date(timeline[timeline.length - 1].when).getTime() : 0,
    comments.length > 0 ? new Date(comments[comments.length - 1].createdAt).getTime() : 0
  ];
  const lastUpdate = new Date(Math.max(...dates));

  return (
    <div className="space-y-4 sm:space-y-6">


      {/* Header com Status e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/dashboard/sac">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 flex items-center justify-center transition-all group shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover:text-slate-700 transition-colors">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Ticket #{ticket.id}</h1>
              {statusBadge(ticket.status)}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Aberto em {formatDateTime(ticket.openedAt)}</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>Atualizado {formatDateTime(lastUpdate)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm capitalize hidden sm:block h-fit">
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Informações Principais do Ticket */}
      <TicketInfoCard ticket={ticket} />

      {/* Timeline / Histórico */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Histórico de Movimentações
          </h2>
        </div>

        <div className="p-6">
          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 font-medium">Nenhuma movimentação registrada</p>
              <p className="text-xs text-slate-400 mt-1">As atualizações aparecerão aqui</p>
            </div>
          ) : (
            <div className="relative pl-4 sm:pl-6">
              {/* Linha vertical da timeline */}
              <div className="absolute left-4 sm:left-6 top-4 bottom-4 w-px bg-slate-200" />

              <div className="space-y-8">
                {timeline.map((item: any, index: number) => {
                  const isLast = index === timeline.length - 1;
                  return (
                    <div key={index} className="relative flex gap-4 sm:gap-6 group">
                      {/* Marcador */}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white shadow-sm transition-transform group-hover:scale-110 ${item.status === 'finalizado' ? 'border-emerald-500 text-emerald-600' : 'border-blue-500 text-blue-600'
                        }`}>
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all -mt-1 group-hover:border-blue-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="font-medium text-slate-900">
                            {item.status === 'finalizado' ? 'Ticket Finalizado' : 'Em Análise'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {formatDateTime(item.when)}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-light">{item.description || '—'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Seção de Comentários */}
      <CommentsSection
        ticketId={ticket.id}
        initialComments={comments}
        ticketStatus={ticket.status}
      />
    </div>
  );
}
