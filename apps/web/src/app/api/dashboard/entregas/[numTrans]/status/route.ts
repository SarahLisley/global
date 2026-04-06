import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { API_BASE } from '@lib/api';

export async function PUT(req: Request) {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });

    const { pathname } = new URL(req.url);
    const numTrans = pathname.split('/').slice(-2, -1)[0] || '';
    if (!numTrans) return NextResponse.json({ error: 'numTrans ausente' }, { status: 400 });

    const body = await req.json();

    const res = await fetch(`${API_BASE}/entregas/${encodeURIComponent(numTrans)}/status`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro inesperado' }, { status: 500 });
  }
}
