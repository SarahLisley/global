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

  return (
    <div className={cn(
      "flex w-full group animate-in slide-in-from-bottom-2 duration-500 gap-3",
      isMe ? "justify-end" : "justify-start"
    )}>
      {/* Avatar SAC / Winthor */}
      {!isMe && (
        <div className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-sm mt-1",
          msg.authorType === 'winthor' ? "bg-amber-100 border-amber-200" : "bg-white border-slate-200"
        )}>
          {msg.authorType === 'winthor' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-700">
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <path d="M4 10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" />
              <line x1="12" y1="22" x2="12" y2="18" />
              <circle cx="9" cy="14" r="1.5" fill="currentColor" className="opacity-75" />
              <circle cx="15" cy="14" r="1.5" fill="currentColor" className="opacity-75" />
            </svg>
          ) : (
            <span className="text-[10px] font-bold text-slate-600">SC</span>
          )}
        </div>
      )}

      <div className={cn(
        "flex flex-col max-w-[75%]",
        isMe ? "items-end" : "items-start"
      )}>
        {/* Meta */}
        <div className="flex items-center gap-2 mb-1 px-1 opacity-80">
          <span className="text-[10px] text-slate-400 font-medium">{formatDateTime(msg.createdAt)}</span>
        </div>

        {/* Bubble */}
        <div className={cn(
          "relative px-5 py-3.5 text-sm shadow-sm transition-all duration-200",
          isMe
            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-blue-500/10"
            : msg.authorType === 'winthor'
              ? "bg-amber-50 text-slate-800 border border-amber-200 rounded-2xl rounded-tl-sm shadow-sm"
              : "bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm shadow-slate-200/50"
        )}>
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {msg.content}
          </p>
          {msg.attachment && (
            <a href={msg.attachment.url} target="_blank" className={cn(
              "flex items-center gap-2 mt-3 p-2 rounded-lg text-xs transition-colors border",
              isMe
                ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
                : "bg-slate-50 hover:bg-slate-100 text-blue-600 border-slate-100"
            )}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
              <span className="truncate max-w-[200px] font-medium">{msg.attachment.filename}</span>
            </a>
          )}
        </div>

        {/* Actions */}
        {isMe && !isDisabled && (
          <div className="flex items-center gap-3 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button onClick={() => onEdit(msg)} className="text-[10px] text-slate-400 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors hover:underline">
              Editar
            </button>
            <button onClick={() => onDelete(msg.id)} className="text-[10px] text-slate-400 hover:text-red-500 font-medium flex items-center gap-1 transition-colors hover:underline">
              Apagar
            </button>
          </div>
        )}
      </div>

      {/* Avatar Me */}
      {isMe && (
        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 shadow-sm mt-1">
          <span className="text-[10px] font-bold text-blue-600">me</span>
        </div>
      )}
    </div>
  );
}
