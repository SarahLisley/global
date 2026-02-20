import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

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

export async function fetchSacSeries(): Promise<SacSeriesData> {
  const token = (await cookies()).get('pgb_session')?.value;
  if (!token) {
    // Return empty state if no token
    return {
      labels: [],
      datasets: [{
        label: 'Sem sessão',
        data: [],
        borderColor: '#94a3b8',
        backgroundColor: '#cbd5e1'
      }]
    };
  }

  try {
    const res = await fetch(`${API_BASE}/sac/series`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch SAC series', res.status);
      return {
        labels: [],
        datasets: [{
          label: `Erro ${res.status}`,
          data: [],
          borderColor: '#ef4444',
          backgroundColor: '#fca5a5'
        }]
      };
    }

    const data = await res.json();
    // Garantir que as cores existam se a API não mandar
    return {
      ...data,
      datasets: data.datasets.map((d: any) => ({
        ...d,
        borderColor: d.borderColor || '#3b82f6',
        backgroundColor: d.backgroundColor || '#93c5fd',
      }))
    };
  } catch (error) {
    console.error('Error fetching SAC series', error);
    return {
      labels: [],
      datasets: [{
        label: 'Erro de conexão',
        data: [],
        borderColor: '#ef4444',
        backgroundColor: '#fca5a5'
      }]
    };
  }
}

export type TicketSeries = {
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
  const token = (await cookies()).get('pgb_session')?.value;
  if (!token) return { list: [], total: 0, page: 1 };

  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.pageSize) query.append('pageSize', params.pageSize);
  if (params.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params.dateTo) query.append('dateTo', params.dateTo);
  if (params.status && params.status !== 'todos') query.append('status', params.status);
  if (params.orderNumber) query.append('orderNumber', params.orderNumber);
  if (params.invoiceNumber) query.append('invoiceNumber', params.invoiceNumber);

  try {
    const res = await fetch(`${API_BASE}/sac/tickets?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch tickets:', res.status);
      return { list: [], total: 0, page: 1 };
    }

    const data = await res.json();
    return {
      list: data.list || [],
      total: data.total || 0,
      page: Number(params.page || 1),
    };
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return { list: [], total: 0, page: 1 };
  }
}

export type PendingTicket = {
  id: string;
  subject: string;
  status: 'pendente' | 'em_andamento';
  openedAt: string;
};

export async function fetchPendingTickets(): Promise<PendingTicket[]> {
  const token = (await cookies()).get('pgb_session')?.value;
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE}/sac/tickets?status=em_andamento&pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.list ?? []).slice(0, 5).map((t: any) => ({
      id: t.id,
      subject: t.subject || 'Sem assunto',
      status: t.status,
      openedAt: t.openedAt,
    }));
  } catch {
    return [];
  }
}
