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
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
};

export type Theme = typeof THEMES[keyof typeof THEMES];

/**
 * Get theme preference for a user via API
 * Priority: Firebase > localStorage > system preference
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<string>} Theme value ('light' | 'dark')
 */
export async function getThemePreference(userId: string | null | undefined): Promise<Theme> {
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
    if (localTheme && (localTheme === 'light' || localTheme === 'dark')) {
      return localTheme as Theme;
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
export async function updateThemePreference(userId: string | null | undefined, theme: Theme): Promise<boolean> {
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
export async function toggleTheme(userId: string | null | undefined): Promise<Theme> {
  const currentTheme = await getThemePreference(userId);
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  await updateThemePreference(userId, newTheme);
  return newTheme;
}

/**
 * Apply theme to DOM (add/remove 'dark' class on html element)
 * Includes smooth transition animation and updates theme-color meta tag
 * @param {string} theme - Theme value ('light' | 'dark')
 */
export function applyThemeToDOM(theme: Theme): void {
  if (typeof window === 'undefined') return;

  const html = document.documentElement;

  // Add transition classes for smooth theme change
  html.style.transition = 'background-color 0.3s ease, color 0.3s ease';

  // Apply theme
  if (theme === THEMES.DARK) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  // Update theme-color meta tag for iOS PWA status bar
  const themeColor = theme === THEMES.DARK ? '#0f172a' : '#f8fafc';
  let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', themeColor);
  } else {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    metaThemeColor.content = themeColor;
    document.head.appendChild(metaThemeColor);
  }

  // Remove transition after animation completes to avoid conflicts
  setTimeout(() => {
    html.style.transition = '';
  }, 300);
}

/**
 * Initialize theme on app load
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<string>} Current theme
 */
export async function initializeTheme(userId: string | null | undefined): Promise<Theme> {
  const theme = await getThemePreference(userId);
  applyThemeToDOM(theme);
  return theme;
}

export { THEMES };
