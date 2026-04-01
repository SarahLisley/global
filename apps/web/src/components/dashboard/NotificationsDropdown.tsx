import clsx from 'clsx';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  onMarkAllAsRead: () => void;
}

export function NotificationsDropdown({ notifications, isOpen, setIsOpen, isSearchOpen, onMarkAllAsRead }: NotificationsDropdownProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'relative p-2 sm:p-2.5 text-gray-600 dark:text-zinc-400 hover:text-[#ff6b35] dark:hover:text-[#ff8c42] hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-200',
          'hidden md:block',
          isSearchOpen && 'md:hidden lg:block',
          isOpen && 'text-[#ff6b35] dark:text-[#ff8c42] bg-orange-50 dark:bg-orange-900/30'
        )}
        title="Notificações"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b35] rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-zinc-100">Notificações</h3>
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-[#4a90e2] hover:text-[#2563eb] font-medium transition-colors"
                title="Marcar todas como lidas"
              >
                Marcar todas como lidas
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 dark:text-zinc-500">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-300">Nenhuma notificação</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Você será notificado sobre novidades aqui.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={clsx(
                      "p-4 border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer",
                      !notification.read && "bg-blue-50/30 dark:bg-blue-900/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                        !notification.read ? "bg-[#ff6b35]" : "bg-gray-200 dark:bg-zinc-700"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          "text-sm font-medium truncate",
                          !notification.read ? "text-gray-900 dark:text-zinc-100" : "text-gray-600 dark:text-zinc-400"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                          {notification.description}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          {notification.timestamp ? new Date(notification.timestamp).toLocaleDateString('pt-BR') : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 text-center">
              <Link
                href="/dashboard/notificacoes"
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 dark:text-zinc-300 hover:text-[#4a90e2] dark:hover:text-blue-400 font-medium transition-colors block w-full"
              >
                Ver todas as notificações
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
