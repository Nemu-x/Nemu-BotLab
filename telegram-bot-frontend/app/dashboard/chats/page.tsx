'use client';

import { useTranslation } from '@/app/hooks/useTranslation';
import ChatInterface from '@/app/components/ChatInterface';

export default function ChatsPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{t('chats.title')}</h1>
      <ChatInterface />
    </div>
  );
} 