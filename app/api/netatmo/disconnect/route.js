import { withAuthAndErrorHandler, success } from '@/lib/core';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/disconnect
 * Clears Netatmo tokens to force re-authorization
 * Used when user needs to re-authorize with new OAuth scopes (e.g., camera access)
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async () => {
  // Clear all Netatmo data using Admin SDK
  // Use environment-aware path (dev/netatmo in localhost, netatmo in production)
  const netatmoPath = getEnvironmentPath('netatmo');
  await adminDbSet(netatmoPath, null);

  return success({
    message: 'Disconnesso da Netatmo. Riconnetti per autorizzare nuovi permessi.',
  });
}, 'Netatmo/Disconnect');
