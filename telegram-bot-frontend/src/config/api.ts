import { API_BASE_URL } from './env';

export const API_ENDPOINTS = {
  // Auth endpoints
  login: `${API_BASE_URL}/api/users/login`,
  register: `${API_BASE_URL}/api/users/register`,
  
  // User endpoints
  users: `${API_BASE_URL}/api/users`,
  
  // Commands endpoints
  commands: `${API_BASE_URL}/api/commands`,
  
  // Clients endpoints
  clients: `${API_BASE_URL}/api/clients`,
  clientSearch: `${API_BASE_URL}/api/clients/search`,
  clientNotes: (id: string) => `${API_BASE_URL}/api/clients/${id}/notes`,
  clientBlock: (id: string) => `${API_BASE_URL}/api/clients/${id}/toggle-block`,
  clientDialogStatus: (id: string) => `${API_BASE_URL}/api/clients/${id}/dialog-status`,
  
  // Messages endpoints
  messages: `${API_BASE_URL}/api/messages`,
  clientMessages: (clientId: string) => `${API_BASE_URL}/api/messages/client/${clientId}`,
  unreadMessages: `${API_BASE_URL}/api/messages/unread`,
  markMessagesRead: `${API_BASE_URL}/api/messages/mark-read`,
  sendMessage: (clientId: string) => `${API_BASE_URL}/api/messages/send/${clientId}`,
  
  // Flow endpoints
  flows: `${API_BASE_URL}/api/flows`,
  flowById: (id: string) => `${API_BASE_URL}/api/flows/${id}`,
  flowSteps: (flowId: string) => `${API_BASE_URL}/api/flows/${flowId}/steps`,
  flowStep: (flowId: string, stepId: string) => `${API_BASE_URL}/api/flows/${flowId}/steps/${stepId}`,
  setDefaultFlow: (id: string) => `${API_BASE_URL}/api/flows/${id}/set-default`,
  sendFlowInvitation: (id: string) => `${API_BASE_URL}/api/flows/${id}/invite`,
  
  // Health check
  health: `${API_BASE_URL}/health`,

  // Settings
  settings: `${API_BASE_URL}/api/settings`,
  updateSettings: `${API_BASE_URL}/api/settings`,

  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  USERS: '/api/users',
  MESSAGES: '/api/messages',
  COMMANDS: '/api/commands',
  FLOWS: '/api/flows',
  SETTINGS: '/api/settings',
  STATS: '/api/stats',
  FLOW_RESPONSES: '/api/flow-responses'
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  // Безопасное получение токена (работает и на сервере, и на клиенте)
  let token = null;
  try {
    // Проверяем, что мы на клиенте (в браузере)
    if (typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('token');
      console.log('Current token from localStorage:', token ? `${token.substring(0, 15)}...` : 'None'); // Debug log
    } else {
      console.log('Running on server, getting token from provided Authorization header');
      // На сервере токен берем из Authorization header, если он передан в options
      if (options.headers) {
        const headers = options.headers as Record<string, string>;
        
        if ('Authorization' in headers) {
          // Проверяем формат заголовка Authorization
          const authHeader = headers['Authorization'] || headers['authorization'];
          console.log('Authorization header provided:', authHeader ? `${authHeader.substring(0, 15)}...` : 'None');
          
          if (authHeader) {
            token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
            console.log('Extracted token:', token ? `${token.substring(0, 15)}...` : 'None');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error accessing authorization data:', error);
  }
  
  // Собираем заголовки для запроса
  // Используем заголовок Authorization с префиксом Bearer
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  
  // Удаляем дублирующие заголовки из options.headers перед их объединением
  if (options.headers) {
    const customHeaders = { ...options.headers } as Record<string, string>;
    // Удаляем Authorization из customHeaders, т.к. мы уже добавили его выше
    delete customHeaders['Authorization'];
    delete customHeaders['authorization'];
    
    // Объединяем с нашими заголовками
    Object.assign(headers, customHeaders);
  }

  console.log('Request headers:', headers); // Debug log
  console.log('Request to endpoint:', endpoint); // Debug log

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'same-origin',
    });

    console.log('Response status:', response.status); // Debug log
    console.log('Response headers:', [...response.headers.entries()]); // Debug log

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: response.statusText || 'Unknown error',
        status: response.status 
      }));
      console.error('API Error:', error); // Debug log
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    // Полностью отключаем обновление localStorage для flow данных
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error); // Debug log
    throw error;
  }
};

