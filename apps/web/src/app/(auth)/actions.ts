'use server';

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
const MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === '1';

export async function loginAction(form: { email: string; password: string }) {
  try {
    if (MOCK) {
      const token = `mock-${Buffer.from(`${form.email}:${Date.now()}`).toString('base64')}`;
      (await cookies()).set('pgb_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60,
      });
      return { ok: true, redirectTo: '/dashboard' };
    }

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.message ?? `Falha no login (${res.status})` };
    }

    const data = (await res.json()) as { token: string; user: any };
    (await cookies()).set('pgb_session', data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60,
    });
    (await cookies()).set('pgb_user', Buffer.from(JSON.stringify(data.user)).toString('base64'), {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60,
    });

    return { ok: true, redirectTo: '/dashboard' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado no login' };
  }
}

export type RegisterInput = { cnpj?: string; name: string; email: string; password: string };

export async function registerAction(form: RegisterInput) {
  try {
    if (MOCK) {
      const token = `mock-${Buffer.from(`${form.email}:${Date.now()}`).toString('base64')}`;
      (await cookies()).set('pgb_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60,
      });
      return { ok: true, redirectTo: '/dashboard' };
    }

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.message ?? `Cadastro indisponível (${res.status})` };
    }

    return { ok: true, redirectTo: '/dashboard' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado no cadastro' };
  }
}