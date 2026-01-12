/**
 * Tests for Hue Remote Token Helper (OAuth 2.0)
 */

import {
  getValidRemoteAccessToken,
  exchangeCodeForTokens,
  saveRemoteTokens,
  clearRemoteTokens,
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
  });

  describe('getValidRemoteAccessToken', () => {
    it('should return access token when refresh succeeds', async () => {
      const { ref, get, update } = require('firebase/database');

      // Mock Firebase get (has refresh token)
      get.mockResolvedValue({
        exists: () => true,
        val: () => ({ refresh_token: 'old-refresh-token' }),
      });

      // Mock Hue OAuth refresh endpoint
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
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
        'https://api.meethue.com/oauth2/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
          }),
        })
      );

      expect(update).toHaveBeenCalled();
    });

    it('should return error when not connected', async () => {
      const { get } = require('firebase/database');

      // Mock Firebase get (no refresh token)
      get.mockResolvedValue({
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

      // Mock Firebase get
      get.mockResolvedValue({
        exists: () => true,
        val: () => ({ refresh_token: 'invalid-token' }),
      });

      // Mock Hue OAuth error
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({
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
    it('should exchange authorization code for tokens', async () => {
      global.fetch.mockResolvedValue({
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
          body: expect.stringContaining('code=auth-code-123'),
        })
      );
    });

    it('should throw error when code exchange fails', async () => {
      global.fetch.mockResolvedValue({
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
          remote_connected_at: null,
          connection_mode: 'local',
        })
      );
    });
  });

  describe('isRemoteConnected', () => {
    it('should return true when refresh token exists', async () => {
      const { get } = require('firebase/database');

      get.mockResolvedValue({
        exists: () => true,
        val: () => ({ refresh_token: 'token' }),
      });

      const result = await isRemoteConnected();

      expect(result).toBe(true);
    });

    it('should return false when no refresh token', async () => {
      const { get } = require('firebase/database');

      get.mockResolvedValue({
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
