'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Dialog as DialogModel } from '../../api/dialogs';
import { dialogsApi } from '../../api/dialogs';
import DialogStatusBadge from '../../components/DialogStatusBadge';
import Link from 'next/link';

export default function DialogsPage() {
  const [dialogs, setDialogs] = useState<DialogModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDialogs();
  }, []);

  const fetchDialogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dialogsApi.getDialogs();
      setDialogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке диалогов');
      console.error('Error fetching dialogs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Диалоги
        </h1>
        <Link
          href="/dashboard/dialogs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Создать диалог
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : dialogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Нет диалогов
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {dialogs.map((dialog) => (
              <li key={dialog.id}>
                <Link
                  href={`/dashboard/dialogs/${dialog.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate dark:text-blue-400">
                          {dialog.name}
                        </p>
                        <div className="ml-2">
                          <DialogStatusBadge status={dialog.status} />
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        {dialog.is_active ? (
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            Активен
                          </p>
                        ) : (
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Неактивен
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {dialog.description || 'Нет описания'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 dark:text-gray-400">
                        <p>
                          Создан: {new Date(dialog.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 