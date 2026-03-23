import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Portal Global — Portal do Cliente',
    template: '%s | Portal Global',
  },
  description: 'Portal do Cliente - Global Hospitalar. Gerencie pedidos, financeiro, SAC e entregas.',
  keywords: ['portal', 'cliente', 'global', 'hospitalar', 'pedidos', 'financeiro', 'SAC'],
  authors: [{ name: 'Bravo Tecnologia e Inovação' }],
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Portal Global',
    title: 'Portal Global — Portal do Cliente',
    description: 'Gerencie pedidos, financeiro, SAC e entregas.',
  },
};

import { MSWProvider } from './MSWProvider';
import { Toaster } from '@pgb/ui';
import { ThemeProvider } from '../components/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MSWProvider>
            {children}
            <Toaster />
          </MSWProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}