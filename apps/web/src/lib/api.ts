import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

// Configuração para permitir conexões internas com certificados autoassinados no server-side
if (typeof window === 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  try {
    const { Agent, setGlobalDispatcher } = require('undici');
    setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));
  } catch (e) {
    // Ignora silenciosamente se o undici não puder ser injetado (fallback p/ env)
  }
}

export const API_BASE = (typeof window === 'undefined' && rawApiBase.includes('globalh.ddns.net'))
  ? rawApiBase.replace(/https?:\/\/globalh\.ddns\.net/, 'http://127.0.0.1') // Alterado para HTTP
  : rawApiBase;

export const AUTH_ERROR_MSG = 'Sua sessão é inválida. Por favor, faça login novamente.';

export async function apiServer<T = any>(
  path: string,
  options?: RequestInit & { requireAuth?: boolean }
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options ?? {};

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> ?? {}),
  };

  if (requireAuth) {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Se o body é um objeto (não FormData), adiciona Content-Type
  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
    cache: fetchOptions.cache ?? 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `API ${res.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || message;
    } catch {
      if (text) message = text;
    }
    
    // Tratar erros específicos
    if (message.includes('Input buffers must have the same byte length') || 
        message.includes('JWT') || 
        message.includes('token') ||
        res.status === 401) {
      message = AUTH_ERROR_MSG;
    }
    
    if (res.status === 429) {
      message = 'Muitas requisições. Por favor, aguarde um momento.';
    }
    
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/**
 * Versão segura que retorna null em vez de lançar erro.
 * Útil para componentes que podem funcionar sem dados.
 */
export async function apiServerSafe<T = any>(
  path: string,
  options?: RequestInit & { requireAuth?: boolean }
): Promise<T | null> {
  try {
    return await apiServer<T>(path, options);
  } catch (err: any) {
    // Se for um erro de redirecionamento do Next.js, apenas repassa
    if (err?.digest?.includes('NEXT_REDIRECT')) throw err;

    // Se for erro de autenticação, redirecionamos automaticamente para o login com limpeza de sessão
    if (err?.message === 'NOT_AUTHENTICATED' || err?.message === AUTH_ERROR_MSG) {
      console.warn(`[Auth Auto-Redirect] Redirecionando devido a sessão inválida/ausente.`);
      redirect('/login?clean_session=1&reason=auth_error');
    }

    // Se for um AbortError (timeout proposital), não logamos como erro no console
    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      return null;
    }

    console.error(`[API Server Safe Error] path: ${path} | error:`, err?.message || err);
    return null;
  }
}
