'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export async function searchTicketsAction(form: {
  dateFrom?: string;
  dateTo?: string;
  status?: 'todos' | 'em_andamento' | 'finalizado';
  orderNumber?: string;
  invoiceNumber?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return { ok: false, message: 'Sem sessão', list: [] };

    const params = new URLSearchParams();
    if (form.dateFrom) params.set('dateFrom', form.dateFrom);
    if (form.dateTo) params.set('dateTo', form.dateTo);
    if (form.status && form.status !== 'todos') params.set('status', form.status);
    if (form.orderNumber) params.set('orderNumber', form.orderNumber);
    if (form.invoiceNumber) params.set('invoiceNumber', form.invoiceNumber);
    params.set('page', String(form.page ?? 1));
    params.set('pageSize', String(form.pageSize ?? 20));

    const url = `${API_BASE}/dashboard/sac/tickets?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    console.log('[searchTicketsAction] URL:', url, 'status:', res.status);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.error || `Falha na busca (${res.status})`, list: [] };
    }

    const data = await res.json();
    return { ok: true, list: data?.list ?? [], page: data?.page, pageSize: data?.pageSize, total: data?.total };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado na busca', list: [] };
  }
}

export async function createTicketAction(form: {
  subject: string;
  orderNumber?: string;
  invoiceNumber?: string;
}) {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return { ok: false, message: 'Sem sessão' };

    const res = await fetch(`${API_BASE}/dashboard/sac/tickets`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject: form.subject,
        orderNumber: form.orderNumber || undefined,
        invoiceNumber: form.invoiceNumber || undefined,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.error || `Falha ao criar ticket (${res.status})` };
    }

    const data = await res.json();
    revalidatePath('/dashboard/sac');
    return { ok: true, ticket: data?.ticket };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado ao criar ticket' };
  }
}

export async function addCommentAction(ticketId: string, content: string, type: 'message' | 'note' = 'message') {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return { ok: false, message: 'Sem sessão' };

    const res = await fetch(`${API_BASE}/dashboard/sac/tickets/${encodeURIComponent(ticketId)}/comments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, type }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.error || `Falha ao enviar comentário (${res.status})` };
    }

    const data = await res.json();
    revalidatePath(`/dashboard/sac/${ticketId}`);
    return { ok: true, comment: data?.comment };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado ao enviar comentário' };
  }
}

export async function fetchCommentsAction(ticketId: string) {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return { ok: false, message: 'Sem sessão', comments: [] };

    const res = await fetch(`${API_BASE}/dashboard/sac/tickets/${encodeURIComponent(ticketId)}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.error || `Falha ao buscar comentários (${res.status})`, comments: [] };
    }

    const data = await res.json();
    return { ok: true, comments: data?.comments ?? [] };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado', comments: [] };
  }
}

export async function editCommentAction(ticketId: string, commentId: string, content: string) {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return { ok: false, message: 'Sem sessão' };

    const res = await fetch(`${API_BASE}/dashboard/sac/tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.error || `Falha ao editar comentário (${res.status})` };
    }

    revalidatePath(`/dashboard/sac/${ticketId}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado ao editar comentário' };
  }
}

export async function deleteCommentAction(ticketId: string, commentId: string) {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return { ok: false, message: 'Sem sessão' };

    const res = await fetch(`${API_BASE}/dashboard/sac/tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.error || `Falha ao apagar comentário (${res.status})` };
    }

    revalidatePath(`/dashboard/sac/${ticketId}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado ao apagar comentário' };
  }
}