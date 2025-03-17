'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '../hooks/useTranslation';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

export function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const currentLang = pathname?.startsWith('/ru') ? 'ru' : 'en';

  const handleLanguageChange = (langCode: string) => {
    if (!pathname) return;
    
    const newPath = langCode === 'en' 
      ? pathname.replace(/^\/ru/, '')
      : pathname.startsWith('/ru')
        ? pathname
        : `/ru${pathname}`;
    
    router.push(newPath);
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50">
        <span className="sr-only">{t('common.changeLanguage')}</span>
        <GlobeAltIcon className="h-5 w-5" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
          {languages.map((lang) => (
            <Menu.Item key={lang.code}>
              {({ active }) => (
                <button
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    block w-full px-4 py-2 text-left text-sm
                    ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}
                    ${currentLang === lang.code ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}
                  `}
                >
                  {lang.name}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 