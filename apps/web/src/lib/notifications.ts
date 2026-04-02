export type ClientNotification = {
  id: string;
  type: 'sac' | 'boleto' | 'pedido';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  meta?: Record<string, unknown>;
};

export type NotificationsResponse = {
  notifications: ClientNotification[];
  total: number;
};

export type NotificationsReadDetail = {
  ids: string[];
};

export const NOTIFICATIONS_READ_EVENT = 'pgb:notifications-read';

function normalizeIds(ids: string[]) {
  return [...new Set(ids.map((id) => `${id}`.trim()).filter(Boolean))];
}

export async function markNotificationsAsRead(ids: string[]) {
  const normalizedIds = normalizeIds(ids);
  if (normalizedIds.length === 0) {
    return [];
  }

  const response = await fetch('/api/notifications/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: normalizedIds }),
  });

  if (!response.ok) {
    throw new Error('Falha ao marcar notificacoes como lidas');
  }

  return normalizedIds;
}

export function emitNotificationsRead(ids: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedIds = normalizeIds(ids);
  if (normalizedIds.length === 0) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<NotificationsReadDetail>(NOTIFICATIONS_READ_EVENT, {
      detail: { ids: normalizedIds },
    })
  );
}

export function listenNotificationsRead(listener: (ids: string[]) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<NotificationsReadDetail>;
    listener(customEvent.detail?.ids ?? []);
  };

  window.addEventListener(NOTIFICATIONS_READ_EVENT, handleEvent as EventListener);

  return () => {
    window.removeEventListener(NOTIFICATIONS_READ_EVENT, handleEvent as EventListener);
  };
}
