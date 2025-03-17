'use client';

import { useRouter } from 'next/navigation';
import TicketsPage from '@/app/tickets/page';

export default function DashboardTicketsPage() {
  return (
    <div className="p-4">
      <TicketsPage />
    </div>
  );
} 