'use server';

import { revalidatePath } from 'next/cache';
import { apiServer } from '../../../../lib/api';

export async function createTicketAction(form: {
  subject: string;
  orderNumber?: string;
  invoiceNumber?: string;
}) {
  try {
    const data = await apiServer('/sac/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: form.subject,
        orderNumber: form.orderNumber || undefined,
        invoiceNumber: form.invoiceNumber || undefined,
      }),
    });
    revalidatePath('/dashboard/sac');
    return { ok: true, ticket: data?.ticket };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro inesperado ao criar ticket');
    return { ok: false, message };
  }
}

export async function addCommentAction(
  ticketId: string,
  content: string,
  type: 'message' | 'note' = 'message',
  isPublic: boolean = false,
  attachment?: { filename: string; path: string }
) {
  try {
    const data = await apiServer(`/sac/tickets/${encodeURIComponent(ticketId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, type, isPublic, attachment }),
    });
    revalidatePath(`/dashboard/sac/${ticketId}`);
    return { ok: true, comment: data?.comment };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro inesperado ao enviar comentário');
    return { ok: false, message };
  }
}

export async function fetchCommentsAction(ticketId: string) {
  try {
    const data = await apiServer(`/sac/tickets/${encodeURIComponent(ticketId)}/comments`);
    return { ok: true, comments: data?.comments ?? [] };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro inesperado');
    return { ok: false, message, comments: [] };
  }
}

export async function editCommentAction(ticketId: string, commentId: string, content: string) {
  try {
    await apiServer(`/sac/tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    revalidatePath(`/dashboard/sac/${ticketId}`);
    return { ok: true };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro inesperado ao editar comentário');
    return { ok: false, message };
  }
}

export async function deleteCommentAction(ticketId: string, commentId: string) {
  try {
    await apiServer(`/sac/tickets/${encodeURIComponent(ticketId)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
    });
    revalidatePath(`/dashboard/sac/${ticketId}`);
    return { ok: true };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro inesperado ao apagar comentário');
    return { ok: false, message };
  }
}

export async function closeTicketAction(ticketId: string) {
  try {
    await apiServer(`/sac/tickets/${encodeURIComponent(ticketId)}/close`, {
      method: 'PUT',
    });
    revalidatePath(`/dashboard/sac/${ticketId}`);
    return { ok: true };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro inesperado ao finalizar ticket');
    return { ok: false, message };
  }
}

export async function simulateWinthorAction(ticketId: string, attachment?: { filename: string; path: string }) {
  try {
    const data = await apiServer(`/sac/tickets/${encodeURIComponent(ticketId)}/simulate-winthor`, {
      method: 'POST',
      body: JSON.stringify({ attachment }),
    });
    revalidatePath(`/dashboard/sac/${ticketId}`);
    return { ok: true, comment: data.comment };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro ao simular');
    return { ok: false, message };
  }
}

export async function uploadAttachmentAction(ticketId: string, formData: FormData) {
  try {
    const data = await apiServer(`/sac/tickets/${encodeURIComponent(ticketId)}/attachments`, {
      method: 'POST',
      body: formData,
    });
    return { ok: true, data };
  } catch (e: any) {
    const message = e?.message === 'NOT_AUTHENTICATED' ? 'Sem sessão' : (e?.message ?? 'Erro inesperado no upload');
    return { ok: false, message };
  }
}
