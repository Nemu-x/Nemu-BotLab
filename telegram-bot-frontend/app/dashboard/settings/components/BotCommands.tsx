import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../../hooks/useTranslation';

interface BotCommand {
  id?: number;
  question: string;
  answer: string;
  isActive: boolean;
}

export default function BotCommands() {
  const { t } = useTranslation();
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bot-commands');
      if (!response.ok) throw new Error('Failed to fetch commands');
      const data = await response.json();
      setCommands(data);
    } catch (error) {
      console.error('Error fetching commands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCommand = () => {
    setCommands([
      ...commands,
      {
        question: '',
        answer: '',
        isActive: true,
      },
    ]);
  };

  const handleRemoveCommand = async (id?: number) => {
    if (!id) {
      setCommands(commands.filter((_, index) => index !== commands.length - 1));
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/bot-commands/${id}/toggle`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle command');
      await fetchCommands();
    } catch (error) {
      console.error('Error toggling command:', error);
    }
  };

  const handleCommandChange = (index: number, field: keyof BotCommand, value: string | boolean) => {
    const newCommands = [...commands];
    newCommands[index] = { ...newCommands[index], [field]: value };
    setCommands(newCommands);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const command of commands) {
        if (command.id) {
          // Update existing command
          const response = await fetch(`http://localhost:3001/api/bot-commands/${command.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
          });
          if (!response.ok) throw new Error('Failed to update command');
        } else {
          // Create new command
          const response = await fetch('http://localhost:3001/api/bot-commands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
          });
          if (!response.ok) throw new Error('Failed to create command');
        }
      }
      await fetchCommands();
    } catch (error) {
      console.error('Error saving commands:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('settings.sections.commands.title')}</h3>
        <button
          onClick={handleAddCommand}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          {t('settings.sections.commands.add')}
        </button>
      </div>

      <div className="space-y-4">
        {commands.map((command, index) => (
          <div key={command.id || index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('settings.sections.commands.question')}
                </label>
                <input
                  type="text"
                  className="input mt-1"
                  value={command.question}
                  onChange={(e) => handleCommandChange(index, 'question', e.target.value)}
                  placeholder={t('settings.sections.commands.questionPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('settings.sections.commands.answer')}
                </label>
                <textarea
                  className="input mt-1"
                  rows={3}
                  value={command.answer}
                  onChange={(e) => handleCommandChange(index, 'answer', e.target.value)}
                  placeholder={t('settings.sections.commands.answerPlaceholder')}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={command.isActive}
                    onChange={(e) => handleCommandChange(index, 'isActive', e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('settings.sections.commands.active')}
                  </span>
                </label>

                <button
                  onClick={() => handleRemoveCommand(command.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary"
        >
          {isSaving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
} 