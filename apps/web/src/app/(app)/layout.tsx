'use client';

import type { ReactNode } from 'react';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { Topbar } from '../../components/dashboard/Topbar';
import { useState } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Container principal com margin-left apenas no desktop */}
      <div className="lg:ml-60 flex min-h-screen flex-col">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}