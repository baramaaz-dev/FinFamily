import { useTranslation } from 'react-i18next';
import {
  LANGUAGE_DIRECTION,
  type Direction,
  type SupportedLanguage,
} from '@/i18n';

export function useDirection(): {
  direction: Direction;
  language: SupportedLanguage;
  isRTL: boolean;
  toggleLanguage: () => void;
} {
  const { i18n } = useTranslation();
  const language = (i18n.language ?? 'ar') as SupportedLanguage;
  const direction = LANGUAGE_DIRECTION[language] ?? 'rtl';

  const toggleLanguage = () => {
    const next: SupportedLanguage = language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.setAttribute('dir', LANGUAGE_DIRECTION[next]);
    document.documentElement.setAttribute('lang', next);
  };

  return {
    direction,
    language,
    isRTL: direction === 'rtl',
    toggleLanguage,
  };
}
