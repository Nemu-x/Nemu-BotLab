import { Inter } from 'next/font/google';
import Navigation from '../components/Navigation';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex">
            {/* Sidebar */}
            <div className="fixed inset-y-0 z-50 flex w-64 flex-col">
              <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                  <div className="flex flex-shrink-0 items-center px-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Telegram Bot</h1>
                  </div>
                  <Navigation />
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col pl-64">
              <main className="flex-1">
                <div className="py-6">
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 
 