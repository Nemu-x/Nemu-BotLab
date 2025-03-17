'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/app/hooks/useTranslation';

interface FlowStep {
  id?: number;
  flowId?: number;
  title: string;
  message: string;
  order?: number;
  buttons?: Array<{ text: string; type?: 'url' | 'callback' | 'nextStep' }>;
}

interface Flow {
  id?: number;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  steps?: FlowStep[];
}

export default function FlowEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  const router = useRouter();
  const { t } = useTranslation();

  const [flow, setFlow] = useState<Flow>({
    name: '',
    description: '',
    isActive: true,
    isDefault: false,
    steps: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState<FlowStep>({
    title: '',
    message: '',
    buttons: [{ text: '', type: 'callback' }]
  });

  useEffect(() => {
    // Always fetch the flow, even for new ones
    // Our API will handle the "new" ID specially
    fetchFlow();
  }, [id]);

  const fetchFlow = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Don't make API calls for new flows to reduce unnecessary network requests
      if (isNew) {
        setFlow({
          name: '',
          description: '',
          isActive: true,
          isDefault: false,
          steps: []
        });
        setLoading(false);
        return;
      }
      
      console.log(`Fetching flow with ID: ${id}`);
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/flows/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        console.error(`Error response from API: ${response.status} ${response.statusText}`);
        
        // Если ошибка авторизации, пробуем использовать локальный API
        if (response.status === 401) {
          console.log('Authorization error, trying local API...');
          const localResponse = await fetch(`/api/flows/${id}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!localResponse.ok) {
            throw new Error(`Failed to fetch flow: ${localResponse.statusText}`);
          }
          
          const data = await localResponse.json();
          console.log('Fetched flow data from local API:', data);
          
          setFlow({
            ...data,
            steps: data.steps || []
          });
          return;
        }
        
        throw new Error(`Failed to fetch flow: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched flow data:', data);
      
      setFlow({
        ...data,
        steps: data.steps || []
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flow';
      console.error('Error fetching flow:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFlow(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: string) => {
    setFlow(prev => ({ ...prev, [name]: !prev[name as keyof Flow] }));
  };

  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewStep(prev => ({ ...prev, [name]: value }));
  };

  const handleAddButton = () => {
    setNewStep(prev => ({
      ...prev,
      buttons: [...(prev.buttons || []), { text: '', type: 'callback' }]
    }));
  };

  const handleRemoveButton = (index: number) => {
    setNewStep(prev => ({
      ...prev,
      buttons: prev.buttons?.filter((_, i) => i !== index) || []
    }));
  };

  const handleButtonChange = (index: number, field: 'text' | 'type', value: string) => {
    setNewStep(prev => {
      const newButtons = [...(prev.buttons || [])];
      if (field === 'text') {
        newButtons[index] = { ...newButtons[index], text: value };
      } else if (field === 'type') {
        newButtons[index] = { ...newButtons[index], type: value as 'url' | 'callback' | 'nextStep' };
      }
      return { ...prev, buttons: newButtons };
    });
  };

  const handleSaveStep = async () => {
    if (!newStep.title || !newStep.message) {
      alert(t('flows.errorAddingStep') + ': ' + 'Title and message are required');
      return;
    }

    try {
      setLoading(true);
      
      // Add the step to the current flow
      const updatedSteps = [...(flow.steps || [])];
      const stepOrder = updatedSteps.length + 1;
      
      // Generate a unique ID for the new step
      const maxStepId = updatedSteps.length > 0 
        ? Math.max(...updatedSteps.map(step => step.id || 0)) 
        : 0;
      
      const stepToAdd = {
        ...newStep,
        id: maxStepId + 1,
        order: stepOrder,
        flowId: flow.id
      };
      
      updatedSteps.push(stepToAdd);
      
      // Update the flow with the new step
      const updatedFlow = {
        ...flow,
        steps: updatedSteps
      };
      
      setFlow(updatedFlow);
      
      // If we're editing an existing flow, save the changes
      if (!isNew && flow.id) {
        // Получаем токен из localStorage
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/flows/${flow.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(updatedFlow),
        });
        
        if (!response.ok) {
          console.error(`Error response from API: ${response.status} ${response.statusText}`);
          throw new Error(t('flows.errorAddingStep'));
        }
        
        // Reload the flow to get the updated data
        const updatedData = await response.json();
        setFlow(updatedData);
      }
      
      // Reset the form
      setIsAddingStep(false);
      setNewStep({
        title: '',
        message: '',
        buttons: [{ text: '', type: 'callback' }]
      });
    } catch (err) {
      console.error('Error saving step:', err);
      setError(t('flows.errorAddingStep'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/flows' : `/api/flows/${id}`;
      
      console.log(`Saving flow with method ${method} to URL ${url}`, flow);
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(flow),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', response.status, errorData);
        throw new Error(
          isNew 
            ? `${t('flows.errorCreating')}: ${errorData.error || response.statusText}` 
            : `${t('flows.errorUpdating')}: ${errorData.error || response.statusText}`
        );
      }
      
      const savedFlow = await response.json();
      console.log('Flow saved successfully:', savedFlow);
      
      // Покажем уведомление об успешном сохранении
      alert(isNew ? t('flows.createSuccess') : t('flows.updateSuccess')); 
      
      if (isNew) {
        router.push('/ru/dashboard/flows');
      }
    } catch (err) {
      console.error('Error saving flow:', err);
      setError(err instanceof Error ? err.message : (isNew ? t('flows.errorCreating') : t('flows.errorUpdating')));
      
      // Покажем ошибку пользователю
      alert(err instanceof Error ? err.message : (isNew ? t('flows.errorCreating') : t('flows.errorUpdating')));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !flow.id) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !flow.id) {
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
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchFlow}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <Link 
          href="/ru/dashboard/flows"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          {t('common.backToList')}
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isNew ? t('flows.addFlow') : t('flows.editFlow')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('flows.description')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <form onSubmit={handleSaveFlow}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('flows.flowName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={flow.name}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter survey name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('flows.flowDescription')}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={flow.description}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter survey description"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={flow.isActive}
                        onChange={() => handleToggle('isActive')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {t('flows.isActive')}
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={flow.isDefault}
                        onChange={() => handleToggle('isDefault')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {t('flows.isDefault')}
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => router.push('/ru/dashboard/flows')}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? t('common.saving') : t('common.save')}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900 dark:border-blue-800">
            <h2 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t('flows.tips')}</h2>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <li>• Интерактивные сценарии позволяют получать структурированную обратную связь от пользователей</li>
              <li>• Создавайте шаги с разветвлённой логикой</li>
              <li>• Добавляйте кнопки с различными действиями к каждому шагу</li>
              <li>• Настройте сценарий по умолчанию, который будет автоматически запускаться для новых пользователей</li>
            </ul>
          </div>
        </div>
      </div>
      
      {!isNew && (
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('flows.steps')}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddingStep(!isAddingStep)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isAddingStep ? t('common.cancel') : t('flows.addStep')}
              </button>
            </div>
            
            {isAddingStep && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('flows.addStep')}</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="step-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('flows.stepTitle')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="step-title"
                      name="title"
                      value={newStep.title}
                      onChange={handleStepChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter step title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="step-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('flows.stepText')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="step-message"
                      name="message"
                      value={newStep.message}
                      onChange={handleStepChange}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter message text"
                      required
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('flows.buttons')}
                      </label>
                      <button
                        type="button"
                        onClick={handleAddButton}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
                      >
                        {t('flows.addButton')}
                      </button>
                    </div>
                    
                    {newStep.buttons && newStep.buttons.length > 0 ? (
                      <div className="space-y-2">
                        {newStep.buttons.map((button, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="flex-grow grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={button.text}
                                onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white col-span-2"
                                placeholder={t('flows.buttonText')}
                              />
                              <select
                                value={button.type || 'callback'}
                                onChange={(e) => handleButtonChange(index, 'type', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              >
                                <option value="callback">{t('flows.buttonType.callback')}</option>
                                <option value="url">{t('flows.buttonType.url')}</option>
                                <option value="nextStep">{t('flows.buttonType.nextStep')}</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveButton(index)}
                              className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Кнопки еще не добавлены. Нажмите "Добавить кнопку" для добавления кнопки.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <button
                      type="button"
                      onClick={handleSaveStep}
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6">
              {flow.steps && flow.steps.length > 0 ? (
                <div className="flow-root">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {flow.steps.map((step) => (
                      <li key={step.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {step.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                              {step.message}
                            </p>
                            {step.buttons && step.buttons.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {step.buttons.map((button, index) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                    {button.text}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex items-center space-x-2">
                            <button
                              type="button"
                              className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                              title={t('common.delete')}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('flow_detail.noSteps')}
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingStep(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                    >
                      {t('flows.addStep')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 