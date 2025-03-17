'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Flow {
  id: number;
  name: string;
  description: string;
  isActive?: boolean;
  is_active?: boolean;
  isDefault?: boolean;
  is_default?: boolean;
  config?: Record<string, any>;
  steps?: any[];
  createdBy?: number;
  startCommandId?: any;
  createdAt?: string;
  updatedAt?: string;
  startCommand?: any;
  creator?: {
    id: number;
    username: string;
    email: string;
  };
}

export default function FlowsPage() {
  const { t } = useTranslation();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching flows for Russian version');

      const response = await fetch('/api/flows', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Error fetching flows: ${response.status} ${response.statusText}`);
        throw new Error(t('flows.errorFetching'));
      }

      const data = await response.json();
      console.log('Flows data received from API:', data);

      // Также проверяем localStorage для моков, созданных в этой сессии
      let combinedData = [...data];
      if (typeof window !== 'undefined') {
        try {
          const localFlows = localStorage.getItem('mockFlows');
          if (localFlows) {
            const parsedLocalFlows = JSON.parse(localFlows);
            console.log('Found flows in localStorage:', parsedLocalFlows);
            
            // Проверяем, есть ли flows из localStorage уже в данных с сервера
            const apiIds = data.map((flow: Flow) => flow.id);
            const uniqueLocalFlows = parsedLocalFlows.filter((flow: Flow) => !apiIds.includes(flow.id));
            
            if (uniqueLocalFlows.length > 0) {
              console.log('Adding unique flows from localStorage:', uniqueLocalFlows);
              combinedData = [...data, ...uniqueLocalFlows];
            }
          }
        } catch (error) {
          console.error('Error loading flows from localStorage:', error);
        }
      }
      
      setFlows(combinedData);
    } catch (err) {
      console.error('Error loading flows:', err);
      setError(err instanceof Error ? err.message : String(err));
      
      // В случае ошибки API, попробуем загрузить данные из localStorage
      if (typeof window !== 'undefined') {
        try {
          const localFlows = localStorage.getItem('mockFlows');
          if (localFlows) {
            console.log('Falling back to localStorage data due to API error');
            setFlows(JSON.parse(localFlows));
          }
        } catch (localError) {
          console.error('Error loading fallback from localStorage:', localError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>{t('flows.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4 max-w-lg w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{t('flows.error')}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchFlows}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('flows.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('flows.description')}</p>
        </div>
        <Link href="/ru/dashboard/flows/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <PlusIcon className="h-4 w-4 mr-2" />
          {t('flows.create')}
        </Link>
      </div>

      {flows.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('flows.noFlows')}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Создайте ваш первый сценарий для начала работы.
          </p>
          <div className="mt-6">
            <Link href="/ru/dashboard/flows/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('flows.create')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('flows.columns.name')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('flows.columns.description')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('flows.columns.steps')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('flows.columns.active')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('flows.columns.default')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('flows.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {flows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{flow.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{flow.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{flow.steps?.length || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (flow.isActive || flow.is_active) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {(flow.isActive || flow.is_active) ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (flow.isDefault || flow.is_default) ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {(flow.isDefault || flow.is_default) ? t('common.yes') : t('common.no')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <Link 
                        href={`/ru/dashboard/flows/${flow.id}`} 
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title={t('common.edit')}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm(`Вы уверены, что хотите удалить поток "${flow.name}"?`)) {
                            // Здесь должна быть функция удаления flow
                            // Так как в исходной версии её нет, просто выводим сообщение в консоль
                            console.log(`Удаление потока ${flow.id} запрошено`);
                          }
                        }}
                        title={t('common.delete')}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 