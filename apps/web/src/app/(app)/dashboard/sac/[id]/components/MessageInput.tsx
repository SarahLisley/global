'use client';

import React from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  placeholder?: string;
  onAttachClick?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  isPending,
  placeholder = 'Digite sua mensagem...',
  onAttachClick,
  disabled,
}: MessageInputProps) {
  return (
    <div className="p-4 bg-white border-t border-slate-100 shrink-0 relative z-10 transition-colors focus-within:bg-slate-50/10">
      <form onSubmit={onSubmit} className="flex gap-2 items-end relative bg-slate-50 rounded-2xl border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all shadow-sm">
        {onAttachClick && (
          <button
            type="button"
            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Anexar arquivo"
            onClick={onAttachClick}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
          </button>
        )}

        <div className="flex-1 py-2">
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            placeholder={placeholder}
            className="w-full text-sm bg-transparent border-none focus:ring-0 p-0 outline-none resize-none placeholder:text-slate-400 max-h-[120px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            disabled={disabled}
          />
        </div>

        <button
          type="submit"
          disabled={!value.trim() || isPending || disabled}
          className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-md shadow-blue-500/20"
        >
          {isPending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          )}
        </button>
      </form>
      <div className="px-2 mt-2 flex justify-end">
        <span className="text-[10px] text-slate-400 font-medium">Pressione Enter para enviar</span>
      </div>
    </div>
  );
}
