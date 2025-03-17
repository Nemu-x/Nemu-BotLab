// Общие данные для всех API эндпоинтов
// Загружаем моки из localStorage или используем дефолтные
const defaultMockFlows = [
  {
    id: 1,
    name: "test",
    description: "test",
    isActive: true,
    isDefault: false,
    config: {},
    steps: [],
    createdBy: 1,
    startCommandId: null,
    createdAt: "2025-03-14T02:55:21.348Z",
    updatedAt: "2025-03-14T02:55:21.348Z",
    startCommand: null,
    creator: {
      id: 1,
      username: "admin",
      email: "admin@example.com"
    }
  }
];

// В серверной среде Next.js глобального объекта window нет
let savedMockFlows;
if (typeof window !== 'undefined') {
  try {
    const savedData = localStorage.getItem('mockFlows');
    if (savedData) {
      savedMockFlows = JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Error loading mockFlows from localStorage:', error);
  }
}

export let mockFlows = savedMockFlows || defaultMockFlows;

// Определяем тип для элементов mockFlows
export type MockFlow = typeof defaultMockFlows[0];

// Функция для обновления mockFlows
export function updateMockFlows(newMockFlows: MockFlow[]) {
  console.log('Updating mockFlows with new data');
  console.log('Previous data length:', mockFlows.length);
  console.log('New data length:', newMockFlows.length);
  mockFlows = newMockFlows;
  
  // Сохраняем обновленные данные в localStorage, если мы в браузере
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mockFlows', JSON.stringify(mockFlows));
      console.log('mockFlows saved to localStorage');
    } catch (error) {
      console.error('Error saving mockFlows to localStorage:', error);
    }
  } else {
    console.log('Not in browser, skipping localStorage save');
  }
  
  console.log('Data updated successfully');
  return mockFlows;
} 