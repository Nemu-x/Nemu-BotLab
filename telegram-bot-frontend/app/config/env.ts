// Базовый URL для API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Временной интервал для обновления данных (в миллисекундах)
export const UPDATE_INTERVAL = 5000; // 5 секунд

// Максимальное количество сообщений для отображения в чате
export const MAX_MESSAGES = 100;

// Языки, поддерживаемые приложением
export const SUPPORTED_LANGUAGES = ['en', 'ru']; 