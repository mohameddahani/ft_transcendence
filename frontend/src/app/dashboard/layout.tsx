// app/dashboard/layout.tsx
'use client';

import { AuthGuard } from '@/app/components/AuthGuard';
import { Sidebar } from '@/app/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 p-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}