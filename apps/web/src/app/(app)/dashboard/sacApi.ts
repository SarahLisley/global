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
    const res = await fetch(`${API_BASE}/dashboard/sac/series`, {
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
    const res = await fetch(`${API_BASE}/dashboard/sac/tickets?status=pendente&pageSize=5`, {
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
