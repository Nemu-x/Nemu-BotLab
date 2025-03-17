'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/config/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Определяем, что ввёл пользователь: email или username
      const isEmail = identifier.includes('@');
      const loginData = isEmail 
        ? { email: identifier, password } 
        : { username: identifier, password };
      
      console.log('Login attempt with:', loginData); // Debug log
      
      // Используем локальный API эндпоинт вместо внешнего API
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      // Обрабатываем ответ
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to login');
      }
      
      const data = await response.json();
      console.log('Login response:', data); // Debug log
      
      if (data.token) {
        // Сохраняем токен в localStorage для совместимости
        localStorage.setItem('token', data.token);
        
        // Сохраняем токен в cookie для middleware
        document.cookie = `token=${data.token}; path=/; max-age=86400`;
        
        // Проверяем, есть ли URL для редиректа
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || '/dashboard';
        
        router.push(redirectUrl);
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      setError(err?.message || 'Failed to login. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.svg"
            alt="Bot Lab Dashboard"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your username or email address
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Username or Email address
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Username or Email address"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Available accounts: <br/>
              <span className="font-medium text-gray-800">admin / admin123</span> (Super Admin)<br/>
              <span className="font-medium text-gray-800">admintest / admintest123</span> (Admin)
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 