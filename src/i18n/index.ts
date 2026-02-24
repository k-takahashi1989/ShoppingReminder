import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../storage/mmkvStorage';
import ja from './locales/ja';
import en from './locales/en';

const LANG_KEY = 'app_language';

// MMKV から保存済み言語を取得（なければ日本語）
const savedLang = storage.getString(LANG_KEY) || 'ja';

/** 言語を変更し MMKV に永続化する */
export function changeAndPersistLanguage(lang: string): void {
  i18n.changeLanguage(lang);
  storage.set(LANG_KEY, lang);
}

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: savedLang,
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
