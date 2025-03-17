# Localization Implementation Guide

This document provides a complete guide for implementing proper localization in the Telegram Bot application, focusing on English and Russian languages support.

## Current Localization Issues

The current implementation has several problems:

1. **Duplicate Route Structure** - The `/ru` directory creates duplicated pages that are hard to maintain
2. **Inconsistent Translation Usage** - Some components use translation hooks while others have hardcoded text
3. **Mixed Language Content** - Some Russian text appears in the English version and vice versa
4. **No Language Persistence** - User language preference isn't saved between sessions
5. **No Dynamic Language Switching** - Changing language requires a page refresh

## Recommended Approach

We recommend implementing Next.js internationalization (i18n) with JSON-based translation files and a custom hook for accessing translations.

## Implementation Steps

### 1. Set Up Next.js i18n Configuration

First, configure Next.js's built-in internationalization support:

```javascript
// next.config.js
module.exports = {
  i18n: {
    // List of locales supported
    locales: ['en', 'ru'],
    // Default locale
    defaultLocale: 'en',
    // Auto-detect user's preferred locale
    localeDetection: true,
  },
}
```

### 2. Create Translation Files

Create structured JSON files for all text content:

```
/public/locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   ├── chats.json
│   ├── flows.json
│   ├── commands.json
│   ├── operators.json
│   ├── settings.json
│   └── tickets.json
└── ru/
    ├── common.json
    ├── auth.json
    ├── dashboard.json
    ├── chats.json
    ├── flows.json
    ├── commands.json
    ├── operators.json
    ├── settings.json
    └── tickets.json
```

Example content for English `common.json`:

```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "chats": "Chats",
    "flows": "Flows",
    "commands": "Commands",
    "operators": "Operators",
    "settings": "Settings",
    "tickets": "Tickets",
    "logout": "Logout"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "refresh": "Refresh",
    "send": "Send",
    "upload": "Upload"
  },
  "status": {
    "loading": "Loading...",
    "success": "Success",
    "error": "Error",
    "empty": "No data available"
  }
}
```

And for Russian `common.json`:

```json
{
  "navigation": {
    "dashboard": "Панель управления",
    "chats": "Чаты",
    "flows": "Сценарии",
    "commands": "Команды",
    "operators": "Операторы",
    "settings": "Настройки",
    "tickets": "Тикеты",
    "logout": "Выход"
  },
  "actions": {
    "save": "Сохранить",
    "cancel": "Отмена",
    "delete": "Удалить",
    "edit": "Редактировать",
    "create": "Создать",
    "search": "Поиск",
    "filter": "Фильтр",
    "refresh": "Обновить",
    "send": "Отправить",
    "upload": "Загрузить"
  },
  "status": {
    "loading": "Загрузка...",
    "success": "Успешно",
    "error": "Ошибка",
    "empty": "Данные отсутствуют"
  }
}
```

### 3. Create Translation Loader

Create a utility to load translations:

```javascript
// utils/translations.js
import enCommon from '../public/locales/en/common.json';
import enAuth from '../public/locales/en/auth.json';
import enDashboard from '../public/locales/en/dashboard.json';
// Import all other English files

import ruCommon from '../public/locales/ru/common.json';
import ruAuth from '../public/locales/ru/auth.json';
import ruDashboard from '../public/locales/ru/dashboard.json';
// Import all other Russian files

// Combine all translation files by language
export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    // Add other namespaces
  },
  ru: {
    common: ruCommon,
    auth: ruAuth,
    dashboard: ruDashboard,
    // Add other namespaces
  }
};
```

### 4. Create Translation Hook

Implement a custom hook for accessing translations:

```javascript
// hooks/useTranslation.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { resources } from '../utils/translations';

export const useTranslation = (namespace = 'common') => {
  const router = useRouter();
  const { locale, pathname, asPath, query } = router;
  const [currentLocale, setCurrentLocale] = useState(locale || 'en');
  
  useEffect(() => {
    setCurrentLocale(locale || 'en');
  }, [locale]);
  
  // Function to change the language
  const changeLanguage = (newLocale) => {
    // Save preference in localStorage
    localStorage.setItem('preferredLanguage', newLocale);
    
    // Navigate to the same page with new locale
    router.push({ pathname, query }, asPath, { locale: newLocale });
  };
  
  // Translation function
  const t = (key) => {
    if (!key) return '';
    
    // Handle namespace:key format
    let ns = namespace;
    let translationKey = key;
    
    if (key.includes(':')) {
      const parts = key.split(':');
      ns = parts[0];
      translationKey = parts[1];
    }
    
    // Navigate the nested structure
    const keys = translationKey.split('.');
    let translation = resources[currentLocale]?.[ns];
    
    for (const k of keys) {
      translation = translation?.[k];
      if (!translation) return key; // Return key if translation not found
    }
    
    return translation || key;
  };
  
  return {
    t,
    locale: currentLocale,
    changeLanguage,
    locales: router.locales || ['en', 'ru']
  };
};
```

