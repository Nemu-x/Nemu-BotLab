'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { fetchApi, API_ENDPOINTS } from '@/src/config/api';
import Image from 'next/image';

interface Client {
  id: number;
  telegram_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  notes?: string;
  is_blocked: boolean;
  is_dialog_open: boolean;
  language?: string;
  tags?: string[];
  assigned_to?: number;
  category?: string;
  priority?: string;
  status?: string;
  banned_at?: string;
  ban_reason?: string;
}

interface ClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdate: (updatedClient: Client) => void;
}

export default function ClientModal({ client, isOpen, onClose, onClientUpdate }: ClientModalProps) {
  const { t, currentLang } = useTranslation();
  const [notes, setNotes] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<number | undefined>(undefined);
  const [isBlocked, setIsBlocked] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [isBlockingUser, setIsBlockingUser] = useState(false);

  // Загрузка данных при открытии модального окна
  useEffect(() => {
    if (client) {
      setNotes(client.notes || '');
      setSelectedLanguage(client.language || 'en');
      
      // Исправляем обработку тегов, проверяя, что это действительно массив
      if (Array.isArray(client.tags)) {
        setTags(client.tags);
      } else if (typeof client.tags === 'string') {
        // Если это строка, пробуем распарсить JSON
        try {
          const parsedTags = JSON.parse(client.tags);
          setTags(Array.isArray(parsedTags) ? parsedTags : []);
        } catch (e) {
          // Если не удалось распарсить, то используем как один тег или пустой массив
          setTags(client.tags ? [client.tags] : []);
        }
      } else {
        // Если ничего не подходит, используем пустой массив
        setTags([]);
      }
      
      setSelectedOperator(client.assigned_to);
      setIsBlocked(client.is_blocked);
      setBanReason(client.ban_reason || '');
      
      // Загрузка операторов
      const fetchOperators = async () => {
        try {
          const data = await fetchApi(API_ENDPOINTS.users);
          setOperators(data);
        } catch (error) {
          console.error('Error fetching operators:', error);
        }
      };
      
      fetchOperators();
    }
  }, [client]);

  // Если модальное окно закрыто, не рендерим содержимое
  if (!isOpen || !client) return null;

  // Сохранение изменений
  const handleSave = async () => {
    if (!client) return;
    
    setIsSaving(true);
    try {
      // Обновление заметок
      await fetchApi(`${API_ENDPOINTS.clients}/${client.id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes })
      });
      
      // Обновление языка
      await fetchApi(`${API_ENDPOINTS.clients}/${client.id}/language`, {
        method: 'PUT',
        body: JSON.stringify({ language: selectedLanguage })
      });
      
      // Обновление тегов
      await fetchApi(`${API_ENDPOINTS.clients}/${client.id}`, {
        method: 'PUT',
        body: JSON.stringify({ tags })
      });
      
      // Обновление оператора
      if (selectedOperator !== client.assigned_to) {
        await fetchApi(`${API_ENDPOINTS.clients}/${client.id}`, {
          method: 'PUT',
          body: JSON.stringify({ assigned_to: selectedOperator })
        });
      }
      
      // Обновляем клиента в родительском компоненте
      onClientUpdate({
        ...client,
        notes,
        language: selectedLanguage,
        tags,
        assigned_to: selectedOperator
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      setError('Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };

  // Блокировка/разблокировка пользователя
  const toggleBlockUser = async () => {
    if (!client) return;
    
    console.log('Attempting to toggle block status:', { clientId: client.id, currentBlockStatus: isBlocked });
    
    setIsBlockingUser(true);
    try {
      const response = await fetchApi(`${API_ENDPOINTS.clients}/${client.id}/toggle-block`, {
        method: 'PUT',
        body: JSON.stringify({ 
          isBlocked: !isBlocked,
          banReason: !isBlocked ? banReason : '' 
        })
      });
      
      console.log('Toggle block API response:', response);
      
      // Обновляем состояние
      setIsBlocked(!isBlocked);
      
      // Обновляем клиента в родительском компоненте
      onClientUpdate({
        ...client,
        is_blocked: !isBlocked,
        ban_reason: !isBlocked ? banReason : '',
        banned_at: !isBlocked ? new Date().toISOString() : undefined
      });
      
      setError(null);
    } catch (error) {
      console.error('Error toggling user block status:', error);
      setError('Failed to update block status');
    } finally {
      setIsBlockingUser(false);
    }
  };

  // Добавление тега
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Удаление тега
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Получение имени клиента для отображения
  const getClientDisplayName = () => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-itm-dark-secondary rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="p-4 border-b border-gray-200 dark:border-itm-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-itm-text-primary">
            {t('clients.clientInfo') || 'Client Information'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-itm-text-secondary dark:hover:text-itm-text-primary"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Содержимое */}
        <div className="p-4 overflow-y-auto flex-grow">
          {/* Основная информация */}
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 mr-4">
              {client.photo_url ? (
                <Image
                  src={client.photo_url}
                  alt={getClientDisplayName()}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-itm-dark-accent flex items-center justify-center">
                  <span className="text-2xl text-gray-700 dark:text-itm-text-primary">
                    {getClientDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-itm-text-primary mb-1">
                {getClientDisplayName()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-itm-text-secondary mb-1">
                {client.username ? `@${client.username}` : ''}
              </p>
              <p className="text-sm text-gray-500 dark:text-itm-text-secondary mb-1">
                ID: {client.telegram_id}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">{t('clients.status') || 'Status'}:</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  client.is_dialog_open 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {client.is_dialog_open ? (t('clients.active') || 'Active') : (t('clients.inactive') || 'Inactive')}
                </span>
                {isBlocked && (
                  <span className="ml-2 text-sm px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {t('clients.blocked') || 'Blocked'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Блокировка/разблокировка пользователя */}
          <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                {t('clients.blockStatus') || 'Block Status'}
              </h3>
              <div className="flex items-center">
                <span className={`mr-2 text-sm ${isBlocked ? 'text-red-500' : 'text-green-500'}`}>
                  {isBlocked ? (t('clients.blocked') || 'Blocked') : (t('clients.notBlocked') || 'Not Blocked')}
                </span>
                <button
                  onClick={toggleBlockUser}
                  disabled={isBlockingUser}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    isBlocked 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200'
                  }`}
                >
                  {isBlockingUser 
                    ? (t('common.loading') || 'Loading...') 
                    : isBlocked 
                      ? (t('clients.unblock') || 'Unblock') 
                      : (t('clients.block') || 'Block')
                  }
                </button>
              </div>
            </div>
            {!isBlocked && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('clients.banReason') || 'Block Reason'}
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder={t('clients.banReasonPlaceholder') || 'Enter reason for blocking this user...'}
                />
              </div>
            )}
          </div>
          
          {/* Язык */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('clients.language') || 'Language'}
            </label>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setSelectedLanguage('en')}
                className={`p-2 rounded ${
                  selectedLanguage === 'en' 
                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <span className="text-lg">🇬🇧</span>
              </button>
              <button 
                onClick={() => setSelectedLanguage('ru')}
                className={`p-2 rounded ${
                  selectedLanguage === 'ru' 
                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <span className="text-lg">🇷🇺</span>
              </button>
            </div>
          </div>
          
          {/* Заметки */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Notes') || 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
              placeholder={t('Add notes about this client...') || 'Add notes about this client...'}
            />
          </div>
          
          {/* Теги */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Tags') || 'Tags'}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {Array.isArray(tags) && tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t('Add a tag...') || 'Add a tag...'}
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              >
                {t('Add') || 'Add'}
              </button>
            </div>
          </div>
          
          {/* Назначенный оператор */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Assigned Operator') || 'Assigned Operator'}
            </label>
            <select
              value={selectedOperator !== undefined && selectedOperator !== null ? selectedOperator.toString() : ''}
              onChange={(e) => setSelectedOperator(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('Not assigned') || 'Not assigned'}</option>
              {operators.map(operator => (
                <option key={operator.id} value={operator.id}>
                  {operator.username || operator.email}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Кнопки действий */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          {error && (
            <div className="mr-auto text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 mr-2"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
} 