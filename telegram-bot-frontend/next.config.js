/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Улучшение производительности сборки
  swcMinify: true,
  // Отключение ESLint в процессе сборки (только для режима разработки)
  eslint: {
    // Проверять в процессе компиляции только если это не режим разработки
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  // Улучшение кэширования
  onDemandEntries: {
    // период (в мс), в течение которого собранные страницы остаются в памяти
    maxInactiveAge: 25 * 1000,
    // количество страниц, которые должны быть сохранены в памяти
    pagesBufferLength: 2,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
  serverRuntimeConfig: {
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3003'
  },
  publicRuntimeConfig: {
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3003'
  }
}

module.exports = nextConfig 