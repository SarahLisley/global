import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Limpar cookie de sessão inválido
    cookieStore.delete('pgb_session');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sessão limpa com sucesso' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Erro ao limpar sessão' 
    }, { status: 500 });
  }
}
