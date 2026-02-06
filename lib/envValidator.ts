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
  environment: 'dev' | 'prod' | 'unknown';
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
    'NETATMO_CLIENT_ID',
    'NETATMO_CLIENT_SECRET',
  ];

  // Check required variables
  const missing = required.filter(varName => !process.env[varName]);

  // Check optional variables (for warnings)
  const warnings = optional.filter(varName => !process.env[varName]);

  const valid = missing.length === 0;

  // Log validation result
  if (valid) {
    console.log('✅ Health monitoring environment validation passed');
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
 * Detects dev vs prod credentials
 *
 * @returns {Object} Validation result
 *   - valid: boolean - Netatmo credentials present
 *   - environment: 'dev' | 'prod' | 'unknown' - Credential type
 *   - warnings: string[] - Configuration warnings
 */
export function validateNetatmoEnv(): NetatmoValidationResult {
  const clientId = process.env.NETATMO_CLIENT_ID;
  const clientSecret = process.env.NETATMO_CLIENT_SECRET;

  const warnings: string[] = [];

  // Check if credentials are present
  if (!clientId || !clientSecret) {
    return {
      valid: false,
      environment: 'unknown',
      warnings: ['NETATMO_CLIENT_ID or NETATMO_CLIENT_SECRET missing'],
    };
  }

  // Detect dev vs prod credentials
  // Dev credentials typically contain 'test', 'dev', or are shorter
  let environment: 'dev' | 'prod' | 'unknown' = 'prod';

  if (
    clientId.toLowerCase().includes('test') ||
    clientId.toLowerCase().includes('dev') ||
    clientSecret.toLowerCase().includes('test') ||
    clientSecret.toLowerCase().includes('dev')
  ) {
    environment = 'dev';
  }

  // Check for common misconfigurations in prod
  if (environment === 'dev' && process.env.NODE_ENV === 'production') {
    warnings.push('Using dev Netatmo credentials in production environment');
  }

  console.log(`✅ Netatmo environment detected: ${environment}`);
  if (warnings.length > 0) {
    console.warn(`⚠️ Netatmo warnings: ${warnings.join(', ')}`);
  }

  return {
    valid: true,
    environment,
    warnings,
  };
}
