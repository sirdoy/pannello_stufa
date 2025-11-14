'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getThemePreference, updateThemePreference, applyThemeToDOM, THEMES } from '@/lib/themeService';

const ThemeContext = createContext({
  theme: THEMES.LIGHT,
  setTheme: () => {},
  toggleTheme: () => {},
  isLoading: true,
});

export function ThemeProvider({ children }) {
  const { user } = useUser();
  const [theme, setThemeState] = useState(THEMES.LIGHT);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme on mount
  useEffect(() => {
    async function loadTheme() {
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

  const setTheme = async (newTheme) => {
    try {
      await updateThemePreference(user?.sub, newTheme);
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    await setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
