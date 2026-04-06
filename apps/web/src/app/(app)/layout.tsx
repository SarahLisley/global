import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { DashboardScaffold } from '../../components/dashboard/DashboardScaffold';

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Server-side user extraction
  let user = undefined;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pgb_session')?.value;
    if (token) {
      try {
        const decoded = jwtDecode<{ name?: string; sub?: string; email?: string; codcli?: number }>(token);
        user = {
          name: decoded.name || decoded.sub || 'Usuário',
          email: decoded.email || decoded.sub || '',
          codcli: decoded.codcli,
        };
      } catch (jwtError: any) {
        // Token inválido - limpar o cookie
        console.warn('Invalid JWT token, clearing cookie:', jwtError.message);
        // Nota: Não podemos deletar cookies diretamente no server-side sem resposta,
        // mas o tratamento de erro impede que a aplicação quebre
      }
    }
  } catch (error) {
    console.error('Failed to extract user token in layout:', error);
  }

  return (
    <DashboardScaffold user={user}>
      {children}
    </DashboardScaffold>
  );
}