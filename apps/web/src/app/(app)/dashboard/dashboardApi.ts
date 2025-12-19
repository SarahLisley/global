import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export type RawKpis = {
  codcli: number;
  ordersLast30d: { totalAmount: number; totalOrders: number };
  receivablesOpen: { totalAmount: number };
  deliveries: { doneLast30d: number; doneToday: number };
};

export async function fetchKpis(): Promise<RawKpis> {
  const token = (await cookies()).get('pgb_session')?.value;
  if (!token) throw new Error('Sem token de sessão');

  const res = await fetch(`${API_BASE}/dashboard/kpis`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Falha ao buscar KPIs (${res.status})`);
  }
  return res.json();
}

export type KpiCard = {
  delta: number; label: string; value: string | number 
};

export function mapKpisToCards(raw: RawKpis): KpiCard[] {
  const fmtCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  return [
    {
        label: 'Valor atendido (30d)', value: fmtCurrency.format(raw.ordersLast30d.totalAmount || 0),
        delta: 0
    },
    {
        label: 'Qtde pedidos (30d)', value: raw.ordersLast30d.totalOrders || 0,
        delta: 0
    },
    {
        label: 'Títulos em aberto (R$)', value: fmtCurrency.format(raw.receivablesOpen.totalAmount || 0),
        delta: 0
    },
    {
        label: 'Entregas hoje', value: raw.deliveries.doneToday || 0,
        delta: 0
    },
  ];
}