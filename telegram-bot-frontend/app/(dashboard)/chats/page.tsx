'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type Chat = {
  id: number;
  username: string;
  lastMessage: string;
  lastActivity: string;
  status: 'active' | 'pending' | 'closed';
};

const mockChats: Chat[] = [
  {
    id: 1,
    username: '@user1',
    lastMessage: 'Здравствуйте, у меня вопрос по доставке',
    lastActivity: '2 минуты назад',
    status: 'active',
  },
  {
    id: 2,
    username: '@user2',
    lastMessage: 'Спасибо за помощь!',
    lastActivity: '15 минут назад',
    status: 'closed',
  },
  {
    id: 3,
    username: '@user3',
    lastMessage: 'Когда будет доступна эта функция?',
    lastActivity: '1 час назад',
    status: 'pending',
  },
];

export default function ChatsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const timer = setTimeout(() => {
      setChats(mockChats);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredChats = chats.filter(chat =>
    chat.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Chat['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Активные чаты</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Управление чатами и обращениями пользователей
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Поиск по чатам..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Chats list */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading ? (
            // Loading state
            [...Array(3)].map((_, i) => (
              <li key={i} className="p-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              </li>
            ))
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <li
                key={chat.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                      <span className="text-sm font-medium leading-none text-primary-700 dark:text-primary-300">
                        {chat.username.charAt(1).toUpperCase()}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {chat.username}
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {chat.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(chat.status)}`}>
                      {chat.status === 'active' ? 'Активный' :
                       chat.status === 'pending' ? 'Ожидает' : 'Закрыт'}
                    </span>
                    <time className="text-xs text-gray-500 dark:text-gray-400">
                      {chat.lastActivity}
                    </time>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500 dark:text-gray-400">
              Чаты не найдены
            </li>
          )}
        </ul>
      </div>
    </div>
  );
} 