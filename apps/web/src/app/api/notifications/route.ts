import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

import { API_BASE } from '../../../lib/api';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('pgb_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validar token antes de enviar para API
    try {
      jwtDecode(token);
    } catch (jwtError) {
      console.warn('Invalid JWT token in notifications route:', jwtError);
      // Limpar cookie inválido
      const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      response.cookies.delete('pgb_session');
      return response;
    }

    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Tratar diferentes tipos de erro
    if (res.status === 429) {
      return NextResponse.json({ 
        error: 'Too many requests', 
        message: 'Por favor, aguarde um momento antes de tentar novamente' 
      }, { status: 429 });
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error('API notifications error:', res.status, errorText);
      return NextResponse.json({ 
        error: 'API error', 
        status: res.status,
        message: errorText 
      }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error('Notifications proxy error:', err);
    
    // Tratar erros específicos
    if (err.message?.includes('Input buffers must have the same byte length')) {
      return NextResponse.json({ 
        error: 'Token decode error', 
        message: 'Sua sessão é inválida. Por favor, faça login novamente.' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal error', 
      message: err.message || 'Erro ao carregar notificações' 
    }, { status: 500 });
  }
}
