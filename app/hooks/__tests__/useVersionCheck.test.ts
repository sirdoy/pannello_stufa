import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useVersionCheck } from '../useVersionCheck';

// Mock del modulo changelogService
jest.mock('@/lib/changelogService', () => ({
  getLatestVersion: jest.fn(),
}));

// Mock del modulo version
jest.mock('@/lib/version', () => ({
  APP_VERSION: '1.5.0',
}));

import { getLatestVersion } from '@/lib/changelogService';

describe('useVersionCheck Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    test('returns correct initial state', async () => {
      getLatestVersion.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useVersionCheck());

      // Wait for initial render to complete
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current.hasNewVersion).toBe(false);
      expect(result.current.latestVersion).toBe(null);
      expect(result.current.showWhatsNew).toBe(false);
      expect(typeof result.current.dismissWhatsNew).toBe('function');
      expect(typeof result.current.dismissBadge).toBe('function');
    });
  });

  describe('Version Check', () => {
    test('detects newer version available', async () => {
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.hasNewVersion).toBe(true);
        expect(result.current.latestVersion).toEqual(mockLatestVersion);
      });
    });

    test('does not flag same version as new', async () => {
      const mockLatestVersion = {
        version: '1.5.0', // Same as APP_VERSION
        date: '2025-10-10',
        type: 'minor',
        changes: ['Current version']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.hasNewVersion).toBe(false);
      });
    });

    test('does not flag older version as new', async () => {
      const mockLatestVersion = {
        version: '1.4.0', // Older than APP_VERSION
        date: '2025-10-09',
        type: 'minor',
        changes: ['Old version']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.hasNewVersion).toBe(false);
      });
    });

    test('handles missing latest version gracefully', async () => {
      getLatestVersion.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.hasNewVersion).toBe(false);
        expect(result.current.latestVersion).toBe(null);
      });
    });

    test('handles API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      getLatestVersion.mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
        expect(result.current.hasNewVersion).toBe(false);
      });

      consoleError.mockRestore();
    });
  });

  describe('WhatsNew Modal', () => {
    test('shows modal on first visit', async () => {
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.showWhatsNew).toBe(true);
      });
    });

    test('does not show modal if version already seen', async () => {
      localStorage.setItem('lastSeenVersion', '1.5.0');

      const mockLatestVersion = {
        version: '1.5.0',
        date: '2025-10-10',
        type: 'minor',
        changes: ['Current version']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.showWhatsNew).toBe(false);
      });
    });

    test('does not show modal if version dismissed', async () => {
      localStorage.setItem('dismissedVersions', JSON.stringify(['1.5.0']));

      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.showWhatsNew).toBe(false);
      });
    });
  });

  describe('dismissWhatsNew', () => {
    test('dismisses modal and saves to localStorage', async () => {
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.showWhatsNew).toBe(true);
      });

      act(() => {
        result.current.dismissWhatsNew();
      });

      await waitFor(() => {
        expect(result.current.showWhatsNew).toBe(false);
      });

      expect(localStorage.getItem('lastSeenVersion')).toBe('1.5.0');
    });

    test('permanently dismisses when dontShowAgain is true', async () => {
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.showWhatsNew).toBe(true);
      });

      act(() => {
        result.current.dismissWhatsNew(true);
      });

      await waitFor(() => {
        expect(result.current.showWhatsNew).toBe(false);
      });

      const dismissed = JSON.parse(localStorage.getItem('dismissedVersions'));
      expect(dismissed).toContain('1.5.0');
    });

    test('handles multiple dismissed versions', async () => {
      localStorage.setItem('dismissedVersions', JSON.stringify(['1.4.0']));

      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.showWhatsNew).toBe(true);
      });

      act(() => {
        result.current.dismissWhatsNew(true);
      });

      const dismissed = JSON.parse(localStorage.getItem('dismissedVersions'));
      expect(dismissed).toContain('1.4.0');
      expect(dismissed).toContain('1.5.0');
      expect(dismissed.length).toBe(2);
    });
  });

  describe('dismissBadge', () => {
    test('dismisses badge and saves to localStorage', async () => {
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        expect(result.current.hasNewVersion).toBe(true);
      });

      act(() => {
        result.current.dismissBadge();
      });

      await waitFor(() => {
        expect(result.current.hasNewVersion).toBe(false);
      });

      expect(localStorage.getItem('lastSeenVersion')).toBe('1.5.0');
    });
  });

  describe('localStorage Error Handling', () => {
    test('handles corrupted dismissedVersions data', async () => {
      localStorage.setItem('dismissedVersions', 'invalid-json');

      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

      const { result } = renderHook(() => useVersionCheck());

      await waitFor(() => {
        // Should not crash, should show modal
        expect(result.current.showWhatsNew).toBe(true);
      });
    });
  });

  describe('React Strict Mode Protection', () => {
    test('prevents double fetch in strict mode', async () => {
      const mockLatestVersion = {
        version: '1.6.0',
        date: '2025-10-11',
        type: 'minor',
        changes: ['New feature']
      };

      getLatestVersion.mockResolvedValue(mockLatestVersion);

      // Render hook twice to simulate strict mode
      const { rerender } = renderHook(() => useVersionCheck());
      rerender();

      await waitFor(() => {
        // Should only call once despite double render
        expect(getLatestVersion).toHaveBeenCalledTimes(1);
      });
    });
  });
});
