'use client';

import AuthGuard from '@/src/components/AuthGuard';
import Sidebar from './components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-itm-dark-primary">
        <Sidebar />
        <div className="flex-1 md:ml-64 flex flex-col">
          <main className="overflow-y-auto p-4 md:p-8 flex-grow">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
} 