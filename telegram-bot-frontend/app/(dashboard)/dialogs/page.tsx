'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

type DialogCondition = {
  type: 'text' | 'button' | 'command' | 'regex';
  value: string;
};

type DialogResponse = {
  id: number;
  text: string;
  buttons?: string[];
};

type DialogStep = {
  id: number;
  name: string;
  description: string;
  conditions: DialogCondition[];
  response: DialogResponse;
  nextSteps?: number[];
  isActive: boolean;
};

const mockDialogs: DialogStep[] = [
  {
    id: 1,
    name: 'Приветствие',
    description: 'Начальный диалог при первом обращении',
    conditions: [
      { type: 'command', value: '/start' },
      { type: 'text', value: 'привет' },
      { type: 'text', value: 'здравствуйте' }
    ],
    response: {
      id: 1,
      text: 'Здравствуйте! Я виртуальный помощник. Чем могу помочь?',
      buttons: ['Задать вопрос', 'Связаться с оператором']
    },
    nextSteps: [2, 3],
    isActive: true
  },
  {
    id: 2,
    name: 'Задать вопрос',
    description: 'Обработка запроса на вопрос',
    conditions: [
      { type: 'text', value: 'задать вопрос' },
      { type: 'button', value: 'Задать вопрос' }
    ],
    response: {
      id: 2,
      text: 'Пожалуйста, опишите ваш вопрос. Я постараюсь помочь или передам его оператору.',
    },
    isActive: true
  },
  {
    id: 3,
    name: 'Связь с оператором',
    description: 'Перевод диалога на оператора',
    conditions: [
      { type: 'text', value: 'оператор' },
      { type: 'button', value: 'Связаться с оператором' }
    ],
    response: {
      id: 3,
      text: 'Я перевожу вас на оператора. Пожалуйста, подождите немного.',
    },
    isActive: true
  }
];

