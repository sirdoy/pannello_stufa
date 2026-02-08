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
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Health monitoring environment validation passed')
      );
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

    it('should warn about missing optional vars', () => {
      process.env.ADMIN_USER_ID = 'auth0|admin123';
      process.env.CRON_SECRET = 'secret123';
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'project-id';
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'client@email.com';
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----';
      // Missing Netatmo vars (optional)

      const result = validateHealthMonitoringEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([
        'NETATMO_CLIENT_ID',
        'NETATMO_CLIENT_SECRET',
      ]);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Optional env vars missing')
      );
    });

    it('should not warn when optional vars present', () => {
      process.env.ADMIN_USER_ID = 'auth0|admin123';
      process.env.CRON_SECRET = 'secret123';
      process.env.FIREBASE_ADMIN_PROJECT_ID = 'project-id';
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'client@email.com';
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----';
      process.env.NETATMO_CLIENT_ID = 'netatmo-client-id';
      process.env.NETATMO_CLIENT_SECRET = 'netatmo-secret';

      const result = validateHealthMonitoringEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('validateNetatmoEnv', () => {
    it('should return valid: true when credentials present', () => {
      process.env.NETATMO_CLIENT_ID = 'client-id-12345';
      process.env.NETATMO_CLIENT_SECRET = 'secret-67890';

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(true);
      expect(result.environment).toBe('prod');
      expect(result.warnings).toEqual([]);
    });

    it('should return valid: false when credentials missing', () => {
      delete process.env.NETATMO_CLIENT_ID;
      delete process.env.NETATMO_CLIENT_SECRET;

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(false);
      expect(result.environment).toBe('unknown');
      expect(result.warnings).toContain('NETATMO_CLIENT_ID or NETATMO_CLIENT_SECRET missing');
    });

    it('should detect dev environment from client ID', () => {
      process.env.NETATMO_CLIENT_ID = 'test-client-id';
      process.env.NETATMO_CLIENT_SECRET = 'secret-12345';

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(true);
      expect(result.environment).toBe('dev');
    });

    it('should detect dev environment from client secret', () => {
      process.env.NETATMO_CLIENT_ID = 'client-id-12345';
      process.env.NETATMO_CLIENT_SECRET = 'dev-secret-67890';

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(true);
      expect(result.environment).toBe('dev');
    });

    it('should warn when using dev credentials in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });
      process.env.NETATMO_CLIENT_ID = 'test-client-id';
      process.env.NETATMO_CLIENT_SECRET = 'secret-12345';

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(true);
      expect(result.environment).toBe('dev');
      expect(result.warnings).toContain('Using dev Netatmo credentials in production environment');

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      });
    });

    it('should not warn when using prod credentials in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });
      process.env.NETATMO_CLIENT_ID = 'client-id-12345';
      process.env.NETATMO_CLIENT_SECRET = 'secret-67890';

      const result = validateNetatmoEnv();

      expect(result.valid).toBe(true);
      expect(result.environment).toBe('prod');
      expect(result.warnings).toEqual([]);

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      });
    });
  });
});
