import { NextRequest, NextResponse } from 'next/server';

// Пути, для которых не требуется авторизация
const publicPaths = ['/login', '/ru/login'];

// Публичные API пути, которые не требуют авторизации
const publicApiPaths = [
  '/api/users/login',
  '/api/health'
];

export function middleware(request: NextRequest) {
  // Для всех API запросов добавляем CORS заголовки
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Добавляем CORS заголовки
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Для OPTIONS запросов возвращаем 200 OK сразу
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }
    
    // Проверяем, является ли API путь публичным
    const isPublicApiPath = publicApiPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    
    // Если API путь публичный, пропускаем без проверки токена
    if (isPublicApiPath) {
      return response;
    }
    
    // Для остальных API путей проверяем токен, но не редиректим на логин
    const token = request.cookies.get('token')?.value;
    if (!token) {
      // Для API запросов возвращаем 401 вместо редиректа
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(response.headers)
          }
        }
      );
    }
    
    // Если токен есть, пропускаем запрос дальше
    return response;
  }
  
  // Проверяем, является ли текущий путь публичным
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // Если путь публичный, пропускаем дальше
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Получаем токен из cookies
  const token = request.cookies.get('token')?.value;
  
  // Если токена нет, перенаправляем на страницу входа
  if (!token) {
    // Сохраняем URL, куда пользователь пытался получить доступ
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', request.nextUrl.pathname);
    
    return NextResponse.redirect(url);
  }
  
  // Если токен есть, пропускаем запрос дальше
  return NextResponse.next();
}

// Указываем, какие пути должны проходить через middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 
 