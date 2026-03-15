/**
 * Environment Variable Validator
 *
 * Validates required environment variables for health monitoring on startup.
 * Helps catch configuration errors before they cause runtime failures.
 *
 * Usage:
 *   import { validateHealthMonitoringEnv } from '@/lib/envValidator';
 *
 *   const result = validateHealthMonitoringEnv();
 *   if (!result.valid) {
 *     console.error('Missing env vars:', result.missing);
 *   }
 */

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export interface NetatmoValidationResult {
  valid: boolean;
  environment: 'proxy' | 'unknown';
  warnings: string[];
}

/**
 * Validate health monitoring environment variables
 *
 * @returns {Object} Validation result
 *   - valid: boolean - All required vars present
 *   - missing: string[] - Names of missing required vars
 *   - warnings: string[] - Names of missing optional vars
 */
export function validateHealthMonitoringEnv(): ValidationResult {
  const required = [
    'ADMIN_USER_ID',
    'CRON_SECRET',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ];

  const optional = [
    'NETATMO_PROXY_URL',
    'NETATMO_API_KEY',
  ];

  // Check required variables
  const missing = required.filter(varName => !process.env[varName]);

  // Check optional variables (for warnings)
  const warnings = optional.filter(varName => !process.env[varName]);

  const valid = missing.length === 0;

  // Log validation result
  if (valid) {
    if (warnings.length > 0) {
      console.warn(`⚠️ Optional env vars missing: ${warnings.join(', ')}`);
    }
  } else {
    console.error(`❌ Health monitoring environment validation failed: Missing ${missing.join(', ')}`);
  }

  return {
    valid,
    missing,
    warnings,
  };
}

/**
 * Validate Netatmo-specific environment variables
 * Checks for proxy credentials (NETATMO_PROXY_URL + NETATMO_API_KEY)
 *
 * @returns {Object} Validation result
 *   - valid: boolean - Proxy credentials present
 *   - environment: 'proxy' | 'unknown' - Always 'proxy' when valid
 *   - warnings: string[] - Configuration warnings
 */
export function validateNetatmoEnv(): NetatmoValidationResult {
  const proxyUrl = process.env.NETATMO_PROXY_URL;
  const apiKey = process.env.NETATMO_API_KEY;

  const warnings: string[] = [];

  // Check if proxy credentials are present
  if (!proxyUrl || !apiKey) {
    return {
      valid: false,
      environment: 'unknown',
      warnings: ['NETATMO_PROXY_URL or NETATMO_API_KEY missing'],
    };
  }

  if (warnings.length > 0) {
    console.warn(`⚠️ Netatmo warnings: ${warnings.join(', ')}`);
  }

  return {
    valid: true,
    environment: 'proxy',
    warnings,
  };
}
