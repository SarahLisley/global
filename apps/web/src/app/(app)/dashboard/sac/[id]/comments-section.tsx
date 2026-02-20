'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { addCommentAction, fetchCommentsAction, editCommentAction, deleteCommentAction, simulateWinthorAction, uploadAttachmentAction } from '../actions';
import { Toast } from './toast';
import { cn } from '@lib/cn';
import { ChatBubble, type ChatComment } from './components/ChatBubble';
import { MessageInput } from './components/MessageInput';
import { NotesList } from './components/NotesList';

// Re-export for consumers
export type { ChatComment as Comment };

interface Props {
  ticketId: string;
  initialComments: ChatComment[];
  ticketStatus: 'em_andamento' | 'finalizado';
}

const POLLING_INTERVAL = 10000;

export function CommentsSection({ ticketId, initialComments, ticketStatus }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<ChatComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isPolling, setIsPolling] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isNotePublic, setIsNotePublic] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('Arquivo muito grande. Máximo 5MB.', 'error');
        return;
      }
      setSelectedFile(file);
      showToast(`Arquivo "${file.name}" selecionado`, 'info');
    }
  };

  // Chat message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isDisabled) return;

    setIsPolling(false);
    startTransition(async () => {
      let attachment = undefined;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await uploadAttachmentAction(ticketId, formData);
        if (!uploadRes.ok) {
          showToast(uploadRes.message ?? 'Erro no upload', 'error');
          setIsPolling(true);
          return;
        }
        attachment = {
          filename: uploadRes.data.filename,
          path: uploadRes.data.path
        };
      }

      const res = await addCommentAction(ticketId, newMessage.trim(), 'message', false, attachment);
      if (!res.ok) {
        showToast(res.message ?? 'Erro ao enviar', 'error');
      } else if (res.comment) {
        setComments((prev) => [...prev, res.comment as ChatComment]);
        setNewMessage('');
        setSelectedFile(null);
        router.refresh();
      }
      setIsPolling(true);
    });
  };

  // Note submit
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isDisabled) return;
    setIsPolling(false);
    startTransition(async () => {
      const res = await addCommentAction(ticketId, newComment.trim(), 'note', isNotePublic);
      if (!res.ok) {
        showToast(res.message ?? 'Erro ao enviar', 'error');
      } else if (res.comment) {
        setComments((prev) => [...prev, res.comment as ChatComment]);
        setNewComment('');
        setIsNotePublic(false);
        router.refresh();
      }
      setIsPolling(true);
    });
  };

  const handleEdit = (comment: ChatComment) => {
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
        router.refresh();
      } else {
        showToast(res.message ?? 'Erro ao editar', 'error');
      }
    });
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Tem certeza que deseja apagar?')) return;
    try {
      const res = await deleteCommentAction(ticketId, commentId);
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showToast('Mensagem apagada com sucesso', 'success');
        router.refresh();
      } else {
        showToast(res.message ?? 'Erro desconhecido ao apagar', 'error');
      }
    } catch (e: any) {
      console.error('Erro no handleDelete:', e);
      showToast('Erro de conexão ao apagar', 'error');
    }
  };

  // Chat icon
  const ChatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ÁREA 1: INTERAÇÃO SAC */}
      <div
        className={cn(
          "bg-white rounded-2xl border transition-all duration-300 flex flex-col h-[650px] overflow-hidden relative shadow-md shadow-slate-200/50",
          isDragOver ? "border-blue-500 ring-4 ring-blue-500/5" : "border-slate-200/60"
        )}
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
        <div className="bg-slate-50/80 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-slate-200/60 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
              <ChatIcon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-slate-800 font-semibold text-base tracking-tight">Interação SAC</h3>
                <button
                  onClick={() => {
                    startTransition(async () => {
                      const res = await simulateWinthorAction(ticketId);
                      if (res.ok && res.comment) {
                        setComments(prev => [...prev, res.comment as ChatComment]);
                        showToast('Winthor respondeu!', 'success');
                      } else {
                        showToast('Erro ao simular Winthor', 'error');
                      }
                    });
                  }}
                  className="opacity-0 hover:opacity-100 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded border border-amber-200 transition-opacity"
                  title="Dev Only: Simular resposta da Winthor"
                >
                  Simular Winthor
                </button>
              </div>
              <p className="text-slate-400 text-xs font-medium">Conversa direta com o suporte</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
            <span className="text-slate-600 text-[11px] font-semibold uppercase tracking-wide">{allMessages.length} MSG</span>
          </div>
        </div>

        {/* Chat Area — using ChatBubble components */}
        <div
          ref={interactionListRef}
          className="flex-1 overflow-y-auto px-6 py-8 bg-[#f8fafc] space-y-8 scroll-smooth"
          style={{
            backgroundImage: 'radial-gradient(circle, #e2e8f0 1.2px, transparent 1.2px)',
            backgroundSize: '32px 32px'
          }}
        >
          {allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 select-none opacity-60">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-200/50 shadow-sm">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z" /></svg>
              </div>
              <span className="text-sm font-medium text-slate-500">Nenhum histórico</span>
              <span className="text-xs mt-1.5 text-slate-400">Inicie uma conversa abaixo.</span>
            </div>
          ) : (
            allMessages.map((msg) => (
              editingId === msg.id ? (
                <div key={msg.id} className="flex flex-col items-end gap-2 animate-in fade-in zoom-in duration-300">
                  <div className="w-full max-w-[75%] bg-white border-2 border-blue-400 rounded-2xl px-5 py-3.5 shadow-xl shadow-blue-500/10 relative">
                    <textarea
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      className="w-full text-sm bg-transparent border-none focus:ring-0 p-0 outline-none resize-none placeholder:text-slate-400 min-h-[40px]"
                      autoFocus
                    />
                    <div className="absolute -right-1.5 top-3 w-3 h-3 bg-white border-r border-t border-blue-400 rotate-[45deg] rounded-[1px]" />
                  </div>
                  <div className="flex gap-2 mr-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveEdit(msg.id)}
                      disabled={isPending || !editContent.trim()}
                      className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
                    >
                      {isPending ? 'Salvando...' : 'Salvar Alteração'}
                    </button>
                  </div>
                </div>
              ) : (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isDisabled={isDisabled}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
            ))
          )}
        </div>

        {/* Message Input or Finalized Banner */}
        {isDisabled ? (
          <div className="p-6 bg-slate-50 border-t border-slate-200 text-center animate-in slide-in-from-bottom-2 duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 text-slate-600 text-sm font-medium border border-slate-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
              Este ticket foi finalizado. Não é possível enviar novas mensagens.
            </div>
          </div>
        ) : (
          <MessageInput
            value={newMessage}
            onChange={setNewMessage}
            onSubmit={handleSendMessage}
            isPending={isPending}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            disabled={isDisabled}
          />
        )}
      </div>

      {/* ÁREA 2: NOTAS — using NotesList component */}
      <NotesList
        notes={clientNotes}
        isDisabled={isDisabled}
        isPending={isPending}
        editingId={editingId}
        editContent={editContent}
        onEditContentChange={setEditContent}
        onEdit={handleEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditingId(null)}
        onDelete={handleDelete}
        newNoteValue={newComment}
        onNewNoteChange={setNewComment}
        onSubmitNote={handleSubmitNote}
        isNotePublic={isNotePublic}
        onTogglePublic={() => setIsNotePublic(!isNotePublic)}
      />
    </div>
  );
}
