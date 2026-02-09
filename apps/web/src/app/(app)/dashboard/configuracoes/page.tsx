import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
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
    console.error('Failed to decode user for settings:', error);
  }

  return <SettingsClient user={user} />;
}
