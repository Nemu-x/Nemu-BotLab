import { fetchApi } from '@/src/config/api';

export type DialogStatus = 'new' | 'in_progress' | 'closed';

export interface Dialog {
  id?: number;
  name: string;
  description?: string;
  is_active?: boolean;
  status?: DialogStatus;
  resolution?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  creator?: {
    id: number;
    username: string;
    email: string;
  };
  steps?: any[];
}

const BASE_URL = '/api/dialogs';

export const dialogsApi = {
  /**
   * Получение списка всех диалогов
   */
  async getAllDialogs(): Promise<Dialog[]> {
    return fetchApi(BASE_URL);
  },

  /**
   * Для обратной совместимости с существующим кодом
   */
  async getDialogs(): Promise<Dialog[]> {
    return this.getAllDialogs();
  },

  /**
   * Получение одного диалога по ID
   */
  async getDialogById(id: number | string): Promise<Dialog> {
    return fetchApi(`${BASE_URL}/${id}`);
  },

  /**
   * Создание нового диалога
   */
  async createDialog(dialogData: Partial<Dialog>): Promise<Dialog> {
    return fetchApi(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(dialogData)
    });
  },

  /**
   * Обновление диалога
   */
  async updateDialog(id: number | string, dialogData: Partial<Dialog>): Promise<Dialog> {
    return fetchApi(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dialogData)
    });
  },

  /**
   * Обновление статуса диалога
   */
  async updateDialogStatus(id: number | string, status: DialogStatus, resolution?: string): Promise<Dialog> {
    return fetchApi(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution })
    });
  },

  /**
   * Удаление диалога
   */
  async deleteDialog(id: number | string): Promise<{ message: string }> {
    return fetchApi(`${BASE_URL}/${id}`, {
      method: 'DELETE'
    });
  }
};

export default dialogsApi; 