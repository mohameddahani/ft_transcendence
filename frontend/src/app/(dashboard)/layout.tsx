// app/(dashboard)/layout.tsx
'use client';

import { useState } from 'react';
import { Sidebar } from '@/app/components/Sidebar';
import { SidebarToggle } from '@/app/components/SidebarToggle';
import { AuthGuard } from '@/app/components/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile Hamburger Button - hidden on desktop */}
        <SidebarToggle isOpen={isSidebarOpen} onClick={toggleSidebar} />

        {/* Sidebar - fixed on mobile, static on desktop */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Main Content - ml-64 on desktop only */}
        <main className={`
          flex-1 p-4 pt-16 md:pt-8 md:p-8
          ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}
        `}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}