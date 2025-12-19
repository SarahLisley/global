import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export type DocDTO = {
  description: string;
  dueDate: string;
  docNumber: string;
  status: 'valido' | 'vencido' | 'proximo_vencer';
};

export async function fetchDocsValidity(): Promise<DocDTO[]> {
  const token = (await cookies()).get('pgb_session')?.value;
  if (!token) throw new Error('Sem token de sessão');

  const res = await fetch(`${API_BASE}/dashboard/docs/validity`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Falha ao buscar documentos (${res.status})`);
  }
  const data = await res.json();
  return (data?.docs ?? []) as DocDTO[];
}