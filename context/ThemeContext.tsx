import themes from '@/components/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

type ThemeName = 'light' | 'dark';

type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  primary: string;
  border: string;
  shadow: string;
  divider: string;
  inactive: string;
  quiet: string;
  moderate: string;
  soundGuideSlot: string;
  loud: string;
  info: string;
};

type ThemeTypography = {
  fontFamily: string;
  headingWeight: string;
  bodyWeight: string;
  scale: number;
};

type ThemeContextType = {
  logo: number;
  colors: ThemeColors;
  typography: ThemeTypography;
  themeName: ThemeName;
  setTheme: (t: ThemeName) => void;
};

const THEME_KEY = 'theme-storage';

const ThemeContext = createContext<ThemeContextType>({
  logo: themes.light.logo,
  colors: themes.light.colors,
  typography: themes.light.typography,
  themeName: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>((Appearance.getColorScheme() as ThemeName) ?? 'light');

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
    <ThemeContext.Provider
      value={{ logo: theme.logo, colors: theme.colors, typography: theme.typography, themeName, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
