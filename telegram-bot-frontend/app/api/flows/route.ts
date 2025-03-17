import { NextResponse } from 'next/server';
import { mockFlows, updateMockFlows, MockFlow } from '../shared/mockData';
import { API_ENDPOINTS, fetchApi } from '@/src/config/api';
import { API_BASE_URL } from '@/src/config/env';

/**
 * Flows API routes
 * Обработка запросов к API для управления сценариями
 * 
 * @author Git-Nemu_XX
 * @version 1.0.3
 */

// Используем Node.js runtime, а не Edge runtime
export const runtime = 'nodejs';

// Интерфейс для бэкенд-данных (может иметь snake_case поля)
interface BackendFlow {
  id: number;
  name: string;
  description: string;
  is_active?: boolean;
  is_default?: boolean;
  steps?: any[];
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    console.log('GET /api/flows - Fetching all flows from backend');
    
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
      console.log('No authorization header or token cookie in client request');
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    
    // Передаем заголовок авторизации в запрос к бэкенду
    try {
      const data = await fetchApi(API_ENDPOINTS.flows, {
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
        }
      });
      
      console.log(`Received ${data.length} flows from backend`);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching flows from backend:', error);
      return NextResponse.json({ error: 'Failed to fetch flows from server. Please try again later.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET flows route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/flows - Creating a new flow');
    
    const body = await request.json();
    console.log('Client POST data:', body);
    
    // Получаем заголовок авторизации из запроса клиента
    let authHeader = request.headers.get('authorization');
    console.log('Initial authorization header:', authHeader);
    
    if (!authHeader) {
      // Если заголовок отсутствует, проверяем cookie, как в GET методе
      const cookieHeader = request.headers.get('cookie');
      
      if (cookieHeader) {
        try {
          const cookies: Record<string, string> = {};
          cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2) {
              const key = parts[0].trim();
              const value = parts.slice(1).join('=').trim();
              cookies[key] = value;
            }
          });
          
          if (cookies['token']) {
            authHeader = cookies['token'];
          }
        } catch (error) {
          console.error('Error parsing cookies:', error);
        }
      }
    }
    
    if (!authHeader) {
      console.log('No authorization header or token, cannot create flow');
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    
    // Передаем заголовок авторизации в запрос к бэкенду
    console.log('Attempting to create flow on backend with auth header');
    try {
      const response = await fetchApi(API_ENDPOINTS.flows, {
        method: 'POST',
        headers: {
          'Authorization': authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      console.log('Backend response:', response);
      return NextResponse.json(response, { status: 201 });
    } catch (error: any) {
      console.error('Error creating flow on backend:', error);
      
      // Подробная информация об ошибке для легкой отладки
      const errorMessage = error?.message || 'Unknown error';
      const statusCode = error?.status || 500;
      
      console.log(`Backend flow creation failed: ${errorMessage} (${statusCode})`);
      
      return NextResponse.json({ 
        error: 'Failed to create flow on server',
        message: errorMessage,
        details: 'Please contact administrator to fix the backend issue'
      }, { status: statusCode });
    }
  } catch (error: any) {
    console.error('Unhandled error in POST flow route:', error);
    return NextResponse.json({ error: 'Internal server error', message: error?.message }, { status: 500 });
  }
} 