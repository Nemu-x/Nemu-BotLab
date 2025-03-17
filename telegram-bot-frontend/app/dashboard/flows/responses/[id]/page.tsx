'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/app/hooks/useTranslation';
import { fetchApi } from '@/src/config/api';

interface FlowStep {
  id: number;
  question: string;
  response_type?: string;
  is_required?: boolean;
  order_index?: number;
}

interface FlowResponse {
  id: number;
  client_id: number;
  flow_id: number;
  responses: Record<string, any>;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  structuredResponses?: Array<{
    stepId: number;
    orderIndex: number;
    question: string;
    responseType: string;
    answer: any;
    options: Array<any>;
  }>;
  client?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    telegram_id: string;
  };
  flow?: {
    id: number;
    name: string;
    description?: string;
    flowSteps?: FlowStep[];
  };
}

export default function ResponseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [response, setResponse] = useState<FlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      fetchResponseDetails();
    }
  }, [id]);

  const fetchResponseDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/api/flow-responses/${id}`);
      console.log('Received response details:', data);
      setResponse(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching response details:', err);
      setError(err.message || t('common.errorFetching'));
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get client name for display
  const getClientName = (response: FlowResponse) => {
    if (!response.client) return `Client #${response.client_id}`;
    
    const { first_name, last_name, username, telegram_id } = response.client;
    
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    } else if (first_name) {
      return first_name;
    } else if (username) {
      return `@${username}`;
    } else {
      return `ID: ${telegram_id}`;
    }
  };

  // Get step question by ID
  const getStepQuestion = (stepId: string | number) => {
    if (!response?.flow?.flowSteps) return `Step #${stepId}`;
    
    const step = response.flow.flowSteps.find(s => s.id.toString() === stepId.toString());
    return step ? step.question : `Step #${stepId}`;
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

  if (error || !response) {
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
                <p>{error || 'Response not found'}</p>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => router.push('/dashboard/flows/responses')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow transition-colors"
        >
          {t('common.backToList')}
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/dashboard/flows/responses"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          {t('common.backToList')}
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('responses.responseDetails')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {response.flow?.name || `Flow #${response.flow_id}`} - {getClientName(response)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">{t('responses.title')}</h2>
            </div>
            
            <div className="p-6">
              {response.structuredResponses && response.structuredResponses.length > 0 ? (
                <div className="space-y-4">
                  {response.structuredResponses.map((item) => (
                    <div key={item.stepId} className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {item.question}
                      </h3>
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                          {item.responseType}
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        <p className="text-gray-700 dark:text-gray-300">
                          {typeof item.answer === 'object' 
                            ? JSON.stringify(item.answer, null, 2) 
                            : item.answer.toString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(response.responses).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(response.responses).map(([stepId, answer]) => (
                    <div key={stepId} className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {getStepQuestion(stepId)}
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        <p className="text-gray-700 dark:text-gray-300">
                          {typeof answer === 'object' ? JSON.stringify(answer, null, 2) : answer.toString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                  {t('responses.noResponses')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">{t('common.details')}</h2>
            </div>
            
            <div className="p-6">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('responses.id')}</dt>
                  <dd className="text-sm text-gray-900 dark:text-white ml-4">{response.id}</dd>
                </div>
                
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('responses.status')}</dt>
                  <dd className="text-sm ml-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      response.completed 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    }`}>
                      {response.completed ? t('responses.completed') : t('responses.inProgress')}
                    </span>
                  </dd>
                </div>
                
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('responses.client')}</dt>
                  <dd className="text-sm text-blue-600 dark:text-blue-400 ml-4">
                    <Link href={`/dashboard/chats/[chatId]`.replace('[chatId]', String(response.client_id))}>
                      {getClientName(response)}
                    </Link>
                  </dd>
                </div>
                
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('responses.flow')}</dt>
                  <dd className="text-sm text-blue-600 dark:text-blue-400 ml-4">
                    <Link href={`/dashboard/flows/${response.flow_id}`}>
                      {response.flow?.name || `Flow #${response.flow_id}`}
                    </Link>
                  </dd>
                </div>
                
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('responses.createdAt')}</dt>
                  <dd className="text-sm text-gray-900 dark:text-white ml-4">{formatDate(response.created_at)}</dd>
                </div>
                
                {response.completed && (
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('responses.completedAt')}</dt>
                    <dd className="text-sm text-gray-900 dark:text-white ml-4">{formatDate(response.completed_at)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 