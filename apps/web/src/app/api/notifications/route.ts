import { NextRequest, NextResponse } from 'next/server';

import { API_BASE } from '../../../lib/api';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('pgb_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Notifications proxy error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
