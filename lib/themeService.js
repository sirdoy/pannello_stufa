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

const THEME_KEY = 'pannello-stufa-theme';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

/**
 * Get theme preference for a user via API
 * Priority: Firebase > localStorage > system preference
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<string>} Theme value ('light' | 'dark')
 */
export async function getThemePreference(userId) {
  // Try Firebase first via API
  if (userId) {
    try {
      const response = await fetch('/api/user/theme', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const theme = data.theme;

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
 * Update theme preference for a user via API
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

  // Save to Firebase via API if user logged in
  if (userId) {
    try {
      const response = await fetch('/api/user/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update theme');
      }

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
