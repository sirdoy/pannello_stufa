/**
 * Tests for Hue Remote Token Helper (OAuth 2.0)
 */

import {
  getValidRemoteAccessToken,
  exchangeCodeForTokens,
  saveRemoteTokens,
  clearRemoteTokens,
  clearTokenCache,
  isRemoteConnected,
  handleRemoteTokenError,
} from '../hueRemoteTokenHelper';

// Mock Firebase
jest.mock('../../firebase', () => ({
  db: {},
}));

// Mock Firebase database functions
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
}));

// Mock environment helper
jest.mock('../../environmentHelper', () => ({
  getEnvironmentPath: jest.fn((path) => `dev/${path}`),
}));

describe('hueRemoteTokenHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    // Clear in-memory token cache to prevent test pollution
    clearTokenCache();

    // Mock ref to return a mock reference object
    const { ref, update } = require('firebase/database');
    (ref as jest.Mock).mockReturnValue('mock-ref');
    (update as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getValidRemoteAccessToken', () => {
    it('should return access token when refresh succeeds', async () => {
      const { ref, get, update } = require('firebase/database');

      // Mock Firebase get (has refresh token, but no valid cached access_token)
      (get as jest.Mock).mockResolvedValue({
        exists: () => true,
        val: () => ({
          refresh_token: 'old-refresh-token',
          access_token: null, // No cached token
        }),
      });

      // Mock Hue OAuth refresh endpoint (standard OAuth2 token endpoint)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 604800,
        }),
      });

      const result = await getValidRemoteAccessToken();

      expect(result).toEqual({
        accessToken: 'new-access-token',
        error: null,
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.meethue.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
          }),
        })
      );

      expect(update).toHaveBeenCalled();
    });

    it('should return cached access token from Firebase when valid', async () => {
      const { get } = require('firebase/database');

      // Mock Firebase get (has valid cached access_token)
      (get as jest.Mock).mockResolvedValue({
        exists: () => true,
        val: () => ({
          refresh_token: 'refresh-token',
          access_token: 'cached-access-token',
          access_token_expires_at: Date.now() + 3600000, // Expires in 1 hour
        }),
      });

      const result = await getValidRemoteAccessToken();

      expect(result).toEqual({
        accessToken: 'cached-access-token',
        error: null,
      });

      // Should not call fetch when using cached token
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return error when not connected', async () => {
      const { get } = require('firebase/database');

      // Mock Firebase get (no refresh token, no access_token)
      (get as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getValidRemoteAccessToken();

      expect(result).toEqual({
        accessToken: null,
        error: 'NOT_CONNECTED',
        message: expect.any(String),
        reconnect: true,
      });
    });

    it('should return error when token refresh fails', async () => {
      const { get } = require('firebase/database');

      // Mock Firebase get (has refresh token, no cached access_token)
      (get as jest.Mock).mockResolvedValue({
        exists: () => true,
        val: () => ({
          refresh_token: 'invalid-token',
          access_token: null,
        }),
      });

      // Mock Hue OAuth error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid refresh token',
        }),
      });

      const result = await getValidRemoteAccessToken();

      expect(result).toEqual({
        accessToken: null,
        error: 'TOKEN_EXPIRED',
        message: expect.any(String),
        reconnect: true,
      });
    });
  });

  describe('exchangeCodeForTokens', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_HUE_CLIENT_ID: 'test-client-id',
        HUE_CLIENT_SECRET: 'test-client-secret',
      };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should exchange authorization code for tokens', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 604800,
        }),
      });

      const result = await exchangeCodeForTokens('auth-code-123');

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 604800,
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.meethue.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );

      // Verify body is URLSearchParams with correct parameters
      const fetchCall = fetch.mock.calls[0];
      const body = fetchCall[1].body;
      expect(body).toBeInstanceOf(URLSearchParams);
      expect(body.get('code')).toBe('auth-code-123');
      expect(body.get('grant_type')).toBe('authorization_code');
    });

    it('should throw error when code exchange fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'invalid_request',
          error_description: 'Invalid authorization code',
        }),
      });

      await expect(exchangeCodeForTokens('invalid-code')).rejects.toThrow();
    });
  });

  describe('saveRemoteTokens', () => {
    it('should save refresh token to Firebase', async () => {
      const { update } = require('firebase/database');

      await saveRemoteTokens('new-refresh-token');

      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          refresh_token: 'new-refresh-token',
          remote_connected_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('clearRemoteTokens', () => {
    it('should clear remote tokens from Firebase', async () => {
      const { update } = require('firebase/database');

      await clearRemoteTokens();

      expect(update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          refresh_token: null,
          access_token: null,
          access_token_expires_at: null,
          remote_connected_at: null,
          connection_mode: 'local',
        })
      );
    });
  });

  describe('isRemoteConnected', () => {
    it('should return true when refresh token exists', async () => {
      const { get } = require('firebase/database');

      (get as jest.Mock).mockResolvedValue({
        exists: () => true,
        val: () => ({ refresh_token: 'token' }),
      });

      const result = await isRemoteConnected();

      expect(result).toBe(true);
    });

    it('should return false when no refresh token', async () => {
      const { get } = require('firebase/database');

      (get as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await isRemoteConnected();

      expect(result).toBe(false);
    });
  });

  describe('handleRemoteTokenError', () => {
    it('should return correct status codes for errors', () => {
      expect(handleRemoteTokenError('NOT_CONNECTED')).toEqual({
        status: 401,
        reconnect: true,
      });

      expect(handleRemoteTokenError('TOKEN_EXPIRED')).toEqual({
        status: 401,
        reconnect: true,
      });

      expect(handleRemoteTokenError('NETWORK_ERROR')).toEqual({
        status: 500,
        reconnect: false,
      });
    });
  });
});
