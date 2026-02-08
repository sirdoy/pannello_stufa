/**
 * Token Refresh Tests
 */

import { createMockFetchResponse } from '@/__tests__/__utils__/mockFactories';

// Mock modules before imports
jest.mock('../tokenStorage');
jest.mock('../deviceFingerprint');
jest.mock('firebase/messaging');

// Mock fetch
global.fetch = jest.fn().mockResolvedValue(
  createMockFetchResponse({ success: true })
) as jest.MockedFunction<typeof fetch>;

// Mock Notification
global.Notification = {
  permission: 'granted',
  prototype: {} as Notification,
  requestPermission: jest.fn().mockResolvedValue('granted' as NotificationPermission),
} as any;

// Mock navigator.serviceWorker
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    getRegistration: jest.fn(() => Promise.resolve({ active: true })),
  },
  writable: true,
  configurable: true,
});

// Mock navigator.userAgent
Object.defineProperty(global.navigator, 'userAgent', {
  value: 'Mozilla/5.0 Test Browser',
  writable: true,
  configurable: true,
});

// Mock process.env
process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = 'test-vapid-key';

import { shouldRefreshToken, checkAndRefreshToken } from '../tokenRefresh';
import { loadToken, saveToken, getTokenAge, updateLastUsed } from '../tokenStorage';
import { getToken, deleteToken } from 'firebase/messaging';

const mockLoadToken = jest.mocked(loadToken);
const mockSaveToken = jest.mocked(saveToken);
const mockGetTokenAge = jest.mocked(getTokenAge);
const mockUpdateLastUsed = jest.mocked(updateLastUsed);
const mockGetToken = jest.mocked(getToken);
const mockDeleteToken = jest.mocked(deleteToken);

describe('tokenRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldRefreshToken', () => {
    it('returns false when no token stored', async () => {
      mockGetTokenAge.mockResolvedValue(null);

      const result = await shouldRefreshToken();

      expect(result).toBe(false);
    });

    it('returns false when token is fresh (< 30 days)', async () => {
      mockGetTokenAge.mockResolvedValue(15);

      const result = await shouldRefreshToken();

      expect(result).toBe(false);
    });

    it('returns true when token is old (> 30 days)', async () => {
      mockGetTokenAge.mockResolvedValue(45);

      const result = await shouldRefreshToken();

      expect(result).toBe(true);
    });

    it('returns true when token is exactly at threshold', async () => {
      mockGetTokenAge.mockResolvedValue(30.1);

      const result = await shouldRefreshToken();

      expect(result).toBe(true);
    });
  });

  describe('checkAndRefreshToken', () => {
    it('skips refresh when no stored token', async () => {
      mockLoadToken.mockResolvedValue(null);

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(false);
      expect(result.error).toBe('No stored token');
      expect(mockDeleteToken).not.toHaveBeenCalled();
    });

    it('updates lastUsed when token is fresh', async () => {
      mockLoadToken.mockResolvedValue({ token: 'fresh-token' } as any);
      mockGetTokenAge.mockResolvedValue(10);

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(false);
      expect(result.token).toBe('fresh-token');
      expect(updateLastUsed).toHaveBeenCalled();
      expect(mockDeleteToken).not.toHaveBeenCalled();
    });

    it('refreshes token when older than 30 days', async () => {
      mockLoadToken.mockResolvedValue({
        token: 'old-token',
        deviceId: 'device-123',
      } as any);
      mockGetTokenAge.mockResolvedValue(45);
      mockGetToken.mockResolvedValue('new-token-abc');

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(true);
      expect(result.token).toBe('new-token-abc');
      expect(mockDeleteToken).toHaveBeenCalled();
      expect(mockGetToken).toHaveBeenCalled();
      expect(saveToken).toHaveBeenCalledWith(
        'new-token-abc',
        expect.objectContaining({ deviceId: 'device-123' })
      );
    });

    it('returns error when no permission', async () => {
      const originalPermission = Notification.permission;
      (Notification as any).permission = 'denied';

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(false);
      expect(result.error).toBe('No permission');

      (Notification as any).permission = originalPermission;
    });

    it('continues on mockDeleteToken failure', async () => {
      mockLoadToken.mockResolvedValue({
        token: 'old-token',
        deviceId: 'device-123',
      } as any);
      mockGetTokenAge.mockResolvedValue(45);
      mockDeleteToken.mockRejectedValue(new Error('Delete failed'));
      mockGetToken.mockResolvedValue('new-token-xyz');

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(true);
      expect(result.token).toBe('new-token-xyz');
      expect(mockDeleteToken).toHaveBeenCalled();
      expect(mockGetToken).toHaveBeenCalled();
    });

    it('saves locally even if server registration fails', async () => {
      mockLoadToken.mockResolvedValue({
        token: 'old-token',
        deviceId: 'device-123',
      } as any);
      mockGetTokenAge.mockResolvedValue(45);
      mockGetToken.mockResolvedValue('new-token-fail');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as any);

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(true);
      expect(result.token).toBe('new-token-fail');
      expect(saveToken).toHaveBeenCalledWith(
        'new-token-fail',
        expect.objectContaining({ deviceId: 'device-123' })
      );
    });

    it('returns stored token on refresh failure', async () => {
      mockLoadToken.mockResolvedValue({
        token: 'stored-token',
        deviceId: 'device-123',
      } as any);
      mockGetTokenAge.mockResolvedValue(45);
      mockGetToken.mockRejectedValue(new Error('Network error'));

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(false);
      expect(result.token).toBe('stored-token');
      expect(result.error).toBe('Network error');
    });
  });
});
