import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import themes from '@/components/themes';

type ThemeName = 'light' | 'dark';

type ThemeColors = {
  background: string;
  text: string;
  primary: string;
  border: string;
};

type ThemeTypography = {
  fontFamily: string;
  headingWeight: string;
  bodyWeight: string;
  scale: number;
};

type ThemeContextType = {
  colors: ThemeColors;
  typography: ThemeTypography;
  themeName: ThemeName;
  setTheme: (t: ThemeName) => void;
};

const THEME_KEY = 'theme-storage';

const ThemeContext = createContext<ThemeContextType>({
  colors: themes.light.colors,
  typography: themes.light.typography,
  themeName: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(
    (Appearance.getColorScheme() as ThemeName) ?? 'light'
  );

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark') {
        setThemeName(stored);
      }
    });
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeName(t);
    AsyncStorage.setItem(THEME_KEY, t);
  };

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider value={{ colors: theme.colors, typography: theme.typography, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
