import { apiServer } from '../../../lib/api';

export type DocDTO = {
  description: string;
  dueDate: string;
  docNumber: string;
  status: 'valido' | 'vencido' | 'proximo_vencer';
  url?: string;
};

export async function fetchDocsValidity(): Promise<DocDTO[]> {
  const data = await apiServer<{ docs: DocDTO[] }>('/docs/validity');
  return data?.docs ?? [];
}