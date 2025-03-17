import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT Secret (должен совпадать с бэкендом)
const JWT_SECRET = 'aQ0K/aJl83iXiklN19H/rMuBkLHx8nPAdnRburQtWtc=';

// Тестовые пользователи для мок-сервера
const MOCK_USERS = [
  { id: 1, username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'super_admin', isActive: true },
  { id: 2, username: 'admintest', email: 'admintest@example.com', password: 'admintest123', role: 'admin', isActive: true },
  { id: 3, username: 'operator', email: 'operator@example.com', password: 'operator123', role: 'operator', isActive: true },
];

// Настройка для использования Node.js runtime вместо Edge runtime
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Получаем данные из запроса
    const body = await request.json();
    console.log('Received login request:', body);
    
    // Проверяем, что есть username/email и пароль
    if ((!body.username && !body.email) || !body.password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      );
    }
    
    // Ищем пользователя
    const user = MOCK_USERS.find(
      (u) => 
        (body.username && u.username.toLowerCase() === body.username.toLowerCase()) ||
        (body.email && u.email.toLowerCase() === body.email.toLowerCase())
    );
    
    // Проверяем пароль
    if (!user || user.password !== body.password) {
      console.log('Invalid credentials, user:', user);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Генерируем JWT токен (совместимый с бэкендом)
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Login successful for user:', user.username);
    console.log('Generated JWT token:', token);
    
    // Возвращаем токен и данные пользователя
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      }
    });
    
  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json(
      { error: 'Server error during login' },
      { status: 500 }
    );
  }
} 