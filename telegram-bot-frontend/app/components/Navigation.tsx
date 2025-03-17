'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '../hooks/useTranslation';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CommandLineIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  basePath: string;
};

export default function Navigation() {
  const { t, currentLang } = useTranslation();
  const pathname = usePathname() || '';
  const langPrefix = currentLang === 'ru' ? '/ru' : '';

  const navigation: NavigationItem[] = [
    {
      name: t('navigation.dashboard'),
      href: `${langPrefix}/dashboard`,
      icon: HomeIcon,
      basePath: '/dashboard'
    },
    {
      name: t('navigation.chats'),
      href: `${langPrefix}/dashboard/chats`,
      icon: ChatBubbleLeftRightIcon,
      basePath: '/dashboard/chats'
    },
    {
      name: t('navigation.dialogs'),
      href: `${langPrefix}/dashboard/dialogs`,
      icon: ChatBubbleLeftRightIcon,
      basePath: '/dashboard/dialogs'
    },
    {
      name: t('navigation.commands'),
      href: `${langPrefix}/dashboard/commands`,
      icon: CommandLineIcon,
      basePath: '/dashboard/commands'
    },
    {
      name: t('navigation.flows'),
      href: `${langPrefix}/dashboard/flows`,
      icon: ClipboardDocumentListIcon,
      basePath: '/dashboard/flows'
    },
    {
      name: t('navigation.operators'),
      href: `${langPrefix}/dashboard/operators`,
      icon: UserGroupIcon,
      basePath: '/dashboard/operators'
    },
    {
      name: t('navigation.settings'),
      href: `${langPrefix}/dashboard/settings`,
      icon: Cog6ToothIcon,
      basePath: '/dashboard/settings'
    },
  ];

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
                         pathname.startsWith(`${langPrefix}${item.basePath}/`) || 
                         (pathname === `${langPrefix}/dashboard` && item.basePath === '/dashboard');
        
        console.log(`Path: ${pathname}, Item: ${item.href}, IsActive: ${isActive}`);
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
              isActive
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
            }`}
          >
            <item.icon
              className={`mr-3 h-6 w-6 flex-shrink-0 ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
              }`}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
} 