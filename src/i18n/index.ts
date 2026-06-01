import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from './locales/ar';
import en from './locales/en';

export const SUPPORTED_LANGUAGES = ['ar', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type Direction = 'rtl' | 'ltr';

export const LANGUAGE_DIRECTION: Record<SupportedLanguage, Direction> = {
  ar: 'rtl',
  en: 'ltr',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'ar',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'finfamily-lang',
    },
  });

export default i18n;
