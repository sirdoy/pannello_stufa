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

    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ theme: 'light' }),
      })
    ) as jest.Mock;
  });

  describe('THEMES constants', () => {
    it('should have light and dark themes', () => {
      expect(THEMES.LIGHT).toBe('light');
      expect(THEMES.DARK).toBe('dark');
    });
  });

  describe('getThemePreference', () => {
    it('should return theme from API if available', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ theme: THEMES.DARK }),
        })
      ) as jest.Mock;

      const result = await getThemePreference('user123');

      expect(result).toBe(THEMES.DARK);
      expect(global.fetch).toHaveBeenCalledWith('/api/user/theme', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(localStorage.getItem('pannello-stufa-theme')).toBe(THEMES.DARK);
    });

    it('should return localStorage theme if API unavailable', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('API error')));
      localStorage.setItem('pannello-stufa-theme', THEMES.DARK);

      const result = await getThemePreference('user123');

      expect(result).toBe(THEMES.DARK);
    });

    it('should return light theme as default', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('API error')));

      const result = await getThemePreference('user123');

      expect(result).toBe(THEMES.LIGHT);
    });

    it('should return light theme when no userId provided', async () => {
      const result = await getThemePreference(null);

      expect(result).toBe(THEMES.LIGHT);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('updateThemePreference', () => {
    it('should save theme via API and localStorage', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      ) as jest.Mock;

      const result = await updateThemePreference('user123', THEMES.DARK);

      expect(result).toBe(true);
      expect(localStorage.getItem('pannello-stufa-theme')).toBe(THEMES.DARK);
      expect(global.fetch).toHaveBeenCalledWith('/api/user/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: THEMES.DARK }),
      });
    });

    it('should apply theme to DOM immediately', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      ) as jest.Mock;

      await updateThemePreference('user123', THEMES.DARK);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should throw error for invalid theme', async () => {
      await expect(
        updateThemePreference('user123', 'invalid-theme' as any)
      ).rejects.toThrow('Invalid theme');
    });

    it('should save to localStorage even without userId', async () => {
      const result = await updateThemePreference(null, THEMES.DARK);

      expect(result).toBe(true);
      expect(localStorage.getItem('pannello-stufa-theme')).toBe(THEMES.DARK);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API save errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'API error' }),
        })
      ) as jest.Mock;

      await expect(
        updateThemePreference('user123', THEMES.DARK)
      ).rejects.toThrow('API error');

      // localStorage should still be updated (optimistic update)
      expect(localStorage.getItem('pannello-stufa-theme')).toBe(THEMES.DARK);
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', async () => {
      // Mock getThemePreference returning light
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ theme: THEMES.LIGHT }),
        })
        // Mock updateThemePreference
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const result = await toggleTheme('user123');

      expect(result).toBe(THEMES.DARK);
    });

    it('should toggle from dark to light', async () => {
      // Mock getThemePreference returning dark
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ theme: THEMES.DARK }),
        })
        // Mock updateThemePreference
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

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
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ theme: THEMES.DARK }),
        })
      ) as jest.Mock;

      const result = await initializeTheme('user123');

      expect(result).toBe(THEMES.DARK);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should apply default theme if none saved', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('API error')));

      const result = await initializeTheme('user123');

      expect(result).toBe(THEMES.LIGHT);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
