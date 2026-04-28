import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '@/i18n';

export type LanguageCode = 'en' | 'ko' | 'ja' | 'zh-CN' | 'zh-TW' | 'fr' | 'es';

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
};

const LANGUAGE_KEY = 'language-storage';

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then(stored => {
      const SUPPORTED: LanguageCode[] = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'fr', 'es'];
      if (stored && SUPPORTED.includes(stored as LanguageCode)) {
        setLanguageState(stored as LanguageCode);
        i18n.changeLanguage(stored);
      } else {
        const locale = Localization.getLocales()[0];
        const languageTag = locale?.languageTag ?? 'en';
        const languageCode = locale?.languageCode ?? 'en';
        const TAG_MAP: Partial<Record<string, LanguageCode>> = { 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW' };
        const CODE_MAP: Partial<Record<string, LanguageCode>> = { ko: 'ko', ja: 'ja', fr: 'fr', es: 'es' };
        const detected: LanguageCode = TAG_MAP[languageTag] ?? CODE_MAP[languageCode] ?? 'en';
        setLanguageState(detected);
        i18n.changeLanguage(detected);
      }
    });
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext);
}
