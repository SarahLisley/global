import { apiServerSafe } from '../../../lib/api';

export type DocDTO = {
  description: string;
  dueDate: string;
  docNumber: string;
  status: 'valido' | 'vencido' | 'proximo_vencer';
  url?: string;
};

// Função streaming para carregamento progressivo
export async function fetchDocsValidityStream(): Promise<DocDTO[]> {
  const data = await apiServerSafe<{ docs: DocDTO[] }>('/docs/validity', {
    cache: 'force-cache',
    next: { revalidate: 120 }
  });
  return data?.docs ?? [];
}

// Função ultra rápida usando nova rota
export async function fetchDocsValidityUltraFast(): Promise<DocDTO[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout (aumentado para evitar abort precoce)

  try {
    const data = await apiServerSafe<{ docs: DocDTO[] }>('/docs/validity-fast', {
      signal: controller.signal,
      cache: 'force-cache',
      next: { revalidate: 300 } // 5 minutos cache
    });
    return data?.docs ?? [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Timeout ultra rápido - tentando versão normal');
      return fetchDocsValidityFast(); // Fallback para versão normal
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
export async function fetchDocsValidityFast(): Promise<DocDTO[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const data = await apiServerSafe<{ docs: DocDTO[] }>('/docs/validity', {
      signal: controller.signal,
      cache: 'no-store'
    });
    return data?.docs ?? [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Timeout na busca de documentos - retornando vazio');
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
