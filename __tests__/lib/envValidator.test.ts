/**
 * Tests for Environment Validator
 */

import {
  validateHealthMonitoringEnv,
  validateNetatmoEnv,
} from '../../lib/envValidator';

describe('envValidator', () => {
  // Save original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env vars for each test
    process.env = { ...originalEnv };
    // Mock console to avoid test output noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore env vars
    process.env = originalEnv;
    (console.log as jest.Mock).mockRestore();
    (console.warn as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  describe('validateHealthMonitoringEnv', () => {
    it('should return valid: true when all required vars are present', () => {
      process.env.ADMIN_USER_ID = 'auth0|admin123';
      process.env.CRON_SECRET = 'secret123';
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'project-id';
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'client@email.com';
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----';

      const result = validateHealthMonitoringEnv();

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should return missing array when required vars absent', () => {
      // Clear all env vars
      delete process.env.ADMIN_USER_ID;
      delete process.env.CRON_SECRET;
      delete process.env.FIREBASE_ADMIN_PROJECT_ID;
      delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;

      const result = validateHealthMonitoringEnv();

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual([
        'ADMIN_USER_ID',
        'CRON_SECRET',
        'FIREBASE_ADMIN_PROJECT_ID',
        'FIREBASE_ADMIN_CLIENT_EMAIL',
        'FIREBASE_ADMIN_PRIVATE_KEY',
      ]);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Health monitoring environment validation failed')
      );
    });

    it('should detect partial missing vars', () => {
      process.env.ADMIN_USER_ID = 'auth0|admin123';
      process.env.CRON_SECRET = 'secret123';
      // Missing Firebase vars

      const result = validateHealthMonitoringEnv();

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual([
        'FIREBASE_ADMIN_PROJECT_ID',
        'FIREBASE_ADMIN_CLIENT_EMAIL',
        'FIREBASE_ADMIN_PRIVATE_KEY',
      ]);
    });

    it('should warn about missing optional proxy vars', () => {
      process.env.ADMIN_USER_ID = 'auth0|admin123';
      process.env.CRON_SECRET = 'secret123';
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'project-id';
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'client@email.com';
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----';
      // Missing proxy vars (optional)

      const result = validateHealthMonitoringEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([
        'NETATMO_PROXY_URL',
        'NETATMO_PROXY_API_KEY',
      ]);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Optional env vars missing')
      );
    });

    it('should not warn when optional proxy vars present', () => {
      process.env.ADMIN_USER_ID = 'auth0|admin123';
      process.env.CRON_SECRET = 'secret123';
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'project-id';
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'client@email.com';
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----';
      process.env.NETATMO_PROXY_URL = 'http://proxy-host:8080/api/v1/netatmo';
      process.env.NETATMO_PROXY_API_KEY = 'my-api-key';

      const result = validateHealthMonitoringEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('validateNetatmoEnv', () => {
    it('should return valid: true when proxy credentials present', () => {
      process.env.NETATMO_PROXY_URL = 'http://proxy-host:8080/api/v1/netatmo';
      process.env.NETATMO_PROXY_API_KEY = 'my-api-key';

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(true);
      expect(result.environment).toBe('proxy');
      expect(result.warnings).toEqual([]);
    });

    it('should return valid: false when proxy credentials missing', () => {
      delete process.env.NETATMO_PROXY_URL;
      delete process.env.NETATMO_PROXY_API_KEY;

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(false);
      expect(result.environment).toBe('unknown');
      expect(result.warnings).toContain('NETATMO_PROXY_URL or NETATMO_PROXY_API_KEY missing');
    });

    it('should return valid: false when only NETATMO_PROXY_URL missing', () => {
      delete process.env.NETATMO_PROXY_URL;
      process.env.NETATMO_PROXY_API_KEY = 'my-api-key';

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(false);
      expect(result.environment).toBe('unknown');
    });

    it('should return valid: false when only NETATMO_PROXY_API_KEY missing', () => {
      process.env.NETATMO_PROXY_URL = 'http://proxy-host:8080/api/v1/netatmo';
      delete process.env.NETATMO_PROXY_API_KEY;

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(false);
      expect(result.environment).toBe('unknown');
    });

    it('should always return environment: proxy when valid', () => {
      process.env.NETATMO_PROXY_URL = 'http://proxy-host:8080/api/v1/netatmo';
      process.env.NETATMO_PROXY_API_KEY = 'my-api-key';

      const result = validateNetatmoEnv();

      expect(result.environment).toBe('proxy');
    });
  });
});
