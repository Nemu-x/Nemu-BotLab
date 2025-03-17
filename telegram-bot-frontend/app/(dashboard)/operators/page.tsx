'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

type Operator = {
  id: number;
  name: string;
  email: string;
  telegramUsername: string;
  role: 'admin' | 'operator';
  isActive: boolean;
  lastActive: string;
};

const mockOperators: Operator[] = [
  {
    id: 1,
    name: 'Администратор',
    email: 'admin@example.com',
    telegramUsername: '@admin',
    role: 'admin',
    isActive: true,
    lastActive: '2 минуты назад',
  },
  {
    id: 2,
    name: 'Оператор 1',
    email: 'operator1@example.com',
    telegramUsername: '@operator1',
    role: 'operator',
    isActive: true,
    lastActive: '1 час назад',
  },
  {
    id: 3,
    name: 'Оператор 2',
    email: 'operator2@example.com',
    telegramUsername: '@operator2',
    role: 'operator',
    isActive: false,
    lastActive: '2 дня назад',
  },
];

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    const timer = setTimeout(() => {
      setOperators(mockOperators);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAddOperator = () => {
    setIsEditing(true);
    setEditingOperator({
      id: Date.now(),
      name: '',
      email: '',
      telegramUsername: '',
      role: 'operator',
      isActive: true,
      lastActive: 'Никогда',
    });
  };

  const handleEditOperator = (operator: Operator) => {
    setIsEditing(true);
    setEditingOperator(operator);
  };

  const handleSaveOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOperator) return;

    // TODO: Replace with actual API call
    if (editingOperator.id === Date.now()) {
      setOperators([...operators, editingOperator]);
    } else {
      setOperators(operators.map(op => 
        op.id === editingOperator.id ? editingOperator : op
      ));
    }

    setIsEditing(false);
    setEditingOperator(null);
  };

  const handleDeleteOperator = (id: number) => {
    // TODO: Replace with actual API call
    setOperators(operators.filter(op => op.id !== id));
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Операторы</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление операторами и их правами доступа
          </p>
        </div>
        <button
          onClick={handleAddOperator}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Добавить оператора
        </button>
      </div>

      {isEditing && editingOperator && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium">
            {editingOperator.id === Date.now() ? 'Новый оператор' : 'Редактирование оператора'}
          </h2>
          <form onSubmit={handleSaveOperator} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Имя
                </label>
                <input
                  type="text"
                  id="name"
                  className="input mt-1"
                  value={editingOperator.name}
                  onChange={e => setEditingOperator({ ...editingOperator, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="input mt-1"
                  value={editingOperator.email}
                  onChange={e => setEditingOperator({ ...editingOperator, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="telegramUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telegram username
                </label>
                <input
                  type="text"
                  id="telegramUsername"
                  className="input mt-1"
                  value={editingOperator.telegramUsername}
                  onChange={e => setEditingOperator({ ...editingOperator, telegramUsername: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Роль
                </label>
                <select
                  id="role"
                  className="input mt-1"
                  value={editingOperator.role}
                  onChange={e => setEditingOperator({ ...editingOperator, role: e.target.value as 'admin' | 'operator' })}
                >
                  <option value="operator">Оператор</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={editingOperator.isActive}
                onChange={e => setEditingOperator({ ...editingOperator, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Активен
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingOperator(null);
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
                Оператор
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Контакты
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Роль
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
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                </tr>
              ))
            ) : operators.length > 0 ? (
              operators.map((operator) => (
                <tr key={operator.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                          <span className="text-sm font-medium leading-none text-primary-700 dark:text-primary-300">
                            {operator.name.charAt(0).toUpperCase()}
                          </span>
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {operator.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Активность: {operator.lastActive}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {operator.email}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {operator.telegramUsername}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      operator.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {operator.role === 'admin' ? 'Администратор' : 'Оператор'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      operator.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                    }`}>
                      {operator.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditOperator(operator)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOperator(operator.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={operator.role === 'admin'}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Операторы не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 