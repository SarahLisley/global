import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { API_BASE } from '../../../../lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      let err: any = null;
      try { err = await res.json(); } catch { err = await res.text(); }
      return NextResponse.json(
        typeof err === 'string' ? { error: err } : err || { error: 'Login falhou' },
        { status: res.status }
      );
    }

    const data = await res.json(); 
    const token = data?.token;
    if (!token) {
      return NextResponse.json({ error: 'Token ausente na resposta do backend' }, { status: 502 });
    }

    (await
          cookies()).set('pgb_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: Number(data?.expiresIn ?? 2 * 60 * 60),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro de rede' }, { status: 530 });
  }
}