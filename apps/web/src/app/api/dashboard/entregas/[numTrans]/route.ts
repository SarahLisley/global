import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });

    const { pathname } = new URL(req.url);
    const numTrans = pathname.split('/').pop() || '';
    if (!numTrans) return NextResponse.json({ error: 'numTrans ausente' }, { status: 400 });

    const res = await fetch(`${API_BASE}/entregas/${encodeURIComponent(numTrans)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro inesperado' }, { status: 500 });
  }
}