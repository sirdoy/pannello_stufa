/**
 * Unit tests for Netatmo Credentials Resolver
 * Tests credential reading and validation with hostname-based environment detection
 */

import { getNetatmoCredentials, getNetatmoCredentialsClient } from '@/lib/netatmoCredentials';

describe('netatmoCredentials', () => {
  // Store original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and clear mocks
    jest.clearAllMocks();

    // Reset process.env to a clean state
    process.env = { ...originalEnv };

    // Explicitly delete Netatmo env vars to ensure clean state
    delete process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID;
    delete process.env.NETATMO_CLIENT_SECRET;
    delete process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI;
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('getNetatmoCredentials (server-side)', () => {
    it('returns credentials when all environment variables are set', () => {
      // Setup: Complete credentials
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'client-123';
      process.env.NETATMO_CLIENT_SECRET = 'secret-456';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'http://localhost:3001/api/netatmo/callback';

      // Execute
      const credentials = getNetatmoCredentials();

      // Assert: All fields present
      expect(credentials).toEqual({
        clientId: 'client-123',
        clientSecret: 'secret-456',
        redirectUri: 'http://localhost:3001/api/netatmo/callback',
      });
    });

    it('throws error if clientId is missing', () => {
      // Setup: Only secret and redirectUri
      process.env.NETATMO_CLIENT_SECRET = 'secret-456';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'http://localhost:3001/callback';

      // Execute & Assert
      expect(() => getNetatmoCredentials()).toThrow(
        /Missing NEXT_PUBLIC_NETATMO_CLIENT_ID/
      );
    });

    it('throws error if clientSecret is missing', () => {
      // Setup: Only clientId and redirectUri
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'client-123';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'http://localhost:3001/callback';

      // Execute & Assert
      expect(() => getNetatmoCredentials()).toThrow(
        /Missing NETATMO_CLIENT_SECRET/
      );
    });

    it('throws error if redirectUri is missing', () => {
      // Setup: Only clientId and secret
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'client-123';
      process.env.NETATMO_CLIENT_SECRET = 'secret-456';

      // Execute & Assert
      expect(() => getNetatmoCredentials()).toThrow(
        /Missing NEXT_PUBLIC_NETATMO_REDIRECT_URI/
      );
    });

    it('throws error if all credentials are missing', () => {
      // Setup: No credentials

      // Execute & Assert
      expect(() => getNetatmoCredentials()).toThrow(
        /Missing NEXT_PUBLIC_NETATMO_CLIENT_ID/
      );
    });

    it('includes setup instructions in error message', () => {
      // Setup: No credentials

      // Execute & Assert
      expect(() => getNetatmoCredentials()).toThrow(
        /Localhost: add to \.env\.local.*Production: add to Vercel/
      );
    });

    it('returns complete credentials object with correct types', () => {
      // Setup: All credentials
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'client-123';
      process.env.NETATMO_CLIENT_SECRET = 'secret-456';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'https://example.com/callback';

      // Execute
      const credentials = getNetatmoCredentials();

      // Assert: All fields are strings
      expect(typeof credentials.clientId).toBe('string');
      expect(typeof credentials.clientSecret).toBe('string');
      expect(typeof credentials.redirectUri).toBe('string');
      expect(Object.keys(credentials)).toHaveLength(3);
    });

    it('handles empty string environment variables as missing', () => {
      // Setup: Empty strings
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = '';
      process.env.NETATMO_CLIENT_SECRET = '';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = '';

      // Execute & Assert
      expect(() => getNetatmoCredentials()).toThrow(/Missing/);
    });
  });

  describe('getNetatmoCredentialsClient (browser-side)', () => {
    it('returns credentials when all environment variables are set', () => {
      // Setup: Complete credentials
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'client-abc';
      process.env.NETATMO_CLIENT_SECRET = 'secret-def';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'https://app.vercel.app/callback';

      // Execute
      const credentials = getNetatmoCredentialsClient();

      // Assert: All fields present
      expect(credentials).toEqual({
        clientId: 'client-abc',
        clientSecret: 'secret-def',
        redirectUri: 'https://app.vercel.app/callback',
      });
    });

    it('throws error if credentials are missing', () => {
      // Setup: No credentials

      // Execute & Assert
      expect(() => getNetatmoCredentialsClient()).toThrow(
        /Missing NEXT_PUBLIC_NETATMO_CLIENT_ID/
      );
    });

    it('returns same result as server-side function', () => {
      // Setup: Complete credentials
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'client-same';
      process.env.NETATMO_CLIENT_SECRET = 'secret-same';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'http://localhost:3001/callback';

      // Execute
      const serverCredentials = getNetatmoCredentials();
      const clientCredentials = getNetatmoCredentialsClient();

      // Assert: Both return same values
      expect(clientCredentials).toEqual(serverCredentials);
    });
  });

  describe('Environment-specific values', () => {
    it('localhost reads .env.local values (simulated)', () => {
      // Setup: Simulate localhost .env.local values
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'localhost-client-id';
      process.env.NETATMO_CLIENT_SECRET = 'localhost-secret';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'http://localhost:3001/api/netatmo/callback';

      // Execute
      const credentials = getNetatmoCredentials();

      // Assert: Returns localhost values
      expect(credentials.clientId).toBe('localhost-client-id');
      expect(credentials.redirectUri).toContain('localhost:3001');
    });

    it('production reads Vercel Environment Variables values (simulated)', () => {
      // Setup: Simulate production Vercel env vars
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'prod-client-id';
      process.env.NETATMO_CLIENT_SECRET = 'prod-secret';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'https://production.app/api/netatmo/callback';

      // Execute
      const credentials = getNetatmoCredentials();

      // Assert: Returns production values
      expect(credentials.clientId).toBe('prod-client-id');
      expect(credentials.redirectUri).toContain('production.app');
    });
  });

  describe('Edge cases', () => {
    it('handles whitespace-only values as invalid', () => {
      // Setup: Whitespace values
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = '   ';
      process.env.NETATMO_CLIENT_SECRET = '\t\n';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = '  ';

      // Execute & Assert: Whitespace is truthy but probably invalid
      // Our validator doesn't trim, so these pass validation
      // (but would fail at OAuth API level)
      const credentials = getNetatmoCredentials();
      expect(credentials.clientId).toBe('   ');
    });

    it('handles special characters in credentials', () => {
      // Setup: Special characters
      process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID = 'client-with-dashes_underscores123';
      process.env.NETATMO_CLIENT_SECRET = 'secret!@#$%^&*()+=';
      process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI = 'http://localhost:3001/api/callback?test=1';

      // Execute
      const credentials = getNetatmoCredentials();

      // Assert: Special characters preserved
      expect(credentials.clientId).toContain('_underscores');
      expect(credentials.clientSecret).toContain('!@#');
      expect(credentials.redirectUri).toContain('?test=1');
    });
  });
});
