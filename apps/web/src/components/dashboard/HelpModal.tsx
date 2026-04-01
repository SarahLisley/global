'use client';

import clsx from 'clsx';
import { Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-zinc-900 dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-gray-50 dark:from-zinc-900 to-white dark:to-zinc-900 dark:to-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 dark:bg-blue-900/30 rounded-lg text-[#4a90e2] dark:text-blue-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Precisa de ajuda?</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <p className="text-gray-600 dark:text-zinc-400 text-sm">
              Nossa equipe de suporte está pronta para ajudar você com qualquer dúvida ou problema.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 group hover:border-blue-200 dark:border-blue-800/50 dark:hover:border-blue-800/50 transition-colors">
                <div className="p-2 bg-white dark:bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-sm text-gray-600 dark:text-zinc-400 group-hover:text-[#4a90e2] dark:group-hover:text-blue-400 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Telefone</p>
                  <p className="text-gray-900 dark:text-zinc-100 font-medium">0800 123 4567</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 group hover:border-blue-200 dark:border-blue-800/50 dark:hover:border-blue-800/50 transition-colors">
                <div className="p-2 bg-white dark:bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-sm text-gray-600 dark:text-zinc-400 group-hover:text-[#4a90e2] dark:group-hover:text-blue-400 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-gray-900 dark:text-zinc-100 font-medium">suporte@bravotecnologia.com.br</p>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
