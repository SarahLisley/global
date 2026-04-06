import { apiServerSafe } from '../../../lib/api';

export type RawKpis = {
  codcli: number;
  ordersLast30d: { totalAmount: number; totalOrders: number };
  receivablesOpen: { totalAmount: number };
  deliveries: { doneLast30d: number; doneToday: number };
};

export async function fetchKpis(): Promise<RawKpis> {
  const data = await apiServerSafe<RawKpis>('/dashboard/kpis');
  return data || {
    codcli: 0,
    ordersLast30d: { totalAmount: 0, totalOrders: 0 },
    receivablesOpen: { totalAmount: 0 },
    deliveries: { doneLast30d: 0, doneToday: 0 }
  };
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