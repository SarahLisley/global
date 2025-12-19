'use server';

import { cookies } from 'next/headers';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export async function fetchTicketDetail(id: string) {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return { ok: false, message: 'Sem sessão' };
    const res = await fetch(`${API_BASE}/dashboard/sac/tickets/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.error || `Falha ao obter ticket (${res.status})` };
    }
    const data = await res.json();
    return { ok: true, ticket: data.ticket, timeline: data.timeline ?? [] };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado' };
  }
}