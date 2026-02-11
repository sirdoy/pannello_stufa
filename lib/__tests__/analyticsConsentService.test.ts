/**
 * Tests for analyticsConsentService
 *
 * Verifies GDPR-compliant consent management:
 * - SSR safety (window undefined handling)
 * - Initial state is 'unknown'
 * - Grant/deny consent with timestamp
 * - canTrackAnalytics only returns true when granted
 * - Reset consent removes all data
 */

import {
  getConsentState,
  setConsentState,
  canTrackAnalytics,
  getConsentTimestamp,
  resetConsent,
} from '../analyticsConsentService';

describe('analyticsConsentService', () => {
  // Mock localStorage
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock = {};

    // Mock localStorage methods
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key];
        }),
      },
      writable: true,
    });
  });

  describe('SSR safety', () => {
    it('returns "unknown" when window is undefined', () => {
      // Temporarily make window undefined
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR behavior
      delete global.window;

      const state = getConsentState();
      expect(state).toBe('unknown');

      // Restore window
      global.window = originalWindow;
    });

    it('getConsentTimestamp returns null when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR behavior
      delete global.window;

      const timestamp = getConsentTimestamp();
      expect(timestamp).toBeNull();

      global.window = originalWindow;
    });

    it('setConsentState is a no-op when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR behavior
      delete global.window;

      // Should not throw, just silently no-op
      expect(() => setConsentState(true)).not.toThrow();

      global.window = originalWindow;
    });

    it('resetConsent is a no-op when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR behavior
      delete global.window;

      // Should not throw, just silently no-op
      expect(() => resetConsent()).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('initial state', () => {
    it('returns "unknown" when consent not set', () => {
      const state = getConsentState();
      expect(state).toBe('unknown');
    });

    it('canTrackAnalytics returns false when consent not set', () => {
      const canTrack = canTrackAnalytics();
      expect(canTrack).toBe(false);
    });

    it('getConsentTimestamp returns null when consent not set', () => {
      const timestamp = getConsentTimestamp();
      expect(timestamp).toBeNull();
    });
  });

  describe('granting consent', () => {
    it('sets consent to "granted"', () => {
      setConsentState(true);
      const state = getConsentState();
      expect(state).toBe('granted');
    });

    it('writes timestamp when granting consent', () => {
      setConsentState(true);

      const timestamp = getConsentTimestamp();
      expect(timestamp).not.toBeNull();
      expect(timestamp!).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('canTrackAnalytics returns true when consent granted', () => {
      setConsentState(true);
      const canTrack = canTrackAnalytics();
      expect(canTrack).toBe(true);
    });

    it('writes to localStorage with correct keys', () => {
      setConsentState(true);
      expect(localStorageMock['analytics_consent']).toBe('true');
      expect(localStorageMock['analytics_consent_timestamp']).toBeDefined();
    });
  });

  describe('denying consent', () => {
    it('sets consent to "denied"', () => {
      setConsentState(false);
      const state = getConsentState();
      expect(state).toBe('denied');
    });

    it('writes timestamp when denying consent', () => {
      setConsentState(false);
      const timestamp = getConsentTimestamp();
      expect(timestamp).not.toBeNull();
      expect(timestamp!).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('canTrackAnalytics returns false when consent denied', () => {
      setConsentState(false);
      const canTrack = canTrackAnalytics();
      expect(canTrack).toBe(false);
    });

    it('writes to localStorage with correct keys', () => {
      setConsentState(false);
      expect(localStorageMock['analytics_consent']).toBe('false');
      expect(localStorageMock['analytics_consent_timestamp']).toBeDefined();
    });
  });

  describe('resetting consent', () => {
    it('removes consent state', () => {
      setConsentState(true);
      resetConsent();
      const state = getConsentState();
      expect(state).toBe('unknown');
    });

    it('removes consent timestamp', () => {
      setConsentState(true);
      resetConsent();
      const timestamp = getConsentTimestamp();
      expect(timestamp).toBeNull();
    });

    it('canTrackAnalytics returns false after reset', () => {
      setConsentState(true);
      resetConsent();
      const canTrack = canTrackAnalytics();
      expect(canTrack).toBe(false);
    });

    it('removes both localStorage keys', () => {
      setConsentState(true);
      resetConsent();
      expect(localStorageMock['analytics_consent']).toBeUndefined();
      expect(localStorageMock['analytics_consent_timestamp']).toBeUndefined();
    });
  });

  describe('changing consent', () => {
    it('updates timestamp when changing from granted to denied', () => {
      setConsentState(true);
      const firstTimestamp = getConsentTimestamp();

      // Wait a bit to ensure different timestamp
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      setConsentState(false);
      const secondTimestamp = getConsentTimestamp();

      expect(secondTimestamp).not.toBe(firstTimestamp);

      jest.useRealTimers();
    });

    it('updates timestamp when changing from denied to granted', () => {
      setConsentState(false);
      const firstTimestamp = getConsentTimestamp();

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      setConsentState(true);
      const secondTimestamp = getConsentTimestamp();

      expect(secondTimestamp).not.toBe(firstTimestamp);

      jest.useRealTimers();
    });
  });
});
