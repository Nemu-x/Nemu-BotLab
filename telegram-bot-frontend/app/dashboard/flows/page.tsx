'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/app/hooks/useTranslation';
import { fetchApi, API_ENDPOINTS } from '@/src/config/api';
import { FiPlus, FiSearch } from 'react-icons/fi';

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
  stepsCount?: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFlowId, setDeletingFlowId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Добавляем функцию для перезагрузки при возвращении на страницу
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing flows data');
        fetchFlows();
      }
    };

    // Подписываемся на событие изменения видимости
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Загружаем flows при первом рендере
    fetchFlows();

    // Отписываемся при размонтировании
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем данные только с сервера через API 
      const data = await fetchApi(API_ENDPOINTS.flows);
      console.log('Flows data received from API:', data);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      
      // Используем только данные с сервера
      setFlows(data);
    } catch (error: any) {
      console.error('Error fetching flows:', error);
      setError(error?.message || t('flows.errorFetching'));
      
      // В случае ошибки от сервера, очищаем список flows
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteFlow = async (flowId: number) => {
    try {
      setDeletingFlowId(flowId);
      
      // Отправляем запрос на удаление
      await fetchApi(`${API_ENDPOINTS.flows}/${flowId}`, {
        method: 'DELETE',
      });
      
      // Обновляем список потоков, удаляя удаленный
      const updatedFlows = flows.filter(flow => flow.id !== flowId);
      setFlows(updatedFlows);
      
      // Показываем уведомление (если есть компонент для уведомлений)
      console.log(`Flow ${flowId} deleted successfully`);
    } catch (err: any) {
      console.error(`Error deleting flow ${flowId}:`, err);
      setError(err?.message || `Failed to delete flow: ${flowId}`);
    } finally {
      setDeletingFlowId(null);
    }
  };

  // Добавляем функцию для создания нового потока
  const openCreateModal = () => {
    window.location.href = '/dashboard/flows/new';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4 max-w-lg w-full">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-itm-text-primary">{t('flows.title')}</h1>
        <button
          onClick={() => openCreateModal()}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-itm-dark-highlight dark:hover:bg-itm-dark-accent text-white font-medium py-2 px-4 rounded inline-flex items-center"
        >
          <FiPlus className="mr-2" /> {t('flows.createNew')}
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder={t('flows.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-itm-border rounded-md bg-white dark:bg-itm-dark-accent text-gray-900 dark:text-itm-text-primary"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-itm-text-secondary" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-itm-dark-secondary shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-itm-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-itm-border">
              <thead className="bg-gray-50 dark:bg-itm-dark-accent">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                    {t('flows.name')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                    {t('flows.description')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                    {t('flows.status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                    {t('flows.type')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                    {t('flows.steps')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-itm-text-secondary uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-itm-dark-secondary divide-y divide-gray-200 dark:divide-itm-border">
                {flows.map((flow) => (
                  <tr key={flow.id} className="hover:bg-gray-50 dark:hover:bg-itm-dark-accent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {flow.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {flow.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        flow.isActive || flow.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {(flow.isActive || flow.is_active) ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(flow.isDefault || flow.is_default) ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          {t('flows.default')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {flow.stepsCount !== undefined ? flow.stepsCount : (flow.steps?.length || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link 
                          href={`/dashboard/flows/${flow.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title={t('common.edit')}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete flow "${flow.name}"?`)) {
                              deleteFlow(flow.id);
                            }
                          }}
                          disabled={deletingFlowId === flow.id}
                          title={t('common.delete')}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingFlowId === flow.id ? (
                            <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 