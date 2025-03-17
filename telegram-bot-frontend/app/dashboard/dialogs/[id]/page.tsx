'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Dialog } from '../../../api/dialogs';
import { dialogsApi } from '../../../api/dialogs';
import DialogStatusBadge from '../../../components/DialogStatusBadge';
import DialogStatusChanger from '../../../components/DialogStatusChanger';

export default function DialogDetailsPage({ params }: { params: { id: string } }) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dialogId = parseInt(params.id, 10);

  useEffect(() => {
    if (!isNaN(dialogId)) {
      fetchDialog();
    } else {
      setError('Неверный ID диалога');
      setIsLoading(false);
    }
  }, [dialogId]);

  const fetchDialog = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dialogsApi.getDialogById(dialogId);
      if (data) {
        setDialog(data);
      } else {
        setError('Диалог не найден');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке диалога');
      console.error('Error fetching dialog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChanged = async (newStatus: 'new' | 'in_progress' | 'closed', resolution?: string) => {
    if (!dialog) return;
    
    try {
      const updatedDialog = await dialogsApi.updateDialogStatus(dialogId, newStatus, resolution);
      setDialog(updatedDialog);
    } catch (err) {
      console.error('Error updating dialog status:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Ошибка</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/dialogs"
                className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium leading-4 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
              >
                Вернуться к списку диалогов
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dialog) {
    return (
      <div className="text-center">
        <p className="text-lg text-gray-500 dark:text-gray-400">Диалог не найден</p>
        <div className="mt-4">
          <Link
            href="/dashboard/dialogs"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-100 px-3 py-2 text-sm font-medium leading-4 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
          >
            Вернуться к списку диалогов
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/dialogs"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Назад к списку диалогов
        </Link>
      </div>

      <div className="mb-6 flex flex-col justify-between border-b border-gray-200 pb-5 sm:flex-row sm:items-center dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {dialog.name}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {dialog.description || 'Нет описания'}
          </p>
        </div>
        <div className="mt-4 flex items-center space-x-4 sm:mt-0">
          <DialogStatusBadge status={dialog.status} />
          {dialog.is_active ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300">
              Активен
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              Неактивен
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Информация о диалоге</h2>
          <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">{dialog.id}</dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Название</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">{dialog.name}</dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Описание</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {dialog.description || 'Нет описания'}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Дата создания</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {new Date(dialog.created_at).toLocaleString()}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Последнее обновление</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {new Date(dialog.updated_at).toLocaleString()}
              </dd>
            </div>
            <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Создатель</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {dialog.creator ? dialog.creator.username : `ID: ${dialog.created_by}`}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Управление статусом</h2>
          
          <DialogStatusChanger 
            dialogId={dialog.id} 
            currentStatus={dialog.status} 
            onStatusChanged={handleStatusChanged}
          />
          
          {dialog.status === 'closed' && dialog.resolution && (
            <div className="mt-6 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Резолюция</h3>
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-500 dark:text-gray-300">
                {dialog.resolution}
              </div>
            </div>
          )}
        </div>
      </div>

      {dialog.steps && dialog.steps.length > 0 && (
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Шаги диалога</h2>
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {dialog.steps.map((step) => (
                <li key={step.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {step.name || `Шаг ${step.order_index + 1}`}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 truncate dark:text-gray-400">
                        {step.message || step.description || 'Нет описания'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {step.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Неактивен
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 