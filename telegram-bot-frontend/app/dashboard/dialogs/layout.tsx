import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Управление диалогами | Bot Lab Dashboard',
  description: 'Управление сценариями диалогов и автоматическими ответами бота',
};

export default function DialogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 