'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChatBubbleLeftRightIcon,
  CommandLineIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { api, getDashboardStats, getDashboardActivity, getDashboardTimeAnalytics } from '@/src/config/api';
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
  name: string;
  value: string | number;
  secondaryValue: string;
  icon: React.ReactNode;
  link?: string;
};

function StatCard({ name, value, secondaryValue, icon, link }: StatCardProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-itm-dark-secondary rounded-lg shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl text-gray-700 dark:text-itm-text-primary">
              {icon}
            </span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-itm-text-secondary truncate">
                {name}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-itm-text-primary">
                  {value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {secondaryValue}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {link && (
        <div className="bg-gray-50 dark:bg-itm-dark-accent px-5 py-3">
          <div className="text-sm">
            <Link
              href={link}
              className="font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
            >
              View all &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Activity item component
function ActivityItem({ activity }: { activity: Activity }) {
  let icon, content, actionColor;

  switch (activity.type) {
    case 'new_user':
      icon = <FiUsers className="w-5 h-5 text-blue-500" />;
      content = <span>New user registered: <span className="font-medium">{activity.client}</span></span>;
      actionColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'completed_flow':
      icon = <FiCheckCircle className="w-5 h-5 text-green-500" />;
      content = <span><span className="font-medium">{activity.client}</span> completed the flow: <span className="font-medium">{activity.content}</span></span>;
      actionColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'message':
      icon = <FiMessageSquare className="w-5 h-5 text-purple-500" />;
      content = <span>Client #{activity.id}: "{activity.content}"</span>;
      actionColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      break;
    case 'flow_error':
      icon = <FiAlertCircle className="w-5 h-5 text-red-500" />;
      content = <span>Error in flow <span className="font-medium">{activity.content}</span>: {activity.content}</span>;
      actionColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      break;
    default:
      icon = <FiActivity className="w-5 h-5 text-gray-500" />;
      content = <span>Unknown activity: {activity.content || 'No details'}</span>;
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
            <FiClock className="inline mr-1 w-3 h-3" /> {activity.time || activity.timestamp || 'Just now'}
          </span>
          <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${actionColor}`}>
            {activity.type.replace('_', ' ')}
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
  const [dashboardData, setDashboardData] = useState<any>({
    clients: { total: 0, newThisMonth: 0, activeToday: 0, growthRate: '0%' },
    messages: { total: 0, today: 0, averagePerDay: 0 },
    operators: { total: 0, active: 0 },
    commands: { total: 0, active: 0 },
    flows: { total: 0, active: 0 },
    tickets: { total: 0, open: 0, resolutionRate: 0 },
    performance: { responseRate: '0%', avgResponseTime: '0 min', customerSatisfaction: '0%' }
  });
  const [activeFlows, setActiveFlows] = useState<Flow[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<number[]>(Array(24).fill(0));

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
      
      // Используем новые методы API
      const statsData = await getDashboardStats().catch(err => {
        console.error('Dashboard: Ошибка при загрузке статистики:', err);
        return null;
      });
      
      if (statsData) {
        console.log('Dashboard: Получены данные статистики:', statsData);
        setDashboardData(statsData);
        
        // Обновляем стандартные статы для совместимости со старым кодом
        setStats({
          activeUsers: statsData.clients.activeToday || 0,
          totalChats: statsData.clients.total || 0,
          commandsUsed: statsData.commands.total || 0,
          activeOperators: statsData.operators.active || 0,
          responseRate: statsData.performance.responseRate || '0%',
          avgResponseTime: statsData.performance.avgResponseTime || '0s'
        });
      } else {
        // Запасной вариант, если новое API недоступно
        await fetchLegacyData();
      }
      
      // Получаем данные активности
      const activityData = await getDashboardActivity(10).catch(err => {
        console.error('Dashboard: Ошибка при загрузке активности:', err);
        return [];
      });
      
      if (Array.isArray(activityData) && activityData.length > 0) {
        console.log(`Dashboard: Получено ${activityData.length} записей активности`);
        
        // Преобразуем в формат для отображения
        const formattedActivity = activityData.map(item => ({
          id: item.id,
          type: item.type,
          client: item.clientName,
          content: item.content,
          time: formatTime(item.timestamp),
          timestamp: item.timestamp
        }));
        
        setRecentActivity(formattedActivity);
      }
      
      // Получаем данные по активности по времени суток
      const timeAnalytics = await getDashboardTimeAnalytics().catch(err => {
        console.error('Dashboard: Ошибка при загрузке аналитики по времени:', err);
        return null;
      });
      
      if (timeAnalytics && timeAnalytics.hourlyDistribution) {
        console.log('Dashboard: Получены данные по активности по часам');
        setHourlyActivity(timeAnalytics.hourlyDistribution);
      }
      
      // Получаем данные flows
      const flows = await api.getFlows().catch(err => {
        console.error('Dashboard: Ошибка при загрузке flows:', err);
        return [];
      });
      
      if (Array.isArray(flows)) {
        console.log(`Dashboard: Получено ${flows.length} flows`);
        // Активные flows (имеют флаг isActive)
        const activeFlows = flows.filter((flow: any) => flow.isActive);
        setActiveFlows(activeFlows);
      }
      
    } catch (err) {
      console.error('Dashboard: Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Запасной метод получения данных, если новое API недоступно
  const fetchLegacyData = async () => {
    try {
      // Получаем данные клиентов
      const clients = await api.getClients().catch(err => {
        console.error('Dashboard: Ошибка при загрузке клиентов:', err);
        return [];
      });
      
      // Получаем данные команд
      const commands = await api.getCommands().catch(err => {
        console.error('Dashboard: Ошибка при загрузке команд:', err);
        return [];
      });
      
      // Получаем данные пользователей (операторов)
      const users = await api.getUsers().catch(err => {
        console.error('Dashboard: Ошибка при загрузке пользователей:', err);
        return [];
      });
      
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
      
      // Обновляем состояние статистики
      setStats({
        activeUsers: activeUsers || 0,
        totalChats: clients.length || 0,
        commandsUsed: commands.length || 0,
        activeOperators: activeOperators || 0,
        responseRate: '95%',
        avgResponseTime: '1.8s'
      });
    } catch (err) {
      console.error('Dashboard: Error fetching legacy data:', err);
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

  // Расширенные карточки статистики
  const statCards = [
    { 
      name: t('dashboard.activeUsers'), 
      value: dashboardData.clients.activeToday,
      secondaryValue: `${dashboardData.clients.growthRate} ${t('dashboard.growth')}`,
      icon: <FiUsers className="w-6 h-6" />,
      link: '/dashboard/clients'
    },
    { 
      name: t('dashboard.totalChats'), 
      value: dashboardData.messages.total,
      secondaryValue: `${dashboardData.messages.today} ${t('dashboard.today')}`,
      icon: <FiMessageSquare className="w-6 h-6" />,
      link: '/dashboard/chats'
    },
    { 
      name: t('dashboard.commandsUsed'), 
      value: dashboardData.commands.total,
      secondaryValue: `${dashboardData.commands.active} ${t('dashboard.active')}`,
      icon: <FiActivity className="w-6 h-6" />,
      link: '/dashboard/commands'
    },
    { 
      name: t('dashboard.activeOperators'), 
      value: dashboardData.operators.active,
      secondaryValue: `${t('dashboard.outOf')} ${dashboardData.operators.total}`,
      icon: <FiUsers className="w-6 h-6" />,
      link: '/dashboard/operators'
    },
    { 
      name: t('dashboard.openTickets'), 
      value: dashboardData.tickets.open,
      secondaryValue: `${dashboardData.tickets.resolutionRate}% ${t('dashboard.resolved')}`,
      icon: <FiCheckCircle className="w-6 h-6" />,
      link: '/dashboard/tickets'
    },
    { 
      name: t('dashboard.responseTime'), 
      value: dashboardData.performance.avgResponseTime.replace('мин', 'min'),
      secondaryValue: `${dashboardData.performance.responseRate} ${t('dashboard.responseRate')}`,
      icon: <FiClock className="w-6 h-6" />
    },
  ];

  // Функция для отображения рейтинга часов активности
  const renderHourlyChart = () => {
    const maxValue = Math.max(...hourlyActivity);
    
    return (
      <div className="mt-4 flex items-end space-x-1 h-40">
        {hourlyActivity.map((count, hour) => {
          const height = maxValue > 0 ? (count / maxValue) * 100 : 0;
          const isPeak = count === maxValue && maxValue > 0;
          
          return (
            <div key={hour} className="flex flex-col items-center flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {count > 0 && count}
              </div>
              <div 
                className={`w-full ${isPeak ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-indigo-200 dark:bg-indigo-800'} rounded-t`}
                style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
              ></div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {hour}:00
              </div>
            </div>
          );
        })}
      </div>
    );
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

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            name={stat.name}
            value={stat.value}
            secondaryValue={stat.secondaryValue}
            icon={stat.icon}
            link={stat.link}
          />
        ))}
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
                href="/dashboard/flows" 
                className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center"
              >
                {t('dashboard.manageFlows')}
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                  {t('dashboard.noActivity')}
                </p>
              </div>
            )}
          </div>
          <div className="px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/dashboard/chats" 
              className="text-sm font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {t('dashboard.viewAllActivity')} <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
        
        {/* Hourly Activity Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('dashboard.hourlyActivity')}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.hourlyActivityDescription')}
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {renderHourlyChart()}
          </div>
          <div className="px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.basedOnLastWeek')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 