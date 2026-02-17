/**
 * Fritz!Box Configuration API
 *
 * GET    /api/config/fritzbox - Get current Fritz!Box credentials (masked)
 * POST   /api/config/fritzbox - Save Fritz!Box credentials to Firebase RTDB
 * DELETE /api/config/fritzbox - Remove Fritz!Box credentials from Firebase RTDB
 *
 * Credentials are stored in Firebase RTDB at config/fritzbox (shared across all devices).
 * Password is stored server-side only; GET returns password masked.
 *
 * POST supports partial update: if password is omitted/blank and credentials already exist,
 * the existing password is preserved.
 */

import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { adminDbGet, adminDbSet, adminDbRemove } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { invalidateFritzBoxCredentialCache } from '@/lib/fritzbox/fritzboxClient';

export const dynamic = 'force-dynamic';

interface FritzBoxCredentials {
  apiUrl: string;
  username: string;
  password: string;
  updatedAt: number;
}

interface SaveCredentialsBody {
  apiUrl?: string;
  username?: string;
  password?: string;
}

/**
 * GET /api/config/fritzbox
 * Returns current Fritz!Box credentials with password masked.
 *
 * Response:
 *   200: { configured: true, apiUrl, username, passwordSet: true, updatedAt }
 *   200: { configured: false }
 */
export const GET = withAuthAndErrorHandler(async () => {
  const path = getEnvironmentPath('config/fritzbox');
  const credentials = (await adminDbGet(path)) as FritzBoxCredentials | null;

  if (!credentials?.apiUrl) {
    return success({ configured: false });
  }

  return success({
    configured: true,
    apiUrl: credentials.apiUrl,
    username: credentials.username,
    passwordSet: Boolean(credentials.password),
    updatedAt: credentials.updatedAt,
  });
}, 'Config/FritzBox GET');

/**
 * POST /api/config/fritzbox
 * Save Fritz!Box credentials to Firebase RTDB (shared across all devices).
 * If credentials already exist and password is blank, the existing password is preserved.
 *
 * Body:
 *   {
 *     apiUrl: string,      // Required: HomeAssistant API URL (e.g. http://192.168.1.1:8000)
 *     username: string,    // Required: API username
 *     password?: string,   // Optional on update: leave blank to keep existing password
 *   }
 *
 * Response:
 *   200: { message: 'Credentials saved' }
 *   400: validation error
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await request.json()) as SaveCredentialsBody;
  const { apiUrl, username, password } = body;

  if (!apiUrl || typeof apiUrl !== 'string' || apiUrl.trim() === '') {
    return badRequest('apiUrl is required');
  }

  if (!username || typeof username !== 'string' || username.trim() === '') {
    return badRequest('username is required');
  }

  // Basic URL validation
  try {
    const parsed = new URL(apiUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return badRequest('apiUrl must use http or https protocol');
    }
  } catch {
    return badRequest('apiUrl must be a valid URL (e.g. http://192.168.1.1:8000)');
  }

  // Determine the password to store
  let resolvedPassword: string;

  if (password && password.trim() !== '') {
    // New password provided
    resolvedPassword = password.trim();
  } else {
    // No password provided — keep existing password if credentials already stored
    const path = getEnvironmentPath('config/fritzbox');
    const existing = (await adminDbGet(path)) as FritzBoxCredentials | null;

    if (!existing?.password) {
      return badRequest('password is required');
    }

    resolvedPassword = existing.password;
  }

  const path = getEnvironmentPath('config/fritzbox');
  await adminDbSet(path, {
    apiUrl: apiUrl.trim(),
    username: username.trim(),
    password: resolvedPassword,
    updatedAt: Date.now(),
  });

  // Invalidate the in-memory credential cache so next request re-reads from Firebase
  invalidateFritzBoxCredentialCache();

  return success({ message: 'Credentials saved' });
}, 'Config/FritzBox POST');

/**
 * DELETE /api/config/fritzbox
 * Remove Fritz!Box credentials from Firebase RTDB.
 *
 * Response:
 *   200: { message: 'Credentials removed' }
 */
export const DELETE = withAuthAndErrorHandler(async () => {
  const path = getEnvironmentPath('config/fritzbox');
  await adminDbRemove(path);

  // Invalidate the in-memory credential cache
  invalidateFritzBoxCredentialCache();

  return success({ message: 'Credentials removed' });
}, 'Config/FritzBox DELETE');
