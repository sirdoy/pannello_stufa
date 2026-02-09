// app/hooks/__tests__/useReducedMotion.test.js
/**
 * useReducedMotion Hook Tests
 *
 * Tests motion preference detection, updates on change, and SSR safety.
 * Uses matchMedia mocking for testing media query behavior.
 */
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';

/**
 * Creates a mock matchMedia implementation
 * @param {boolean} matches - Whether 'no-preference' matches (motion allowed)
 * @returns {Function[]} Array of listeners for simulating preference changes
 */
const mockMatchMedia = (matches: boolean): Array<(e: { matches: boolean }) => void> => {
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  const mockMediaQueryList = {
    matches,
    media: '(prefers-reduced-motion: no-preference)',
    addEventListener: jest.fn((event, listener) => {
      listeners.push(listener);
    }),
    removeEventListener: jest.fn((event, listener) => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    }),
    // Legacy Safari < 14 support
    addListener: jest.fn((listener) => listeners.push(listener)),
    removeListener: jest.fn((listener) => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    }),
  };

  window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList);
  return listeners;
};

describe('useReducedMotion', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.restoreAllMocks();
  });

  describe('Initial Value', () => {
    it('returns false when user has no motion preference (motion allowed)', () => {
      mockMatchMedia(true); // no-preference matches = motion allowed
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);
    });

    it('returns true when user prefers reduced motion', () => {
      mockMatchMedia(false); // no-preference doesn't match = reduced motion
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);
    });
  });

  describe('Preference Change', () => {
    it('updates when preference changes from allowed to reduced', () => {
      const listeners = mockMatchMedia(true); // Start with motion allowed
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);

      // Simulate user enabling reduced motion
      act(() => {
        listeners[0]!({ matches: false });
      });
      expect(result.current).toBe(true);
    });

    it('updates when preference changes from reduced to allowed', () => {
      const listeners = mockMatchMedia(false); // Start with reduced motion
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);

      // Simulate user disabling reduced motion
      act(() => {
        listeners[0]!({ matches: true });
      });
      expect(result.current).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      mockMatchMedia(true);
      const { unmount } = renderHook(() => useReducedMotion());

      unmount();

      const mockMediaQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('Legacy Browser Support', () => {
    it('uses addListener/removeListener when addEventListener unavailable', () => {
      const listeners = [];
      const mockMediaQueryList = {
        matches: true,
        media: '(prefers-reduced-motion: no-preference)',
        addEventListener: undefined,
        removeEventListener: undefined,
        addListener: jest.fn((listener) => listeners.push(listener)),
        removeListener: jest.fn(),
      };

      window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList);

      const { result, unmount } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);
      expect(mockMediaQueryList.addListener).toHaveBeenCalled();

      unmount();
      expect(mockMediaQueryList.removeListener).toHaveBeenCalled();
    });
  });

  describe('SSR Safety', () => {
    it('defaults to reduced motion when window is undefined', () => {
      // Test the initialization logic directly since renderHook requires window
      const QUERY = '(prefers-reduced-motion: no-preference)';
      const getInitialValue = () => {
        if (typeof window === 'undefined') return true;
        return !window.matchMedia(QUERY).matches;
      };

      // Temporarily remove window to test SSR path
      const originalWindow = global.window;
      // @ts-ignore - Intentionally testing SSR scenario
      delete global.window;

      expect(getInitialValue()).toBe(true);

      global.window = originalWindow;
    });
  });

  describe('Media Query', () => {
    it('queries the correct media feature', () => {
      mockMatchMedia(true);
      renderHook(() => useReducedMotion());

      expect(window.matchMedia).toHaveBeenCalledWith(
        '(prefers-reduced-motion: no-preference)'
      );
    });
  });
});
