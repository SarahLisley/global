import { cookies } from 'next/headers';

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

// Tratamento de NAT Loopback: Se estamos no servidor e a URL aponta para o domínio global,
// redirecionamos para o IP local (127.0.0.1) para evitar bloqueio do roteador.
export const API_BASE = (typeof window === 'undefined' && rawApiBase.includes('globalh.ddns.net'))
  ? rawApiBase.replace(/https?:\/\/globalh\.ddns\.net/, 'https://127.0.0.1')
  : rawApiBase;


/**
 * Helper centralizado para chamadas server-side à API.
 * Extrai o token da sessão automaticamente e trata erros de forma consistente.
 */
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
  } catch {
    return null;
  }
}
