'use client';

import { useState, useEffect } from 'react';
import { Cog6ToothIcon, KeyIcon, ChatBubbleBottomCenterTextIcon, BellIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

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
};

const mockSettings: Settings = {
  botToken: process.env.NEXT_PUBLIC_BOT_TOKEN || '',
  webhookUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || '',
  welcomeMessage: 'Здравствуйте! Чем могу помочь?',
  defaultResponseTime: 5,
  notificationEmail: 'support@example.com',
  autoRespond: true,
  workingHours: {
    start: '09:00',
    end: '18:00',
  },
  offlineMessage: 'Извините, мы сейчас не в сети. Мы ответим вам в рабочее время.',
  notifications: {
    newChat: true,
    operatorAssigned: true,
    chatClosed: true,
  },
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>(mockSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    // TODO: Replace with actual API call
    const timer = setTimeout(() => {
      setSettings(mockSettings);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify bot token
      const response = await fetch(`https://api.telegram.org/bot${settings.botToken}/getMe`);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error('Invalid bot token');
      }

      // Set webhook
      if (settings.webhookUrl) {
        const webhookResponse = await fetch(`https://api.telegram.org/bot${settings.botToken}/setWebhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: settings.webhookUrl,
          }),
        });
        const webhookData = await webhookResponse.json();
        
        if (!webhookData.ok) {
          throw new Error('Failed to set webhook');
        }
      }

    } catch (error) {
      console.error('Error saving settings:', error);
      // TODO: Show error message to user
    } finally {
      setIsSaving(false);
    }
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
                  placeholder="https://your-domain.com/api/webhook"
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
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.sections.notifications.notifyOn')}
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifyNewChat"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={settings.notifications.newChat}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, newChat: e.target.checked }
                    })}
                  />
                  <label htmlFor="notifyNewChat" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.sections.notifications.newChat')}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifyOperatorAssigned"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={settings.notifications.operatorAssigned}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, operatorAssigned: e.target.checked }
                    })}
                  />
                  <label htmlFor="notifyOperatorAssigned" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.sections.notifications.operatorAssigned')}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifyChatClosed"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={settings.notifications.chatClosed}
                    onChange={e => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, chatClosed: e.target.checked }
                    })}
                  />
                  <label htmlFor="notifyChatClosed" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.sections.notifications.chatClosed')}
                  </label>
                </div>
              </div>
            </div>
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