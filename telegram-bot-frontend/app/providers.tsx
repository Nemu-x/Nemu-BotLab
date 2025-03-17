'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Кэширование запросов на 5 минут
        staleTime: 5 * 60 * 1000,
        // Повторные попытки при ошибке
        retry: 1,
        // Отключение рефетча при фокусе окна в режиме разработки
        refetchOnWindowFocus: process.env.NODE_ENV !== 'development',
        // Отключение рефетча при восстановлении сети в режиме разработки
        refetchOnReconnect: process.env.NODE_ENV !== 'development',
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 