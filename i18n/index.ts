import i18n from 'i18next';
import * as Localization from 'expo-localization';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import ko from '@/locales/ko.json';
import ja from '@/locales/ja.json';
import zhCN from '@/locales/zh-CN.json';
import zhTW from '@/locales/zh-TW.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';

function getInitialLanguage() {
  for (const locale of Localization.getLocales()) {
    const languageTag = locale.languageTag.toLowerCase();
    const languageCode = locale.languageCode?.toLowerCase();

    if (languageCode === 'zh' || languageTag.startsWith('zh')) {
      const isTraditionalChinese =
        languageTag.includes('hant') ||
        languageTag.includes('-tw') ||
        languageTag.includes('-hk') ||
        languageTag.includes('-mo');

      return isTraditionalChinese ? 'zh-TW' : 'zh-CN';
    }

    if (['en', 'ko', 'ja', 'fr', 'es'].includes(languageCode ?? '')) {
      return languageCode;
    }
  }

  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja },
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
