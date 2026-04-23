'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';

const links = [
  {
    href: '/dashboard',
    label: 'Início',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  {
    href: '/dashboard/sac',
    label: 'SAC',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  {
    href: '/dashboard/entregas',
    label: 'Entregas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
      </svg>
    )
  },
  {
    href: '/dashboard/meus-pedidos',
    label: 'Pedidos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    )
  },
  {
    href: '/dashboard/financeiro',
    label: 'Financeiro',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    )
  }
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: {
    name: string;
    email: string;
  };
}

export function Sidebar({ isOpen = false, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/logout', { method: 'POST', cache: 'no-store' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed left-0 top-0 h-screen w-60 shrink-0 bg-gradient-to-b from-[#1e3a5f] to-[#0f1e3a] text-white shadow-2xl flex flex-col overflow-hidden z-50 transition-transform duration-300',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header com Logo */}
        <div className="px-6 py-4 sm:py-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between lg:justify-center">
            <Image
              src="/images/logo-global-hospitalar.png"
              alt="GLOBAL Hospitalar"
              width={120}
              height={120}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
            {/* Botão fechar mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 sm:py-6 space-y-1 sm:space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {links.map((link) => {
            const active = link.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={handleLinkClick}
                className={clsx(
                  'group flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1'
                )}
              >
                <span className={clsx(
                  'transition-transform duration-200 flex-shrink-0',
                  active ? 'scale-110' : 'group-hover:scale-110'
                )}>
                  {link.icon}
                </span>
                <span className="truncate">{link.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-900 animate-pulse flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer/User Section */}
        <div className="p-4 sm:p-6 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/5 backdrop-blur-sm">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
              {(user?.name ?? 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">{user?.name ?? 'Usuário'}</p>
              <p className="text-[10px] sm:text-xs text-blue-200 truncate">{user?.email ?? ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-200 hover:text-white transition-colors flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg disabled:opacity-50"
              title={loggingOut ? 'Saindo...' : 'Sair'}
              disabled={loggingOut}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={clsx(loggingOut && 'opacity-60')}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}