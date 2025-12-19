import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export type OrderDTO = {
  orderNumber: string;
  seller: string;
  total: number;
  status: 'faturado' | 'bloqueado' | 'liberado';
};

export async function fetchRecentOrders(): Promise<OrderDTO[]> {
  const token = (await cookies()).get('pgb_session')?.value;
  if (!token) throw new Error('Sem token de sessão');

  const res = await fetch(`${API_BASE}/dashboard/orders/recent`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Falha ao buscar pedidos (${res.status})`);
  }
  const data = await res.json();
  const orders = (data?.orders ?? []) as any[];
  return orders.map((o) => ({
    orderNumber: o.orderNumber,
    seller: o.seller,
    total: o.total,
    status: o.status,
  }));
}