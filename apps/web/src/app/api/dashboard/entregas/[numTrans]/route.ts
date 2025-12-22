import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export async function GET(_req: Request, { params }: { params: { numTrans: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pgb_session')?.value;
    if (!token) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });

    const res = await fetch(`${API_BASE}/dashboard/entregas/${encodeURIComponent(params.numTrans)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro inesperado' }, { status: 500 });
  }
}