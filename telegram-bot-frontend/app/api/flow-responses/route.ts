import { NextResponse } from 'next/server';
import { API_ENDPOINTS, fetchApi } from '@/src/config/api';
import { API_BASE_URL } from '@/src/config/env';

// Используем Node.js runtime, а не Edge runtime
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    console.log('GET /api/flow-responses - Fetching all flow responses from backend');
    
    // Получаем заголовок авторизации из запроса клиента
    let authHeader = request.headers.get('authorization');
    console.log('Initial authorization header:', authHeader);
    
    // Если заголовок Authorization отсутствует, проверяем cookie
    if (!authHeader) {
      const cookieHeader = request.headers.get('cookie');
      console.log('Cookie header raw:', cookieHeader);
      
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
        const authCookie = cookies.find(cookie => cookie.startsWith('next-auth.session-token='));
        
        if (authCookie) {
          const token = authCookie.split('=')[1];
          authHeader = `Bearer ${token}`;
          console.log('Generated authorization header from cookie:', authHeader);
        }
      }
    }
    
    // Формируем заголовки для запроса к бэкенду
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Делаем запрос к бэкенду
    const backendUrl = API_BASE_URL || 'http://localhost:3003';
    const response = await fetch(`${backendUrl}/api/flow-responses`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch flow responses' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} flow responses from backend`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching flow responses:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}