### 5. Create Language Switcher Component

```jsx
// components/LanguageSwitcher.jsx
import { useTranslation } from '../hooks/useTranslation';

export const LanguageSwitcher = () => {
  const { locale, changeLanguage, locales } = useTranslation();
  
  return (
    <div className="flex items-center space-x-2">
      {locales.map((lang) => (
        <button
          key={lang}
          onClick={() => changeLanguage(lang)}
          className={`px-2 py-1 rounded ${
            locale === lang
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
```

### 6. Initialize User's Preferred Language

Add initialization logic to load user's preferred language:

```jsx
// _app.jsx or layout.jsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user has a saved language preference
    const savedLocale = localStorage.getItem('preferredLanguage');
    
    // If user has a preference and it's different from current locale
    if (savedLocale && savedLocale !== router.locale) {
      // Change to preferred language
      router.push(router.asPath, router.asPath, { locale: savedLocale });
    }
  }, []);
  
  return <Component {...pageProps} />;
}
```

### 7. Update Components to Use Translation Hook

Replace all hardcoded text with translation calls:

Before:
```jsx
<button className="btn-primary">Save</button>
```

After:
```jsx
import { useTranslation } from '../hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <button className="btn-primary">{t('actions.save')}</button>
  );
};
```

### 8. Add Language Switcher to Layout

Add the language switcher to a prominent location like the navbar or settings page:

```jsx
// components/Navbar.jsx
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = () => {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Logo />
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {/* Navigation links */}
            </div>
          </div>
          <div className="flex items-center">
            <LanguageSwitcher />
            {/* Other navbar items */}
          </div>
        </div>
      </div>
    </nav>
  );
};
```

### 9. Remove `/ru` Directory and Duplicated Routes

Once the proper i18n implementation is in place, remove the duplicate `/ru` directory structure to avoid confusion and maintenance issues.

### 10. Update API Responses

Update backend API responses to include translations for dynamic content:

```javascript
// Example API response with translations
{
  "id": 1,
  "status": "open",
  "statusTranslations": {
    "en": "Open",
    "ru": "Открыт"
  },
  "title": "Sample ticket",
  "description": "This is a sample ticket",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

Then use these translations in the frontend:

```jsx
const TicketStatus = ({ ticket }) => {
  const { locale } = useTranslation();
  
  // Use the appropriate translation based on current locale
  const statusText = ticket.statusTranslations?.[locale] || ticket.status;
  
  return <span className="status-badge">{statusText}</span>;
};
```

## Testing Localization

### Test Checklist

1. **Language Detection**: Verify that the application correctly detects the user's browser language
2. **Language Switching**: Test that the language switcher changes the UI language without page reload
3. **Language Persistence**: Verify that the selected language persists across page navigation and sessions
4. **Translation Coverage**: Check for any missing translations or untranslated text
5. **Layout Issues**: Ensure that longer Russian text doesn't break the layout
6. **Dynamic Content**: Test that dynamically loaded content is properly translated
7. **Date/Time Formats**: Verify that dates and times respect the locale format

### Localization Testing Tool

Create a simple utility to help identify missing translations:

```javascript
// utils/localizationTester.js
import { resources } from './translations';

export const findMissingTranslations = () => {
  const missing = {};
  
  // Compare all keys in English to Russian
  const checkNamespace = (ns, enObj, ruObj, path = '') => {
    for (const key in enObj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof enObj[key] === 'object' && enObj[key] !== null) {
        // Recursively check nested objects
        checkNamespace(ns, enObj[key], ruObj?.[key] || {}, currentPath);
      } else if (!(ruObj && key in ruObj)) {
        // Record missing translation
        if (!missing[ns]) missing[ns] = [];
        missing[ns].push(currentPath);
      }
    }
  };
  
  // Check each namespace
  for (const ns in resources.en) {
    checkNamespace(ns, resources.en[ns], resources.ru[ns]);
  }
  
  return missing;
};
```

## Migration Strategy

To migrate from the current structure to the new i18n implementation:

1. Start by setting up the i18n configuration and translation files
2. Implement the translation hook and language switcher
3. Update one section of the application at a time, starting with common components
4. Test each section thoroughly before moving to the next
5. Keep the `/ru` directory until all components are updated
6. Finally, remove the `/ru` directory once everything is tested

## Best Practices

1. **Use Namespaces**: Organize translations by feature area
2. **Avoid String Concatenation**: Use placeholders instead of concatenating translated strings
3. **Consider Context**: Provide context for translators when words have multiple meanings
4. **Pluralization**: Handle pluralization correctly using appropriate patterns
5. **Format Numbers and Dates**: Use locale-aware formatting for numbers, currencies, and dates
6. **RTL Support**: Consider adding support for right-to-left languages in the future
7. **Translation Review**: Have native speakers review translations for accuracy 