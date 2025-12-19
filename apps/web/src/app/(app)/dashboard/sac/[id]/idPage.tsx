import Link from 'next/link';
import { Card, Badge, Button } from '@pgb/ui';
import { fetchTicketDetail } from '../detailApi';

function statusBadge(s: 'pendente' | 'em_andamento' | 'finalizado') {
  if (s === 'finalizado') return <Badge variant="success">Finalizado</Badge>;
  if (s === 'em_andamento') return <Badge variant="info">Em andamento</Badge>;
  return <Badge variant="warning">Pendente</Badge>;
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

// Ajuste Next 15: params é Promise<{ id: string }>
export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetchTicketDetail(id);

  if (!res.ok) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/dashboard" className="hover:underline hover:text-slate-900 transition-colors">Dashboard</Link>
          <span className="text-slate-400">/</span>
          <Link href="/dashboard/sac" className="hover:underline hover:text-slate-900 transition-colors">SAC</Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900">Ticket #{id}</span>
        </div>

        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 mb-4">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
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

  const { ticket, timeline } = res;
  const lastUpdate = timeline.length > 0 ? timeline[timeline.length - 1].when : ticket.openedAt;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/dashboard" className="hover:underline hover:text-slate-900 transition-colors">Dashboard</Link>
        <span className="text-slate-400">/</span>
        <Link href="/dashboard/sac" className="hover:underline hover:text-slate-900 transition-colors">SAC</Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-900 font-medium">Ticket #{ticket.id}</span>
      </div>

      {/* Header com Status e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ticket #{ticket.id}</h1>
            {statusBadge(ticket.status)}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Aberto em {formatDateTime(ticket.openedAt)}</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span>Atualizado {formatDateTime(lastUpdate)}</span>
            </div>
          </div>
        </div>
        <Link href="/dashboard/sac">
          <Button variant="secondary" className="w-full sm:w-auto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar
          </Button>
        </Link>
      </div>

      {/* Informações Principais do Ticket */}
      <Card className="p-5 sm:p-6 hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Detalhes do Ticket
        </h2>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Assunto</div>
            <div className="text-sm font-medium text-gray-900">{ticket.subject || '—'}</div>
          </div>

          <div className="group">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Filial</div>
            <div className="text-sm text-gray-900">{ticket.branch ?? '—'}</div>
          </div>

          <div className="group">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Número do Pedido</div>
            <div className="text-sm font-mono text-gray-900">{ticket.orderNumber ?? '—'}</div>
          </div>

          <div className="group">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nota Fiscal</div>
            <div className="text-sm font-mono text-gray-900">{ticket.invoiceNumber ?? '—'}</div>
          </div>

          <div className="group">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Finalização</div>
            <div className="text-sm text-gray-900">
              {ticket.closedAt ? formatDateTime(ticket.closedAt) : (
                <span className="text-slate-400 italic">Em aberto</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline / Histórico */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="m19 9-5 5-4-4-3 3"/>
          </svg>
          Histórico de Movimentações
        </h2>

        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300 mb-3">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm text-slate-500 font-medium">Nenhuma movimentação registrada</p>
            <p className="text-xs text-slate-400 mt-1">As atualizações aparecerão aqui</p>
          </div>
        ) : (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent hidden sm:block" />

            <div className="space-y-6">
              {timeline.map((item: any, index: number) => (
                <div key={item.seq} className="flex items-start gap-4 relative">
                  {/* Ponto da timeline */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                      item.status === 'finalizado' ? 'bg-emerald-500' :
                      item.status === 'em_andamento' ? 'bg-blue-500' : 'bg-amber-500'
                    }`}>
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {statusBadge(item.status)}
                        <span className="text-xs text-slate-500">
                          {formatDateTime(item.when)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{item.description || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Ações Futuras: Comentários, Anexos */}
      <Card className="p-5 sm:p-6 border-2 border-dashed border-slate-200 bg-slate-50/50">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-1">Comentários e Anexos</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Em breve você poderá adicionar comentários e anexar arquivos diretamente nesta tela.
              A funcionalidade de comunicação bidirecional será integrada após confirmação do fluxo completo.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}