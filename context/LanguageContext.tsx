import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import i18n from '@/i18n';

export type LanguageCode = 'en' | 'ko' | 'ja' | 'zh-CN' | 'zh-TW' | 'fr' | 'es';

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
};

const LANGUAGE_KEY = 'language-storage';
const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'fr', 'es'];

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
});

function isSupportedLanguage(value: string | null): value is LanguageCode {
  return SUPPORTED_LANGUAGES.includes(value as LanguageCode);
}

function resolveLanguageFromLocales(locales: Localization.Locale[]): LanguageCode {
  for (const locale of locales) {
    const languageTag = locale.languageTag;
    const normalizedTag = languageTag.toLowerCase();
    const languageCode = locale.languageCode?.toLowerCase();

    if (languageCode === 'zh' || normalizedTag.startsWith('zh')) {
      const isTraditionalChinese =
        normalizedTag.includes('hant') ||
        normalizedTag.includes('-tw') ||
        normalizedTag.includes('-hk') ||
        normalizedTag.includes('-mo');

      return isTraditionalChinese ? 'zh-TW' : 'zh-CN';
    }

    if (languageCode && isSupportedLanguage(languageCode)) {
      return languageCode;
    }
  }

  return 'en';
}

function getSystemLanguage(): LanguageCode {
  return resolveLanguageFromLocales(Localization.getLocales());
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [hasManualLanguage, setHasManualLanguage] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLanguage() {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      const shouldUseManualLanguage = isSupportedLanguage(storedLanguage);
      const nextLanguage = shouldUseManualLanguage ? storedLanguage : getSystemLanguage();

      if (isMounted) {
        setHasManualLanguage(shouldUseManualLanguage);
        setLanguageState(nextLanguage);
        i18n.changeLanguage(nextLanguage);
      }
    }

    loadLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasManualLanguage) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') {
        return;
      }

      const nextLanguage = getSystemLanguage();
      setLanguageState(nextLanguage);
      i18n.changeLanguage(nextLanguage);
    });

    return () => subscription.remove();
  }, [hasManualLanguage]);

  const setLanguage = (lang: LanguageCode) => {
    setHasManualLanguage(true);
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext);
}
