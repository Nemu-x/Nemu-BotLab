'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { fetchApi, API_ENDPOINTS } from '@/app/config/api';
import { API_BASE_URL } from '@/app/config/env';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface Client {
  id: number;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language?: string;
}

interface Operator {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  client_id: number;
  status: string;
  priority: string;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  assignedOperator?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface TicketModalProps {
  isOpen: boolean;
  onClose: (refreshData?: boolean) => void;
  initialClient?: Client | null;
  initialTicket?: Ticket | null;
  isCreating?: boolean;
}

export default function TicketModal({ isOpen, onClose, initialClient = null, initialTicket = null, isCreating = true }: TicketModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('open');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка клиентов при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchOperators();
      
      if (initialClient) {
        setSelectedClient(initialClient);
      }
      
      if (initialTicket) {
        setTitle(initialTicket.title);
        setDescription(initialTicket.description || '');
        setPriority(initialTicket.priority);
        setStatus(initialTicket.status);
        setSelectedOperator(initialTicket.assigned_to);
        
        // Если у заявки есть клиент, найдем его в списке клиентов
        if (initialTicket.client_id) {
          fetchClientById(initialTicket.client_id);
        }
      } else {
        // Сброс формы для создания новой заявки
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus('open');
        setSelectedOperator(null);
      }
    }
  }, [isOpen, initialClient, initialTicket]);

  // Загрузка клиентов
  const fetchClients = async () => {
    try {
      const response = await fetchApi(API_ENDPOINTS.clients);
      setClients(response);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients');
    }
  };
  
  // Загрузка операторов
  const fetchOperators = async () => {
    try {
      const response = await fetchApi(API_ENDPOINTS.users);
      setOperators(response);
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };
  
  // Загрузка клиента по ID
  const fetchClientById = async (clientId: number) => {
    try {
      const response = await fetchApi(`${API_ENDPOINTS.clients}/${clientId}`);
      setSelectedClient(response);
    } catch (error) {
      console.error(`Error fetching client with ID ${clientId}:`, error);
    }
  };

  // Фильтрация клиентов при изменении поискового запроса
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = clients.filter(client => 
      client.username?.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.first_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.last_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.telegram_id.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Создание или обновление заявки
  const handleSaveTicket = async () => {
    if (!title || !selectedClient) {
      setError(t('tickets.requiredFields'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const ticketData = {
        title,
        description,
        client_id: selectedClient.id,
        priority,
        status,
        assigned_to: selectedOperator
      };

      let response;
      
      if (initialTicket) {
        // Обновление существующей заявки
        response = await fetchApi(`${API_BASE_URL}/api/tickets/${initialTicket.id}`, {
          method: 'PUT',
          body: JSON.stringify(ticketData)
        });
      } else {
        // Создание новой заявки
        response = await fetchApi(`${API_BASE_URL}/api/tickets`, {
          method: 'POST',
          body: JSON.stringify(ticketData)
        });
      }

      onClose(true); // Закрываем модальное окно и обновляем список заявок
    } catch (error) {
      console.error('Error saving ticket:', error);
      setError(initialTicket ? t('tickets.errorUpdating') : t('tickets.errorCreating'));
    } finally {
      setIsSaving(false);
    }
  };

  // Выбор клиента
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setShowSearch(false);
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {initialTicket ? t('tickets.ticketDetails') : t('tickets.newTicket')}
            </h2>
            <button
              onClick={() => onClose()}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Выбор клиента */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('tickets.client')} *
              </label>
              {selectedClient ? (
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md dark:border-gray-700">
                  <div>
                    <div className="font-medium">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </div>
                    {selectedClient.username && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        @{selectedClient.username}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowSearch(true)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    {t('common.change')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-full p-3 border border-gray-300 rounded-md text-left text-gray-500 dark:border-gray-700 dark:text-gray-400"
                >
                  {t('tickets.selectClient')}
                </button>
              )}

              {/* Поиск клиентов */}
              {showSearch && (
                <div className="mt-2 border border-gray-300 rounded-md dark:border-gray-700 p-3">
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('tickets.searchClient')}
                      className="w-full p-2 pl-8 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                      autoFocus
                    />
                    <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="text-center py-2 text-gray-500 dark:text-gray-400">
                        {t('clients.noSearchResults')}
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredClients.map((client) => (
                          <li
                            key={client.id}
                            onClick={() => handleSelectClient(client)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <div className="font-medium">
                              {client.first_name} {client.last_name}
                            </div>
                            {client.username && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{client.username}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Заголовок */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('tickets.title_field')} *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder={t('tickets.title_field')}
              />
            </div>

            {/* Описание */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('tickets.description')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder={t('tickets.description')}
              />
            </div>

            {/* Статус (только для редактирования) */}
            {!isCreating && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tickets.status')}
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="open">{t('tickets.statuses.open')}</option>
                  <option value="in_progress">{t('tickets.statuses.in_progress')}</option>
                  <option value="resolved">{t('tickets.statuses.resolved')}</option>
                  <option value="closed">{t('tickets.statuses.closed')}</option>
                </select>
              </div>
            )}

            {/* Приоритет */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tickets.priority')}
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`flex-1 py-2 rounded-md text-sm ${
                      priority === 'low'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('tickets.priorities.low')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`flex-1 py-2 rounded-md text-sm ${
                      priority === 'medium'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('tickets.priorities.medium')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`flex-1 py-2 rounded-md text-sm ${
                      priority === 'high'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-2 border-yellow-500'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t('tickets.priorities.high')}
                  </button>
                </div>
              </div>
            </div>

            {/* Назначение оператора */}
            <div>
              <label htmlFor="operator" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('tickets.assignedTo')}
              </label>
              <select
                id="operator"
                value={selectedOperator || ''}
                onChange={(e) => setSelectedOperator(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">{t('common.none')}</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.first_name} {operator.last_name} ({operator.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Кнопки действий */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => onClose()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('tickets.cancel')}
              </button>
              <button
                onClick={handleSaveTicket}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                    {t('common.saving')}
                  </span>
                ) : (
                  t('tickets.save')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 