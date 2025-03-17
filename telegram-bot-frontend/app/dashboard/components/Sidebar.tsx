'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/app/hooks/useTranslation';
import { FiMenu, FiX, FiHome, FiMessageSquare, FiUsers, FiSettings, FiGlobe, FiChevronDown, FiCommand, FiMessageCircle, FiLogOut, FiTag, FiGithub } from 'react-icons/fi';
import { LuLayoutDashboard } from 'react-icons/lu';
import { ThemeToggle } from '../../components/ThemeToggle';

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
};

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-50 text-indigo-600 dark:bg-itm-dark-accent dark:text-indigo-400'
          : 'text-gray-700 dark:text-itm-text-secondary hover:bg-gray-100 dark:hover:bg-itm-dark-accent'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const pathname = usePathname() || '';
  const router = useRouter();
  const { t } = useTranslation();
  const isRussian = pathname.startsWith('/ru');

  const toggleLanguage = () => {
    const newPath = isRussian 
      ? pathname.replace(/^\/ru/, '') 
      : `/ru${pathname}`;
    
    router.push(newPath);
  };

  const handleLanguageChange = (lang: string) => {
    const newPath = lang === 'en' 
      ? pathname.replace(/^\/ru/, '') 
      : pathname.startsWith('/ru') 
        ? pathname 
        : `/ru${pathname}`;

    router.push(newPath || '/');
    setIsLangDropdownOpen(false);
  };

  // Clean up event listener on unmount
  useEffect(() => {
    const closeDropdownOnClickOutside = (e: MouseEvent) => {
      if (isLangDropdownOpen) {
        setIsLangDropdownOpen(false);
      }
    };

    // Add event listener if dropdown is open
    if (isLangDropdownOpen) {
      document.addEventListener('click', closeDropdownOnClickOutside);
    }

    return () => {
      document.removeEventListener('click', closeDropdownOnClickOutside);
    };
  }, [isLangDropdownOpen]);

  // Функция для выхода из системы
  const handleLogout = () => {
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    // Удаляем токен из cookies
    document.cookie = 'token=; path=/; max-age=0';
    // Перенаправляем на страницу входа
    router.push('/login');
  };

  useEffect(() => {
    // Close mobile menu when path changes
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-gray-100 dark:bg-itm-dark-accent text-gray-700 dark:text-itm-text-primary"
        >
          {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-0 z-40 flex transform transition-transform ease-in-out duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative flex flex-col w-72 max-w-xs h-full bg-white dark:bg-itm-dark-secondary shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-itm-border">
            <div className="flex items-center">
              <span className="text-lg font-semibold text-indigo-600 dark:text-itm-text-primary">Bot Lab</span>
              <Link 
                href="https://github.com/Nemu-x" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiGithub className="w-5 h-5" />
              </Link>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-itm-text-secondary dark:hover:text-itm-text-primary"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavItem
              href="/dashboard"
              icon={<LuLayoutDashboard className="w-5 h-5" />}
              label={t('navigation.Dashboard') || 'Dashboard'}
              isActive={pathname === '/dashboard' || pathname === '/ru/dashboard'}
            />
            <NavItem
              href="/dashboard/chats"
              icon={<FiMessageSquare className="w-5 h-5" />}
              label={t('navigation.Chats') || 'Chats'}
              isActive={pathname.includes('/dashboard/chats')}
            />
            <NavItem
              href="/dashboard/tickets"
              icon={<FiTag className="w-5 h-5" />}
              label="Tickets"
              isActive={pathname.includes('/dashboard/tickets')}
            />
            <NavItem
              href="/dashboard/flows"
              icon={<FiMessageSquare className="w-5 h-5" />}
              label={t('navigation.flows')}
              isActive={pathname.includes('/dashboard/flows')}
            />
            <NavItem
              href="/dashboard/commands"
              icon={<FiCommand className="w-5 h-5" />}
              label={t('navigation.commands')}
              isActive={pathname.includes('/dashboard/commands')}
            />
            <NavItem
              href="/dashboard/operators"
              icon={<FiUsers className="w-5 h-5" />}
              label={t('navigation.operators')}
              isActive={pathname.includes('/dashboard/operators')}
            />
            <NavItem
              href="/dashboard/settings"
              icon={<FiSettings className="w-5 h-5" />}
              label={t('navigation.settings')}
              isActive={pathname.includes('/dashboard/settings')}
            />
            
            {/* Кнопка выхода из системы */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 mt-4 rounded-md text-sm font-medium transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <FiLogOut className="w-5 h-5 mr-3" />
              <span>{t('navigation.logout') || 'Logout'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-full w-64 md:w-64 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } bg-white dark:bg-itm-dark-secondary border-r border-gray-200 dark:border-itm-border`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 mb-2">
            <Link href="/dashboard" className="flex items-center">
              <LuLayoutDashboard className="w-8 h-8 mr-2 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-semibold text-gray-800 dark:text-itm-text-primary">Bot Lab</span>
              <Link 
                href="https://github.com/Nemu-x" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FiGithub className="w-5 h-5" />
              </Link>
            </Link>
          </div>

          {/* Theme Toggle */}
          <div className="px-6 mb-4">
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <div className="px-4 py-2">
            <h3 className="mb-2 ml-2 text-xs font-semibold text-gray-500 uppercase dark:text-itm-text-secondary">
              {t('navigation.title')}
            </h3>
            <nav className="space-y-1">
              <NavItem 
                href="/dashboard" 
                icon={<FiHome className="w-5 h-5" />} 
                label={t('navigation.dashboard')} 
                isActive={pathname === '/dashboard' || pathname === '/ru/dashboard'} 
              />
              <NavItem 
                href="/dashboard/chats" 
                icon={<FiMessageCircle className="w-5 h-5" />} 
                label={t('navigation.chats')} 
                isActive={pathname.includes('/dashboard/chats')} 
              />
              <NavItem 
                href="/dashboard/tickets" 
                icon={<FiTag className="w-5 h-5" />} 
                label="Tickets" 
                isActive={pathname.includes('/dashboard/tickets')} 
              />
              <NavItem 
                href="/dashboard/flows" 
                icon={<FiMessageSquare className="w-5 h-5" />} 
                label={t('navigation.flows')} 
                isActive={pathname.includes('/dashboard/flows')} 
              />
              <NavItem 
                href="/dashboard/commands" 
                icon={<FiCommand className="w-5 h-5" />} 
                label={t('navigation.commands')} 
                isActive={pathname.includes('/dashboard/commands')} 
              />
              <NavItem 
                href="/dashboard/operators" 
                icon={<FiUsers className="w-5 h-5" />} 
                label={t('navigation.operators')} 
                isActive={pathname.includes('/dashboard/operators')} 
              />
              <NavItem 
                href="/dashboard/settings" 
                icon={<FiSettings className="w-5 h-5" />} 
                label={t('navigation.settings')} 
                isActive={pathname.includes('/dashboard/settings')} 
              />
              
              {/* Кнопка выхода из системы */}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 mt-4 rounded-md text-sm font-medium transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <FiLogOut className="w-5 h-5 mr-3" />
                <span>{t('navigation.logout') || 'Logout'}</span>
              </button>
            </nav>
          </div>

          {/* Language Switcher - moved to top */}
          <div className="mt-auto px-4 pb-6">
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center justify-between w-full px-3 py-2 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <FiGlobe className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('language')}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
                    {isRussian ? 'RU' : 'EN'}
                  </span>
                  <FiChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isLangDropdownOpen ? 'transform rotate-180' : ''}`} />
                </div>
              </button>

              {/* Language Dropdown - adjusted to show above */}
              {isLangDropdownOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-md shadow-lg dark:bg-gray-700 ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        !isRussian 
                          ? 'bg-gray-100 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="w-6 inline-block">🇬🇧</span>
                      <span className="ml-2">English</span>
                      {!isRussian && <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">Active</span>}
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ru')}
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        isRussian 
                          ? 'bg-gray-100 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="w-6 inline-block">🇷🇺</span>
                      <span className="ml-2">Русский</span>
                      {isRussian && <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">Активно</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
} 