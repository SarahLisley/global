import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal Global',
  description: 'Portal do Cliente - Global Hospitalar',
};

import { MSWProvider } from './MSWProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <MSWProvider>{children}</MSWProvider>
      </body>
    </html>
  );
}