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
      const decoded = jwtDecode<{ name?: string; sub?: string; email?: string }>(token);
      user = {
        name: decoded.name || decoded.sub || 'Usuário',
        email: decoded.email || decoded.sub || '',
      };
    }
  } catch (error) {
    console.error('Failed to decode user token in layout:', error);
  }

  return (
    <DashboardScaffold user={user}>
      {children}
    </DashboardScaffold>
  );
}