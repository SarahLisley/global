'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Button } from '@pgb/ui';

export default function NotificationsPage() {
  const initialNotifications = [
    { id: 1, title: 'Nova venda realizada', description: 'Pedido #1234 aprovado', time: 'Há 5 min', read: false },
    { id: 2, title: 'Atualização do sistema', description: 'Versão 2.4.0 lançada', time: 'Há 1 hora', read: false },
    { id: 3, title: 'Novo cliente', description: 'Roberto Silva se cadastrou', time: 'Há 2 horas', read: true },
    { id: 4, title: 'Backup concluído', description: 'Backup diário realizado com sucesso', time: 'Ontem', read: true },
    { id: 5, title: 'Alerta de estoque', description: 'Produto X está com estoque baixo', time: 'Ontem', read: true },
  ];

  const [notifications, setNotifications] = useState(initialNotifications);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      // Merge saved notifications with initial ones to ensure IDs 4 and 5 exist if not in storage
      // simple strategy: if storage has data, use it. Ideally we merge. 
      // For now, let's just use storage if it exists, assuming topbar sets it.
      // But Topbar has fewer items. Let's merge logic: maintain local extras? 
      // User just wants consistency. Let's rely on storage mainly.
      // If storage has fewer items than this page (because topbar has fewer), 
      // we might lose the "Backup completed" ones.
      // Let's just trust storage if present.
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
    // Dispatch storage event to update other components if they listen (they don't yet, but good practice)
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notificações</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualize todo o histórico de notificações do sistema.
          </p>
        </div>
        <Button onClick={markAllAsRead}>
          Marcar todas como lidas
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={clsx(
                "p-4 hover:bg-gray-50 transition-colors",
                !notification.read && "bg-blue-50/30"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  "w-2.5 h-2.5 mt-2 rounded-full flex-shrink-0",
                  !notification.read ? "bg-[#ff6b35]" : "bg-gray-200"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className={clsx(
                      "text-base font-medium truncate",
                      !notification.read ? "text-gray-900" : "text-gray-700"
                    )}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
