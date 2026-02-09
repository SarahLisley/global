'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardScaffoldProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
  };
}

export function DashboardScaffold({ children, user }: DashboardScaffoldProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Container principal com margin-left apenas no desktop */}
      <div className="lg:ml-60 flex min-h-screen flex-col">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} initialUser={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