interface CommandData {
  name: string;
  response: string;
  type: 'text' | 'slash' | 'regex';
  matchType?: 'exact' | 'contains' | 'regex';
  priority?: number;
  is_active?: boolean;
}

interface UserData {
  username: string;
  email: string;
  role: string;
  password?: string;
  isActive?: boolean;
}

interface FlowData {
  name: string;
  description: string;
  is_active?: boolean;
  is_default?: boolean;
}

interface FlowStepData {
  title: string;
  text: string;
  buttons?: Array<{
    text: string;
    type: 'inline' | 'reply';
    value?: string;
    nextStep?: string | null;
    row?: number;
  }>;
  nextStep?: string | null;
  conditions?: Array<{
    type: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
    value: string;
    nextStep: string;
  }>;
}

export const api = {
  // Auth
  login: async (data: { email?: string; username?: string; password: string }) => {
    // Если нет username, но есть email, используем email как username
    if (!data.username && data.email) {
      data = { ...data, username: data.email };
    }
    
    const response = await fetchApi(API_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      console.log('Token saved:', response.token); // Debug log
    }
    
    return response;
  },
  register: (data: { email: string; password: string; role?: string }) =>
    fetchApi(API_ENDPOINTS.register, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Users
  getUsers: () => fetchApi(API_ENDPOINTS.users),
  createUser: (data: UserData) =>
    fetchApi(API_ENDPOINTS.users, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Partial<UserData>) =>
    fetchApi(`${API_ENDPOINTS.users}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    fetchApi(`${API_ENDPOINTS.users}/${id}`, {
      method: 'DELETE',
    }),

  // Commands
  getCommands: () => fetchApi(API_ENDPOINTS.commands),
  addCommand: (data: CommandData) =>
    fetchApi(API_ENDPOINTS.commands, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCommand: (id: string, data: CommandData) =>
    fetchApi(`${API_ENDPOINTS.commands}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCommand: (id: string) =>
    fetchApi(`${API_ENDPOINTS.commands}/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => {
      console.log('Delete command response:', response);
      return response;
    }).catch(error => {
      console.error('Error in deleteCommand:', error);
      throw error;
    }),

  // Clients
  getClients: async () => {
    try {
      console.log('API: Запрашиваем список клиентов');
      
      // Добавляем ручную проверку авторизации
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('API: Нет токена авторизации для запроса клиентов');
        throw new Error('Authorization required');
      }
      
      const response = await fetchApi(API_ENDPOINTS.clients);
      
      if (!response || !Array.isArray(response)) {
        console.error('API: Получен неверный формат данных клиентов:', response);
        // Если получаем пустые данные, возвращаем пустой массив вместо ошибки
        if (!response) return [];
        
        // Если есть ответ, но это не массив, оборачиваем в массив
        if (!Array.isArray(response)) {
          if (typeof response === 'object') {
            return [response];
          }
          return [];
        }
      }
      
      console.log('API: Успешно получены клиенты:', response?.length || 0);
      return response || [];
    } catch (error) {
      console.error('API: Ошибка при получении клиентов:', error);
      // В случае ошибки возвращаем пустой массив, чтобы интерфейс не ломался
      return [];
    }
  },
  searchClients: (query: string) => 
    fetchApi(`${API_ENDPOINTS.clientSearch}?query=${encodeURIComponent(query)}`),
  getClientById: (id: string) => {
    console.log(`Fetching client with ID: ${id}`);
    return fetchApi(`${API_ENDPOINTS.clients}/${id}`)
      .then(data => {
        console.log('Received client data:', data);
        return data;
      })
      .catch(error => {
        console.error(`Error fetching client with ID ${id}:`, error);
        throw error;
      });
  },
  updateClientNotes: (id: string, notes: string) =>
    fetchApi(API_ENDPOINTS.clientNotes(id), {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
  toggleClientBlock: (id: string, isBlocked: boolean) =>
    fetchApi(API_ENDPOINTS.clientBlock(id), {
      method: 'PUT',
      body: JSON.stringify({ isBlocked }),
    }),
  toggleDialogStatus: (id: string, isDialogOpen: boolean) =>
    fetchApi(API_ENDPOINTS.clientDialogStatus(id), {
      method: 'PUT',
      body: JSON.stringify({ isDialogOpen }),
    }),

  // Messages
  getClientMessages: (clientId: string) => {
    console.log(`Fetching messages for client with ID: ${clientId}`);
    return fetchApi(API_ENDPOINTS.clientMessages(clientId))
      .then(data => {
        console.log(`Received messages for client ${clientId}:`, data);
        return data;
      })
      .catch(error => {
        console.error(`Error fetching messages for client ${clientId}:`, error);
        throw error;
      });
  },
  getUnreadMessages: () => fetchApi(API_ENDPOINTS.unreadMessages),
  markMessagesAsRead: (messageIds: string[]) =>
    fetchApi(API_ENDPOINTS.markMessagesRead, {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    }),
  sendMessage: async (data: { clientId: string; content: string }) => {
    try {
      const response = await fetchApi(API_ENDPOINTS.sendMessage(data.clientId), {
        method: 'POST',
        body: JSON.stringify({ content: data.content }),
      });
      return response;
    } catch (error: any) {
      if (error.status === 403) {
        throw new Error('Диалог закрыт. Невозможно отправить сообщение.');
      }
      throw error;
    }
  },

  // Flows
  getFlows: async () => {
    try {
      console.log('API: Запрашиваем список Flow');
      
      // Добавляем ручную проверку авторизации
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('API: Нет токена авторизации для запроса Flow');
        throw new Error('Authorization required');
      }
      
      const response = await fetchApi(API_ENDPOINTS.flows);
      
      if (!response || !Array.isArray(response)) {
        console.error('API: Получен неверный формат данных Flow:', response);
        throw new Error('Invalid Flow data format returned from server');
      }
      
      console.log('API: Успешно получены Flow:', response?.length || 0);
      return response || [];
    } catch (error) {
      console.error('API: Ошибка при получении Flow:', error);
      throw error; // Пробрасываем ошибку для обработки в UI
    }
  },
  getFlowById: (id: string) => fetchApi(API_ENDPOINTS.flowById(id)),
  createFlow: async (data: FlowData) => {
    try {
      console.log('API: Создаем новый Flow:', data);
      const response = await fetchApi(API_ENDPOINTS.flows, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('API: Flow успешно создан:', response);
      return response;
    } catch (error) {
      console.error('API: Ошибка при создании Flow:', error);
      throw error; // Пробрасываем ошибку для обработки в UI
    }
  },
  updateFlow: (id: string, data: Partial<FlowData>) =>
    fetchApi(API_ENDPOINTS.flowById(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFlow: (id: string) =>
    fetchApi(API_ENDPOINTS.flowById(id), {
      method: 'DELETE',
    }),
  setDefaultFlow: (id: string) =>
    fetchApi(API_ENDPOINTS.setDefaultFlow(id), {
      method: 'POST',
    }),
  sendFlowInvitation: (id: string) =>
    fetchApi(API_ENDPOINTS.sendFlowInvitation(id), {
      method: 'POST',
    }),
  
  // Flow Steps
  getFlowSteps: (flowId: string) => fetchApi(API_ENDPOINTS.flowSteps(flowId)),
  createFlowStep: (flowId: string, data: FlowStepData) =>
    fetchApi(API_ENDPOINTS.flowSteps(flowId), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFlowStep: (flowId: string, stepId: string, data: Partial<FlowStepData>) =>
    fetchApi(API_ENDPOINTS.flowStep(flowId, stepId), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFlowStep: (flowId: string, stepId: string) =>
    fetchApi(API_ENDPOINTS.flowStep(flowId, stepId), {
      method: 'DELETE',
    }),

  // Settings
  getSettings: async () => {
    try {
      console.log('API: Запрашиваем настройки');
      const response = await fetchApi(API_ENDPOINTS.settings);
      console.log('API: Получены настройки:', response);
      return response;
    } catch (error) {
      console.error('API: Ошибка при получении настроек:', error);
      throw error;
    }
  },

  updateSettings: async (data: Record<string, any>) => {
    try {
      console.log('API: Обновляем настройки:', { ...data, botToken: data.botToken ? '***' : '' });
      const response = await fetchApi(API_ENDPOINTS.updateSettings, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      console.log('API: Настройки обновлены:', response);
      return response;
    } catch (error) {
      console.error('API: Ошибка при обновлении настроек:', error);
      throw error;
    }
  },
};

// Добавляем методы для работы с Dashboard
export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching dashboard stats: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    throw error;
  }
};

export const getDashboardActivity = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/activity?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching dashboard activity: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch dashboard activity:', error);
    throw error;
  }
};

export const getDashboardTimeAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/time-analytics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching time analytics: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch time analytics:', error);
    throw error;
  }
}; 