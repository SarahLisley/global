import { apiServerSafe } from '../../../lib/api';

export type SacSeriesData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }>;
};

const EMPTY_SERIES: SacSeriesData = {
  labels: [],
  datasets: [{
    label: 'Sem dados',
    data: [],
    borderColor: '#94a3b8',
    backgroundColor: '#cbd5e1'
  }]
};

export async function fetchSacSeries(): Promise<SacSeriesData> {
  const data = await apiServerSafe<SacSeriesData>('/sac/series');
  if (!data) return EMPTY_SERIES;

  return {
    ...data,
    datasets: data.datasets.map((d: any) => ({
      ...d,
      borderColor: d.borderColor || '#3b82f6',
      backgroundColor: d.backgroundColor || '#93c5fd',
    }))
  };
}

export type TicketListParams = {
  page?: string;
  pageSize?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  orderNumber?: string;
  invoiceNumber?: string;
};

export type TicketListItem = {
  id: string;
  openedAt: string;
  closedAt?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  subject: string;
  status: 'em_andamento' | 'finalizado';
};

export type TicketListResponse = {
  list: TicketListItem[];
  total: number;
  page: number;
};

export async function fetchTickets(params: TicketListParams): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.pageSize) query.append('pageSize', params.pageSize);
  if (params.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params.dateTo) query.append('dateTo', params.dateTo);
  if (params.status && params.status !== 'todos') query.append('status', params.status);
  if (params.orderNumber) query.append('orderNumber', params.orderNumber);
  if (params.invoiceNumber) query.append('invoiceNumber', params.invoiceNumber);

  const data = await apiServerSafe<{ list: TicketListItem[]; total: number }>(`/sac/tickets?${query.toString()}`);
  if (!data) return { list: [], total: 0, page: 1 };

  return {
    list: data.list || [],
    total: data.total || 0,
    page: Number(params.page || 1),
  };
}

export type PendingTicket = {
  id: string;
  subject: string;
  status: 'pendente' | 'em_andamento';
  openedAt: string;
};

export async function fetchPendingTickets(): Promise<PendingTicket[]> {
  const data = await apiServerSafe<{ list: any[] }>('/sac/tickets?status=em_andamento&pageSize=5');
  if (!data) return [];

  return (data.list ?? []).slice(0, 5).map((t: any) => ({
    id: t.id,
    subject: t.subject || 'Sem assunto',
    status: t.status,
    openedAt: t.openedAt,
  }));
}

