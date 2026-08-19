import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';
export type AccentColor = 'blue' | 'emerald' | 'purple' | 'indigo' | 'rose';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('unixx_theme') as Theme | null;
    return saved && ['system', 'light', 'dark'].includes(saved) ? saved : 'system';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('unixx_accent_color') as AccentColor | null;
    return saved && ['blue', 'emerald', 'purple', 'indigo', 'rose'].includes(saved) ? saved : 'blue';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('unixx_theme', newTheme);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem('unixx_accent_color', color);
    document.documentElement.setAttribute('data-accent', color);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    const root = document.documentElement;

    const updateTheme = () => {
      let isDark = false;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        root.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark');
          setResolvedTheme('dark');
        } else {
          root.classList.remove('dark');
          setResolvedTheme('light');
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      } else {
        mediaQuery.addListener(listener);
        return () => mediaQuery.removeListener(listener);
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
