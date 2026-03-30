'use server';

import { apiServer } from '../../../../lib/api';

export async function fetchTicketDetail(id: string) {
  try {
    const data = await apiServer<{ ticket: any; timeline?: any[]; comments?: any[] }>(`/sac/tickets/${encodeURIComponent(id)}`);
    return { ok: true, ticket: data.ticket, timeline: data.timeline ?? [], comments: data.comments ?? [] };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro inesperado');
    return { ok: false, message };
  }
}