/**
 * Theme Service
 * Manages user theme preferences (light/dark) in Firebase with localStorage fallback
 *
 * Firebase Schema:
 * users/{userId}/preferences/theme: 'light' | 'dark'
 *
 * Example:
 * users/auth0|123/preferences/theme: 'dark'
 */

import { ref, get, set } from 'firebase/database';
import { db } from './firebase';

const THEME_KEY = 'pannello-stufa-theme';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

/**
 * Get theme preference for a user
 * Priority: Firebase > localStorage > system preference
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<string>} Theme value ('light' | 'dark')
 */
export async function getThemePreference(userId) {
  // Try Firebase first
  if (userId) {
    try {
      const themeRef = ref(db, `users/${userId}/preferences/theme`);
      const snapshot = await get(themeRef);

      if (snapshot.exists()) {
        const theme = snapshot.val();
        // Sync to localStorage for offline
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_KEY, theme);
        }
        return theme;
      }
    } catch (error) {
      console.error('Error getting theme from Firebase:', error);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const localTheme = localStorage.getItem(THEME_KEY);
    if (localTheme && Object.values(THEMES).includes(localTheme)) {
      return localTheme;
    }
  }

  // Default to light
  return THEMES.LIGHT;
}

/**
 * Update theme preference for a user
 * Saves to both Firebase and localStorage
 * @param {string} userId - Auth0 user ID
 * @param {string} theme - Theme value ('light' | 'dark')
 * @returns {Promise<boolean>} Success status
 */
export async function updateThemePreference(userId, theme) {
  if (!Object.values(THEMES).includes(theme)) {
    throw new Error(`Invalid theme: ${theme}. Must be 'light' or 'dark'`);
  }

  // Save to localStorage immediately (optimistic update)
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_KEY, theme);
    applyThemeToDOM(theme);
  }

  // Save to Firebase if user logged in
  if (userId) {
    try {
      const themeRef = ref(db, `users/${userId}/preferences/theme`);
      await set(themeRef, theme);
      return true;
    } catch (error) {
      console.error('Error updating theme in Firebase:', error);
      throw error;
    }
  }

  return true;
}

/**
 * Toggle theme between light and dark
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<string>} New theme value
 */
export async function toggleTheme(userId) {
  const currentTheme = await getThemePreference(userId);
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  await updateThemePreference(userId, newTheme);
  return newTheme;
}

/**
 * Apply theme to DOM (add/remove 'dark' class on html element)
 * @param {string} theme - Theme value ('light' | 'dark')
 */
export function applyThemeToDOM(theme) {
  if (typeof window === 'undefined') return;

  const html = document.documentElement;
  if (theme === THEMES.DARK) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

/**
 * Initialize theme on app load
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<string>} Current theme
 */
export async function initializeTheme(userId) {
  const theme = await getThemePreference(userId);
  applyThemeToDOM(theme);
  return theme;
}

export { THEMES };
