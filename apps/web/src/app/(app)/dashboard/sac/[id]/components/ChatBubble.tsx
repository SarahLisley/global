'use client';

import { cn } from '@lib/cn';

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export interface ChatComment {
  id: string;
  author: string;
  authorType: 'cliente' | 'suporte' | 'winthor';
  type?: 'message' | 'note';
  content: string;
  isPublic?: boolean;
  attachment?: {
    filename: string;
    url: string;
  };
  createdAt: string;
}

interface ChatBubbleProps {
  message: ChatComment;
  isDisabled: boolean;
  onEdit: (msg: ChatComment) => void;
  onDelete: (id: string) => void;
}

export function ChatBubble({ message: msg, isDisabled, onEdit, onDelete }: ChatBubbleProps) {
  const isMe = msg.authorType === 'cliente';
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
  const attachmentUrl = msg.attachment ? (msg.attachment.url.startsWith('http') ? msg.attachment.url : `${API_BASE}${msg.attachment.url}`) : '';

  return (
    <div className={cn(
      "flex w-full group animate-in slide-in-from-bottom-2 duration-500 gap-3",
      isMe ? "justify-end" : "justify-start"
    )}>
      {/* Avatar SAC / Winthor */}
      {!isMe && (
        <div className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-sm mt-1",
          msg.authorType === 'winthor' ? "bg-amber-100 dark:bg-amber-900/50 border-amber-200 dark:border-amber-800/50" : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
        )}>
          {msg.authorType === 'winthor' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-700 dark:text-amber-400">
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <path d="M4 10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" />
              <line x1="12" y1="22" x2="12" y2="18" />
              <circle cx="9" cy="14" r="1.5" fill="currentColor" className="opacity-75" />
              <circle cx="15" cy="14" r="1.5" fill="currentColor" className="opacity-75" />
            </svg>
          ) : (
            <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-400">SC</span>
          )}
        </div>
      )}

      <div className={cn(
        "flex flex-col max-w-[75%]",
        isMe ? "items-end" : "items-start"
      )}>
        {/* Meta */}
        <div className="flex items-center gap-2 mb-1 px-1 opacity-80">
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">{formatDateTime(msg.createdAt)}</span>
        </div>

        {/* Bubble */}
        <div className={cn(
          "relative px-5 py-3.5 text-sm transition-all duration-300",
          isMe
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-blue-500/20 border border-blue-500/20"
            : msg.authorType === 'winthor'
              ? "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-amber-200 dark:border-amber-800/50/60 rounded-2xl rounded-tl-sm shadow-md shadow-amber-200/10"
              : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800/80 rounded-2xl rounded-tl-sm shadow-md shadow-slate-200/40"
        )}>
          {/* Decorative quote for support */}
          {!isMe && (
            <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white dark:bg-zinc-900 border-l border-t border-inherit rotate-[-45deg] rounded-[1px]" />
          )}
          {isMe && (
            <div className="absolute -right-1.5 top-3 w-3 h-3 bg-blue-700 border-r border-t border-blue-700/50 rotate-[45deg] rounded-[1px]" />
          )}

          <p className="whitespace-pre-wrap break-words leading-relaxed font-light">
            {msg.content}
          </p>

          {msg.attachment && (
            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className={cn(
              "flex items-center gap-3 mt-4 p-3 rounded-xl text-xs transition-all border duration-200 group/file",
              isMe
                ? "bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-inner"
                : "bg-slate-50 dark:bg-zinc-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:bg-blue-950/30 text-blue-600 dark:text-blue-500 border-slate-100 dark:border-zinc-800/50 hover:border-blue-100 shadow-sm"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isMe ? "bg-white/20" : "bg-blue-100 dark:bg-blue-900/50/50 group-hover/file:bg-blue-100 dark:bg-blue-900/50"
              )}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate max-w-[180px] font-semibold">{msg.attachment.filename}</span>
                <span className={cn("text-[10px] opacity-70", isMe ? "text-white" : "text-slate-500 dark:text-zinc-400")}>Clique para abrir arquivo</span>
              </div>
            </a>
          )}
        </div>

        {/* Actions */}
        {isMe && !isDisabled && (
          <div className="flex items-center gap-4 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            <button onClick={() => onEdit(msg)} className="text-[10px] text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 dark:text-blue-500 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Editar
            </button>
            <button onClick={() => onDelete(msg.id)} className="text-[10px] text-slate-400 dark:text-zinc-500 hover:text-red-500 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
              Apagar
            </button>
          </div>
        )}
      </div>

      {/* Avatar Me */}
      {isMe && (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center shrink-0 shadow-sm mt-1">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-500">me</span>
        </div>
      )}
    </div>
  );
}
