'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  ShoppingCart,
  RefreshCw,
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
  FileText,
  CreditCard,
  Loader2,
} from 'lucide-react';

// Mapa de ícones por tipo de notificação
const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  sac: { icon: FileText, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50' },
  boleto: { icon: CreditCard, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-100 dark:bg-red-900/50' },
  pedido: { icon: ShoppingCart, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
  default: { icon: Bell, color: 'text-slate-500 dark:text-zinc-400', bg: 'bg-slate-100 dark:bg-zinc-800' },
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

type Notification = {
  id: string;
  type: 'sac' | 'boleto' | 'pedido';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Erro ao carregar notificações');
      const data = await res.json();

      // Carregar status de leitura do localStorage
      const readIds: string[] = JSON.parse(localStorage.getItem('readNotifications') || '[]');

      const mapped: Notification[] = (data.notifications || []).map((n: any) => ({
        ...n,
        read: readIds.includes(n.id),
      }));

      setNotifications(mapped);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    window.dispatchEvent(new Event('storage'));
  };

  const markAsRead = (id: string) => {
    const readIds: string[] = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('readNotifications', JSON.stringify(readIds));
    }
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Notificações</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-orange-500 text-white text-xs font-bold shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              Acompanhe eventos recentes de tickets, boletos e pedidos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:bg-blue-900/50 border border-blue-100 hover:border-blue-200 dark:border-blue-800/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/10 active:translate-y-0"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">Carregando notificações...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-base font-medium text-slate-700 dark:text-zinc-300">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-3 text-sm text-blue-600 dark:text-blue-500 hover:underline font-medium"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Notification List */}
      {!loading && !error && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-base font-medium text-slate-700 dark:text-zinc-300">Tudo em dia!</p>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Nenhuma notificação no momento.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/50/80">
              {notifications.map((notification, index) => {
                const cfg = typeConfig[notification.type] || typeConfig.default;
                const IconComponent = cfg.icon;

                return (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className={clsx(
                      'group relative p-5 transition-all duration-200 cursor-pointer',
                      !notification.read
                        ? 'bg-gradient-to-r from-blue-50/60 to-transparent hover:from-blue-50 hover:to-blue-50/30'
                        : 'hover:bg-slate-50/80',
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Unread indicator bar */}
                    {!notification.read && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-orange-500 to-orange-400" />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                          cfg.bg,
                        )}
                      >
                        <IconComponent className={clsx('w-5 h-5', cfg.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={clsx(
                                'text-sm font-semibold truncate transition-colors',
                                !notification.read ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-700 dark:text-zinc-300',
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                              {notification.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                            <span className="text-xs text-slate-400 dark:text-zinc-500 whitespace-nowrap font-medium">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary footer */}
      {!loading && !error && notifications.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-zinc-500 pt-2">
          <Bell className="w-3.5 h-3.5" />
          <span>
            {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} ·{' '}
            {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
