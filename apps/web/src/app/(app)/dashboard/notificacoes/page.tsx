'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  ShoppingCart,
  RefreshCw,
  UserPlus,
  HardDrive,
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

/* ─── Icon map per notification type ─── */
const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  venda: { icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  sistema: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100' },
  cliente: { icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-100' },
  backup: { icon: HardDrive, color: 'text-slate-600', bg: 'bg-slate-100' },
  estoque: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  default: { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-100' },
};

function getIconConfig(title: string) {
  if (title.toLowerCase().includes('venda')) return iconMap.venda;
  if (title.toLowerCase().includes('sistema') || title.toLowerCase().includes('atualização')) return iconMap.sistema;
  if (title.toLowerCase().includes('cliente')) return iconMap.cliente;
  if (title.toLowerCase().includes('backup')) return iconMap.backup;
  if (title.toLowerCase().includes('estoque')) return iconMap.estoque;
  return iconMap.default;
}

export default function NotificationsPage() {
  const initialNotifications = [
    { id: 1, title: 'Nova venda realizada', description: 'Pedido #1234 aprovado', time: 'Há 5 min', read: false },
    { id: 2, title: 'Atualização do sistema', description: 'Versão 2.4.0 lançada', time: 'Há 1 hora', read: false },
    { id: 3, title: 'Novo cliente', description: 'Roberto Silva se cadastrou', time: 'Há 2 horas', read: true },
    { id: 4, title: 'Backup concluído', description: 'Backup diário realizado com sucesso', time: 'Ontem', read: true },
    { id: 5, title: 'Alerta de estoque', description: 'Produto X está com estoque baixo', time: 'Ontem', read: true },
  ];

  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const markAsRead = (id: number) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notificações</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-orange-500 text-white text-xs font-bold shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Visualize todo o histórico de notificações do sistema.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/10 active:translate-y-0"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-700">Tudo em dia!</p>
            <p className="text-sm text-slate-500 mt-1">Nenhuma notificação no momento.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {notifications.map((notification, index) => {
              const iconCfg = getIconConfig(notification.title);
              const IconComponent = iconCfg.icon;

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
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
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
                        iconCfg.bg,
                      )}
                    >
                      <IconComponent className={clsx('w-5 h-5', iconCfg.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={clsx(
                              'text-sm font-semibold truncate transition-colors',
                              !notification.read ? 'text-slate-900' : 'text-slate-700',
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                            {notification.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                            {notification.time}
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

      {/* Summary footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
        <Bell className="w-3.5 h-3.5" />
        <span>
          {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} ·{' '}
          {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
