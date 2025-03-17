// API базовый URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

// API эндпоинты
export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  
  // Users
  users: `${API_BASE_URL}/users`,
  
  // Clients
  clients: `${API_BASE_URL}/clients`,
  
  // Flows
  flows: `${API_BASE_URL}/flows`,
  
  // Responses
  flowResponses: `${API_BASE_URL}/flow-responses`,
  
  // Messages
  messages: `${API_BASE_URL}/messages`,
  
  // Dialogs
  dialogs: `${API_BASE_URL}/dialogs`,
}; 