'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
  ChatBubbleLeftIcon,
  UserGroupIcon,
  UserIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  CommandLineIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

type Activity = {
  id: string;
  type: 'newChat' | 'operatorAssigned' | 'chatClosed' | 'commandUsed';
  description: string;
  timestamp: string;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'newChat',
    description: 'Новый чат с пользователем @user123',
    timestamp: '2 минуты назад',
  },
  {
    id: '2',
    type: 'operatorAssigned',
    description: 'Оператор Александр назначен на чат #123',
    timestamp: '5 минут назад',
  },
  {
    id: '3',
    type: 'chatClosed',
    description: 'Чат #123 закрыт',
    timestamp: '10 минут назад',
  },
  {
    id: '4',
    type: 'commandUsed',
    description: 'Пользователь @user456 использовал команду /help',
    timestamp: '15 минут назад',
  },
];

const quickActions: QuickAction[] = [
  {
    title: 'Управление диалогами',
    description: 'Настройка автоматических ответов бота',
    href: '/ru/dialogs',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    title: 'Операторы',
    description: 'Управление операторами и их правами',
    href: '/ru/operators',
    icon: UserPlusIcon,
  },
  {
    title: 'Команды',
    description: 'Настройка команд бота',
    href: '/ru/commands',
    icon: CommandLineIcon,
  },
  {
    title: 'Настройки',
    description: 'Общие настройки бота',
    href: '/ru/settings',
    icon: Cog6ToothIcon,
  },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChats: 0,
    activeChats: 0,
    totalUsers: 0,
    responseRate: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalChats: 156,
        activeChats: 23,
        totalUsers: 89,
        responseRate: 95,
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-96 rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Панель управления</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Обзор активности и статистики бота
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-lg bg-primary-100 p-3 dark:bg-primary-900">
              <ChatBubbleLeftIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Всего чатов
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalChats}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Активные чаты
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.activeChats}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Всего пользователей
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Скорость ответа
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.responseRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium">Последняя активность</h2>
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex-shrink-0">
                  {activity.type === 'newChat' && (
                    <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500" />
                  )}
                  {activity.type === 'operatorAssigned' && (
                    <UserPlusIcon className="h-5 w-5 text-green-500" />
                  )}
                  {activity.type === 'chatClosed' && (
                    <ChatBubbleLeftIcon className="h-5 w-5 text-red-500" />
                  )}
                  {activity.type === 'commandUsed' && (
                    <CommandLineIcon className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium">Быстрые действия</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="flex items-start space-x-3 rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex-shrink-0">
                  <action.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
 