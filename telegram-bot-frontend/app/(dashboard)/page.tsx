'use client';

import { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  CommandLineIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const stats = [
  { name: 'Active Chats', value: '0', icon: ChatBubbleLeftRightIcon },
  { name: 'Commands Used', value: '0', icon: CommandLineIcon },
  { name: 'Active Operators', value: '0', icon: UsersIcon },
  { name: 'Response Rate', value: '0%', icon: ArrowTrendingUpIcon },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual stats from the API
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your bot's performance and activity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-gray-800"
          >
            <dt>
              <div className="absolute rounded-md bg-primary-500/10 p-3">
                <stat.icon
                  className="h-6 w-6 text-primary-600"
                  aria-hidden="true"
                />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              )}
            </dd>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="text-lg font-medium">Recent Activity</h2>
          {isLoading ? (
            <div className="mt-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              No recent activity
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="text-lg font-medium">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button className="btn-primary">
              Add New Command
            </button>
            <button className="btn-secondary">
              View All Chats
            </button>
            <button className="btn-secondary">
              Manage Operators
            </button>
            <button className="btn-secondary">
              Bot Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 