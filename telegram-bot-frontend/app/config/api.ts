import { API_BASE_URL } from './env';

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/login`,
  users: `${API_BASE_URL}/api/users`,
  settings: `${API_BASE_URL}/api/settings`,
  commands: `${API_BASE_URL}/api/commands`,
  messages: `${API_BASE_URL}/api/messages`,
  clients: `${API_BASE_URL}/api/clients`,
  dialogs: `${API_BASE_URL}/api/dialogs`,
  tickets: `${API_BASE_URL}/api/tickets`,
  flows: `${API_BASE_URL}/api/flows`,
  flowResponses: `${API_BASE_URL}/api/flow-responses`,
};

interface FetchOptions extends RequestInit {
  token?: string;
}

export const fetchApi = async (url: string, options: FetchOptions = {}) => {
  try {
    const token = options.token || localStorage.getItem('token');
    const headers = new Headers(options.headers);
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `API request failed with status ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}; 