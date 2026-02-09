import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

export async function GET(_req: Request) {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    const text = await res.text().catch(() => '');
    return NextResponse.json({ ok: res.ok, status: res.status, apiBase: API_BASE, body: text.slice(0, 200) }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, apiBase: API_BASE, error: e?.message }, { status: 530 });
  }
}