'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getThemePreference, updateThemePreference, applyThemeToDOM, THEMES } from '@/lib/themeService';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  toggleTheme: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [theme, setThemeState] = useState<'light' | 'dark'>(THEMES.LIGHT);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize theme on mount
  useEffect(() => {
    async function loadTheme(): Promise<void> {
      try {
        const savedTheme = await getThemePreference(user?.sub);
        setThemeState(savedTheme);
        applyThemeToDOM(savedTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTheme();
  }, [user?.sub]);

  const setTheme = async (newTheme: 'light' | 'dark'): Promise<void> => {
    try {
      await updateThemePreference(user?.sub, newTheme);
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  };

  const toggleTheme = async (): Promise<void> => {
    const newTheme = theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    await setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
