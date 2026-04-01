'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@pgb/ui';

type Ticket = {
  id: string;
  openedAt: string;
  closedAt?: string;
  orderNumber?: number;
  invoiceNumber?: number;
  subject: string;
  status: 'em_andamento' | 'finalizado';
  clientName?: string;
  clientCode?: number;
};

type Comment = {
  id: string;
  author: string;
  authorType: 'cliente' | 'suporte';
  content: string;
  createdAt: string;
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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

export default function SACAdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Fetch all open tickets
  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch('/api/admin/sac/tickets?status=em_andamento');
        if (!res.ok) throw new Error('Falha ao carregar tickets');
        const data = await res.json();
        setTickets(data.list ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  // Fetch comments when ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setComments([]);
      return;
    }
    async function fetchComments() {
      try {
        const res = await fetch(`/api/admin/sac/tickets/${selectedTicket!.id}/comments`);
        if (!res.ok) throw new Error('Falha ao carregar comentários');
        const data = await res.json();
        setComments(data.comments ?? []);
      } catch {
        setComments([]);
      }
    }
    fetchComments();
  }, [selectedTicket]);

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim() || !selectedTicket) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/sac/tickets/${selectedTicket.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newResponse.trim() }),
        });
        if (!res.ok) throw new Error('Falha ao enviar resposta');
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => [...prev, data.comment]);
          setNewResponse('');
        }
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    if (!confirm('Deseja realmente finalizar este ticket?')) return;

    try {
      const res = await fetch(`/api/admin/sac/tickets/${selectedTicket.id}/close`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Falha ao finalizar ticket');

      // Remove from list and clear selection
      setTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id));
      setSelectedTicket(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-900/40">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">SAC Admin</h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Gerenciamento de atendimentos</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              ← Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Fechar</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 dark:text-zinc-200">Tickets Abertos</h2>
                <Badge variant="info">{tickets.length}</Badge>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500 dark:text-zinc-400">Carregando...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 dark:text-zinc-500">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">Nenhum ticket aberto</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Todos os atendimentos foram finalizados</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/50 max-h-[600px] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/40 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600' : ''
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">#{ticket.id}</p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{ticket.subject}</p>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">{formatDate(ticket.openedAt)}</p>
                        </div>
                        {ticket.orderNumber && (
                          <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded-full shrink-0">
                            Ped #{ticket.orderNumber}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {!selectedTicket ? (
              <Card className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-zinc-600">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-zinc-300">Selecione um ticket</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Clique em um ticket à esquerda para visualizar e responder</p>
              </Card>
            ) : (
              <Card className="p-0 overflow-hidden flex flex-col h-[700px]">
                {/* Ticket Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-slate-50 dark:from-zinc-900 to-white dark:to-zinc-900 border-b border-slate-100 dark:border-zinc-800/50 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-zinc-100">Ticket #{selectedTicket.id}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{selectedTicket.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">Em andamento</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseTicket}
                      className="text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:bg-emerald-950/30"
                    >
                      ✓ Finalizar
                    </Button>
                  </div>
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-sm">
                      Nenhuma mensagem ainda
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const isSupport = comment.authorType === 'suporte';
                      return (
                        <div
                          key={comment.id}
                          className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] ${isSupport ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isSupport ? 'flex-row-reverse' : ''}`}>
                              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">{comment.author}</span>
                              {isSupport && (
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-500 px-1.5 py-0.5 rounded">Suporte</span>
                              )}
                            </div>
                            <div
                              className={`px-4 py-3 rounded-2xl text-sm ${isSupport
                                ? 'bg-blue-600 text-white rounded-tr-md'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-md border border-slate-200 dark:border-zinc-800'
                                }`}
                            >
                              <p className="whitespace-pre-wrap">{comment.content}</p>
                            </div>
                            <p className={`text-[10px] text-slate-400 dark:text-zinc-500 mt-1 ${isSupport ? 'text-right' : ''}`}>
                              {formatDateTime(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Response Form */}
                <form onSubmit={handleSendResponse} className="p-4 border-t border-slate-100 dark:border-zinc-800/50 bg-slate-50 dark:bg-zinc-900/40 shrink-0">
                  <div className="flex gap-3">
                    <textarea
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="flex-1 min-h-[80px] p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
                      disabled={isPending}
                    />
                    <Button
                      type="submit"
                      loading={isPending}
                      disabled={!newResponse.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white self-end h-10 px-5"
                    >
                      Enviar
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
