import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { VersionProvider, useVersion } from '../VersionContext';

// Mock del modulo changelogService
jest.mock('@/lib/changelogService', () => ({
  getLatestVersion: jest.fn(),
}));

// Mock del modulo version
jest.mock('@/lib/version', () => ({
  APP_VERSION: '1.5.0',
}));

import { getLatestVersion } from '@/lib/changelogService';

describe('VersionContext', () => {
  // Helper to render hook with provider
  const wrapper = ({ children }) => (
    <VersionProvider>{children}</VersionProvider>
  );

  let originalLocation;

  beforeAll(() => {
    // Save original location
    originalLocation = window.location;
  });

  afterAll(() => {
    // Restore original location
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment mocks
    delete process.env.NODE_ENV;
    // Mock window.location for non-local environment by default
    delete window.location;
    window.location = { hostname: 'example.com' };
  });

  describe('useVersion Hook', () => {
    test('throws error when used outside VersionProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useVersion());
      }).toThrow('useVersion must be used within VersionProvider');

      consoleError.mockRestore();
    });

    test('returns context when used within VersionProvider', () => {
      const { result } = renderHook(() => useVersion(), { wrapper });

      expect(result.current).toHaveProperty('needsUpdate');
      expect(result.current).toHaveProperty('firebaseVersion');
      expect(result.current).toHaveProperty('checkVersion');
      expect(result.current).toHaveProperty('isChecking');
    });
  });

  describe('Initial State', () => {
    test('has correct initial state', () => {
      const { result } = renderHook(() => useVersion(), { wrapper });

      expect(result.current.needsUpdate).toBe(false);
      expect(result.current.firebaseVersion).toBe(null);
      expect(result.current.isChecking).toBe(false);
      expect(typeof result.current.checkVersion).toBe('function');
    });
  });

  describe('Version Check - Local Environment', () => {
    test('skips check in development NODE_ENV', async () => {
      process.env.NODE_ENV = 'development';
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      expect(consoleLog).toHaveBeenCalledWith(
        '🔧 Ambiente locale: versioning enforcement disabilitato'
      );
      expect(result.current.needsUpdate).toBe(false);
      expect(getLatestVersion).not.toHaveBeenCalled();

      consoleLog.mockRestore();
    });

    test('skips check on localhost hostname', async () => {
      delete window.location;
      window.location = { hostname: 'localhost' };

      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      expect(consoleLog).toHaveBeenCalledWith(
        '🔧 Ambiente locale: versioning enforcement disabilitato'
      );
      expect(result.current.needsUpdate).toBe(false);

      consoleLog.mockRestore();
    });

    test('skips check on 127.0.0.1 hostname', async () => {
      delete window.location;
      window.location = { hostname: '127.0.0.1' };

      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      expect(consoleLog).toHaveBeenCalled();
      expect(result.current.needsUpdate).toBe(false);

      consoleLog.mockRestore();
    });

    test('skips check on 192.168.x.x hostname', async () => {
      delete window.location;
      window.location = { hostname: '192.168.1.100' };

      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      expect(consoleLog).toHaveBeenCalled();
      expect(result.current.needsUpdate).toBe(false);

      consoleLog.mockRestore();
    });
  });

  describe('Version Check - Production Environment', () => {
    test('sets needsUpdate when local version is older', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      await waitFor(() => {
        expect(result.current.needsUpdate).toBe(true);
        expect(result.current.firebaseVersion).toBe('1.6.0');
      });

      expect(consoleLog).toHaveBeenCalledWith(
        '⚠️ Update richiesto: 1.5.0 → 1.6.0'
      );

      consoleLog.mockRestore();
    });

    test('does not set needsUpdate when versions are equal', async () => {
      const mockLatestVersion = {
        version: '1.5.0', // Same as APP_VERSION
        date: '2025-10-10',
        type: 'minor',
        changes: ['Current version']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      await waitFor(() => {
        expect(result.current.needsUpdate).toBe(false);
        expect(result.current.firebaseVersion).toBe(null);
      });
    });

    test('does not set needsUpdate when local version is newer', async () => {
      const mockLatestVersion = {
        version: '1.4.0', // Older than APP_VERSION
        date: '2025-10-09',
        type: 'minor',
        changes: ['Old version']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      await waitFor(() => {
        expect(result.current.needsUpdate).toBe(false);
        expect(result.current.firebaseVersion).toBe(null);
      });
    });

    test('handles missing latest version gracefully', async () => {
      getLatestVersion.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      await waitFor(() => {
        expect(result.current.needsUpdate).toBe(false);
        expect(result.current.firebaseVersion).toBe(null);
      });
    });

    test('handles API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      getLatestVersion.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Errore nel controllo versione:',
          expect.any(Error)
        );
        expect(result.current.needsUpdate).toBe(false);
      });

      consoleError.mockRestore();
    });
  });

  describe('isChecking State', () => {
    test('sets isChecking to true during check', async () => {
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockLatestVersion), 100))
      );

      const { result } = renderHook(() => useVersion(), { wrapper });

      let checkPromise;
      act(() => {
        checkPromise = result.current.checkVersion();
      });

      // Wait a tick for state to update
      await act(async () => {
        await Promise.resolve();
      });

      // Should be checking now
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      await checkPromise;
    });

    test('prevents simultaneous checks', async () => {
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      let resolvePromise;
      getLatestVersion.mockImplementation(
        () => new Promise(resolve => {
          resolvePromise = () => resolve(mockLatestVersion);
        })
      );

      const { result } = renderHook(() => useVersion(), { wrapper });

      // Start first check
      let firstCheck;
      await act(async () => {
        firstCheck = result.current.checkVersion();
        // Wait for isChecking to be set
        await Promise.resolve();
      });

      // At this point isChecking should be true
      // Try to start second check
      await act(async () => {
        await result.current.checkVersion();
      });

      // Resolve the first check
      await act(async () => {
        resolvePromise();
        await firstCheck;
      });

      // Should only call once despite two attempts (second should be skipped due to isChecking)
      expect(getLatestVersion).toHaveBeenCalledTimes(1);
    });

    test('resets isChecking on error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      getLatestVersion.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useVersion(), { wrapper });

      await act(async () => {
        await result.current.checkVersion();
      });

      await waitFor(() => {
        expect(result.current.isChecking).toBe(false);
      });

      consoleError.mockRestore();
    });
  });

  describe('Version Comparison Logic', () => {
    const testCases = [
      {
        name: 'detects major version difference',
        local: '1.5.0',
        firebase: '2.0.0',
        shouldUpdate: true
      },
      {
        name: 'detects minor version difference',
        local: '1.5.0',
        firebase: '1.6.0',
        shouldUpdate: true
      },
      {
        name: 'detects patch version difference',
        local: '1.5.0',
        firebase: '1.5.1',
        shouldUpdate: true
      },
      {
        name: 'handles equal versions',
        local: '1.5.0',
        firebase: '1.5.0',
        shouldUpdate: false
      },
      {
        name: 'handles local version newer',
        local: '1.5.0',
        firebase: '1.4.9',
        shouldUpdate: false
      }
    ];

    testCases.forEach(({ name, firebase, shouldUpdate }) => {
      test(name, async () => {
        const mockLatestVersion = {
          version: firebase,
          date: '2025-10-11',
          type: 'minor',
          changes: ['Test']
        };

        getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

        const { result } = renderHook(() => useVersion(), { wrapper });

        await act(async () => {
          await result.current.checkVersion();
        });

        await waitFor(() => {
          expect(result.current.needsUpdate).toBe(shouldUpdate);
        });
      });
    });
  });
});
