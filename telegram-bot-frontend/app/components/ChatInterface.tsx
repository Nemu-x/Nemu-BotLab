'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { fetchApi, API_ENDPOINTS } from '@/src/config/api';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import ClientModal from './ClientModal';
import TicketModal from './TicketModal';

interface Client {
  id: number;
  telegram_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  is_dialog_open: boolean;
  last_message_at?: string;
  language?: string;
  notes?: string;
  is_blocked: boolean;
  tags?: string[];
  assigned_to?: number;
  category?: string;
  priority?: string;
  status?: string;
}

interface Message {
  id: number;
  client_id: number;
  message_content: string;
  is_from_bot: boolean;
  created_at: string;
}

export default function ChatInterface() {
  const { t, currentLang } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isEditingLanguage, setIsEditingLanguage] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Загрузка списка клиентов
  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(API_ENDPOINTS.clients);
      // Фильтруем, чтобы не показывать чат бота с самим собой
      const filteredData = data.filter((client: any) => 
        // Исключаем клиентов, у которых username совпадает с именем бота
        !client.username?.includes('bot') && 
        // Исключаем клиентов, у которых first_name содержит "bot"
        !client.first_name?.toLowerCase().includes('bot')
      );
      setClients(filteredData);
      setFilteredClients(filteredData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка сообщений выбранного клиента
  const fetchMessages = async () => {
    if (!selectedClient) return;
    
    try {
      setRefreshing(true);
      setLoadingMessages(true);
      const data = await fetchApi(`${API_ENDPOINTS.messages}/client/${selectedClient.id}`);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
      setRefreshing(false);
    }
  };

  // Инициализация и автообновление
  useEffect(() => {
    fetchClients();
    
    // Настраиваем интервал для обновления списка клиентов только если включено автообновление
    let clientsInterval: NodeJS.Timeout | null = null;
    
    if (autoUpdate) {
      clientsInterval = setInterval(fetchClients, 120000); // 2 минуты
    }
    
    return () => {
      if (clientsInterval) clearInterval(clientsInterval);
    };
  }, [autoUpdate]);

  // Автообновление сообщений
  useEffect(() => {
    if (!selectedClient) return;
    
    fetchMessages();
    
    // Настраиваем интервал для обновления сообщений только если включено автообновление
    let messagesInterval: NodeJS.Timeout | null = null;
    
    if (autoUpdate) {
      messagesInterval = setInterval(fetchMessages, 30000); // 30 секунд
    }
    
    return () => {
      if (messagesInterval) clearInterval(messagesInterval);
    };
  }, [selectedClient, autoUpdate]);

  // Фильтрация клиентов при изменении поискового запроса
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        (client.username && client.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.first_name && client.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.last_name && client.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.telegram_id && client.telegram_id.includes(searchTerm))
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Отправка сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !newMessage.trim()) return;
    
    try {
      await fetchApi(`${API_ENDPOINTS.messages}/send`, {
        method: 'POST',
        body: JSON.stringify({
          clientId: selectedClient.id,
          message: newMessage
        })
      });
      
      // Добавляем сообщение в список локально для мгновенного отображения
      setMessages(prev => [...prev, {
        id: Date.now(), // Временный ID
        client_id: selectedClient.id,
        message_content: newMessage,
        is_from_bot: true,
        created_at: new Date().toISOString()
      }]);
      
      setNewMessage('');
      
      // Обновляем сообщения после отправки
      setTimeout(fetchMessages, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  // Переключение статуса диалога
  const toggleDialogStatus = async (client: Client) => {
    try {
      const response = await fetchApi(`${API_ENDPOINTS.clients}/${client.id}/dialog-status`, {
        method: 'PUT'
      });
      
      // Обновляем статус клиента в списке
      setClients(prev => prev.map(c => 
        c.id === client.id ? { ...c, is_dialog_open: !c.is_dialog_open } : c
      ));
      
      // Если это выбранный клиент, обновляем его статус
      if (selectedClient && selectedClient.id === client.id) {
        setSelectedClient({ ...selectedClient, is_dialog_open: !selectedClient.is_dialog_open });
      }
    } catch (error) {
      console.error('Error toggling dialog status:', error);
      setError('Failed to update dialog status');
    }
  };

  // Создание заявки из чата
  const createTicket = async () => {
    if (!selectedClient) return;
    
    try {
      await fetchApi(`${API_ENDPOINTS.clients}/${selectedClient.id}/create-ticket`, {
        method: 'POST'
      });
      
      setError('Ticket created successfully');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create ticket');
    }
  };

  // Форматирование времени последнего сообщения
  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: currentLang === 'ru' ? ru : enUS
      });
    } catch (error) {
      return '';
    }
  };

  // Получение имени клиента для отображения
  const getClientDisplayName = (client: Client) => {
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

  // Обработчик изменения языка клиента
  const handleLanguageChange = async () => {
    if (!selectedClient) return;
    
    setIsSavingLanguage(true);
    try {
      await fetchApi(`${API_ENDPOINTS.clients}/${selectedClient.id}/language`, {
        method: 'PUT',
        body: JSON.stringify({ language: selectedLanguage })
      });
      
      // Обновляем клиента в списке
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id ? { ...c, language: selectedLanguage } : c
      ));
      
      // Обновляем выбранного клиента
      setSelectedClient({ ...selectedClient, language: selectedLanguage });
      
      // Закрываем режим редактирования
      setIsEditingLanguage(false);
    } catch (error) {
      console.error('Error updating client language:', error);
      setError('Failed to update client language');
    } finally {
      setIsSavingLanguage(false);
    }
  };

  // При выборе клиента устанавливаем его текущий язык
  useEffect(() => {
    if (selectedClient) {
      setSelectedLanguage(selectedClient.language || 'en');
    }
  }, [selectedClient]);

  // Обновление клиента
  const handleClientUpdate = (updatedClient: Client) => {
    // Обновляем клиента в списке
    setClients(prev => prev.map(c => 
      c.id === updatedClient.id ? updatedClient : c
    ));
    
    // Если это выбранный клиент, обновляем его
    if (selectedClient && selectedClient.id === updatedClient.id) {
      setSelectedClient(updatedClient);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-100 dark:bg-itm-dark-primary">
      {/* Левая панель - список клиентов */}
      <div className="w-1/3 border-r border-gray-200 dark:border-itm-border bg-white dark:bg-itm-dark-secondary overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-itm-border">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-gray-900 dark:text-itm-text-primary">{t('chats.title')}</h2>
            <button
              onClick={() => window.location.href = '/dashboard/bulk-messaging'}
              className="px-3 py-1 bg-blue-500 dark:bg-itm-dark-highlight text-white rounded-md text-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              Bulk Message
            </button>
          </div>
          <input
            type="text"
            placeholder={t('chats.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-itm-border bg-gray-50 dark:bg-itm-dark-accent text-gray-900 dark:text-itm-text-primary"
          />
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-itm-dark-highlight"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center p-4 text-gray-500 dark:text-itm-text-secondary">
              {searchTerm ? t('clients.noSearchResults') : t('clients.noClients')}
            </div>
          ) : (
            <ul>
              {filteredClients.map(client => (
                <li 
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`
                    p-4 border-b border-gray-200 dark:border-itm-border cursor-pointer
                    hover:bg-gray-50 dark:hover:bg-itm-dark-accent
                    ${selectedClient?.id === client.id ? 'bg-blue-50 dark:bg-itm-dark-accent' : ''}
                    ${!client.is_dialog_open ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 relative">
                      {client.photo_url ? (
                        <Image
                          src={client.photo_url}
                          alt={getClientDisplayName(client)}
                          width={48}
                          height={48}
                          className="rounded-full cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setIsClientModalOpen(true);
                          }}
                        />
                      ) : (
                        <div 
                          className="h-12 w-12 rounded-full bg-gray-300 dark:bg-itm-dark-accent flex items-center justify-center cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setIsClientModalOpen(true);
                          }}
                        >
                          <span className="text-xl text-gray-700 dark:text-itm-text-primary">
                            {getClientDisplayName(client).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {client.language && (
                        <div className="absolute bottom-0 right-0 h-5 w-5 bg-white dark:bg-itm-dark-secondary rounded-full flex items-center justify-center border border-gray-200 dark:border-itm-border">
                          <span className="text-xs">
                            {client.language === 'en' ? '🇬🇧' : client.language === 'ru' ? '🇷🇺' : client.language}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-itm-text-primary">
                          {getClientDisplayName(client)}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-itm-text-secondary">
                          {formatLastMessageTime(client.last_message_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500 dark:text-itm-text-secondary">
                          {client.username ? `@${client.username}` : `ID: ${client.telegram_id}`}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDialogStatus(client);
                          }}
                          className={`
                            text-xs px-2 py-1 rounded
                            ${client.is_dialog_open 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                          `}
                        >
                          {client.is_dialog_open ? 'Open' : 'Closed'}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Правая панель - чат с выбранным клиентом */}
      <div className="w-2/3 flex flex-col bg-white dark:bg-itm-dark-secondary overflow-hidden">
        {selectedClient ? (
          <>
            {/* Заголовок чата */}
            <div className="p-4 border-b border-gray-200 dark:border-itm-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div 
                    className="h-10 w-10 relative cursor-pointer"
                    onClick={() => setIsClientModalOpen(true)}
                  >
                    {selectedClient.photo_url ? (
                      <Image
                        src={selectedClient.photo_url}
                        alt={getClientDisplayName(selectedClient)}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-itm-dark-accent flex items-center justify-center">
                        <span className="text-lg text-gray-700 dark:text-itm-text-primary">
                          {getClientDisplayName(selectedClient).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {selectedClient.language && !isEditingLanguage && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 bg-white dark:bg-itm-dark-primary rounded-full flex items-center justify-center border border-gray-200 dark:border-itm-border">
                        <span className="text-xs">
                          {selectedClient.language === 'en' ? '🇬🇧' : selectedClient.language === 'ru' ? '🇷🇺' : selectedClient.language}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-itm-text-primary">
                      {getClientDisplayName(selectedClient)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-itm-text-secondary">
                      {selectedClient.username ? `@${selectedClient.username}` : `ID: ${selectedClient.telegram_id}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsTicketModalOpen(true)}
                    className="px-3 py-1 bg-purple-500 dark:bg-itm-dark-highlight text-white rounded-md text-sm hover:bg-purple-600 dark:hover:bg-blue-700 transition-colors"
                  >
                    Create Ticket
                  </button>
                  <button
                    onClick={() => toggleDialogStatus(selectedClient)}
                    className={`
                      px-3 py-1 rounded-md text-sm font-medium
                      ${selectedClient.is_dialog_open 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}
                    `}
                  >
                    {selectedClient.is_dialog_open ? 'Dialog Open' : 'Dialog Closed'}
                  </button>
                </div>
              </div>
              
              {/* Панель управления чатом */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {!isEditingLanguage ? (
                    <button 
                      onClick={() => setIsEditingLanguage(true)}
                      className="flex items-center text-xs text-blue-500 hover:text-blue-700"
                    >
                      <span className="mr-1">
                        {selectedClient.language === 'en' ? '🇬🇧' : selectedClient.language === 'ru' ? '🇷🇺' : selectedClient.language}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : (
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded p-1">
                      <button 
                        onClick={() => {
                          setSelectedLanguage('en');
                          handleLanguageChange();
                        }}
                        className={`text-xs p-1 rounded mr-1 ${selectedLanguage === 'en' ? 'bg-white dark:bg-gray-600' : ''}`}
                      >
                        🇬🇧
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedLanguage('ru');
                          handleLanguageChange();
                        }}
                        className={`text-xs p-1 rounded ${selectedLanguage === 'ru' ? 'bg-white dark:bg-gray-600' : ''}`}
                      >
                        🇷🇺
                      </button>
                      {isSavingLanguage && (
                        <span className="ml-1 text-xs text-gray-500">...</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoUpdate"
                      checked={autoUpdate}
                      onChange={() => setAutoUpdate(!autoUpdate)}
                      className="mr-1"
                    />
                    <label htmlFor="autoUpdate" className="text-xs text-gray-500 dark:text-gray-400">
                      Auto-update
                    </label>
                  </div>
                  <button
                    onClick={fetchMessages}
                    disabled={refreshing}
                    className="flex items-center text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                  >
                    {refreshing ? (
                      <span className="animate-spin h-3 w-3 border-b border-blue-500 rounded-full mr-1"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            
            {/* Сообщения */}
            <div className="flex-grow overflow-y-auto p-4 bg-gray-50 dark:bg-itm-dark-primary">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-itm-dark-highlight"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center p-4 text-gray-500 dark:text-itm-text-secondary">
                  {t('messages.noMessages')}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      className={`flex ${message.is_from_bot ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          max-w-[70%] rounded-lg px-4 py-2 
                          ${message.is_from_bot 
                            ? 'bg-blue-500 dark:bg-itm-dark-highlight text-white' 
                            : 'bg-gray-200 dark:bg-itm-dark-accent text-gray-900 dark:text-itm-text-primary'}
                        `}
                      >
                        <p>{message.message_content}</p>
                        <div className={`text-xs mt-1 ${message.is_from_bot ? 'text-blue-100' : 'text-gray-500 dark:text-itm-text-secondary'}`}>
                          {formatLastMessageTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Форма отправки сообщения */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-itm-border">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('chats.typingMessage')}
                  className="flex-grow px-4 py-2 rounded-l-md border border-gray-300 dark:border-itm-border bg-gray-50 dark:bg-itm-dark-accent text-gray-900 dark:text-itm-text-primary"
                  disabled={!selectedClient.is_dialog_open}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !selectedClient.is_dialog_open}
                  className="px-4 py-2 bg-blue-500 dark:bg-itm-dark-highlight text-white rounded-r-md disabled:opacity-50"
                >
                  {t('chats.sendMessage')}
                </button>
              </div>
              {!selectedClient.is_dialog_open && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                  {t('messages.dialogClosed')}
                </p>
              )}
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <p className="text-xl">Select a client to start chatting</p>
          </div>
        )}
      </div>
      
      {/* Модальное окно с информацией о клиенте */}
      <ClientModal
        client={selectedClient}
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientUpdate={handleClientUpdate}
      />
      
      {/* Модальное окно создания заявки */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        initialClient={selectedClient}
      />
      
      {/* Сообщение об ошибке */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 