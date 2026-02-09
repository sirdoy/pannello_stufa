import { withAuthAndErrorHandler, success, requireNetatmoToken } from '@/lib/core';
import NETATMO_API from '@/lib/netatmoApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/devices
 * Retrieves list of all Netatmo devices (modules) from Energy API
 * Protected: Requires Auth0 authentication
 *
 * Note: Uses homesdata endpoint (Energy API) instead of deprecated devicelist endpoint
 */
export const GET = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();

  // Get homes data which includes all modules/devices
  const homesData = await NETATMO_API.getHomesData(accessToken);
  const modules = NETATMO_API.parseModules(homesData);

  return success({ modules, homes: homesData });
}, 'Netatmo/Devices');
