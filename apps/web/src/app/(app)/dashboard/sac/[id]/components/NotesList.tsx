'use client';

import React from 'react';
import { cn } from '@lib/cn';
import type { ChatComment } from './ChatBubble';

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Icons
const Icons = {
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Note: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
};

interface NotesListProps {
  notes: ChatComment[];
  isDisabled: boolean;
  isPending: boolean;
  editingId: string | null;
  editContent: string;
  onEditContentChange: (value: string) => void;
  onEdit: (note: ChatComment) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  // New note form
  newNoteValue: string;
  onNewNoteChange: (value: string) => void;
  onSubmitNote: (e: React.FormEvent) => void;
  isNotePublic: boolean;
  onTogglePublic: () => void;
}

export function NotesList({
  notes,
  isDisabled,
  isPending,
  editingId,
  editContent,
  onEditContentChange,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  newNoteValue,
  onNewNoteChange,
  onSubmitNote,
  isNotePublic,
  onTogglePublic,
}: NotesListProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-md shadow-slate-200/40 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/60 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 text-white">
            <Icons.Note />
          </div>
          <div>
            <h3 className="text-slate-800 dark:text-zinc-200 font-semibold text-base tracking-tight">Comentários</h3>
            <p className="text-slate-400 dark:text-zinc-500 text-xs font-medium">Anotações do ticket — você escolhe a visibilidade</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/40 px-3 py-1.5 rounded-full border border-slate-100 dark:border-zinc-800/50">
          <span className="text-slate-600 dark:text-zinc-400 text-[11px] font-semibold uppercase tracking-wide">
            {notes.length} {notes.length === 1 ? 'NOTA' : 'NOTAS'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 bg-[#fcfcfd] space-y-6 overflow-hidden">
        {/* Notes List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-0">
          {notes.map(msg => {
            const isEditing = editingId === msg.id;

            return (
              <div key={msg.id} className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-xl p-5 transition-all duration-300 hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/5">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => onEditContentChange(e.target.value)}
                      className="w-full p-3 text-sm border border-amber-400 rounded-lg focus:ring-4 focus:ring-amber-500/10 outline-none resize-none bg-white dark:bg-zinc-900 shadow-sm"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={onCancelEdit} className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 rounded-lg transition-colors">Cancelar</button>
                      <button onClick={() => onSaveEdit(msg.id)} className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm">Salvar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{formatDateTime(msg.createdAt)}</span>
                        {msg.isPublic ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-500 text-[9px] font-bold uppercase tracking-wider">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            Público
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 text-[9px] font-bold uppercase tracking-wider">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                            Privado
                          </span>
                        )}
                      </div>

                      {!isDisabled && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-slate-100 dark:border-zinc-800/50 shadow-sm">
                          <button onClick={() => onEdit(msg)} className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:bg-blue-950/30 rounded-md transition-colors" title="Editar">
                            <Icons.Edit />
                          </button>
                          <div className="w-px h-4 bg-slate-100 dark:bg-zinc-800 my-auto"></div>
                          <button onClick={() => onDelete(msg.id)} className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:text-red-500 hover:bg-red-50 dark:bg-red-950/30 rounded-md transition-colors" title="Apagar">
                            <Icons.Trash />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap font-normal">{msg.content}</p>
                  </>
                )}
              </div>
            );
          })}

          {notes.length === 0 && !isPending && (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/30">
              <div className="w-14 h-14 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-zinc-600 shadow-sm">
                <Icons.Note />
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide">Nenhuma nota registrada</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Use o campo abaixo para adicionar anotações privadas.</p>
            </div>
          )}
        </div>

        {/* Note Input Form */}
        {!isDisabled && (
          <form onSubmit={onSubmitNote} className="flex flex-col gap-2 relative bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-3 focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:border-amber-400 transition-all shadow-sm shrink-0">
            <div className="flex gap-2 items-end">
              <div className="flex-1 py-1 px-1">
                <textarea
                  value={newNoteValue}
                  onChange={(e) => {
                    onNewNoteChange(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  className="w-full text-sm bg-transparent border-none focus:ring-0 p-2 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 max-h-[120px]"
                  placeholder="Adicionar uma nota..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSubmitNote(e);
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!newNoteValue.trim() || isPending}
                className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center h-[42px] w-[42px]"
              >
                {isPending ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <Icons.Plus />
                )}
              </button>
            </div>

            {/* Toggle Public/Private */}
            <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-zinc-800/50">
              <button
                type="button"
                onClick={onTogglePublic}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border",
                  isNotePublic
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 dark:bg-emerald-900/50"
                    : "bg-slate-50 dark:bg-zinc-900/40 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-800"
                )}
              >
                {isNotePublic ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    Público — suporte verá
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    Privado — só você vê
                  </>
                )}
              </button>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Enter para enviar</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
