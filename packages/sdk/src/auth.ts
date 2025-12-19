import { SessionSchema } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function login(email: string, password: string) {
  await wait(500);
  if (!email || !password) throw new Error('Credenciais inválidas');

  const data = {
    token: 'mock-token-123',
    user: { id: 'u_1', name: 'Admin', email },
  };

  return SessionSchema.parse(data);
}

export async function register(data: { cnpj?: string; name: string; email: string; password: string }) {
  await wait(700);
  if (!data.name || !data.email || !data.password) throw new Error('Dados inválidos');

  const res = {
    token: 'mock-token-123',
    user: { id: 'u_2', name: data.name, email: data.email },
  };

  return SessionSchema.parse(res);
}