import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import {
  type ClientNotification,
  type NotificationsResponse,
  emitNotificationsRead,
  listenNotificationsRead,
  markNotificationsAsRead,
} from '../../lib/notifications';
import { HelpModal } from './HelpModal';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';

const moduleTitles: Record<string, string> = {
  sac: 'SAC',
  pacientes: 'Produtos',
  agenda: 'Agenda',
  relatorios: 'Relatorios',
  configuracoes: 'Configuracoes',
  financeiro: 'Financeiro',
  'meus-pedidos': 'Pedidos',
  entregas: 'Entregas',
  notificacoes: 'Notificacoes',
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

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const userName = initialUser?.name || 'Usuario';
  const userEmail = initialUser?.email || 'usuario@exemplo.com';
  const codcli = initialUser?.codcli;

  const loadNotifications = useCallback(async () => {
    if (isNotificationsLoading || hasLoadedNotifications) {
      return;
    }

    setIsNotificationsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      const data = response.ok ? (await response.json()) as NotificationsResponse : null;
      if (data?.notifications) {
        setNotifications(data.notifications);
        setHasLoadedNotifications(true);
      }
    } catch {
      // Silent fail: notifications can be retried when the dropdown opens.
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [hasLoadedNotifications, isNotificationsLoading]);

  useEffect(() => {
    if (!codcli) {
      return;
    }

    let revokedUrl: string | null = null;

    fetch(`/api/avatar?codcli=${codcli}`)
      .then((response) => (response.ok ? response.blob() : Promise.reject()))
      .then((blob) => {
        revokedUrl = URL.createObjectURL(blob);
        setAvatarUrl(revokedUrl);
      })
      .catch(() => {});

    return () => {
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [codcli]);

  useEffect(() => {
    if (hasLoadedNotifications) {
      return;
    }

    const browserWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const triggerLoad = () => {
      if (!cancelled) {
        void loadNotifications();
      }
    };

    if (typeof browserWindow.requestIdleCallback === 'function') {
      idleId = browserWindow.requestIdleCallback(triggerLoad, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(triggerLoad, 800);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && typeof browserWindow.cancelIdleCallback === 'function') {
        browserWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hasLoadedNotifications, loadNotifications]);

  useEffect(() => {
    if (isNotificationsOpen) {
      void loadNotifications();
    }
  }, [isNotificationsOpen, loadNotifications]);

  useEffect(() => {
    return listenNotificationsRead((ids) => {
      if (ids.length === 0) {
        return;
      }

      const readIds = new Set(ids);
      setNotifications((prev) =>
        prev.map((notification) =>
          readIds.has(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
    });
  }, []);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((notification) => !notification.read).map((notification) => notification.id);
    if (unreadIds.length === 0) {
      return;
    }

    try {
      const updatedIds = await markNotificationsAsRead(unreadIds);
      setNotifications((prev) =>
        prev.map((notification) =>
          updatedIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
      emitNotificationsRead(updatedIds);
    } catch (error) {
      console.error('Falha ao marcar notificacoes como lidas:', error);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

  const segments = pathname.split('/').filter(Boolean);
  const currentModule = segments[1];
  const subModules = segments.slice(2);
  const pageTitle = currentModule ? moduleTitles[currentModule] || 'Dashboard' : 'Inicio';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 lg:hidden"
            aria-label="Abrir menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div
            className={clsx(
              'flex min-w-0 flex-1 flex-col gap-0.5',
              isSearchOpen ? 'hidden lg:flex' : 'flex'
            )}
          >
            <div className="flex items-center gap-2 truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 sm:text-xs">
              <Link href="/dashboard" className="transition-colors hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400">
                Portal Global
              </Link>
              {currentModule && (
                <>
                  <span className="text-slate-300 dark:text-zinc-600">/</span>
                  <span className={clsx(subModules.length === 0 ? 'text-blue-500' : 'cursor-pointer transition-colors hover:text-blue-500')}>
                    {pageTitle}
                  </span>
                </>
              )}
            </div>
            <h1 className="truncate text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-zinc-100 sm:text-xl">
              {pageTitle}
            </h1>
          </div>

          <div className={clsx('flex flex-[2] justify-center', !isSearchOpen && 'hidden sm:flex')}>
            <SearchBar
              isSearchOpen={isSearchOpen}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              toggleSearch={toggleSearch}
            />
          </div>

          <div
            className={clsx(
              'flex flex-1 items-center justify-end gap-2 sm:gap-3 lg:gap-4',
              isSearchOpen ? 'hidden lg:flex' : 'flex'
            )}
          >
            <NotificationsDropdown
              notifications={notifications}
              isLoading={isNotificationsLoading}
              isOpen={isNotificationsOpen}
              setIsOpen={setIsNotificationsOpen}
              isSearchOpen={isSearchOpen}
              onMarkAllAsRead={markAllAsRead}
            />

            <ThemeToggle isSearchOpen={isSearchOpen} />

            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className={clsx(
                'hidden rounded-xl p-2 transition-all duration-200 hover:bg-blue-50 hover:text-[#4a90e2] dark:bg-blue-950/30 dark:text-zinc-400 dark:hover:bg-blue-900/30 md:block sm:p-2.5',
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

            <div
              className={clsx(
                'hidden h-6 w-px bg-gray-200 dark:bg-zinc-800 sm:h-8 md:block',
                isSearchOpen && 'md:hidden lg:block'
              )}
              aria-hidden="true"
            />

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
