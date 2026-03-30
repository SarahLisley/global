import { NextRequest, NextResponse } from 'next/server';

import { API_BASE } from '../../../../../lib/api';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('pgb_session')?.value;
    if (!token) return NextResponse.json({ error: 'Sem sessão' }, { status: 401 });

    const url = new URL(req.url);
    const params = url.searchParams.toString();

    const res = await fetch(`${API_BASE}/sac/tickets?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro inesperado' }, { status: 500 });
  }
}