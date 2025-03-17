'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChatBubbleLeftRightIcon,
  CommandLineIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/src/config/api';
import { useTranslation } from '@/app/hooks/useTranslation';
import { FiUsers, FiMessageSquare, FiActivity, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import Link from 'next/link';

type DashboardStats = {
  activeUsers: number;
  totalChats: number;
  commandsUsed: number;
  activeOperators: number;
  responseRate: string;
  avgResponseTime: string;
}

// Определяем типы для активности
type Activity = {
  id: string;
  type: 'message' | 'new_user' | 'completed_flow' | 'flow_error';
  client: string;
  content: string;
  time: string;
  timestamp: string;
};

// Определяем типы для flow
type Flow = {
  id: string | number;
  name: string;
  description: string;
  isActive: boolean;
  isDefault?: boolean;
  steps?: any[];
};

// Stat card component for reusability
type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// Activity item component
function ActivityItem({ activity }: { activity: Activity }) {
  let icon, content, actionColor;

  switch (activity.type) {
    case 'new_user':
      icon = <FiUsers className="w-5 h-5 text-blue-500" />;
      content = <span>Новый пользователь: <span className="font-medium">{activity.client}</span></span>;
      actionColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'completed_flow':
      icon = <FiCheckCircle className="w-5 h-5 text-green-500" />;
      content = <span><span className="font-medium">{activity.client}</span> завершил сценарий: <span className="font-medium">{activity.content}</span></span>;
      actionColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'message':
      icon = <FiMessageSquare className="w-5 h-5 text-purple-500" />;
      content = <span>Клиент #{activity.id}: "{activity.content}"</span>;
      actionColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      break;
    case 'flow_error':
      icon = <FiAlertCircle className="w-5 h-5 text-red-500" />;
      content = <span>Ошибка в сценарии <span className="font-medium">{activity.content}</span>: {activity.content}</span>;
      actionColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      break;
    default:
      icon = <FiActivity className="w-5 h-5 text-gray-500" />;
      content = <span>Неизвестная активность: {activity.content || 'Нет деталей'}</span>;
      actionColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  return (
    <div className="flex space-x-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-gray-800 dark:text-gray-200">
          {content}
        </div>
        <div className="mt-1 flex">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            <FiClock className="inline mr-1 w-3 h-3" /> {activity.time || activity.timestamp || 'Только что'}
          </span>
          <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${actionColor}`}>
            {activity.type === 'message' ? 'сообщение' : 
             activity.type === 'new_user' ? 'новый пользователь' : 
             activity.type === 'completed_flow' ? 'завершенный сценарий' : 
             activity.type === 'flow_error' ? 'ошибка сценария' : activity.type}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activeUsers: 0,
    totalChats: 0,
    commandsUsed: 0,
    activeOperators: 0,
    responseRate: '0%',
    avgResponseTime: '0s'
  });
  const [activeFlows, setActiveFlows] = useState<Flow[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  // Функция форматирования времени
  const formatTime = (dateString: string): string => {
    if (!dateString) return 'Недавно';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Если сегодня
    if (date.toDateString() === now.toDateString()) {
      return `Сегодня, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Если вчера
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Вчера, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Иначе дата
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('Dashboard: Начинаем загрузку данных дашборда');
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
      
      // Получаем данные клиентов
      const clients = await api.getClients().catch(err => {
        console.error('Dashboard: Ошибка при загрузке клиентов:', err);
        return [];
      });
      console.log(`Dashboard: Получено ${clients?.length || 0} клиентов`);
      
      // Получаем данные команд
      const commands = await api.getCommands().catch(err => {
        console.error('Dashboard: Ошибка при загрузке команд:', err);
        return [];
      });
      console.log(`Dashboard: Получено ${commands?.length || 0} команд`);
      
      // Получаем данные пользователей (операторов)
      const users = await api.getUsers().catch(err => {
        console.error('Dashboard: Ошибка при загрузке пользователей:', err);
        return [];
      });
      console.log(`Dashboard: Получено ${users?.length || 0} пользователей`);
      
      // Получаем данные flows
      const flows = await api.getFlows().catch(err => {
        console.error('Dashboard: Ошибка при загрузке flows:', err);
        return [];
      });
      console.log(`Dashboard: Получено ${flows?.length || 0} flows`);
      
      // Получаем непрочитанные сообщения
      const unreadMessages = await api.getUnreadMessages().catch(err => {
        console.error('Dashboard: Ошибка при загрузке непрочитанных сообщений:', err);
        return [];
      });
      console.log(`Dashboard: Получено ${unreadMessages?.length || 0} непрочитанных сообщений`);
      
      // Получаем все сообщения для активности
      const allMessages = await fetch('/api/messages?limit=10', { headers })
        .then(res => res.ok ? res.json() : [])
        .catch(err => {
          console.error('Dashboard: Ошибка при загрузке всех сообщений:', err);
          return [];
        });
      console.log(`Dashboard: Получено ${allMessages?.length || 0} сообщений для активности`);
      
      // Создаем массив всех messages
      const messages = Array.isArray(allMessages) ? allMessages : unreadMessages;
      
      // Подсчитываем активных пользователей - тех, кто написал сообщение за последние 24 часа
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Используем данные клиентов для подсчета активных
      const activeUsers = clients.filter((client: any) => {
        if (!client.lastActivity) return false;
        const lastActivity = new Date(client.lastActivity);
        return lastActivity > oneDayAgo;
      }).length;
      
      // Активных операторов считаем как операторов с ролью 'operator' и статусом isActive
      const activeOperators = users.filter((user: any) => 
        user.role === 'operator' && user.isActive
      ).length || 0;
      
      // Активные flows (имеют флаг isActive)
      const activeFlows = flows.filter((flow: any) => flow.isActive);
      
      // Обновляем состояние статистики
      setStats({
        activeUsers: activeUsers || 0,
        totalChats: clients.length || 0,
        commandsUsed: commands.length || 0,
        activeOperators: activeOperators || 0,
        responseRate: unreadMessages.length > 0 ? '95%' : '100%',
        avgResponseTime: '1.8s'
      });
      
      // Устанавливаем активные flows
      setActiveFlows(activeFlows);
      
      // Форматируем данные активности
      let recentActivity: Activity[] = [];
      
      // Добавляем последние сообщения от клиентов
      if (Array.isArray(messages) && messages.length > 0) {
        recentActivity = messages.slice(0, 5).map((msg: any) => {
          const clientName = clients.find((c: any) => c.id === msg.clientId)?.username || 'Unknown';
          return {
            id: msg.id,
            type: 'message' as const,
            client: clientName,
            content: msg.content,
            time: formatTime(msg.createdAt),
            timestamp: msg.createdAt,
          };
        });
      }
      
      // Если недостаточно реальных сообщений, добавляем тестовые данные только если нет реальных данных
      if (recentActivity.length === 0) {
        recentActivity = [
          { 
            id: 'test1', 
            type: 'new_user' as const, 
            client: 'Test User', 
            content: 'Новый пользователь зарегистрировался', 
            time: 'Сегодня, 10:25',
            timestamp: new Date().toISOString() 
          },
          { 
            id: 'test2', 
            type: 'completed_flow' as const, 
            client: 'John Doe', 
            content: 'Завершил опрос: Обратная связь', 
            time: 'Вчера, 14:30',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
          }
        ].slice(0, 5);
      }
      
      // Устанавливаем последние активности
      setRecentActivity(recentActivity);
      
    } catch (err) {
      console.error('Dashboard: Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Update data every 30 seconds
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const statCards = [
    { name: t('dashboard.activeUsers'), value: stats.activeUsers.toString(), icon: FiUsers },
    { name: t('dashboard.totalChats'), value: stats.totalChats.toString(), icon: FiMessageSquare },
    { name: t('dashboard.successRate'), value: stats.responseRate, icon: FiCheckCircle },
    { name: t('dashboard.responseTime'), value: stats.avgResponseTime, icon: FiActivity },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcome')}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t('dashboard.overview')}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.statistics')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <StatCard
              key={index}
              title={card.name}
              value={card.value}
              icon={<card.icon className="h-6 w-6 text-white" />}
              color={
                index === 0
                  ? 'bg-blue-500'
                  : index === 1
                  ? 'bg-indigo-500'
                  : index === 2
                  ? 'bg-green-500'
                  : 'bg-purple-500'
              }
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Flows */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('dashboard.activeFlows')}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.activeFlowsDescription')}
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {activeFlows.length > 0 ? (
              activeFlows.map(flow => (
                <div key={flow.id} className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {flow.name}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    {flow.isDefault ? t('flows.default') : t('common.active')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('flows.noFlows')}
                </p>
              </div>
            )}
            <div className="mt-6">
              <Link 
                href="/ru/dashboard/flows" 
                className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center"
              >
                {t('dashboard.manageFlows')}
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('dashboard.recentActivity')}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.recentActivityDescription')}
            </p>
          </div>
          <div className="px-4 py-3 sm:px-6 divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Нет недавней активности
                </p>
              </div>
            )}
          </div>
          <div className="px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/ru/dashboard/dialogs" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {t('dashboard.viewAllActivity')} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 