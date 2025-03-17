/**
 * Модуль для выполнения запросов к API с серверной стороны Next.js
 */

// URL бэкенда (можно брать из .env)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

/**
 * Функция для получения токена авторизации
 * На серверной стороне нет прямого доступа к localStorage, поэтому используем предопределенный токен
 */
function getAuthToken(): string | null {
  // Для серверной стороны используем предопределенный административный токен
  return process.env.API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NDIwMzcxMjksImV4cCI6MTc0MjEyMzUyOX0.Pu7sY-hq4bfpVFSxeFVOLzT2gW_WDoqZ35TEN5Ffu5M';
}

/**
 * Функция для выполнения запросов к API с серверной стороны
 */
export async function fetchApiServer(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  
  // Получаем токен авторизации
  const token = getAuthToken();
  
  // Установка заголовков по умолчанию
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Проверка статуса ответа
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `API request failed with status ${response.status}`,
    }));
    
    throw new Error(
      error.message || `API request failed with status ${response.status}`
    );
  }

  return response.json();
} 