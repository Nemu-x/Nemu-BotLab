'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/app/hooks/useTranslation';
import { api, fetchApi } from '@/src/config/api';
import StepMediaUploader, { MediaFile, MediaType } from '@/app/components/StepMediaUploader';
import ButtonStyleSelector, { ButtonStyle } from '@/app/components/ButtonStyleSelector';
import StepCounterToggle from '@/app/components/StepCounterToggle';
import StepConditionsEditor, { StepCondition } from '@/app/components/StepConditionsEditor';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface FlowStep {
  id?: number;
  flow_id?: number;
  order_index?: number;
  question: string;
  response_type?: string;
  is_required?: boolean;
  options?: Array<{ 
    text: string; 
    value: string; 
    emoji?: string;
    row?: number;
    position?: number;
  }>;
  config?: Record<string, any>;
  nextStepId?: string;
  isFinal?: boolean;
  parse_mode?: string;
  media?: any;
  hide_step_counter?: boolean;
  conditions?: StepCondition[];
  button_style?: ButtonStyle;
  next_step_id?: number | null;
}

interface Flow {
  id?: number;
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  steps?: FlowStep[];
  stepsCount?: number;
}

interface Client {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  telegram_id: string;
  photo_url?: string;
}

// Добавим функцию-адаптер для преобразования типов
const convertToMediaFile = (media: any): MediaFile | null => {
  if (!media) return null;
  
  // Проверяем, что у media есть необходимые поля
  if (typeof media.url !== 'string') return null;
  
  // Приводим тип к валидному MediaType
  let mediaType: MediaType = 'document';
  if (media.type === 'photo') mediaType = 'photo';
  else if (media.type === 'video') mediaType = 'video';
  else if (media.type === 'audio') mediaType = 'audio';
  
  return {
    type: mediaType,
    url: media.url,
    file_id: media.file_id,
    caption: media.caption,
    filename: media.filename,
    mime_type: media.mime_type
  };
};

