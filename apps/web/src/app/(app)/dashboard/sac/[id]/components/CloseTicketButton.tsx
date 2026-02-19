'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { closeTicketAction } from '../../actions';

export function CloseTicketButton({ ticketId, isDisabled }: { ticketId: string; isDisabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isDisabled) return null;

  const handleClose = () => {
    if (!window.confirm('Tem certeza que deseja finalizar este ticket? Essa ação não pode ser desfeita.')) return;

    startTransition(async () => {
      const res = await closeTicketAction(ticketId);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <button
      onClick={handleClose}
      disabled={isPending}
      className="px-4 py-2 bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
      title="Marcar ticket como resolvido"
    >
      {isPending ? (
        <>
          <svg className="animate-spin h-4 w-4 text-rose-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Finalizando...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Finalizar Ticket
        </>
      )}
    </button>
  );
}
