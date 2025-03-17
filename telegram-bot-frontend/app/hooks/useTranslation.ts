import { usePathname } from 'next/navigation';
import en from '../i18n/en.json';
import ru from '../i18n/ru.json';

type TranslationKey = string;
type NestedObject = { [key: string]: string | NestedObject };

export function useTranslation() {
  const pathname = usePathname();
  const currentLang = pathname?.startsWith('/ru') ? 'ru' : 'en';
  const translations = currentLang === 'ru' ? ru : en;

  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value === 'string') {
      return value;
    }

    console.warn(`Invalid translation value for key: ${key}`);
    return key;
  };

  return { t, currentLang };
} 