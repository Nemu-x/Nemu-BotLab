'use client';

import { useState, useEffect } from 'react';
import { Cog6ToothIcon, KeyIcon, ChatBubbleBottomCenterTextIcon, BellIcon, UserGroupIcon, PlusIcon, TrashIcon, UserIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import BotCommands from './components/BotCommands';
import { api } from '@/src/config/api';

type Settings = {
  botToken: string;
  webhookUrl: string;
  welcomeMessage: string;
  defaultResponseTime: number;
  notificationEmail: string;
  autoRespond: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  offlineMessage: string;
  notifications: {
    newChat: boolean;
    operatorAssigned: boolean;
    chatClosed: boolean;
  };
  allowedGroups: {
    id: string;
    name: string;
    isActive: boolean;
  }[];
  administrators: {
    id: string;
    username: string;
    role: 'admin' | 'superadmin';
    isActive: boolean;
  }[];
};

const mockSettings: Settings = {
  botToken: process.env.NEXT_PUBLIC_BOT_TOKEN || '',
  webhookUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || '',
  welcomeMessage: 'Hello! How can I help you?',
  defaultResponseTime: 5,
  notificationEmail: 'support@example.com',
  autoRespond: true,
  workingHours: {
    start: '09:00',
    end: '18:00',
  },
  offlineMessage: 'Sorry, we are currently offline. We will respond to you during business hours.',
  notifications: {
    newChat: true,
    operatorAssigned: true,
    chatClosed: true,
  },
  allowedGroups: [
    {
      id: '1',
      name: 'Support Group',
      isActive: true,
    },
    {
      id: '2',
      name: 'Announcements',
      isActive: true,
    },
  ],
  administrators: [
    {
      id: '1',
      username: '@admin',
      role: 'superadmin',
      isActive: true,
    },
    {
      id: '2',
      username: '@moderator',
      role: 'admin',
      isActive: true,
    },
  ],
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>({
    botToken: '',
    webhookUrl: '',
    welcomeMessage: 'Hello! How can I help you?',
    defaultResponseTime: 5,
    notificationEmail: 'support@example.com',
    autoRespond: true,
    workingHours: {
      start: '09:00',
      end: '18:00',
    },
    offlineMessage: 'Sorry, we are currently offline. We will respond to you during business hours.',
    notifications: {
      newChat: true,
      operatorAssigned: true,
      chatClosed: true,
    },
    allowedGroups: [
      {
        id: '1',
        name: 'Support Group',
        isActive: true,
      },
      {
        id: '2',
        name: 'Announcements',
        isActive: true,
      },
    ],
    administrators: [
      {
        id: '1',
        username: '@admin',
        role: 'superadmin',
        isActive: true,
      },
      {
        id: '2',
        username: '@moderator',
        role: 'admin',
        isActive: true,
      },
    ],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setIsLoading(false);
          return;
        }

        console.log('Loading settings with token:', token); // Debug log
        const data = await api.getSettings();
        console.log('Loaded settings:', data); // Debug log
        
        setSettings(prevSettings => ({
          ...prevSettings,
          ...data
        }));
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      console.log('Saving settings:', settings); // Debug log
      await api.updateSettings({
        botToken: settings.botToken,
        webhookUrl: settings.webhookUrl,
        welcomeMessage: settings.welcomeMessage,
        defaultResponseTime: settings.defaultResponseTime,
        notificationEmail: settings.notificationEmail,
        autoRespond: settings.autoRespond,
        workingHours: settings.workingHours,
        offlineMessage: settings.offlineMessage,
        notifications: settings.notifications
      });
      
      // Show success message
      alert('Settings saved successfully');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGroup = () => {
    const newGroup = {
      id: Date.now().toString(),
      name: '',
      isActive: true,
    };
    setSettings({
      ...settings,
      allowedGroups: [...settings.allowedGroups, newGroup],
    });
  };

  const handleRemoveGroup = (id: string) => {
    setSettings({
      ...settings,
      allowedGroups: settings.allowedGroups.filter(group => group.id !== id),
    });
  };

  const handleAddAdmin = () => {
    const newAdmin = {
      id: Date.now().toString(),
      username: '',
      role: 'admin' as const,
      isActive: true,
    };
    setSettings({
      ...settings,
      administrators: [...settings.administrators, newAdmin],
    });
  };

  const handleRemoveAdmin = (id: string) => {
    setSettings({
      ...settings,
      administrators: settings.administrators.filter(admin => admin.id !== id),
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-1/6 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('settings.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bot Configuration */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium">{t('settings.sections.bot.title')}</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="botToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.sections.bot.token')}
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type={showToken ? "text" : "password"}
                  id="botToken"
                  className="input flex-1"
                  value={settings.botToken}
                  onChange={e => setSettings({ ...settings, botToken: e.target.value })}
                  placeholder={t('settings.sections.bot.tokenDescription')}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {showToken ? t('common.hide') : t('common.show')}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('settings.sections.bot.tokenDescription')} (<a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">@BotFather</a>)
              </p>
            </div>

            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.sections.bot.webhook')}
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  id="webhookUrl"
                  className="input"
                  value={settings.webhookUrl}
                  onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
                  placeholder={t('settings.sections.bot.webhookDescription')}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('settings.sections.bot.webhookDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Message Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-2">
            <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium">{t('settings.sections.messages.title')}</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.sections.messages.welcome')}
              </label>
              <div className="mt-1">
                <textarea
                  id="welcomeMessage"
                  rows={3}
                  className="input"
                  value={settings.welcomeMessage}
                  onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="offlineMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.sections.messages.offline')}
              </label>
              <div className="mt-1">
                <textarea
                  id="offlineMessage"
                  rows={3}
                  className="input"
                  value={settings.offlineMessage}
                  onChange={e => setSettings({ ...settings, offlineMessage: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label htmlFor="defaultResponseTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('settings.sections.messages.responseTime')}
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="defaultResponseTime"
                    className="input"
                    min="1"
                    max="60"
                    value={settings.defaultResponseTime}
                    onChange={e => setSettings({ ...settings, defaultResponseTime: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRespond"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={settings.autoRespond}
                  onChange={e => setSettings({ ...settings, autoRespond: e.target.checked })}
                />
                <label htmlFor="autoRespond" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('settings.sections.messages.autoRespond')}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium">{t('settings.sections.notifications.title')}</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="notificationEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.sections.notifications.email')}
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="notificationEmail"
                  className="input"
                  value={settings.notificationEmail}
                  onChange={e => setSettings({ ...settings, notificationEmail: e.target.value })}
                  placeholder={t('settings.sections.notifications.emailDescription')}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('settings.sections.notifications.emailDescription')}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.sections.notifications.events')}
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                    checked={settings.notifications.newChat}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, newChat: e.target.checked }
                    })}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.sections.notifications.newChat')}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                    checked={settings.notifications.operatorAssigned}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, operatorAssigned: e.target.checked }
                    })}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.sections.notifications.operatorAssigned')}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                    checked={settings.notifications.chatClosed}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, chatClosed: e.target.checked }
                    })}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.sections.notifications.chatClosed')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Management */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-medium">Allowed Groups</h2>
            </div>
            <button
              onClick={handleAddGroup}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Group
            </button>
          </div>

          <div className="space-y-4">
            {settings.allowedGroups.map((group) => (
              <div key={group.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        allowedGroups: settings.allowedGroups.map(g =>
                          g.id === group.id ? { ...g, name: e.target.value } : g
                        ),
                      });
                    }}
                    className="input"
                    placeholder="Group name"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={group.isActive}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          allowedGroups: settings.allowedGroups.map(g =>
                            g.id === group.id ? { ...g, isActive: e.target.checked } : g
                          ),
                        });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveGroup(group.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Administrators Management */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-medium">Administrators</h2>
            </div>
            <button
              onClick={handleAddAdmin}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Administrator
            </button>
          </div>

          <div className="space-y-4">
            {settings.administrators.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={admin.username}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        administrators: settings.administrators.map(a =>
                          a.id === admin.id ? { ...a, username: e.target.value } : a
                        ),
                      });
                    }}
                    className="input"
                    placeholder="Telegram username"
                  />
                  <select
                    value={admin.role}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        administrators: settings.administrators.map(a =>
                          a.id === admin.id ? { ...a, role: e.target.value as 'admin' | 'superadmin' } : a
                        ),
                      });
                    }}
                    className="input"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={admin.isActive}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          administrators: settings.administrators.map(a =>
                            a.id === admin.id ? { ...a, isActive: e.target.checked } : a
                          ),
                        });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAdmin(admin.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
} 