import { useEffect } from 'react';

// Тип для Flow
interface Flow {
  id: number;
  name: string;
  description: string;
  isActive?: boolean;
  is_active?: boolean;
  isDefault?: boolean;
  is_default?: boolean;
  config?: Record<string, any>;
  steps?: any[];
  createdBy?: number;
  startCommandId?: any;
  createdAt?: string;
  updatedAt?: string;
  startCommand?: any;
  creator?: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * Хук для работы с Flow в localStorage
 */
export function useLocalStorageFlows() {
  // Функция получения всех Flow из localStorage
  const getLocalFlows = (): Flow[] => {
    try {
      const localFlows = localStorage.getItem('mockFlows');
      if (localFlows) {
        return JSON.parse(localFlows);
      }
    } catch (error) {
      console.error('Error loading flows from localStorage:', error);
    }
    return [];
  };

  // Функция сохранения Flow в localStorage
  const saveLocalFlows = (flows: Flow[]): void => {
    try {
      localStorage.setItem('mockFlows', JSON.stringify(flows));
      console.log('Flows saved to localStorage, count:', flows.length);
    } catch (error) {
      console.error('Error saving flows to localStorage:', error);
    }
  };

  // Функция добавления нового Flow в localStorage
  const addLocalFlow = (flow: Flow): void => {
    try {
      const existingFlows = getLocalFlows();
      
      // Проверяем, существует ли уже Flow с таким ID
      const exists = existingFlows.some(f => f.id === flow.id);
      if (exists) {
        console.log(`Flow with ID ${flow.id} already exists in localStorage, updating`);
        const updatedFlows = existingFlows.map(f => f.id === flow.id ? flow : f);
        saveLocalFlows(updatedFlows);
      } else {
        console.log(`Adding new Flow with ID ${flow.id} to localStorage`);
        saveLocalFlows([...existingFlows, flow]);
      }
    } catch (error) {
      console.error('Error adding flow to localStorage:', error);
    }
  };

  // Функция удаления Flow из localStorage
  const removeLocalFlow = (flowId: number): void => {
    try {
      const existingFlows = getLocalFlows();
      const updatedFlows = existingFlows.filter(f => f.id !== flowId);
      saveLocalFlows(updatedFlows);
      console.log(`Flow with ID ${flowId} removed from localStorage`);
    } catch (error) {
      console.error('Error removing flow from localStorage:', error);
    }
  };

  // Функция обновления Flow в localStorage на основе ответа API
  const updateLocalStorageFromResponse = (response: Response) => {
    const shouldUpdate = response.headers.get('X-Should-Update-LocalStorage');
    
    if (shouldUpdate === 'true') {
      response.json().then(data => {
        console.log('Received signal to update localStorage with data:', data);
        if (data && data.id) {
          addLocalFlow(data);
        }
      }).catch(error => {
        console.error('Error parsing response JSON for localStorage update:', error);
      });
    }
  };

  return {
    getLocalFlows,
    saveLocalFlows,
    addLocalFlow,
    removeLocalFlow,
    updateLocalStorageFromResponse
  };
} 