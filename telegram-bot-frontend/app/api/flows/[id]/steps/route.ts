import { NextResponse } from 'next/server';
import { mockFlows, updateMockFlows } from '../../../shared/mockData';
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET request for flow steps, flow ID: ${params.id}`);
    
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
      
      console.log(`Returning ${flow.steps?.length || 0} steps from mocks for flow ID: ${id}`);
      return NextResponse.json(flow.steps || []);
    }
    
    try {
      // Пытаемся получить steps с бэкенда
      const steps = await fetchApi(`${API_ENDPOINTS.flows}/${id}/steps`, {
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      console.log(`Received ${steps.length} steps from backend for flow ID: ${id}`);
      return NextResponse.json(steps);
    } catch (error) {
      console.error(`Error fetching steps from backend: ${error}`);
      console.log('Falling back to mock data for steps');
      
      const flow = mockFlows.find(flow => flow.id === id);
      
      if (!flow) {
        console.error(`Flow not found with ID: ${id}`);
        return NextResponse.json(
          { error: 'Flow not found' }, 
          { status: 404 }
        );
      }
      
      console.log(`Returning ${flow.steps?.length || 0} steps from mocks for flow ID: ${id}`);
      return NextResponse.json(flow.steps || []);
    }
  } catch (error) {
    console.error('Error in GET flow steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow steps' }, 
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`POST /api/flows/${params.id}/steps - Creating step on backend`);
    
    const flowId = parseInt(params.id);
    
    if (isNaN(flowId)) {
      console.error(`Invalid flow ID: ${params.id}`);
      return NextResponse.json(
        { error: 'Invalid flow ID' }, 
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log('Step creation data:', data);
    
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
      console.log('No authorization header or token cookie in client request, using mocks for step creation');
      return createStepInMocks(flowId, data);
    }
    
    try {
      // Отправляем запрос на создание step на бэкенде
      const createdStep = await fetchApi(`${API_ENDPOINTS.flows}/${flowId}/steps`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      
      console.log('Step created successfully on backend:', createdStep);
      return NextResponse.json(createdStep, { status: 201 });
    } catch (error) {
      console.error(`Error creating step on backend: ${error}`);
      console.log('Falling back to mock data for step creation');
      
      return createStepInMocks(flowId, data);
    }
  } catch (error) {
    console.error(`Error creating step for flow ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to create step' }, 
      { status: 500 }
    );
  }
}

// Вспомогательная функция для создания шага в моках
function createStepInMocks(flowId: number, data: any) {
  const flowIndex = mockFlows.findIndex(flow => flow.id === flowId);
  
  if (flowIndex === -1) {
    console.error(`Flow not found with ID: ${flowId}`);
    return NextResponse.json(
      { error: 'Flow not found' }, 
      { status: 404 }
    );
  }
  
  // Создаем новый массив flows для изменения
  const updatedFlows = [...mockFlows];
  
  // Make sure steps array exists
  if (!updatedFlows[flowIndex].steps) {
    updatedFlows[flowIndex].steps = [];
  }
  
  // Generate a new step ID
  const steps = updatedFlows[flowIndex].steps as Step[] || [];
  const maxStepId = steps.length > 0 
    ? Math.max(...steps.map(step => step.id || 0)) 
    : 0;
  
  // Create the new step
  const newStep: Step = {
    ...data,
    id: maxStepId + 1,
    flowId: flowId,
    order: steps.length + 1
  };
  
  // Add the step to the flow
  (updatedFlows[flowIndex].steps as Step[]).push(newStep);
  
  // Обновляем общие данные
  updateMockFlows(updatedFlows);
  
  console.log('New step created in mocks:', newStep);
  return NextResponse.json(newStep, { status: 201 });
} 