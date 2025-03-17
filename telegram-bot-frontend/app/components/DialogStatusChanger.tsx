import React, { useState } from 'react';
import { dialogsApi } from '../api/dialogs';

type DialogStatus = 'new' | 'in_progress' | 'closed';

interface DialogStatusChangerProps {
  dialogId: number;
  currentStatus: DialogStatus;
  onStatusChanged?: (newStatus: DialogStatus, resolution?: string) => void;
}

const DialogStatusChanger: React.FC<DialogStatusChangerProps> = ({ 
  dialogId, 
  currentStatus, 
  onStatusChanged 
}) => {
  const [status, setStatus] = useState<DialogStatus>(currentStatus);
  const [resolution, setResolution] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResolution, setShowResolution] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as DialogStatus;
    setStatus(newStatus);
    
    // Показываем поле резолюции только если статус "закрыт"
    if (newStatus === 'closed') {
      setShowResolution(true);
    } else {
      setShowResolution(false);
      handleSubmit(newStatus);
    }
  };

  const handleSubmit = async (statusToSubmit: DialogStatus = status, resolutionText: string = resolution) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await dialogsApi.updateDialogStatus(dialogId, statusToSubmit, statusToSubmit === 'closed' ? resolutionText : undefined);
      
      if (onStatusChanged) {
        onStatusChanged(statusToSubmit, statusToSubmit === 'closed' ? resolutionText : undefined);
      }
      
      if (statusToSubmit === 'closed') {
        setShowResolution(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении статуса');
      console.error('Error updating dialog status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Статус:
        </label>
        <select
          id="status"
          value={status}
          onChange={handleStatusChange}
          disabled={isSubmitting}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        >
          <option value="new">Новый</option>
          <option value="in_progress">В работе</option>
          <option value="closed">Закрыт</option>
        </select>
        
        {isSubmitting && !showResolution && (
          <span className="ml-2 text-sm text-gray-500">Обновление...</span>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900">
          <div className="flex">
            <div className="text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          </div>
        </div>
      )}

      {showResolution && (
        <form onSubmit={handleResolutionSubmit} className="space-y-3">
          <div>
            <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Резолюция по диалогу
            </label>
            <textarea
              id="resolution"
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Опишите, как был решен вопрос клиента"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowResolution(false)}
              className="mr-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-800 dark:hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DialogStatusChanger; 