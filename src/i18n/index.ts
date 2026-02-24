import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './locales/ja';
import en from './locales/en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: 'ja',           // デフォルト言語
    fallbackLng: 'ja',
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    interpolation: {
      escapeValue: false, // React Native はXSSリスクなし
    },
  });

export default i18n;
