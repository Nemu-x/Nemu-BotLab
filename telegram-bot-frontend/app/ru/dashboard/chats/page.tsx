'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api } from '@/src/config/api';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Message {
  id: string;
  content: string;
  clientId: string;
  createdAt: string;
  isFromBot: boolean;
  is_read?: boolean;
}

interface Chat {
  id: string;
  telegramId: string;
  username: string;
  firstName?: string;
  lastName?: string; 
  lastMessage?: Message;
  lastActivity: string;
  status: 'active' | 'pending' | 'closed';
  unreadCount: number;
  isBlocked?: boolean;
}

export default function ChatsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Загрузка данных о чатах
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        // Получаем клиентов
        console.log('Начинаем загрузку клиентов...');
        const clients = await api.getClients();
        console.log('Получены клиенты:', clients);
        
        if (!clients || !Array.isArray(clients)) {
          console.error('Неожиданный формат данных клиентов:', clients);
          setError('Ошибка загрузки данных клиентов: неожиданный формат данных');
          setIsLoading(false);
          return;
        }
        
        // Для каждого клиента получаем последнее сообщение
        const chatsWithMessages = await Promise.all(
          clients.map(async (client: any) => {
            console.log('Обрабатываем клиента:', client);
            try {
              // Гарантируем, что client.id существует
              if (!client || !client.id) {
                console.error('Клиент не имеет ID:', client);
                return null;
              }
              
              // Получаем сообщения для этого клиента
              const messages = await api.getClientMessages(client.id);
              
              // Находим последнее сообщение
              let lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
              
              // Считаем непрочитанные сообщения (не от бота и не прочитанные)
              const unreadCount = messages ? messages.filter((m: any) => !m.isFromBot && !m.is_read).length : 0;
              
              return {
                id: client.id,
                telegramId: client.telegramId,
                username: client.username || 'Без имени',
                firstName: client.firstName,
                lastName: client.lastName,
                lastMessage: lastMessage,
                lastActivity: lastMessage ? lastMessage.createdAt : client.createdAt,
                status: client.isBlocked ? 'closed' : (unreadCount > 0 ? 'active' : 'pending'),
                unreadCount,
                isBlocked: client.isBlocked
              };
            } catch (error) {
              console.error(`Error fetching messages for client ${client?.id}:`, error);
              return {
                id: client.id,
                telegramId: client.telegramId,
                username: client.username || 'Без имени',
                firstName: client.firstName,
                lastName: client.lastName,
                lastActivity: client.createdAt,
                status: client.isBlocked ? 'closed' : 'pending',
                unreadCount: 0,
                isBlocked: client.isBlocked
              };
            }
          })
        );
        
        // Фильтруем null значения
        const validChats = chatsWithMessages.filter(chat => chat !== null);
        console.log('Обработанные чаты:', validChats);
        
        // Сортируем: сначала с непрочитанными сообщениями, затем по времени последней активности
        const sortedChats = validChats.sort((a, b) => {
          // Сначала сортируем по непрочитанным
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          
          // Затем по времени последней активности
          const aDate = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const bDate = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return bDate - aDate;
        });
        
        setChats(sortedChats);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить чаты');
        console.error('Error fetching chats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
    
    // Обновляем каждые 30 секунд
    const intervalId = setInterval(fetchChats, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Фильтрация чатов по поисковому запросу
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (chat.username && chat.username.toLowerCase().includes(searchTermLower)) ||
      (chat.firstName && chat.firstName.toLowerCase().includes(searchTermLower)) ||
      (chat.lastName && chat.lastName.toLowerCase().includes(searchTermLower)) ||
      chat.lastMessage?.content?.toLowerCase().includes(searchTermLower)
    );
  });
  
  // Цвет статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  
  // Получение отображаемого имени
  const getDisplayName = (chat: Chat) => {
    if (chat.firstName && chat.lastName) {
      return `${chat.firstName} ${chat.lastName}`;
    } else if (chat.firstName) {
      return chat.firstName;
    } else if (chat.username) {
      return `@${chat.username}`;
    } else {
      return `ID: ${chat.telegramId}`;
    }
  };
  
  // Получение первой буквы имени
  const getInitial = (chat: Chat) => {
    if (chat.firstName) {
      return chat.firstName.charAt(0).toUpperCase();
    } else if (chat.username) {
      return chat.username.charAt(0).toUpperCase();
    }
    return 'К';
  };

  // Форматирование времени
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Если сегодня
    if (date >= today) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Если вчера
    else if (date >= yesterday) {
      return 'Вчера';
    }
    // Иначе дата
    else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">Чаты с клиентами</h1>
      
      {/* Поиск */}
      <div className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            placeholder="Поиск по имени или сообщению..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Список чатов */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          // Скелетон-лоадер
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b border-gray-200 bg-white p-4 last:border-0 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                  <div className="mb-2 h-4 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          ))
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div 
              key={chat.id} 
              className="cursor-pointer border-b border-gray-200 bg-white p-4 hover:bg-gray-50 last:border-0 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              onClick={() => router.push(`/ru/dashboard/chats/${chat.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                    {getInitial(chat)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {getDisplayName(chat)} 
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                          {chat.unreadCount}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {chat.lastMessage?.content || 'Нет сообщений'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(chat.lastActivity)}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(chat.status.toString())}`}>
                    {chat.status === 'active' ? 'Активный' : chat.status === 'pending' ? 'Ожидает' : 'Закрыт'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-center bg-white p-8 text-center dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">Чаты не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
} 