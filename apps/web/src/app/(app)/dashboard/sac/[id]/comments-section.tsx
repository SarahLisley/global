'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { addCommentAction, fetchCommentsAction, editCommentAction, deleteCommentAction } from '../actions';
import { Toast } from './toast';

interface Comment {
  id: string;
  author: string;
  authorType: 'cliente' | 'suporte';
  type?: 'message' | 'note';
  content: string;
  attachment?: {
    filename: string;
    url: string;
  };
  createdAt: string;
}

interface Props {
  ticketId: string;
  initialComments: Comment[];
  ticketStatus: 'em_andamento' | 'finalizado';
}

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const POLLING_INTERVAL = 10000;

export function CommentsSection({ ticketId, initialComments, ticketStatus }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState(''); // Para comentários pessoais
  const [newMessage, setNewMessage] = useState(''); // Para chat SAC
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // New States for Premium Features
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Filter messages based on type
  // Backward compatibility: if type is undefined, assume it's a message unless it's explicitly a note
  const allMessages = comments.filter(c => c.type === 'message' || !c.type);
  const clientNotes = comments.filter(c => c.type === 'note');

  const isDisabled = ticketStatus === 'finalizado';

  const interactionListRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const fetchLatestComments = useCallback(async () => {
    if (isDisabled) return;
    try {
      const res = await fetchCommentsAction(ticketId);
      if (res.ok && res.comments) {
        setComments(res.comments);
      }
    } catch {
      // Silent fail
    }
  }, [ticketId, isDisabled]);

  useEffect(() => {
    if (!isPolling || isDisabled) return;
    const interval = setInterval(fetchLatestComments, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [isPolling, isDisabled, fetchLatestComments]);

  useEffect(() => {
    if (interactionListRef.current) interactionListRef.current.scrollTop = interactionListRef.current.scrollHeight;
  }, [comments.length]);

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      showToast(`Arquivo "${files[0].name}" pronto para envio (Simulação)`, 'info');
      // Aqui integraria o envio real do arquivo
    }
  };

  // Enviar mensagem no CHAT SAC
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isDisabled) return;

    setError(null);
    setIsPolling(false);

    startTransition(async () => {
      const res = await addCommentAction(ticketId, newMessage.trim(), 'message');
      if (!res.ok) {
        showToast(res.message ?? 'Erro ao enviar', 'error');
      } else if (res.comment) {
        setComments((prev) => [...prev, res.comment as Comment]);
        setNewMessage('');
        router.refresh(); // Atualiza timestamp no header
      }
      setIsPolling(true);
    });
  };

  // Enviar nota na área de Comentários
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isDisabled) return;

    setError(null);
    setIsPolling(false);

    startTransition(async () => {
      const res = await addCommentAction(ticketId, newComment.trim(), 'note');
      if (!res.ok) {
        showToast(res.message ?? 'Erro ao enviar', 'error');
      } else if (res.comment) {
        setComments((prev) => [...prev, res.comment as Comment]);
        setNewComment('');
        router.refresh(); // Atualiza timestamp no header
      }
      setIsPolling(true);
    });
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    startTransition(async () => {
      const res = await editCommentAction(ticketId, commentId, editContent.trim());
      if (res.ok) {
        setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: editContent.trim() } : c)));
        setEditingId(null);
        setEditContent('');
        showToast('Edição salva com sucesso', 'success');
        router.refresh(); // Atualiza timestamp no header
      } else {
        showToast(res.message ?? 'Erro ao editar', 'error');
      }
    });
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Tem certeza que deseja apagar?')) return;

    setError(null);
    try {
      const res = await deleteCommentAction(ticketId, commentId);
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showToast('Mensagem apagada com sucesso', 'success');
        router.refresh(); // Atualiza timestamp no header
      } else {
        const msg = res.message ?? 'Erro desconhecido ao apagar';
        showToast(msg, 'error');
      }
    } catch (e: any) {
      console.error('Erro no handleDelete:', e);
      showToast('Erro de conexão ao apagar', 'error');
    }
  };

  // Componente de Ícone para reduzir repetição e padronizar
  const Icons = {
    Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-0.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
    Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>,
    Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
    Chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    Note: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ÁREA 1: INTERAÇÃO SAC */}
      <div
        className={`bg-white rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col h-[520px] overflow-hidden relative ${isDragOver ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200/60 shadow-sm'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-50 bg-blue-600/5 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-blue-500 m-2 rounded-xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <h3 className="text-lg font-bold text-blue-700">Solte o arquivo aqui</h3>
            <p className="text-blue-600/80 text-sm">Para anexar à mensagem</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50/50 rounded-xl flex items-center justify-center border border-slate-200/50 shadow-sm text-slate-600">
              <Icons.Chat />
            </div>
            <div>
              <h3 className="text-slate-800 font-semibold text-base tracking-tight">Interação SAC</h3>
              <p className="text-slate-400 text-xs font-medium">Conversa direta com o suporte</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
            <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide">{allMessages.length} MSG</span>
          </div>
        </div>

        {/* Chat Area */}
        <div
          ref={interactionListRef}
          className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50 space-y-6"
        >
          {allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 select-none">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z" /></svg>
              </div>
              <span className="text-sm font-medium text-slate-500">Nenhum histórico</span>
              <span className="text-xs mt-1.5 text-slate-400">Inicie uma conversa abaixo.</span>
            </div>
          ) : (
            allMessages.map((msg) => {
              const isMe = msg.authorType === 'cliente';
              const isEditing = editingId === msg.id;

              if (isEditing) return null;

              return (
                <div key={msg.id} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Meta */}
                    <div className="flex items-center gap-2 mb-1.5 px-1 opacity-90">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? 'text-blue-600' : 'text-slate-600'}`}>
                        {isMe ? 'Você' : 'SAC'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{formatDateTime(msg.createdAt)}</span>
                    </div>

                    {/* Bubble */}
                    <div className={`relative px-5 py-3.5 text-sm shadow-sm transition-all duration-200 hover:shadow-md ${isMe
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm ring-1 ring-blue-700/50'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm'
                      }`}>
                      <p className={`whitespace-pre-wrap break-words leading-relaxed ${isMe ? 'font-light' : 'font-normal'}`}>
                        {msg.content}
                      </p>
                      {msg.attachment && (
                        <a href={msg.attachment.url} target="_blank" className={`flex items-center gap-2 mt-3 p-2 rounded-lg text-xs transition-colors border ${isMe
                          ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                          : 'bg-slate-50 hover:bg-slate-100 text-blue-600 border-slate-100'
                          }`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                          <span className="truncate max-w-[200px] font-medium">{msg.attachment.filename}</span>
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    {isMe && !isDisabled && (
                      <div className="flex items-center gap-3 mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                        <button onClick={() => handleEdit(msg)} className="text-[10px] text-slate-400 hover:text-blue-600 font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(msg.id)} className="text-[10px] text-slate-400 hover:text-red-500 font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors">
                          Apagar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Chat */}
        {!isDisabled && (
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 shrink-0 relative z-10 transition-colors focus-within:bg-slate-50/30">
            <div className="flex gap-3 items-end">
              {/* Botão de Anexo Restaurado */}
              <button
                type="button"
                className="mb-2.5 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Anexar arquivo"
                onClick={() => showToast('Funcionalidade de anexo em breve!', 'info')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
              </button>

              <div className="relative flex-1 group">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem para o suporte..."
                  className="w-full pl-4 pr-12 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none resize-none bg-slate-50 focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
                  rows={1}
                  style={{ minHeight: '42px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="absolute top-3 right-3 text-xs text-slate-300">↵</div>
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || isPending}
                className="h-[42px] w-[42px] flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-md shadow-blue-500/20"
              >
                {isPending ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-0.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ÁREA 2: ANOTAÇÕES */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col overflow-hidden">
        {/* Header Anotações - Padronizado com o de cima */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50/50 rounded-xl flex items-center justify-center border border-slate-200/50 shadow-sm text-slate-600">
              <Icons.Note />
            </div>
            <div>
              <h3 className="text-slate-800 font-semibold text-base tracking-tight">Anotações Pessoais</h3>
              <p className="text-slate-400 text-xs font-medium">Notas privadas do ticket</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide">{clientNotes.length} NOTAS</span>
          </div>
        </div>

        <div className="p-6 bg-slate-50 space-y-6">
          {!isDisabled && (
            <form onSubmit={handleSubmitNote} className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-100 placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                placeholder="Adicionar uma nota rápida..."
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 flex items-center gap-2"
              >
                <Icons.Plus />
                <span>Adicionar</span>
              </button>
            </form>
          )}

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {clientNotes.map(msg => {
              const isEditing = editingId === msg.id;

              return (
                <div key={msg.id} className="group relative bg-white border border-slate-100 rounded-xl p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 text-sm border border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-500/10 outline-none resize-none bg-white shadow-sm"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                        <button onClick={() => handleSaveEdit(msg.id)} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100/50">{formatDateTime(msg.createdAt)}</span>

                        {!isDisabled && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                            <button onClick={() => handleEdit(msg)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                              <Icons.Edit />
                            </button>
                            <div className="w-px h-4 bg-slate-100 my-auto"></div>
                            <button onClick={() => handleDelete(msg.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Apagar">
                              <Icons.Trash />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-normal">{msg.content}</p>
                    </>
                  )}
                </div>
              );
            })}

            {clientNotes.length === 0 && !isPending && (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Nenhuma nota registrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
