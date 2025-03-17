'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from './hooks/useTranslation';

export default function NotFound() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isRussian = pathname?.startsWith('/ru');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-extrabold text-gray-400 dark:text-gray-600">404</h1>
          <h2 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
            {t('notFound.title')}
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {t('notFound.message')}
          </p>
          <div className="mt-6">
            <Link
              href={isRussian ? "/ru/dashboard" : "/dashboard"}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('notFound.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 