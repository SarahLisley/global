'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { logoutAction } from '../../actions/logoutAction';

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
  };
}

import { HelpModal } from './HelpModal';

export function Topbar({ onMenuClick, initialUser }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [userName, setUserName] = useState(initialUser?.name || 'Usuário');
  const [userEmail, setUserEmail] = useState(initialUser?.email || 'usuario@exemplo.com');

  /* Removed client-side cookie logic as it's now handled server-side in layout.tsx */

  const [notifications, setNotifications] = useState<{ id: number; title: string; description: string; time: string; read: boolean }[]>([]);
  const isLoaded = true;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar busca global
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

  const segments = pathname.split('/').filter(Boolean);
  const currentModule = segments[1];
  const pageTitle = currentModule ? (moduleTitles[currentModule] || 'Dashboard') : 'Início';

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Botão Menu Mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Abrir menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Left Section - Título e Data */}
          <div className={clsx(
            'flex flex-col gap-0.5 transition-all duration-300',
            isSearchOpen ? 'hidden sm:block sm:opacity-0 sm:w-0 sm:overflow-hidden' : 'opacity-100'
          )}>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight truncate">
              {pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 capitalize truncate hidden sm:block">
              {dateStr}
            </p>
          </div>

          {/* Barra de Busca Expansível */}
          <div className={clsx(
            'flex-1 transition-all duration-300',
            isSearchOpen ? 'max-w-2xl' : 'max-w-0 overflow-hidden'
          )}>
            <form onSubmit={handleSearch} className="relative">
              <svg
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-10 sm:pl-12 pr-10 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                autoFocus={isSearchOpen}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </form>
          </div>

          {/* Right Section - Ações */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {/* Botão de Busca */}
            <button
              onClick={toggleSearch}
              className={clsx(
                'p-2 sm:p-2.5 rounded-xl transition-all duration-200',
                isSearchOpen
                  ? 'text-white bg-[#4a90e2] hover:bg-[#2563eb] shadow-lg'
                  : 'text-gray-600 hover:text-[#4a90e2] hover:bg-blue-50'
              )}
              title={isSearchOpen ? 'Fechar busca' : 'Buscar'}
            >
              {isSearchOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
            </button>

            {/* Notificações - Desktop apenas */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={clsx(
                  'relative p-2 sm:p-2.5 text-gray-600 hover:text-[#ff6b35] hover:bg-orange-50 rounded-xl transition-all duration-200',
                  'hidden md:block',
                  isSearchOpen && 'md:hidden lg:block',
                  isNotificationsOpen && 'text-[#ff6b35] bg-orange-50'
                )}
                title="Notificações"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {isLoaded && notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b35] rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Dropdown de Notificações */}
              {isNotificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <h3 className="font-semibold text-gray-900">Notificações</h3>
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[#4a90e2] hover:text-[#2563eb] font-medium transition-colors"
                      >
                        Marcar todas como lidas
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-600">Nenhuma notificação</p>
                          <p className="text-xs text-gray-400 mt-1">Você será notificado sobre novidades aqui.</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={clsx(
                              "p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer",
                              !notification.read && "bg-blue-50/30"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={clsx(
                                "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                                !notification.read ? "bg-[#ff6b35]" : "bg-gray-200"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className={clsx(
                                  "text-sm font-medium truncate",
                                  !notification.read ? "text-gray-900" : "text-gray-600"
                                )}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {notification.description}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1.5">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                      <Link
                        href="/dashboard/notificacoes"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-sm text-gray-600 hover:text-[#4a90e2] font-medium transition-colors block w-full"
                      >
                        Ver todas as notificações
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Ajuda - Desktop apenas */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className={clsx(
                'p-2 sm:p-2.5 text-gray-600 hover:text-[#4a90e2] hover:bg-blue-50 rounded-xl transition-all duration-200',
                'hidden md:block',
                isSearchOpen && 'md:hidden lg:block',
                isHelpOpen && 'text-[#4a90e2] bg-blue-50'
              )}
              title="Ajuda e Suporte"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </button>

            {/* Divider - Desktop apenas */}
            <div className={clsx(
              'w-px h-6 sm:h-8 bg-gray-200',
              'hidden md:block',
              isSearchOpen && 'md:hidden lg:block'
            )} />

            {/* Perfil */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className={clsx(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#4a90e2] to-[#2563eb] flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-lg ring-2 ring-blue-100 transition-transform hover:scale-105',
                  isSearchOpen && 'hidden sm:flex'
                )}>
                  {userName.charAt(0).toUpperCase()}
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{userEmail}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/dashboard/configuracoes"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Configurações
                      </Link>
                      <button
                        onClick={async () => {
                          setIsProfileOpen(false);
                          await logoutAction();
                          router.push('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}