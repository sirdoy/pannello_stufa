/**
 * Environment Helper
 * Detects if running in development or production environment
 * and provides appropriate Firebase paths
 */

/**
 * Check if running in development environment
 * @returns {boolean}
 */
export function isDevelopment(): boolean {
  // Check for localhost or 127.0.0.1 in various contexts
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    // Client-side check
    const hostname = window.location.hostname;
    const isDev = (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.')
    );
    return isDev;
  }

  // Server-side check (also used in tests)
  // In production, NODE_ENV is 'production'
  // In development, NODE_ENV is 'development'
  // In tests, NODE_ENV is 'test' but we default to production behavior for safety
  return process.env.NODE_ENV === 'development';
}

/**
 * Get Firebase path prefix for current environment
 * @returns {string} - Empty string for production, 'dev/' for development
 */
function getEnvironmentPrefix(): string {
  return isDevelopment() ? 'dev/' : '';
}

/**
 * Get environment-specific Firebase path
 * @param {string} basePath - Base Firebase path (e.g., 'netatmo', 'hue')
 * @returns {string} - Full path with environment prefix
 *
 * @example
 * // Production
 * getEnvironmentPath('netatmo') // 'netatmo'
 * getEnvironmentPath('hue/refresh_token') // 'hue/refresh_token'
 *
 * // Development (localhost)
 * getEnvironmentPath('netatmo') // 'dev/netatmo'
 * getEnvironmentPath('hue/refresh_token') // 'dev/hue/refresh_token'
 */
export function getEnvironmentPath(basePath: string): string {
  const prefix = getEnvironmentPrefix();
  return `${prefix}${basePath}`;
}

/**
 * Get current environment name
 * @returns {'development' | 'production'}
 */
function getEnvironmentName(): 'development' | 'production' {
  return isDevelopment() ? 'development' : 'production';
}

/**
 * Log environment info (useful for debugging)
 */
function logEnvironmentInfo(): void {
  const env = getEnvironmentName();
  const prefix = getEnvironmentPrefix();


  if (typeof window !== 'undefined') {
  } else {
  }
}