export default function DialogsPage() {
  const [dialogs, setDialogs] = useState<DialogStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDialog, setEditingDialog] = useState<DialogStep | null>(null);
  const [expandedDialog, setExpandedDialog] = useState<number | null>(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    const timer = setTimeout(() => {
      setDialogs(mockDialogs);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAddDialog = () => {
    setIsEditing(true);
    setEditingDialog({
      id: Date.now(),
      name: '',
      description: '',
      conditions: [],
      response: {
        id: Date.now(),
        text: '',
        buttons: []
      },
      isActive: true
    });
  };

  const handleEditDialog = (dialog: DialogStep) => {
    setIsEditing(true);
    setEditingDialog(dialog);
  };

  const handleSaveDialog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDialog) return;

    // TODO: Replace with actual API call
    if (editingDialog.id === Date.now()) {
      setDialogs([...dialogs, editingDialog]);
    } else {
      setDialogs(dialogs.map(d => 
        d.id === editingDialog.id ? editingDialog : d
      ));
    }

    setIsEditing(false);
    setEditingDialog(null);
  };

  const handleDeleteDialog = (id: number) => {
    // TODO: Replace with actual API call
    setDialogs(dialogs.filter(d => d.id !== id));
  };

  const handleAddCondition = () => {
    if (!editingDialog) return;
    setEditingDialog({
      ...editingDialog,
      conditions: [...editingDialog.conditions, { type: 'text', value: '' }]
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (!editingDialog) return;
    setEditingDialog({
      ...editingDialog,
      conditions: editingDialog.conditions.filter((_, i) => i !== index)
    });
  };

  const handleAddButton = () => {
    if (!editingDialog) return;
    setEditingDialog({
      ...editingDialog,
      response: {
        ...editingDialog.response,
        buttons: [...(editingDialog.response.buttons || []), '']
      }
    });
  };

  const handleRemoveButton = (index: number) => {
    if (!editingDialog || !editingDialog.response.buttons) return;
    setEditingDialog({
      ...editingDialog,
      response: {
        ...editingDialog.response,
        buttons: editingDialog.response.buttons.filter((_, i) => i !== index)
      }
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Диалоги</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление сценариями диалогов и автоматическими ответами
          </p>
        </div>
        <button
          onClick={handleAddDialog}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Добавить диалог
        </button>
      </div>

      {isEditing && editingDialog && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium">
            {editingDialog.id === Date.now() ? 'Новый диалог' : 'Редактирование диалога'}
          </h2>
          <form onSubmit={handleSaveDialog} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Название
                </label>
                <input
                  type="text"
                  className="input mt-1"
                  value={editingDialog.name}
                  onChange={e => setEditingDialog({ ...editingDialog, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Описание
                </label>
                <input
                  type="text"
                  className="input mt-1"
                  value={editingDialog.description}
                  onChange={e => setEditingDialog({ ...editingDialog, description: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Условия срабатывания
                </label>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  + Добавить условие
                </button>
              </div>
              <div className="space-y-2">
                {editingDialog.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      className="input"
                      value={condition.type}
                      onChange={e => {
                        const newConditions = [...editingDialog.conditions];
                        newConditions[index] = { ...condition, type: e.target.value as DialogCondition['type'] };
                        setEditingDialog({ ...editingDialog, conditions: newConditions });
                      }}
                    >
                      <option value="text">Текст</option>
                      <option value="button">Кнопка</option>
                      <option value="command">Команда</option>
                      <option value="regex">Регулярное выражение</option>
                    </select>
                    <input
                      type="text"
                      className="input flex-1"
                      value={condition.value}
                      onChange={e => {
                        const newConditions = [...editingDialog.conditions];
                        newConditions[index] = { ...condition, value: e.target.value };
                        setEditingDialog({ ...editingDialog, conditions: newConditions });
                      }}
                      placeholder={
                        condition.type === 'text' ? 'Введите текст...' :
                        condition.type === 'button' ? 'Текст кнопки...' :
                        condition.type === 'command' ? '/команда' :
                        'Регулярное выражение...'
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ответ бота
              </label>
              <textarea
                className="input mt-1"
                rows={3}
                value={editingDialog.response.text}
                onChange={e => setEditingDialog({
                  ...editingDialog,
                  response: { ...editingDialog.response, text: e.target.value }
                })}
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Кнопки ответа
                </label>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  + Добавить кнопку
                </button>
              </div>
              <div className="space-y-2">
                {editingDialog.response.buttons?.map((button, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input flex-1"
                      value={button}
                      onChange={e => {
                        const newButtons = [...(editingDialog.response.buttons || [])];
                        newButtons[index] = e.target.value;
                        setEditingDialog({
                          ...editingDialog,
                          response: { ...editingDialog.response, buttons: newButtons }
                        });
                      }}
                      placeholder="Текст кнопки..."
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveButton(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={editingDialog.isActive}
                onChange={e => setEditingDialog({ ...editingDialog, isActive: e.target.checked })}
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
                  setEditingDialog(null);
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

      <div className="space-y-4">
        {isLoading ? (
          // Loading state
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))
        ) : dialogs.map(dialog => (
          <div
            key={dialog.id}
            className="rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800"
          >
            <div
              className="flex cursor-pointer items-center justify-between p-6"
              onClick={() => setExpandedDialog(expandedDialog === dialog.id ? null : dialog.id)}
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {dialog.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {dialog.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  dialog.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                }`}>
                  {dialog.isActive ? 'Активен' : 'Неактивен'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDialog(dialog);
                    }}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDialog(dialog.id);
                    }}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  {expandedDialog === dialog.id ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedDialog === dialog.id && (
              <div className="border-t border-gray-200 p-6 dark:border-gray-700">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Условия срабатывания
                    </h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {dialog.conditions.map((condition, index) => (
                        <li key={index}>
                          {condition.type === 'text' && 'Текст: '}
                          {condition.type === 'button' && 'Кнопка: '}
                          {condition.type === 'command' && 'Команда: '}
                          {condition.type === 'regex' && 'Регулярное выражение: '}
                          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm dark:bg-gray-700">
                            {condition.value}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ответ бота
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dialog.response.text}
                    </p>
                    {dialog.response.buttons && dialog.response.buttons.length > 0 && (
                      <div className="mt-2">
                        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Кнопки
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {dialog.response.buttons.map((button, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            >
                              {button}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 