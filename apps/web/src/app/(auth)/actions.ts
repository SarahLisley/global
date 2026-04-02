'use server';

import { cookies } from 'next/headers';

// Comunicação Server-to-Server, usamos 127.0.0.1 direto caso haja NAT loopback.
// Isso evita que o Next.js fique "rodando infinito" tentando achar a si próprio no roteador externo.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Permite conectar no HTTPS interno (self-signed)

// Tenta usar uma URL interna primeiro se fornecida, senão forçamos um mapeamento seguro caso seja o ddns global
const rawApiBase = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';
const API_BASE = rawApiBase.includes('globalh.ddns.net') 
  ? 'https://127.0.0.1:4001' // Resolve o IP localmente para Server Actions não sofrerem de NAT Loopback
  : rawApiBase;

const MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === '1';

export async function loginAction(form: { email: string; password: string; remember?: boolean }) {
  try {
    const maxAge = 60 * 60 * 2; // 2 hours

    if (MOCK) {
      const token = `mock-${Buffer.from(`${form.email}:${Date.now()}`).toString('base64')}`;
      (await cookies()).set('pgb_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge,
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
      maxAge,
    });
    (await cookies()).set('pgb_user', Buffer.from(JSON.stringify(data.user)).toString('base64'), {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge,
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
      return { ok: true, needsVerification: true, message: 'Código enviado (mock)' };
    }

    console.log('[REGISTER] Calling API:', `${API_BASE}/auth/register`, JSON.stringify(form));
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
      cache: 'no-store',
    });

    console.log('[REGISTER] API response status:', res.status);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`[REGISTER] API Error ${res.status}:`, JSON.stringify(err));
      return { ok: false, needsVerification: false, message: err?.message ?? `Cadastro indisponível (HTTP ${res.status})` };
    }

    const data = await res.json().catch(() => ({}));
    console.log('[REGISTER] API success body:', JSON.stringify(data));
    return { 
      ok: true, 
      needsVerification: true, 
      email: form.email,
      message: 'Código de verificação enviado para seu e-mail.' 
    };
  } catch (e: any) {
    console.log('[REGISTER] Error:', e?.message);
    return { ok: false, needsVerification: false, message: e?.message ?? 'Erro inesperado no cadastro' };
  }
}

export async function verifyRegisterAction(form: { email: string; code: string }) {
  try {
    if (MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { ok: true, message: 'Cadastro realizado com sucesso!' };
    }

    const res = await fetch(`${API_BASE}/auth/verify-register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.message ?? `Erro na verificação (${res.status})` };
    }

    return { ok: true, message: 'Cadastro realizado com sucesso!' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado' };
  }
}

export async function resendCodeAction(form: { email: string }) {
  try {
    if (MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { ok: true, message: 'Novo código enviado.' };
    }

    const res = await fetch(`${API_BASE}/auth/resend-code`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.message ?? `Erro ao reenviar (${res.status})` };
    }

    return { ok: true, message: 'Novo código enviado para seu e-mail.' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado' };
  }
}

export async function forgotPasswordAction(form: { email: string }) {
  try {
    if (MOCK) {
      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { ok: true, message: 'Se o e-mail existir, você receberá um link de recuperação.' };
    }

    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
      cache: 'no-store',
    });

    if (!res.ok) {
      // Por segurança, geralmente não devemos informar se o e-mail não existe, mas aqui vamos retornar a mensagem do back se houver
      // ou uma genérica de sucesso
      const err = await res.json().catch(() => ({}));
      // Se for 404 ou erro, podemos decidir como tratar. Por enquanto retornamos ok para não vazar info, ou o erro se for crítico.
      // Mas para UX melhor em dev:
      if (res.status >= 500) {
        return { ok: false, message: 'Erro no servidor. Tente novamente mais tarde.' };
      }
    }

    return { ok: true, message: 'Se o e-mail existir, você receberá um link de recuperação.' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado' };
  }
}

export async function resetPasswordAction(form: { token: string; password?: string }) {
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err?.message ?? `Falha ao redefinir senha (${res.status})` };
    }

    return { ok: true, message: 'Senha redefinida com sucesso!' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erro inesperado' };
  }
}