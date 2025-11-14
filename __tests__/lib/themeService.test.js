/**
 * @jest-environment jsdom
 */

import {
  getThemePreference,
  updateThemePreference,
  toggleTheme,
  applyThemeToDOM,
  initializeTheme,
  THEMES,
} from '@/lib/themeService';
import { ref, get, set } from 'firebase/database';

// Mock Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
}));

// Mock Firebase instance
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('themeService', () => {
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Clear localStorage
    localStorage.clear();

    // Reset DOM
    document.documentElement.className = '';
  });

  describe('THEMES constants', () => {
    it('should have light and dark themes', () => {
      expect(THEMES.LIGHT).toBe('light');
      expect(THEMES.DARK).toBe('dark');
    });
  });

  describe('getThemePreference', () => {
    it('should return Firebase theme if available', async () => {
      const mockSnapshot = {
        exists: () => true,
        val: () => THEMES.DARK,
      };
      get.mockResolvedValue(mockSnapshot);

      const result = await getThemePreference('user123');

      expect(result).toBe(THEMES.DARK);
      expect(ref).toHaveBeenCalledWith({}, 'users/user123/preferences/theme');
      expect(localStorage.getItem('pannello-stufa-theme')).toBe(THEMES.DARK);
    });

    it('should return localStorage theme if Firebase unavailable', async () => {
      const mockSnapshot = {
        exists: () => false,
      };
      get.mockResolvedValue(mockSnapshot);
      localStorage.setItem('pannello-stufa-theme', THEMES.DARK);

      const result = await getThemePreference('user123');

      expect(result).toBe(THEMES.DARK);
    });

    it('should return light theme as default', async () => {
      const mockSnapshot = {
        exists: () => false,
      };
      get.mockResolvedValue(mockSnapshot);

      const result = await getThemePreference('user123');

      expect(result).toBe(THEMES.LIGHT);
    });

    it('should handle Firebase errors gracefully', async () => {
      get.mockRejectedValue(new Error('Firebase error'));
      localStorage.setItem('pannello-stufa-theme', THEMES.DARK);

      const result = await getThemePreference('user123');

      expect(result).toBe(THEMES.DARK);
    });

    it('should return light theme when no userId provided', async () => {
      const result = await getThemePreference(null);

      expect(result).toBe(THEMES.LIGHT);
      expect(get).not.toHaveBeenCalled();
    });
  });

  describe('updateThemePreference', () => {
    it('should save theme to both Firebase and localStorage', async () => {
      set.mockResolvedValue();

      const result = await updateThemePreference('user123', THEMES.DARK);

      expect(result).toBe(true);
      expect(localStorage.getItem('pannello-stufa-theme')).toBe(THEMES.DARK);
      expect(ref).toHaveBeenCalledWith({}, 'users/user123/preferences/theme');
      expect(set).toHaveBeenCalled();
    });

    it('should apply theme to DOM immediately', async () => {
      set.mockResolvedValue();

      await updateThemePreference('user123', THEMES.DARK);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should throw error for invalid theme', async () => {
      await expect(
        updateThemePreference('user123', 'invalid-theme')
      ).rejects.toThrow('Invalid theme');
    });

    it('should save to localStorage even without userId', async () => {
      const result = await updateThemePreference(null, THEMES.DARK);

      expect(result).toBe(true);
      expect(localStorage.getItem('pannello-stufa-theme')).toBe(THEMES.DARK);
      expect(set).not.toHaveBeenCalled();
    });

    it('should handle Firebase save errors', async () => {
      set.mockRejectedValue(new Error('Firebase error'));

      await expect(
        updateThemePreference('user123', THEMES.DARK)
      ).rejects.toThrow('Firebase error');

      // localStorage should still be updated (optimistic update)
      expect(localStorage.getItem('pannello-stufa-theme')).toBe(THEMES.DARK);
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', async () => {
      const mockSnapshot = {
        exists: () => true,
        val: () => THEMES.LIGHT,
      };
      get.mockResolvedValue(mockSnapshot);
      set.mockResolvedValue();

      const result = await toggleTheme('user123');

      expect(result).toBe(THEMES.DARK);
    });

    it('should toggle from dark to light', async () => {
      const mockSnapshot = {
        exists: () => true,
        val: () => THEMES.DARK,
      };
      get.mockResolvedValue(mockSnapshot);
      set.mockResolvedValue();

      const result = await toggleTheme('user123');

      expect(result).toBe(THEMES.LIGHT);
    });
  });

  describe('applyThemeToDOM', () => {
    it('should add dark class for dark theme', () => {
      applyThemeToDOM(THEMES.DARK);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class for light theme', () => {
      document.documentElement.classList.add('dark');

      applyThemeToDOM(THEMES.LIGHT);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should handle being called multiple times', () => {
      applyThemeToDOM(THEMES.DARK);
      applyThemeToDOM(THEMES.DARK);

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      applyThemeToDOM(THEMES.LIGHT);
      applyThemeToDOM(THEMES.LIGHT);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('initializeTheme', () => {
    it('should load and apply theme', async () => {
      const mockSnapshot = {
        exists: () => true,
        val: () => THEMES.DARK,
      };
      get.mockResolvedValue(mockSnapshot);

      const result = await initializeTheme('user123');

      expect(result).toBe(THEMES.DARK);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should apply default theme if none saved', async () => {
      const mockSnapshot = {
        exists: () => false,
      };
      get.mockResolvedValue(mockSnapshot);

      const result = await initializeTheme('user123');

      expect(result).toBe(THEMES.LIGHT);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
