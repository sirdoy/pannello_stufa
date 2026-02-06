/**
 * Netatmo OAuth Credentials Resolver
 *
 * Reads Netatmo credentials from environment variables.
 * Credentials have the SAME NAMES but DIFFERENT VALUES per environment:
 * - localhost: .env.local values
 * - production: Vercel Environment Variables values
 *
 * Firebase storage is environment-aware:
 * - localhost: dev/netatmo/
 * - production: netatmo/ (root)
 *
 * Environment detection via hostname (handled by environmentHelper.js)
 */

/**
 * Centralized OAuth scopes for Netatmo integration
 * Includes both thermostat (Energy API) and camera (Security API) scopes
 *
 * @see https://dev.netatmo.com/apidocumentation/energy
 * @see https://dev.netatmo.com/apidocumentation/security
 */
export const NETATMO_OAUTH_SCOPES = 'read_thermostat write_thermostat read_camera access_camera';

/** Netatmo OAuth credentials (server-side) */
export interface NetatmoCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/** Netatmo OAuth credentials (client-side - no secret) */
export interface NetatmoCredentialsClient {
  clientId: string;
  redirectUri: string;
}

/** Internal credentials structure */
interface CredentialsRaw {
  clientId: string | undefined;
  clientSecret: string | undefined;
  redirectUri: string | undefined;
}

/**
 * Get Netatmo credentials from environment
 */
function getCredentials(): CredentialsRaw {
  return {
    clientId: process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID,
    clientSecret: process.env.NETATMO_CLIENT_SECRET,
    redirectUri: process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI,
  };
}

/**
 * Validate credentials and throw descriptive error if incomplete
 */
function validateCredentials(credentials: CredentialsRaw): asserts credentials is NetatmoCredentials {
  if (!credentials.clientId) {
    throw new Error(
      `Missing NEXT_PUBLIC_NETATMO_CLIENT_ID. ` +
      `Please configure Netatmo OAuth credentials in your environment variables. ` +
      `Localhost: add to .env.local | Production: add to Vercel Environment Variables. ` +
      `See docs/setup/netatmo-setup.md for setup instructions.`
    );
  }

  if (!credentials.clientSecret) {
    throw new Error(
      `Missing NETATMO_CLIENT_SECRET. ` +
      `Please configure Netatmo OAuth credentials in your environment variables. ` +
      `Localhost: add to .env.local | Production: add to Vercel Environment Variables. ` +
      `See docs/setup/netatmo-setup.md for setup instructions.`
    );
  }

  if (!credentials.redirectUri) {
    throw new Error(
      `Missing NEXT_PUBLIC_NETATMO_REDIRECT_URI. ` +
      `Please configure Netatmo OAuth credentials in your environment variables. ` +
      `Localhost: add to .env.local | Production: add to Vercel Environment Variables. ` +
      `See docs/setup/netatmo-setup.md for setup instructions.`
    );
  }
}

/**
 * Get Netatmo OAuth credentials for current environment (server-side)
 *
 * Reads credentials from environment variables.
 * Next.js automatically loads correct values based on environment:
 * - localhost: .env.local values
 * - production: Vercel Environment Variables values
 *
 * @example
 * // In API route or server-side code
 * const credentials = getNetatmoCredentials();
 * // → { clientId: '...', clientSecret: '...', redirectUri: '...' }
 */
export function getNetatmoCredentials(): NetatmoCredentials {
  const credentials = getCredentials();
  validateCredentials(credentials);
  return credentials;
}

/**
 * Get Netatmo OAuth credentials for current environment (client-side)
 *
 * Only returns client-safe credentials (NEXT_PUBLIC_* variables).
 * Does NOT include clientSecret as it's server-side only.
 *
 * Next.js automatically loads correct values based on environment:
 * - localhost: .env.local values
 * - production: Vercel Environment Variables values
 *
 * @example
 * // In React component
 * const credentials = getNetatmoCredentialsClient();
 * const authUrl = `https://api.netatmo.com/oauth2/authorize?client_id=${credentials.clientId}...`;
 */
export function getNetatmoCredentialsClient(): NetatmoCredentialsClient {
  const clientId = process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI;

  if (!clientId) {
    throw new Error(
      `Missing NEXT_PUBLIC_NETATMO_CLIENT_ID. ` +
      `Please configure Netatmo OAuth credentials in your environment variables. ` +
      `Localhost: add to .env.local | Production: add to Vercel Environment Variables. ` +
      `See docs/setup/netatmo-setup.md for setup instructions.`
    );
  }

  if (!redirectUri) {
    throw new Error(
      `Missing NEXT_PUBLIC_NETATMO_REDIRECT_URI. ` +
      `Please configure Netatmo OAuth credentials in your environment variables. ` +
      `Localhost: add to .env.local | Production: add to Vercel Environment Variables. ` +
      `See docs/setup/netatmo-setup.md for setup instructions.`
    );
  }

  return { clientId, redirectUri };
}

/**
 * Build Netatmo OAuth authorization URL
 * Uses centralized scopes and credentials
 *
 * @example
 * // In React component
 * const authUrl = getNetatmoAuthUrl('thermostat');
 * window.location.href = authUrl;
 */
export function getNetatmoAuthUrl(state: string = 'auth'): string {
  const { clientId, redirectUri } = getNetatmoCredentialsClient();
  return `https://api.netatmo.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(NETATMO_OAUTH_SCOPES)}&state=${state}`;
}
