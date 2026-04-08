'use server';

import { cookies } from 'next/headers';


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Permite conectar no HTTPS interno (self-signed)

const rawApiBase = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:4001';
const API_BASE = rawApiBase.includes('globalh.ddns.net') 
  ? 'https://127.0.0.1:4001' // API roda em HTTPS
  : rawApiBase;

const MOCK = false; // Desativar mock para usar a API real

export async function loginAction(form: { email: string; password: string; remember?: boolean }) {
  console.log('[LOGIN] MOCK mode:', MOCK);
  console.log('[LOGIN] Form data:', { email: form.email, passwordLength: form.password.length });
  console.log('[LOGIN] API_BASE:', API_BASE);
  console.log('[LOGIN] NODE_ENV:', process.env.NODE_ENV);
  
  try {
    const maxAge = 60 * 60 * 2; // 2 hours

    if (MOCK) {
      console.log('[LOGIN] Using mock authentication');
      // Create a mock JWT token with proper structure
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        name: form.email.split('@')[0],
        sub: form.email,
        email: form.email,
        codcli: 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours
      })).toString('base64url');
      const signature = Buffer.from('mock-signature').toString('base64url');
      const token = `${header}.${payload}.${signature}`;
      
      (await cookies()).set('pgb_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge,
      });
      return { ok: true, redirectTo: '/dashboard' };
    }

    const loginUrl = `${API_BASE}/auth/login`;
    console.log('[LOGIN] Making API call to:', loginUrl);
    console.log('[LOGIN] TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      console.error('[LOGIN] Timeout - request aborted');
    }, 10000); // 10 segundos timeout

    let res;
    try {
      res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    console.log('[LOGIN] Response received - status:', res.status, 'statusText:', res.statusText);

    if (!res.ok) {
      let err: any = {};
      try {
        err = await res.json();
      } catch {
        err = { errorText: await res.text() };
      }
      const errorMsg = err?.message ?? `Falha no login (${res.status})`;
      console.error('[LOGIN] Error response:', errorMsg);
      return { ok: false, message: errorMsg };
    }

    let data;
    try {
      data = (await res.json()) as { token: string; user: any };
    } catch (parseErr) {
      console.error('[LOGIN] Failed to parse response:', parseErr);
      return { ok: false, message: 'Resposta inválida do servidor' };
    }

    console.log('[LOGIN] Success! Token received');
    
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
    const errorDetails = {
      name: e?.name,
      message: e?.message,
      code: e?.code,
      stack: e?.stack?.split('\n')[0],
    };
    console.error('[LOGIN] Catch error:', errorDetails);
    
    // Diagnóstico melhorado
    if (e?.name === 'AbortError') {
      return { ok: false, message: 'Timeout ao conectar na API (10s) - verifique se a API está rodando' };
    }
    if (e?.code === 'ECONNREFUSED' || e?.message?.includes('ECONNREFUSED')) {
      return { ok: false, message: 'API indisponível (ECONNREFUSED) - o servidor está offline?' };
    }
    if (e?.code === 'ENOTFOUND' || e?.message?.includes('getaddrinfo') || e?.message?.includes('ENOTFOUND')) {
      return { ok: false, message: 'Erro de DNS - não conseguir resolver o domínio da API' };
    }
    if (e?.message?.includes('listener indicated an asynchronous response')) {
      return { ok: false, message: 'Erro de comunicação do navegador - desabilite extensões e tente novamente' };
    }
    
    return { ok: false, message: e?.message ?? 'Erro inesperado na conexão' };
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
      return { ok: false, needsVerification: false, message: err?.message ?? `ERRO-BRAVO-X-123 (HTTP ${res.status})` };
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
      const err = await res.json().catch(() => ({}));
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