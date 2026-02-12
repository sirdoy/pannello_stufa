import { withAuthAndErrorHandler, success } from '@/lib/core';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/disconnect
 * Clears Netatmo tokens to force re-authorization
 * Used when user needs to re-authorize with new OAuth scopes (e.g., camera access)
 * Protected: Requires Auth0 authentication
 *
 * IMPORTANT: Only clears authentication data (tokens, cache), preserves user configs
 * (userSelectedScheduleId, stoveSync) to prevent losing user's manual settings
 */
export const POST = withAuthAndErrorHandler(async () => {
  // Clear ONLY authentication-related data, preserve user configuration
  // Authentication data to clear:
  // - refresh_token (OAuth refresh token)
  // - access_token_cache (cached access token with expiry)
  // - home_id (will be re-fetched on next API call)
  // - topology (will be re-fetched on next API call)
  // - cache/* (all cached API responses)
  // - calibrations (calibration log)
  // - health (health monitoring data)
  //
  // User configuration to PRESERVE:
  // - userSelectedScheduleId (user's manually selected Netatmo schedule)
  // - stoveSync (stove-thermostat automation configuration)
  //
  // This prevents losing user's manual settings when they reconnect Netatmo

  const pathsToDelete = [
    'netatmo/refresh_token',
    'netatmo/access_token_cache',
    'netatmo/home_id',
    'netatmo/topology',
    'netatmo/cache',
    'netatmo/calibrations',
    'netatmo/health',
  ];

  // Delete each path individually using environment-aware paths
  await Promise.all(
    pathsToDelete.map((path) => adminDbSet(getEnvironmentPath(path), null))
  );

  return success({
    message: 'Disconnesso da Netatmo. Riconnetti per autorizzare nuovi permessi. Le tue configurazioni (schedule selezionato, automazioni stufa-termostati) sono state preservate.',
  });
}, 'Netatmo/Disconnect');
