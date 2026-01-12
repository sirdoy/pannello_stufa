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
 * Get Netatmo credentials from environment
 * @returns {{ clientId: string|undefined, clientSecret: string|undefined, redirectUri: string|undefined }}
 */
function getCredentials() {
  return {
    clientId: process.env.NEXT_PUBLIC_NETATMO_CLIENT_ID,
    clientSecret: process.env.NETATMO_CLIENT_SECRET,
    redirectUri: process.env.NEXT_PUBLIC_NETATMO_REDIRECT_URI,
  };
}

/**
 * Validate credentials and throw descriptive error if incomplete
 * @param {{ clientId: any, clientSecret: any, redirectUri: any }} credentials
 * @throws {Error} If any credential field is missing
 */
function validateCredentials(credentials) {
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
 * @returns {{ clientId: string, clientSecret: string, redirectUri: string }}
 * @throws {Error} If credentials are missing or incomplete
 *
 * @example
 * // In API route or server-side code
 * const credentials = getNetatmoCredentials();
 * // → { clientId: '...', clientSecret: '...', redirectUri: '...' }
 */
export function getNetatmoCredentials() {
  const credentials = getCredentials();
  validateCredentials(credentials);
  return credentials;
}

/**
 * Get Netatmo OAuth credentials for current environment (client-side)
 *
 * Reads credentials from environment variables.
 * Next.js automatically loads correct values based on environment:
 * - localhost: .env.local values
 * - production: Vercel Environment Variables values
 *
 * @returns {{ clientId: string, clientSecret: string, redirectUri: string }}
 * @throws {Error} If credentials are missing or incomplete
 *
 * @example
 * // In React component
 * const credentials = getNetatmoCredentialsClient();
 * const authUrl = `https://api.netatmo.com/oauth2/authorize?client_id=${credentials.clientId}...`;
 */
export function getNetatmoCredentialsClient() {
  const credentials = getCredentials();
  validateCredentials(credentials);
  return credentials;
}
