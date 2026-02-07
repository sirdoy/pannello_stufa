/**
 * Token Refresh Tests
 */

// Mock modules before imports
jest.mock('../tokenStorage', () => ({
  loadToken: jest.fn(),
  saveToken: jest.fn(),
  getTokenAge: jest.fn(),
  updateLastUsed: jest.fn(),
}));

jest.mock('../deviceFingerprint', () => ({
  getCurrentDeviceFingerprint: jest.fn(() => ({
    deviceId: 'test-device-id',
    displayName: 'Test Browser on Test OS',
    deviceInfo: { browser: 'Test', os: 'Test' },
  })),
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(),
  deleteToken: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
);

// Mock Notification
global.Notification = {
  permission: 'granted',
};

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

describe('tokenRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldRefreshToken', () => {
    it('returns false when no token stored', async () => {
      getTokenAge.mockResolvedValue(null);

      const result = await shouldRefreshToken();

      expect(result).toBe(false);
    });

    it('returns false when token is fresh (< 30 days)', async () => {
      getTokenAge.mockResolvedValue(15);

      const result = await shouldRefreshToken();

      expect(result).toBe(false);
    });

    it('returns true when token is old (> 30 days)', async () => {
      getTokenAge.mockResolvedValue(45);

      const result = await shouldRefreshToken();

      expect(result).toBe(true);
    });

    it('returns true when token is exactly at threshold', async () => {
      getTokenAge.mockResolvedValue(30.1);

      const result = await shouldRefreshToken();

      expect(result).toBe(true);
    });
  });

  describe('checkAndRefreshToken', () => {
    it('skips refresh when no stored token', async () => {
      loadToken.mockResolvedValue(null);

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(false);
      expect(result.error).toBe('No stored token');
      expect(deleteToken).not.toHaveBeenCalled();
    });

    it('updates lastUsed when token is fresh', async () => {
      loadToken.mockResolvedValue({ token: 'fresh-token' });
      getTokenAge.mockResolvedValue(10);

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(false);
      expect(result.token).toBe('fresh-token');
      expect(updateLastUsed).toHaveBeenCalled();
      expect(deleteToken).not.toHaveBeenCalled();
    });

    it('refreshes token when older than 30 days', async () => {
      loadToken.mockResolvedValue({
        token: 'old-token',
        deviceId: 'device-123',
      });
      getTokenAge.mockResolvedValue(45);
      getToken.mockResolvedValue('new-token-abc');

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(true);
      expect(result.token).toBe('new-token-abc');
      expect(deleteToken).toHaveBeenCalled();
      expect(getToken).toHaveBeenCalled();
      expect(saveToken).toHaveBeenCalledWith(
        'new-token-abc',
        expect.objectContaining({ deviceId: 'test-device-id' })
      );
    });

    it('returns error when no permission', async () => {
      const originalPermission = Notification.permission;
      Notification.permission = 'denied';

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(false);
      expect(result.error).toBe('No permission');

      Notification.permission = originalPermission;
    });

    it('continues on deleteToken failure', async () => {
      loadToken.mockResolvedValue({
        token: 'old-token',
        deviceId: 'device-123',
      });
      getTokenAge.mockResolvedValue(45);
      deleteToken.mockRejectedValue(new Error('Delete failed'));
      getToken.mockResolvedValue('new-token-xyz');

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(true);
      expect(result.token).toBe('new-token-xyz');
      expect(deleteToken).toHaveBeenCalled();
      expect(getToken).toHaveBeenCalled();
    });

    it('saves locally even if server registration fails', async () => {
      loadToken.mockResolvedValue({
        token: 'old-token',
        deviceId: 'device-123',
      });
      getTokenAge.mockResolvedValue(45);
      getToken.mockResolvedValue('new-token-fail');
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(true);
      expect(result.token).toBe('new-token-fail');
      expect(saveToken).toHaveBeenCalledWith(
        'new-token-fail',
        expect.objectContaining({ deviceId: 'test-device-id' })
      );
    });

    it('returns stored token on refresh failure', async () => {
      loadToken.mockResolvedValue({
        token: 'stored-token',
        deviceId: 'device-123',
      });
      getTokenAge.mockResolvedValue(45);
      getToken.mockRejectedValue(new Error('Network error'));

      const result = await checkAndRefreshToken('user123');

      expect(result.refreshed).toBe(false);
      expect(result.token).toBe('stored-token');
      expect(result.error).toBe('Network error');
    });
  });
});
