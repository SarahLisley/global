import { apiServer } from '../../../lib/api';

export type OrderDTO = {
  orderNumber: string;
  seller: string;
  total: number;
  status: 'faturado' | 'bloqueado' | 'liberado';
};

export async function fetchRecentOrders(page = 1, pageSize = 10): Promise<{ orders: OrderDTO[], total: number }> {
  const data = await apiServer<{ orders: OrderDTO[], total: number }>(`/orders/recent?page=${page}&pageSize=${pageSize}`);
  const orders = (data?.orders ?? []) as any[];
  const total = Number(data?.total ?? 0);

  return {
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      seller: o.seller,
      total: o.total,
      status: o.status,
    })),
    total
  };
}