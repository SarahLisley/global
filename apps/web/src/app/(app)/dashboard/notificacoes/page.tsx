'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';

import {
  type ClientNotification,
  type NotificationsResponse,
  emitNotificationsRead,
  listenNotificationsRead,
  markNotificationsAsRead,
} from '../../../../lib/notifications';

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
  if (diffMin < 60) return `Ha ${diffMin} min`;
  if (diffHours < 24) return `Ha ${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Ha ${diffDays} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const savingIdSet = useMemo(() => new Set(savingIds), [savingIds]);

  const applyReadState = useCallback((ids: string[]) => {
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
  }, []);

  const updateSavingIds = useCallback((ids: string[], shouldAdd: boolean) => {
    setSavingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (shouldAdd) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return [...next];
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Erro ao carregar notificacoes');
      }

      const data = (await response.json()) as NotificationsResponse;
      setNotifications(data.notifications || []);
    } catch (error: any) {
      setFetchError(error.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (ids: string[], options?: { all?: boolean }) => {
    const unreadIds = ids.filter((id) => notifications.some((notification) => notification.id === id && !notification.read));
    if (unreadIds.length === 0) {
      return;
    }

    setActionError(null);
    updateSavingIds(unreadIds, true);
    if (options?.all) {
      setIsSavingAll(true);
    }

    try {
      const updatedIds = await markNotificationsAsRead(unreadIds);
      applyReadState(updatedIds);
      emitNotificationsRead(updatedIds);
    } catch (error: any) {
      setActionError(error.message || 'Erro ao atualizar notificacoes');
    } finally {
      updateSavingIds(unreadIds, false);
      if (options?.all) {
        setIsSavingAll(false);
      }
    }
  }, [applyReadState, notifications, updateSavingIds]);

  const markAllAsRead = useCallback(async () => {
    await markAsRead(
      notifications.map((notification) => notification.id),
      { all: true }
    );
  }, [markAsRead, notifications]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    return listenNotificationsRead((ids) => {
      applyReadState(ids);
    });
  }, [applyReadState]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Notificacoes</h1>
              {unreadCount > 0 && (
                <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
              Acompanhe eventos recentes de tickets, boletos e pedidos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchNotifications()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Atualizar
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              disabled={isSavingAll}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-100 hover:shadow-md hover:shadow-blue-500/10 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 dark:border-blue-800/50 dark:bg-blue-900/50 dark:text-blue-500"
            >
              {isSavingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              {isSavingAll ? 'Salvando...' : 'Marcar todas como lidas'}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-500 dark:text-zinc-400">Carregando notificacoes...</p>
        </div>
      )}

      {fetchError && !loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-base font-medium text-slate-700 dark:text-zinc-300">{fetchError}</p>
          <button
            onClick={() => void fetchNotifications()}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-500"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !fetchError && actionError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </div>
      )}

      {!loading && !fetchError && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800">
                <Sparkles className="h-8 w-8 text-slate-400 dark:text-zinc-500" />
              </div>
              <p className="text-base font-medium text-slate-700 dark:text-zinc-300">Tudo em dia!</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Nenhuma notificacao no momento.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {notifications.map((notification, index) => {
                const config = typeConfig[notification.type] || typeConfig.default;
                const IconComponent = config.icon;
                const isSaving = savingIdSet.has(notification.id);

                return (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read && !isSaving) {
                        void markAsRead([notification.id]);
                      }
                    }}
                    className={clsx(
                      'group relative cursor-pointer p-5 transition-all duration-200',
                      !notification.read
                        ? 'bg-gradient-to-r from-blue-50/60 to-transparent hover:from-blue-50 hover:to-blue-50/30'
                        : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/70',
                      isSaving && 'opacity-70'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {!notification.read && (
                      <div className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-orange-500 to-orange-400" />
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={clsx(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
                          config.bg
                        )}
                      >
                        <IconComponent className={clsx('h-5 w-5', config.color)} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={clsx(
                                'truncate text-sm font-semibold transition-colors',
                                !notification.read ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-700 dark:text-zinc-300'
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-zinc-400">
                              {notification.description}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                            {isSaving ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 dark:text-zinc-500" />
                                <span className="whitespace-nowrap text-xs font-medium text-slate-400 dark:text-zinc-500">
                                  Salvando...
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                                <span className="whitespace-nowrap text-xs font-medium text-slate-400 dark:text-zinc-500">
                                  {formatTime(notification.timestamp)}
                                </span>
                              </>
                            )}
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

      {!loading && !fetchError && notifications.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400 dark:text-zinc-500">
          <Bell className="h-3.5 w-3.5" />
          <span>
            {notifications.length} notificacao{notifications.length !== 1 ? 'oes' : ''} · {unreadCount} nao lida{unreadCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
