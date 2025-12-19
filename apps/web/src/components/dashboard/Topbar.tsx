'use client';

import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Início',
  '/dashboard/sac': 'SAC',
  '/dashboard/pacientes': 'Produtos',
  '/dashboard/agenda': 'Agenda',
  '/dashboard/relatorios': 'Relatórios',
  '/dashboard/configuracoes': 'Configurações',
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Buscar:', searchQuery);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

  const pageTitle = pageTitles[pathname] || 'Dashboard';

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Botão Menu Mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Abrir menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
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
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
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
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
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
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              )}
            </button>

            {/* Notificações - Desktop apenas */}
            <button 
              className={clsx(
                'relative p-2 sm:p-2.5 text-gray-600 hover:text-[#ff6b35] hover:bg-orange-50 rounded-xl transition-all duration-200',
                'hidden md:block',
                isSearchOpen && 'md:hidden lg:block'
              )}
              title="Notificações"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b35] rounded-full ring-2 ring-white animate-pulse" />
            </button>

            {/* Ajuda - Desktop apenas */}
            <button 
              className={clsx(
                'p-2 sm:p-2.5 text-gray-600 hover:text-[#4a90e2] hover:bg-blue-50 rounded-xl transition-all duration-200',
                'hidden md:block',
                isSearchOpen && 'md:hidden lg:block'
              )}
              title="Ajuda"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>

            {/* Divider - Desktop apenas */}
            <div className={clsx(
              'w-px h-6 sm:h-8 bg-gray-200',
              'hidden md:block',
              isSearchOpen && 'md:hidden lg:block'
            )} />

            {/* Avatar */}
            <div className={clsx(
              'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#4a90e2] to-[#2563eb] flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-lg ring-2 ring-blue-100',
              isSearchOpen && 'hidden sm:flex'
            )}>
              U
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}