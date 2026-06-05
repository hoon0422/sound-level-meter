import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import i18n from '@/i18n';

export type LanguageCode = 'en' | 'ko' | 'ja' | 'zh-CN' | 'zh-TW' | 'fr' | 'es';
export type LanguageMode = 'system' | 'manual';

type LanguageContextType = {
  language: LanguageCode;
  languageMode: LanguageMode;
  setLanguage: (lang: LanguageCode) => void;
  setSystemLanguage: () => void;
};

const LANGUAGE_KEY = 'language-storage';
const LANGUAGE_MODE_KEY = 'language-mode-storage';
const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'fr', 'es'];

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  languageMode: 'system',
  setLanguage: () => {},
  setSystemLanguage: () => {},
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
  const [languageMode, setLanguageMode] = useState<LanguageMode>('system');

  useEffect(() => {
    let isMounted = true;

    async function loadLanguage() {
      const [storedMode, storedLanguage] = await Promise.all([
        AsyncStorage.getItem(LANGUAGE_MODE_KEY),
        AsyncStorage.getItem(LANGUAGE_KEY),
      ]);
      const shouldUseManualLanguage =
        storedMode === 'manual' || (storedMode !== 'system' && isSupportedLanguage(storedLanguage));
      const nextMode: LanguageMode = shouldUseManualLanguage ? 'manual' : 'system';
      const nextLanguage =
        shouldUseManualLanguage && isSupportedLanguage(storedLanguage) ? storedLanguage : getSystemLanguage();

      if (isMounted) {
        setLanguageMode(nextMode);
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
    if (languageMode !== 'system') {
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
  }, [languageMode]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageMode('manual');
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_MODE_KEY, 'manual');
    AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  const setSystemLanguage = () => {
    const nextLanguage = getSystemLanguage();
    setLanguageMode('system');
    setLanguageState(nextLanguage);
    i18n.changeLanguage(nextLanguage);
    AsyncStorage.setItem(LANGUAGE_MODE_KEY, 'system');
    AsyncStorage.removeItem(LANGUAGE_KEY);
  };

  return (
    <LanguageContext.Provider value={{ language, languageMode, setLanguage, setSystemLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext);
}
