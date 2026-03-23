import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { SearchBar } from './SearchBar';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { ThemeToggle } from './ThemeToggle';
import { HelpModal } from './HelpModal';

const moduleTitles: Record<string, string> = {
  'sac': 'SAC',
  'pacientes': 'Produtos',
  'agenda': 'Agenda',
  'relatorios': 'Relatórios',
  'configuracoes': 'Configurações',
  'financeiro': 'Financeiro',
  'meus-pedidos': 'Pedidos',
  'entregas': 'Entregas',
  'notificacoes': 'Notificações',
};

interface TopbarProps {
  onMenuClick?: () => void;
  initialUser?: {
    name: string;
    email: string;
    codcli?: number;
  };
}

export function Topbar({ onMenuClick, initialUser }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const userName = initialUser?.name || 'Usuário';
  const userEmail = initialUser?.email || 'usuario@exemplo.com';
  const codcli = initialUser?.codcli;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.notifications) setNotifications(data.notifications);
      })
      .catch(() => {});

    if (codcli) {
      fetch(`/api/avatar?codcli=${codcli}`)
        .then(r => r.ok ? r.blob() : Promise.reject())
        .then(blob => setAvatarUrl(URL.createObjectURL(blob)))
        .catch(() => {});
    }
  }, [codcli]);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error('Falha ao marcar notificações como lidas:', e);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) setSearchQuery('');
  };

  const segments = pathname.split('/').filter(Boolean);
  const currentModule = segments[1]; // app/dashboard/[module]
  const subModules = segments.slice(2);
  const pageTitle = currentModule ? (moduleTitles[currentModule] || 'Dashboard') : 'Início';

  const dateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          
          {/* Menu Mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Abrir menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Título e Breadcrumbs */}
          <div className={clsx(
            'flex flex-col gap-0.5 flex-1 min-w-0',
            isSearchOpen ? 'hidden sm:block sm:opacity-0 sm:w-0 sm:overflow-hidden' : 'opacity-100'
          )}>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Portal Global</Link>
              {currentModule && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className={clsx(subModules.length === 0 ? "text-blue-500" : "hover:text-blue-500 transition-colors cursor-pointer")}>
                    {pageTitle}
                  </span>
                </>
              )}
              {subModules.map((seg, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-slate-300">/</span>
                  <span className={clsx(idx === subModules.length - 1 ? "text-blue-500" : "truncate")}>
                    {seg.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-zinc-100 tracking-tight truncate leading-tight">
              {pageTitle}
            </h1>
          </div>

          <SearchBar 
            isSearchOpen={isSearchOpen} 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            toggleSearch={toggleSearch} 
          />

          {/* Ações */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <NotificationsDropdown 
              notifications={notifications}
              isOpen={isNotificationsOpen}
              setIsOpen={setIsNotificationsOpen}
              isSearchOpen={isSearchOpen}
              onMarkAllAsRead={markAllAsRead}
            />

            <ThemeToggle isSearchOpen={isSearchOpen} />

            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className={clsx(
                'p-2 sm:p-2.5 text-gray-600 dark:text-zinc-400 hover:text-[#4a90e2] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200',
                'hidden md:block',
                isSearchOpen && 'md:hidden lg:block'
              )}
              title="Ajuda e Suporte"
              aria-label="Ajuda e Suporte"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </button>

            <div className={clsx(
              'w-px h-6 sm:h-8 bg-gray-200 dark:bg-zinc-800',
              'hidden md:block',
              isSearchOpen && 'md:hidden lg:block'
            )} aria-hidden="true" />

            <ProfileDropdown 
              userName={userName}
              userEmail={userEmail}
              avatarUrl={avatarUrl}
              isOpen={isProfileOpen}
              setIsOpen={setIsProfileOpen}
              isSearchOpen={isSearchOpen}
            />
          </div>
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </header>
  );
}