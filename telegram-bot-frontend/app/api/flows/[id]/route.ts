import { NextResponse } from 'next/server';
import { mockFlows, updateMockFlows } from '../../shared/mockData';
import { API_ENDPOINTS, fetchApi } from '@/src/config/api';

// Используем Node.js runtime, а не Edge runtime
export const runtime = 'nodejs';

// Обновляем общую переменную mockFlows при каждом запросе
// Это необходимо, потому что Next.js может создавать разные экземпляры файлов
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/flows/${params.id} - Getting flow details from backend`, { params });
    
    // Определяем, что делать с ID "new"
    if (params.id === 'new') {
      console.log('Returning empty flow template for new flow');
      return NextResponse.json({
        name: '',
        description: '',
        isActive: true,
        isDefault: false,
        steps: []
      });
    }
    
    // Парсим ID из строки в число
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      console.error(`Invalid flow ID: ${params.id}`);
      return NextResponse.json(
        { error: 'Invalid flow ID' }, 
        { status: 400 }
      );
    }
    
    // Получаем заголовок авторизации из запроса клиента
    let authHeader = request.headers.get('authorization');
    console.log('Initial authorization header:', authHeader);
    
    // Если заголовок Authorization отсутствует, проверяем cookie
    if (!authHeader) {
      const cookieHeader = request.headers.get('cookie');
      console.log('Cookie header raw:', cookieHeader);
      
      if (cookieHeader) {
        try {
          // Более детальный парсинг cookie
          const cookies: Record<string, string> = {};
          cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2) {
              const key = parts[0].trim();
              const value = parts.slice(1).join('=').trim();
              cookies[key] = value;
              console.log(`Found cookie: ${key} = ${value.substring(0, 15)}...`);
            }
          });
          
          // Проверяем, есть ли токен в cookies
          if (cookies['token']) {
            console.log('Found token in cookies, length:', cookies['token'].length);
            // Пробуем использовать токен как есть без префикса Bearer
            authHeader = cookies['token'];
            
            // Если бэкенд ожидает префикс Bearer, раскомментируйте следующую строку
            // authHeader = `Bearer ${cookies['token']}`;
          } else {
            console.log('Token cookie not found. Available cookies:', Object.keys(cookies));
          }
        } catch (error) {
          console.error('Error parsing cookies:', error);
        }
      } else {
        console.log('No cookie header found in request');
      }
    }
    
    console.log('Final authorization header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'Not present');
    
    if (!authHeader) {
      console.log('No authorization header or token cookie in client request, using mocks');
      const flow = mockFlows.find(flow => flow.id === id);
      
      if (!flow) {
        console.error(`Flow not found with ID: ${id}`);
        return NextResponse.json(
          { error: 'Flow not found' }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json(flow);
    }
    
    try {
      // Пытаемся получить flow с бэкенда
      const flow = await fetchApi(`${API_ENDPOINTS.flows}/${id}`, {
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      console.log(`Received flow from backend for ID ${id}:`, flow);
      return NextResponse.json(flow);
    } catch (error) {
      console.error(`Error fetching flow from backend: ${error}`);
      console.log('Falling back to mock data');
      
      // Пробуем найти flow по ID в моках
      const flow = mockFlows.find(flow => flow.id === id);
      
      if (!flow) {
        console.error(`Flow not found with ID: ${id}`);
        return NextResponse.json(
          { error: 'Flow not found' }, 
          { status: 404 }
        );
      }
      
      console.log(`Returning mock flow details for ID ${id}:`, flow);
      return NextResponse.json(flow);
    }
  } catch (error) {
    console.error(`Error getting flow ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to get flow details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PUT /api/flows/${params.id} - Updating flow on backend`);
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      console.error(`Invalid flow ID: ${params.id}`);
      return NextResponse.json(
        { error: 'Invalid flow ID' }, 
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log('Update data received:', data);
    
    // Получаем заголовок авторизации из запроса клиента
    let authHeader = request.headers.get('authorization');
    console.log('Initial authorization header:', authHeader);
    
    // Если заголовок Authorization отсутствует, проверяем cookie
    if (!authHeader) {
      const cookieHeader = request.headers.get('cookie');
      console.log('Cookie header raw:', cookieHeader);
      
      if (cookieHeader) {
        try {
          // Более детальный парсинг cookie
          const cookies: Record<string, string> = {};
          cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2) {
              const key = parts[0].trim();
              const value = parts.slice(1).join('=').trim();
              cookies[key] = value;
              console.log(`Found cookie: ${key} = ${value.substring(0, 15)}...`);
            }
          });
          
          // Проверяем, есть ли токен в cookies
          if (cookies['token']) {
            console.log('Found token in cookies, length:', cookies['token'].length);
            // Пробуем использовать токен как есть без префикса Bearer
            authHeader = cookies['token'];
          } else {
            console.log('Token cookie not found. Available cookies:', Object.keys(cookies));
          }
        } catch (error) {
          console.error('Error parsing cookies:', error);
        }
      } else {
        console.log('No cookie header found in request');
      }
    }
    
    console.log('Final authorization header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'Not present');
    
    if (!authHeader) {
      console.log('No authorization header or token cookie in client request, using mocks for update');
      return updateFlowInMocks(id, data);
    }
    
    try {
      // Отправляем запрос на обновление flow на бэкенд
      const updatedFlow = await fetchApi(`${API_ENDPOINTS.flows}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      
      console.log('Flow updated successfully on backend:', updatedFlow);
      return NextResponse.json(updatedFlow);
    } catch (error) {
      console.error(`Error updating flow on backend: ${error}`);
      console.log('Falling back to mock data for update');
      
      return updateFlowInMocks(id, data);
    }
  } catch (error) {
    console.error(`Error updating flow ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update flow' }, 
      { status: 500 }
    );
  }
}

// Вспомогательная функция для обновления flow в моках
function updateFlowInMocks(id: number, data: any) {
  // Find the flow to update
  const flowIndex = mockFlows.findIndex(flow => flow.id === id);
  
  if (flowIndex === -1) {
    console.error(`Flow not found with ID: ${id}`);
    return NextResponse.json(
      { error: 'Flow not found' }, 
      { status: 404 }
    );
  }
  
  let updatedFlows = [...mockFlows];
  
  // Если flow помечен как isDefault=true, сбросим этот флаг у других flows
  if (data.isDefault) {
    updatedFlows = updatedFlows.map(flow => ({
      ...flow,
      isDefault: flow.id === id ? true : false
    }));
  }
  
  // Update the flow preserving the ID
  updatedFlows[flowIndex] = {
    ...updatedFlows[flowIndex],
    ...data,
    id: id // Ensure ID doesn't change
  };
  
  updateMockFlows(updatedFlows);
  
  const updatedFlow = updatedFlows[flowIndex];
  console.log('Flow updated successfully in mocks:', updatedFlow);
  console.log('Total flows after update:', mockFlows.length);
  
  return NextResponse.json(updatedFlow);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/flows/${params.id} - Deleting flow from backend`);
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      console.error(`Invalid flow ID: ${params.id}`);
      return NextResponse.json(
        { error: 'Invalid flow ID' }, 
        { status: 400 }
      );
    }
    
    // Получаем заголовок авторизации из запроса клиента
    let authHeader = request.headers.get('authorization');
    console.log('Initial authorization header:', authHeader);
    
    // Если заголовок Authorization отсутствует, проверяем cookie
    if (!authHeader) {
      const cookieHeader = request.headers.get('cookie');
      console.log('Cookie header raw:', cookieHeader);
      
      if (cookieHeader) {
        try {
          // Более детальный парсинг cookie
          const cookies: Record<string, string> = {};
          cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2) {
              const key = parts[0].trim();
              const value = parts.slice(1).join('=').trim();
              cookies[key] = value;
              console.log(`Found cookie: ${key} = ${value.substring(0, 15)}...`);
            }
          });
          
          // Проверяем, есть ли токен в cookies
          if (cookies['token']) {
            console.log('Found token in cookies, length:', cookies['token'].length);
            // Пробуем использовать токен как есть без префикса Bearer
            authHeader = cookies['token'];
          } else {
            console.log('Token cookie not found. Available cookies:', Object.keys(cookies));
          }
        } catch (error) {
          console.error('Error parsing cookies:', error);
        }
      } else {
        console.log('No cookie header found in request');
      }
    }
    
    console.log('Final authorization header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'Not present');
    
    if (!authHeader) {
      console.log('No authorization header or token cookie in client request, using mocks for deletion');
      return deleteFlowFromMocks(id);
    }
    
    try {
      // Отправляем запрос на удаление flow на бэкенд
      await fetchApi(`${API_ENDPOINTS.flows}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      
      console.log(`Flow ID: ${id} deleted successfully from backend`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`Error deleting flow from backend: ${error}`);
      console.log('Falling back to mock data for deletion');
      
      return deleteFlowFromMocks(id);
    }
  } catch (error) {
    console.error(`Error deleting flow ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete flow' }, 
      { status: 500 }
    );
  }
}

// Вспомогательная функция для удаления flow из моков
function deleteFlowFromMocks(id: number) {
  // Check if flow exists
  const flowExists = mockFlows.some(flow => flow.id === id);
  
  if (!flowExists) {
    console.error(`Flow not found with ID: ${id}`);
    return NextResponse.json(
      { error: 'Flow not found' }, 
      { status: 404 }
    );
  }
  
  // Remove flow from array
  const updatedFlows = mockFlows.filter(flow => flow.id !== id);
  updateMockFlows(updatedFlows);
  
  console.log(`Flow ID: ${id} deleted successfully from mocks`);
  console.log('Total flows after delete:', mockFlows.length);
  
  return NextResponse.json({ success: true });
} 