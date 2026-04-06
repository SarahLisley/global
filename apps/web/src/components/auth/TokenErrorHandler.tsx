'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function TokenErrorHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const reason = searchParams.get('reason');
    
    if (reason === 'invalid_token') {
      // Limpar cookie no cliente
      document.cookie = 'pgb_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Mostrar mensagem amigável
      console.warn('Sua sessão expirou ou é inválida. Por favor, faça login novamente.');
      
      // Redirecionar para login sem o parâmetro
      const url = new URL(window.location.href);
      url.searchParams.delete('reason');
      url.pathname = '/login';
      router.replace(url.toString());
    }
  }, [searchParams, router]);

  return null;
}
