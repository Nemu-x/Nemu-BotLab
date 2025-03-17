import { NextResponse } from 'next/server';
import { mockFlows, updateMockFlows } from '../../../../shared/mockData';
import { API_ENDPOINTS, fetchApi } from '@/src/config/api';

export const runtime = 'nodejs';

// Определение типа для Step
interface Step {
  id: number;
  flowId: number;
  order: number;
  question?: string;
  response_type?: string;
  is_required?: boolean;
  options?: any[];
  config?: any;
  title?: string;
  message?: string;
  buttons?: any[];
  [key: string]: any; // Для остальных полей
}

// GET a specific step of a flow
export async function GET(
  request: Request,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    console.log(`GET request for flow ID: ${params.id}, step ID: ${params.stepId}`);
    
    const flowId = parseInt(params.id);
    const stepId = parseInt(params.stepId);
    
    if (isNaN(flowId) || isNaN(stepId)) {
      console.error(`Invalid IDs - Flow ID: ${params.id}, Step ID: ${params.stepId}`);
      return NextResponse.json(
        { error: 'Invalid flow or step ID' }, 
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
      return getStepFromMocks(flowId, stepId);
    }
    
    try {
      // Пытаемся получить step с бэкенда
      const step = await fetchApi(`${API_ENDPOINTS.flows}/${flowId}/steps/${stepId}`, {
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      console.log(`Received step from backend for flow ID: ${flowId}, step ID: ${stepId}`);
      return NextResponse.json(step);
    } catch (error) {
      console.error(`Error fetching step from backend: ${error}`);
      console.log('Falling back to mock data for step');
      
      return getStepFromMocks(flowId, stepId);
    }
  } catch (error) {
    console.error('Error in GET flow step:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow step' }, 
      { status: 500 }
    );
  }
}

// Вспомогательная функция для получения шага из моков
function getStepFromMocks(flowId: number, stepId: number) {
  const flow = mockFlows.find(flow => flow.id === flowId);
  
  if (!flow) {
    console.error(`Flow not found with ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Flow not found' }, 
      { status: 404 }
    );
  }
  
  const step = (flow.steps as Step[])?.find(step => step.id === stepId);
  
  if (!step) {
    console.error(`Step not found with ID: ${stepId} in flow ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Step not found' }, 
      { status: 404 }
    );
  }
  
  console.log(`Returning step ID: ${stepId} from flow ID: ${flowId} from mocks`);
  return NextResponse.json(step);
}

// PUT (update) a specific step of a flow
export async function PUT(
  request: Request,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    console.log(`PUT /api/flows/${params.id}/steps/${params.stepId} - Updating step on backend`);
    
    const flowId = parseInt(params.id);
    const stepId = parseInt(params.stepId);
    
    if (isNaN(flowId) || isNaN(stepId)) {
      console.error(`Invalid ID: flow ID ${params.id}, step ID ${params.stepId}`);
      return NextResponse.json(
        { error: 'Invalid ID format' }, 
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log('Step update data:', data);
    
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
      console.log('No authorization header or token cookie in client request, using mocks for step update');
      return updateStepInMocks(flowId, stepId, data);
    }
    
    try {
      // Отправляем запрос на обновление step на бэкенде
      const updatedStep = await fetchApi(`${API_ENDPOINTS.flows}/${flowId}/steps/${stepId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      
      console.log('Step updated successfully on backend:', updatedStep);
      return NextResponse.json(updatedStep);
    } catch (error) {
      console.error(`Error updating step on backend: ${error}`);
      console.log('Falling back to mock data for step update');
      
      return updateStepInMocks(flowId, stepId, data);
    }
  } catch (error) {
    console.error(`Error updating step for flow ID ${params.id}, step ID ${params.stepId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update step' }, 
      { status: 500 }
    );
  }
}

// Вспомогательная функция для обновления шага в моках
function updateStepInMocks(flowId: number, stepId: number, data: any) {
  const flowIndex = mockFlows.findIndex(flow => flow.id === flowId);
  
  if (flowIndex === -1) {
    console.error(`Flow not found with ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Flow not found' }, 
      { status: 404 }
    );
  }
  
  const updatedFlows = [...mockFlows];
  
  if (!updatedFlows[flowIndex].steps) {
    console.error(`No steps found in flow ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Flow has no steps' }, 
      { status: 404 }
    );
  }
  
  const stepIndex = (updatedFlows[flowIndex].steps as Step[]).findIndex(step => step.id === stepId);
  
  if (stepIndex === -1) {
    console.error(`Step not found with ID: ${stepId} in flow ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Step not found' }, 
      { status: 404 }
    );
  }
  
  // Update the step with new data while preserving ID and flowId
  const steps = updatedFlows[flowIndex].steps as Step[];
  steps[stepIndex] = {
    ...steps[stepIndex],
    ...data,
    id: stepId,
    flowId: flowId
  };
  
  // Обновляем общие данные
  updateMockFlows(updatedFlows);
  
  const updatedStep = steps[stepIndex];
  console.log('Step updated successfully in mocks:', updatedStep);
  
  return NextResponse.json(updatedStep);
}

// DELETE a specific step of a flow
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; stepId: string } }
) {
  try {
    console.log(`DELETE /api/flows/${params.id}/steps/${params.stepId} - Deleting step from backend`);
    
    const flowId = parseInt(params.id);
    const stepId = parseInt(params.stepId);
    
    if (isNaN(flowId) || isNaN(stepId)) {
      console.error(`Invalid ID: flow ID ${params.id}, step ID ${params.stepId}`);
      return NextResponse.json(
        { error: 'Invalid ID format' }, 
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
      console.log('No authorization header or token cookie in client request, using mocks for step deletion');
      return deleteStepFromMocks(flowId, stepId);
    }
    
    try {
      // Отправляем запрос на удаление step на бэкенде
      await fetchApi(`${API_ENDPOINTS.flows}/${flowId}/steps/${stepId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      
      console.log(`Step ID: ${stepId} deleted successfully from backend`);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(`Error deleting step from backend: ${error}`);
      console.log('Falling back to mock data for step deletion');
      
      return deleteStepFromMocks(flowId, stepId);
    }
  } catch (error) {
    console.error(`Error deleting step for flow ID ${params.id}, step ID ${params.stepId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete step' }, 
      { status: 500 }
    );
  }
}

// Вспомогательная функция для удаления шага из моков
function deleteStepFromMocks(flowId: number, stepId: number) {
  const flowIndex = mockFlows.findIndex(flow => flow.id === flowId);
  
  if (flowIndex === -1) {
    console.error(`Flow not found with ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Flow not found' }, 
      { status: 404 }
    );
  }
  
  const updatedFlows = [...mockFlows];
  
  if (!updatedFlows[flowIndex].steps) {
    console.error(`No steps found in flow ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Flow has no steps' }, 
      { status: 404 }
    );
  }
  
  const steps = updatedFlows[flowIndex].steps as Step[];
  const initialLength = steps.length;
  updatedFlows[flowIndex].steps = steps.filter(step => step.id !== stepId) as any;
  
  if ((updatedFlows[flowIndex].steps as Step[]).length === initialLength) {
    console.error(`Step not found with ID: ${stepId} in flow ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Step not found' }, 
      { status: 404 }
    );
  }
  
  // Re-order remaining steps
  (updatedFlows[flowIndex].steps as Step[]).forEach((step, index) => {
    step.order = index + 1;
  });
  
  // Обновляем общие данные
  updateMockFlows(updatedFlows);
  
  console.log(`Step ID: ${stepId} deleted from flow ID: ${flowId} in mocks`);
  return NextResponse.json({ success: true });
} 