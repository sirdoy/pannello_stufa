import { withAuthAndErrorHandler, success, notFound, requireNetatmoToken } from '@/lib/core';
import { adminDbSet } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/homesdata
 * Retrieves complete Netatmo topology (homes, rooms, modules)
 * Saves home_id to Firebase for future use
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();

  // Get homes data
  const homesData = await NETATMO_API.getHomesData(accessToken);

  if (!homesData || homesData.length === 0) {
    return notFound('Nessuna casa trovata');
  }

  const home = homesData[0]; // Usually single home
  if (!home) {
    return notFound('No home data available');
  }

  // Save home_id to Firebase for future use
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  await adminDbSet(homeIdPath, home.id);

  // Parse and structure data
  const rooms = NETATMO_API.parseRooms(homesData);
  const modules = NETATMO_API.parseModules(homesData);

  // Save topology to Firebase
  const topologyPath = getEnvironmentPath('netatmo/topology');
  await adminDbSet(topologyPath, {
    home_id: home.id,
    home_name: home.name,
    rooms,
    modules,
    schedules: home.schedules ?? [],
    updated_at: Date.now(),
  });

  return success({
    home_id: home.id,
    home_name: home.name,
    rooms,
    modules,
    schedules: home.schedules ?? [],
  });
}, 'Netatmo/HomesData');
