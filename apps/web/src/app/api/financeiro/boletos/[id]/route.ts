
import { NextRequest, NextResponse } from 'next/server';

import { API_BASE } from '../../../../../lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15+ (just to be safe, though 14 works too)
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const session = request.cookies.get('pgb_session')?.value;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session cookie missing' }, { status: 401 });
  }

  // Construct backend URL: /financeiro/boletos/:id
  const url = `${API_BASE}/financeiro/boletos/${id}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      let errorBody = 'Unknown error';
      try {
        const json = await res.json();
        errorBody = json.error || JSON.stringify(json);
      } catch (e) {
        errorBody = await res.text();
      }

      console.error(`Backend returned ${res.status} for boleto ${id} at ${url}. Body: ${errorBody}`);
      return NextResponse.json(
        { error: `Backend error: ${res.statusText}`, details: errorBody, url: url },
        { status: res.status }
      );
    }

    // Forward headers
    const contentType = res.headers.get('Content-Type') || 'application/pdf';
    const contentDisposition = res.headers.get('Content-Disposition') || `attachment; filename="boleto-${id}.pdf"`;

    // Create headers object
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', contentDisposition);

    const contentLength = res.headers.get('Content-Length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // Return the stream
    return new NextResponse(res.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Proxy error fetching boleto:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