export default function FlowEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  const router = useRouter();
  const { t } = useTranslation();

  const [flow, setFlow] = useState<Flow>({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
    steps: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState<FlowStep>({
    question: '',
    response_type: 'callback',
    is_required: false,
    options: [{ text: '', value: '' }],
    config: {}
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [activePrevStepId, setActivePrevStepId] = useState<string | null>(null);
  const [availablePrevSteps, setAvailablePrevSteps] = useState<Array<{ id: number | string; name: string }>>([]);
  const [newOption, setNewOption] = useState({ text: '', value: '', emoji: '', row: 0 });
  const [showButtonOptions, setShowButtonOptions] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    // Always fetch the flow, even for new ones
    // Our API will handle the "new" ID specially
    fetchFlow();
  }, [id]);

  // Обновляем список доступных предыдущих шагов при изменении flow.steps
  useEffect(() => {
    if (flow.steps && flow.steps.length > 0) {
      // Преобразуем шаги в формат, подходящий для выпадающего списка
      const prevSteps = flow.steps.map(step => ({
        id: step.id || 0,
        name: `${step.question} (ID: ${step.id || 0})`
      }));
      setAvailablePrevSteps(prevSteps);
    } else {
      setAvailablePrevSteps([]);
    }
  }, [flow.steps]);

  const fetchFlow = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Don't make API calls for new flows to reduce unnecessary network requests
      if (isNew) {
        setFlow({
          name: '',
          description: '',
          is_active: true,
          is_default: false,
          steps: []
        });
        setLoading(false);
        return;
      }
      
      console.log(`Fetching flow with ID: ${id}`);
      
      // Получаем текущий токен авторизации из localStorage
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Используем локальный API маршрут вместо прямого обращения к бэкенду
      const response = await fetch(`/api/flows/${id}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flow: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched flow data:', data);
      
      // Если steps не загружены или это пустой массив, загружаем их отдельно
      let stepsData = data.steps || [];
      if (stepsData.length === 0 && data.id) {
        try {
          console.log(`Fetching steps for flow ID: ${id}`);
          const stepsResponse = await fetch(`/api/flows/${id}/steps`, { headers });
          
          if (stepsResponse.ok) {
            stepsData = await stepsResponse.json();
            console.log(`Fetched ${stepsData.length} steps for flow ID: ${id}`, stepsData);
          } else {
            console.error(`Failed to fetch steps: ${stepsResponse.status}`);
          }
        } catch (stepsError) {
          console.error('Error fetching steps:', stepsError);
        }
      }
      
      setFlow({
        ...data,
        steps: stepsData
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

  const handleStepChange = (field: string, value: any) => {
    setNewStep(prev => ({ ...prev, [field]: value }));
    
    // Если изменяется nextStepId, нужно также обновить next_step_id
    if (field === 'nextStepId') {
      console.log(`Setting next_step_id to ${value}`);
      setNewStep(prev => ({ 
        ...prev, 
        [field]: value,
        next_step_id: value === 'final' || value === '' ? null : parseInt(value)
      }));
    }
  };

  const handleMediaChange = (media: any) => {
    setNewStep((prev) => ({ ...prev, media }));
  };

  const handleMediaRemove = () => {
    setNewStep((prev) => ({ ...prev, media: null }));
  };

  const handleButtonChange = (index: number, field: string, value: string | number) => {
    setNewStep(prev => {
      const newOptions = [...(prev.options || [])];
      if (field === 'text') {
        newOptions[index] = { ...newOptions[index], text: value as string };
      } else if (field === 'value') {
        newOptions[index] = { ...newOptions[index], value: value as string };
      } else if (field === 'emoji') {
        newOptions[index] = { ...newOptions[index], emoji: value as string };
      } else if (field === 'row') {
        newOptions[index] = { ...newOptions[index], row: typeof value === 'string' ? Number(value) : value };
      }
      return { ...prev, options: newOptions };
    });
  };

  const handleAddButton = () => {
    setNewStep(prev => ({
      ...prev,
      options: [...(prev.options || []), { text: '', value: '' }]
    }));
  };

  const handleRemoveButton = (index: number) => {
    setNewStep(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const handleResponseTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    console.log('Changing response_type to:', newType);
    
    // Определяем, нужно ли показывать опции кнопок
    const shouldShowButtons = ['callback', 'url', 'nextStep', 'keyboard'].includes(newType);
    setShowButtonOptions(shouldShowButtons);
    
    // Обновляем состояние шага
    setNewStep(prev => ({ 
      ...prev, 
      response_type: newType,
      // Если тип изменился на nextStep, добавляем пустую структуру для конфигурации 
      config: newType === 'nextStep' ? { ...prev.config, nextStep: '' } : prev.config,
      // Если тип изменился на text, сбрасываем опции кнопок
      options: newType === 'text' ? [] : prev.options
    }));
  };

  const handleSaveStep = async () => {
    if (!newStep.question) {
      alert(t('flows.errorAddingStep') + ': ' + 'Question is required');
      return;
    }

    try {
      setLoading(true);
      
      // Подготавливаем данные для сохранения, убедившись, что все поля корректны
      const stepToSave = {
        ...newStep,
        // Убедимся, что response_type сохраняется правильно
        response_type: newStep.response_type || 'text',
        // Убедимся, что is_required и isFinal сохраняются как булевы значения
        is_required: !!newStep.is_required,
        isFinal: !!newStep.isFinal,
        // Убедимся, что условия перехода сохраняются корректно
        conditions: newStep.conditions || [],
        // Убедимся, что next_step_id сохраняется корректно
        next_step_id: newStep.next_step_id
      };
      
      // Логируем данные шага перед сохранением для отладки
      console.log('Saving step with data:', JSON.stringify(stepToSave, null, 2));
      
      // Проверяем, редактируем мы существующий шаг или создаем новый
      const isEditing = !!stepToSave.id;
      
      // Сохраняем шаг в зависимости от режима (редактирование или создание)
      if (isEditing) {
        // Режим редактирования: обновляем существующий шаг
        if (!isNew && flow.id) {
          try {
            console.log(`Updating step ID: ${stepToSave.id} for flow ID: ${flow.id}`, stepToSave);
            
            // Получаем текущий токен авторизации из localStorage
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
              'Content-Type': 'application/json'
            };
            
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Используем PUT для обновления шага
            const response = await fetch(`/api/flows/${flow.id}/steps/${stepToSave.id}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(stepToSave)
            });
            
            if (!response.ok) {
              throw new Error(`Failed to update step: ${response.status}`);
            }
            
            const updatedStep = await response.json();
            console.log('Updated step:', updatedStep);
            
            // Обновляем шаг в текущем потоке
            const updatedSteps = flow.steps?.map(step => 
              step.id === updatedStep.id ? updatedStep : step
            ) || [];
            
            setFlow({
              ...flow,
              steps: updatedSteps
            });
          } catch (stepError) {
            console.error('Error updating step on backend:', stepError);
            
            // Если запрос не удался, все равно обновляем шаг локально
            const updatedSteps = flow.steps?.map(step => 
              step.id === stepToSave.id ? stepToSave : step
            ) || [];
            
            setFlow({
              ...flow,
              steps: updatedSteps
            });
          }
        } else {
          // Для новых потоков обновляем шаг локально
          const updatedSteps = flow.steps?.map(step => 
            step.id === stepToSave.id ? stepToSave : step
          ) || [];
          
          setFlow({
            ...flow,
            steps: updatedSteps
          });
        }
      } else {
        // Режим создания: добавляем новый шаг
        const updatedSteps = [...(flow.steps || [])];
        const stepOrder = updatedSteps.length + 1;
        
        // Generate a unique ID for the new step
        const maxStepId = updatedSteps.length > 0 
          ? Math.max(...updatedSteps.map(step => step.id || 0)) 
          : 0;
        
        const stepToAdd = {
          ...stepToSave,
          id: maxStepId + 1,
          order_index: stepOrder,
          flow_id: flow.id
        };
        
        // If we're editing an existing flow, save the step to the backend
        if (!isNew && flow.id) {
          try {
            console.log(`Creating new step for flow ID: ${flow.id}`, stepToAdd);
            
            // Получаем текущий токен авторизации из localStorage
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {
              'Content-Type': 'application/json'
            };
            
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Используем локальный API маршрут вместо прямого обращения к бэкенду
            const response = await fetch(`/api/flows/${flow.id}/steps`, {
              method: 'POST',
              headers,
              body: JSON.stringify(stepToAdd)
            });
            
            if (!response.ok) {
              throw new Error(`Failed to create step: ${response.status}`);
            }
            
            const createdStep = await response.json();
            console.log('Created step:', createdStep);
            
            // Add the created step to the current flow
            updatedSteps.push(createdStep);
          } catch (stepError) {
            console.error('Error creating step on backend:', stepError);
            // If backend failed, still add the step locally
            updatedSteps.push(stepToAdd);
          }
        } else {
          // For new flows, just add the step locally
          updatedSteps.push(stepToAdd);
        }
        
        // Update the flow with the new step
        setFlow({
          ...flow,
          steps: updatedSteps
        });
      }
      
      // Reset the form
      setIsAddingStep(false);
      setShowButtonOptions(false);
      setNewStep({
        question: '',
        response_type: 'callback',
        is_required: false,
        options: [{ text: '', value: '' }],
        config: {}
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
      
      // Получаем текущий токен авторизации из localStorage
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      let updatedFlow;
      if (isNew) {
        // Создаем новый flow через локальный API
        const response = await fetch('/api/flows', {
          method: 'POST',
          headers,
          body: JSON.stringify(flow)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create flow: ${response.status}`);
        }
        
        updatedFlow = await response.json();
        console.log('Created new flow:', updatedFlow);
      } else {
        // Обновляем существующий flow через локальный API
        const response = await fetch(`/api/flows/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(flow)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update flow: ${response.status}`);
        }
        
        updatedFlow = await response.json();
        console.log('Updated flow:', updatedFlow);
      }
      
      setFlow(updatedFlow);
      router.push('/dashboard/flows');
    } catch (err) {
      console.error('Error saving flow:', err);
      setError(t('flows.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditStep = (step: FlowStep) => {
    // Определяем, нужно ли показывать опции кнопок
    const responseType = step.response_type || 'text';
    const shouldShowButtons = ['callback', 'url', 'nextStep', 'keyboard'].includes(responseType);
    setShowButtonOptions(shouldShowButtons);
    
    // Загружаем данные шага в форму для редактирования
    setNewStep({
      id: step.id,
      flow_id: step.flow_id,
      question: step.question,
      response_type: responseType,
      is_required: step.is_required,
      options: responseType === 'text' ? [] : (step.options || [{ text: '', value: '' }]),
      config: step.config || {},
      nextStepId: step.next_step_id?.toString() || step.nextStepId || '',
      next_step_id: step.next_step_id || (step.nextStepId ? parseInt(step.nextStepId) : null),
      isFinal: step.isFinal || false,
      parse_mode: step.parse_mode || '',
      media: convertToMediaFile(step.media),
      button_style: step.button_style || 'inline',
      hide_step_counter: step.hide_step_counter || false,
      conditions: step.conditions || []
    });
    
    // Открываем форму редактирования
    setIsAddingStep(true);
  };

  const handleDeleteStep = (id: number | undefined) => {
    if (!id) {
      console.error('Cannot delete step: missing ID');
      return;
    }
    // Implement the logic to delete a step
    console.log('Deleting step:', id);
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const data = await fetchApi('/api/clients');
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const openInviteModal = () => {
    setShowInviteModal(true);
    fetchClients();
    // Создаем дефолтное сообщение
    if (flow?.name) {
      setInviteMessage(`📋 Приглашаем вас пройти опрос "${flow.name}".\n\nКоличество вопросов: ${flow.steps?.length || 0}\n\nНажмите "Начать опрос", чтобы приступить к прохождению.`);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setSelectedClientId(null);
    setInviteMessage('');
    setInviteSuccess(null);
    setInviteError(null);
  };

  const sendInvitation = async () => {
    if (!selectedClientId) {
      setInviteError(t('flows.selectClient'));
      return;
    }

    try {
      setSendingInvite(true);
      setInviteError(null);
      setInviteSuccess(null);

      const response = await fetchApi(`/api/flows/${id}/invite`, {
        method: 'POST',
        body: JSON.stringify({
          clientId: selectedClientId,
          message: inviteMessage
        })
      });

      setSendingInvite(false);
      setInviteSuccess(t('flows.inviteSent'));
      
      // Сбрасываем выбор клиента после отправки
      setSelectedClientId(null);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setSendingInvite(false);
      setInviteError(error.message || t('flows.errorSendingInvite'));
    }
  };

  const getClientName = (client: Client) => {
    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    } else if (client.first_name) {
      return client.first_name;
    } else if (client.username) {
      return `@${client.username}`;
    } else {
      return `ID: ${client.telegram_id}`;
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
          href="/dashboard/flows"
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
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
                        id="is_active"
                        checked={flow.is_active}
                        onChange={() => handleToggle('is_active')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {t('flows.isActive')}
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={flow.is_default}
                        onChange={() => handleToggle('is_default')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {t('flows.isDefault')}
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/flows')}
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
        
        <div className="md:col-span-1 relative">
          <button 
            onClick={() => setShowTips(!showTips)}
            className="absolute top-0 right-0 p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
            title={showTips ? "Hide tips" : "Show tips"}
          >
            <InformationCircleIcon className="h-6 w-6" />
          </button>
          
          {showTips && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900 dark:border-blue-800 mt-10">
              <h2 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t('flows.tips')}</h2>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <li>• Interactive surveys allow you to gather structured feedback from users</li>
                <li>• Create multiple steps with branching logic</li>
                <li>• Add buttons with different actions to each step</li>
                <li>• Set a default survey that will automatically run for new users</li>
              </ul>
            </div>
          )}
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
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {newStep.id ? t('flows.editStep') : t('flows.addStep')}
                  {newStep.id && ` (ID: ${newStep.id})`}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="step-question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('flows.stepQuestion')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="step-question"
                      name="question"
                      value={newStep.question}
                      onChange={(e) => handleStepChange('question', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter step question"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="step-parse-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('flows.formatting') || 'Text Formatting'}
                    </label>
                    <select
                      id="step-parse-mode"
                      name="parse_mode"
                      value={newStep.parse_mode || ''}
                      onChange={(e) => handleStepChange('parse_mode', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">{t('flows.noFormatting') || 'No Formatting'}</option>
                      <option value="HTML">HTML</option>
                      <option value="Markdown">Markdown</option>
                      <option value="MarkdownV2">MarkdownV2</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('flows.htmlTags') || 'HTML allows using tags like <b>, <i>, <u>, <s>, <a href="">, <code>, <pre>'}
                    </p>
                  </div>
                  
                  {/* Media File and Button Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('flows.media.mediaFile')}
                      </label>
                      <div className="h-28 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                        <StepMediaUploader
                          media={newStep.media}
                          onMediaChange={handleMediaChange}
                          onMediaRemove={handleMediaRemove}
                        />
                      </div>
                    </div>

                    {showButtonOptions && (
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('flows.buttonStyle.title')}
                        </label>
                        <ButtonStyleSelector
                          value={newStep.button_style || 'inline'}
                          onChange={(value) => handleStepChange('button_style', value)}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <label htmlFor="step-response-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('flows.stepResponseType')}
                    </label>
                    <select
                      id="step-response-type"
                      name="response_type"
                      value={newStep.response_type || 'callback'}
                      onChange={handleResponseTypeChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="text">{t('flows.buttonType.text')}</option>
                      <option value="callback">{t('flows.buttonType.callback')}</option>
                      <option value="url">{t('flows.buttonType.url')}</option>
                      <option value="nextStep">{t('flows.buttonType.nextStep')}</option>
                      <option value="keyboard">{t('flows.buttonType.keyboard')}</option>
                    </select>
                  </div>
                  
                  {showButtonOptions && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('flows.options')}
                        </label>
                        <button
                          type="button"
                          onClick={handleAddButton}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
                        >
                          {t('flows.addOption')}
                        </button>
                      </div>
                      
                      {newStep.options && newStep.options.length > 0 ? (
                        <div className="space-y-2">
                          {newStep.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="flex-grow grid grid-cols-5 gap-2">
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white col-span-2"
                                  placeholder={t('flows.optionText')}
                                />
                                <input
                                  type="text"
                                  value={option.value}
                                  onChange={(e) => handleButtonChange(index, 'value', e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  placeholder={newStep.response_type === 'nextStep' 
                                    ? t('flows.nextStepId') 
                                    : t('flows.optionValue')}
                                />
                                <input
                                  type="text"
                                  value={option.emoji || ''}
                                  onChange={(e) => handleButtonChange(index, 'emoji', e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  placeholder={t('flows.emoji')}
                                />
                                <select
                                  value={option.row || 0}
                                  onChange={(e) => handleButtonChange(index, 'row', Number(e.target.value))}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                  <option value={0}>{`${t('flows.buttonRow')} 1`}</option>
                                  <option value={1}>{`${t('flows.buttonRow')} 2`}</option>
                                  <option value={2}>{`${t('flows.buttonRow')} 3`}</option>
                                  <option value={3}>{`${t('flows.buttonRow')} 4`}</option>
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
                          No options added yet. Click "Add Option" to add an option.
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="step-next-step-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('flows.nextStepId')}
                    </label>
                    <select
                      id="step-next-step-id"
                      value={newStep.nextStepId || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Если выбрано "final", устанавливаем isFinal в true
                        if (value === 'final') {
                          handleStepChange('nextStepId', '');
                          handleStepChange('next_step_id', null);
                          handleStepChange('isFinal', true);
                        } else {
                          handleStepChange('nextStepId', value);
                          handleStepChange('next_step_id', value === '' ? null : parseInt(value));
                          handleStepChange('isFinal', false);
                        }
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">{t('flows.noNextStep') || 'Default (sequential)'}</option>
                      <option value="final">{t('flows.isLastStep') || 'Final Step'}</option>
                      {availablePrevSteps.map((step) => (
                        <option key={step.id} value={step.id.toString()}>
                          {step.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('flows.nextStepIdHelp')}
                    </p>
                  </div>
                  
                  <div className="flex space-x-6 mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="step-is-final"
                        checked={newStep.isFinal || false}
                        onChange={(e) => handleStepChange('isFinal', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="step-is-final" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('flows.isLastStep')}
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="step-is-required"
                        checked={newStep.is_required}
                        onChange={(e) => handleStepChange('is_required', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="step-is-required" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('flows.stepIsRequired')}
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <StepCounterToggle 
                        hideStepCounter={newStep.hide_step_counter || false}
                        onChange={(value) => handleStepChange('hide_step_counter', value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('flows.conditions.title')}
                      </label>
                      <select
                        value={activePrevStepId?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setActivePrevStepId(value === '' ? null : value);
                        }}
                        className="border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">{t('flows.conditions.selectPrevStep')}</option>
                        {availablePrevSteps.map((step) => (
                          <option key={step.id} value={step.id.toString()}>
                            {step.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <StepConditionsEditor
                      conditions={newStep.conditions || []}
                      availablePrevSteps={availablePrevSteps}
                      onChange={(conditions) => handleStepChange('conditions', conditions)}
                    />
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleSaveStep}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? t('common.saving') : (newStep.id ? t('flows.updateStep') : t('flows.addStepButton'))}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingStep(false);
                          setShowButtonOptions(false);
                          setNewStep({
                            question: '',
                            response_type: 'callback',
                            is_required: false,
                            options: [{ text: '', value: '' }],
                            config: {},
                            button_style: 'inline'
                          });
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
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
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {step.question}
                              </p>
                              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                ID: {step.id}
                              </span>
                            </div>
                            {step.options && step.options.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {step.options.map((option, index) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                    {option.text}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex items-center space-x-2">
                            <button
                              type="button"
                              className="p-2 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                              title={t('common.edit')}
                              onClick={() => handleEditStep(step)}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                              title={t('common.delete')}
                              onClick={() => handleDeleteStep(step.id)}
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
                <div className="text-center p-8 text-gray-600 dark:text-gray-400">
                  {t('flow_detail.noSteps')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/dashboard/flows"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          {t('flows.backToFlows')}
        </Link>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={openInviteModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t('flows.sendInvitation')}
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Модальное окно для отправки приглашения */}
      {showInviteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {t('flows.sendInvitation')}
                    </h3>
                    <div className="mt-4">
                      <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('flows.selectClient')}
                      </label>
                      <select
                        id="client-select"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={selectedClientId || ''}
                        onChange={(e) => setSelectedClientId(Number(e.target.value) || null)}
                        disabled={loadingClients}
                      >
                        <option value="">{loadingClients ? t('common.loading') : t('flows.selectClientOption')}</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {getClientName(client)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="invite-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('flows.inviteMessage')}
                      </label>
                      <textarea
                        id="invite-message"
                        rows={5}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                      />
                    </div>

                    {inviteSuccess && (
                      <div className="mt-4 p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded">
                        {inviteSuccess}
                      </div>
                    )}

                    {inviteError && (
                      <div className="mt-4 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded">
                        {inviteError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={sendInvitation}
                  disabled={sendingInvite || !selectedClientId}
                >
                  {sendingInvite ? t('common.sending') : t('flows.sendInvite')}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                  onClick={closeInviteModal}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 