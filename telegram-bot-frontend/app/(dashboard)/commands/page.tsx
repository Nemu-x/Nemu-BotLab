'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

type Command = {
  id: number;
  command: string;
  description: string;
  response: string;
  isActive: boolean;
};

const mockCommands: Command[] = [
  {
    id: 1,
    command: '/start',
    description: 'Начало работы с ботом',
    response: 'Добро пожаловать! Я бот поддержки. Чем могу помочь?',
    isActive: true,
  },
  {
    id: 2,
    command: '/help',
    description: 'Список доступных команд',
    response: 'Доступные команды:\n/start - Начать\n/help - Помощь\n/status - Статус заказа',
    isActive: true,
  },
  {
    id: 3,
    command: '/status',
    description: 'Проверка статуса заказа',
    response: 'Пожалуйста, укажите номер вашего заказа.',
    isActive: false,
  },
];

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    const timer = setTimeout(() => {
      setCommands(mockCommands);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAddCommand = () => {
    setIsEditing(true);
    setEditingCommand({
      id: Date.now(),
      command: '',
      description: '',
      response: '',
      isActive: true,
    });
  };

  const handleEditCommand = (command: Command) => {
    setIsEditing(true);
    setEditingCommand(command);
  };

  const handleSaveCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommand) return;

    // TODO: Replace with actual API call
    if (editingCommand.id === Date.now()) {
      setCommands([...commands, editingCommand]);
    } else {
      setCommands(commands.map(cmd => 
        cmd.id === editingCommand.id ? editingCommand : cmd
      ));
    }

    setIsEditing(false);
    setEditingCommand(null);
  };

  const handleDeleteCommand = (id: number) => {
    // TODO: Replace with actual API call
    setCommands(commands.filter(cmd => cmd.id !== id));
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Команды бота</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление командами и ответами бота
          </p>
        </div>
        <button
          onClick={handleAddCommand}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Добавить команду
        </button>
      </div>

      {isEditing && editingCommand && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium">
            {editingCommand.id === Date.now() ? 'Новая команда' : 'Редактирование команды'}
          </h2>
          <form onSubmit={handleSaveCommand} className="space-y-4">
            <div>
              <label htmlFor="command" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Команда
              </label>
              <input
                type="text"
                id="command"
                className="input mt-1"
                value={editingCommand.command}
                onChange={e => setEditingCommand({ ...editingCommand, command: e.target.value })}
                placeholder="/command"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Описание
              </label>
              <input
                type="text"
                id="description"
                className="input mt-1"
                value={editingCommand.description}
                onChange={e => setEditingCommand({ ...editingCommand, description: e.target.value })}
                placeholder="Описание команды"
                required
              />
            </div>
            <div>
              <label htmlFor="response" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ответ
              </label>
              <textarea
                id="response"
                rows={3}
                className="input mt-1"
                value={editingCommand.response}
                onChange={e => setEditingCommand({ ...editingCommand, response: e.target.value })}
                placeholder="Текст ответа бота"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={editingCommand.isActive}
                onChange={e => setEditingCommand({ ...editingCommand, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Активна
              </label>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingCommand(null);
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button type="submit" className="btn-primary">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Команда
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Описание
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Статус
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {isLoading ? (
              // Loading state
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                </tr>
              ))
            ) : commands.length > 0 ? (
              commands.map((command) => (
                <tr key={command.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-mono text-sm text-gray-900 dark:text-white">
                      {command.command}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {command.description}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {command.response.length > 50
                        ? `${command.response.slice(0, 50)}...`
                        : command.response}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      command.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                    }`}>
                      {command.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditCommand(command)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCommand(command.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Команды не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 