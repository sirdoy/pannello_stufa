/**
 * Unit tests for Netatmo Token Helper
 * Tests OAuth token management, refresh logic, and error handling
 */

import { getValidAccessToken, isNetatmoConnected, handleTokenError } from '@/lib/netatmoTokenHelper';

// Mock Firebase Admin SDK
const mockAdminDbGet = jest.fn();
const mockAdminDbSet = jest.fn();

jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: (...args) => mockAdminDbGet(...args),
  adminDbSet: (...args) => mockAdminDbSet(...args),
}));

// Mock environment helper
jest.mock('@/lib/environmentHelper', () => ({
  getEnvironmentPath: (path) => `dev/${path}`,
}));

// Mock netatmo credentials resolver
jest.mock('@/lib/netatmoCredentials', () => ({
  getNetatmoCredentials: jest.fn(() => ({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3001/api/netatmo/callback',
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('netatmoTokenHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getValidAccessToken', () => {
    it('should return error when no refresh token exists', async () => {
      mockAdminDbGet.mockResolvedValue(null);

      const result = await getValidAccessToken();

      expect(result.accessToken).toBeNull();
      expect(result.error).toBe('NOT_CONNECTED');
      expect(result.message).toContain('Nessun refresh token trovato');
    });

    it('should exchange refresh token for access token successfully', async () => {
      mockAdminDbGet.mockResolvedValue('test-refresh-token');

      global.fetch.mockResolvedValue({
        json: async () => ({
          access_token: 'test-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 10800,
        }),
      });

      const result = await getValidAccessToken();

      expect(result.accessToken).toBe('test-access-token');
      expect(result.error).toBeNull();
      // Verify token was updated in Firebase
      expect(mockAdminDbSet).toHaveBeenCalled();
    });

    it('should handle invalid_grant error and clear token', async () => {
      mockAdminDbGet.mockResolvedValue('expired-refresh-token');

      global.fetch.mockResolvedValue({
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Token expired',
        }),
      });

      const result = await getValidAccessToken();

      expect(result.accessToken).toBeNull();
      expect(result.error).toBe('TOKEN_EXPIRED');
      // Verify token was cleared from Firebase
      expect(mockAdminDbSet).toHaveBeenCalledWith('dev/netatmo/refresh_token', null);
      expect(mockAdminDbSet).toHaveBeenCalledWith('dev/netatmo/access_token_cache', null);
    });

    it('should handle network errors gracefully', async () => {
      mockAdminDbGet.mockResolvedValue('test-refresh-token');

      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await getValidAccessToken();

      expect(result.accessToken).toBeNull();
      expect(result.error).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Network error');
    });

    it('should NOT update refresh token if Netatmo returns same token', async () => {
      const refreshToken = 'test-refresh-token';

      mockAdminDbGet.mockResolvedValue(refreshToken);

      global.fetch.mockResolvedValue({
        json: async () => ({
          access_token: 'test-access-token',
          refresh_token: refreshToken, // Same token
          expires_in: 10800,
        }),
      });

      await getValidAccessToken();

      // adminDbSet should be called ONCE for access_token_cache, but NOT for refresh_token
      expect(mockAdminDbSet).toHaveBeenCalledTimes(1);
      expect(mockAdminDbSet).toHaveBeenCalledWith('dev/netatmo/access_token_cache', expect.any(Object));
    });

    it('should handle missing access_token in response', async () => {
      mockAdminDbGet.mockResolvedValue('test-refresh-token');

      global.fetch.mockResolvedValue({
        json: async () => ({
          // Missing access_token
          refresh_token: 'new-refresh-token',
        }),
      });

      const result = await getValidAccessToken();

      expect(result.accessToken).toBeNull();
      expect(result.error).toBe('NO_ACCESS_TOKEN');
    });
  });

  describe('isNetatmoConnected', () => {
    it('should return true when refresh token exists', async () => {
      mockAdminDbGet.mockResolvedValue('test-refresh-token');

      const result = await isNetatmoConnected();

      expect(result).toBe(true);
    });

    it('should return false when refresh token does not exist', async () => {
      mockAdminDbGet.mockResolvedValue(null);

      const result = await isNetatmoConnected();

      expect(result).toBe(false);
    });

    it('should return false when refresh token is null', async () => {
      mockAdminDbGet.mockResolvedValue(null);

      const result = await isNetatmoConnected();

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockAdminDbGet.mockRejectedValue(new Error('Firebase error'));

      const result = await isNetatmoConnected();

      expect(result).toBe(false);
    });
  });

  describe('handleTokenError', () => {
    it('should return 401 and reconnect=true for NOT_CONNECTED', () => {
      const result = handleTokenError('NOT_CONNECTED');

      expect(result.status).toBe(401);
      expect(result.reconnect).toBe(true);
    });

    it('should return 401 and reconnect=true for TOKEN_EXPIRED', () => {
      const result = handleTokenError('TOKEN_EXPIRED');

      expect(result.status).toBe(401);
      expect(result.reconnect).toBe(true);
    });

    it('should return 500 and reconnect=false for TOKEN_ERROR', () => {
      const result = handleTokenError('TOKEN_ERROR');

      expect(result.status).toBe(500);
      expect(result.reconnect).toBe(false);
    });

    it('should return 500 and reconnect=false for NO_ACCESS_TOKEN', () => {
      const result = handleTokenError('NO_ACCESS_TOKEN');

      expect(result.status).toBe(500);
      expect(result.reconnect).toBe(false);
    });

    it('should return 500 and reconnect=false for NETWORK_ERROR', () => {
      const result = handleTokenError('NETWORK_ERROR');

      expect(result.status).toBe(500);
      expect(result.reconnect).toBe(false);
    });

    it('should default to 500 for unknown error', () => {
      const result = handleTokenError('UNKNOWN_ERROR');

      expect(result.status).toBe(500);
      expect(result.reconnect).toBe(false);
    });
  });
});
