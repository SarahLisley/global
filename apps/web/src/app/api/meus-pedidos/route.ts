import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { API_BASE } from '../../../lib/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = (await cookies()).get('pgb_session')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Forward params to backend
    const backendUrl = new URL(`${API_BASE}/orders`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    console.log('[PROXY] Fetching backend:', backendUrl.toString());
    console.log('[PROXY] Auth Token:', token?.slice(0, 10) + '...');

    const res = await fetch(backendUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from backend' }, { status: res.status });
    }

    const data = await res.json();
    console.log('[PROXY] Backend URL Used:', backendUrl.toString());
    console.log('[PROXY] Orders Count:', data.orders?.length ?? 'undefined');
    console.log('[PROXY] Total:', data.total);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
