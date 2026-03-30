import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { API_BASE } from '../../../lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const token = cookieStore.get('pgb_session')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/financeiro?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      // Repassa o erro do backend se houver
      const err = await res.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json({ error: 'Error fetching data' }, { status: 500 });
  }
}
