import { withAuthAndErrorHandler, success, notFound } from '@/lib/core';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { getProxyHomesdata } from '@/lib/netatmoProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/homesdata
 * Retrieves complete Netatmo topology (homes, rooms, modules, schedules) via the proxy.
 * Saves home_id and topology to Firebase for future use by other routes.
 * Protected: Requires Auth0 authentication
 *
 * Migrated from direct Netatmo Cloud API to local proxy (Plan 75-02).
 * No longer requires OAuth tokens — proxy handles token lifecycle.
 */
export const GET = withAuthAndErrorHandler(async () => {
  // Fetch home structure from proxy
  const proxyResponse = await getProxyHomesdata();

  const homes = proxyResponse.body.homes;
  if (!homes || homes.length === 0) {
    return notFound('Nessuna casa trovata');
  }

  const home = homes[0];
  if (!home) {
    return notFound('No home data available');
  }

  // Save home_id to Firebase for use by other routes (e.g. homestatus)
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  await adminDbSet(homeIdPath, home.id);

  // Proxy room/module/schedule objects pass through directly — no parsing needed
  const rooms = home.rooms;
  const modules = home.modules;
  const schedules = home.schedules ?? [];

  // Save topology to Firebase (used by homestatus for module battery info and room_type)
  const topologyPath = getEnvironmentPath('netatmo/topology');
  await adminDbSet(topologyPath, {
    home_id: home.id,
    home_name: home.name,
    rooms,
    modules,
    schedules,
    updated_at: Date.now(),
  });

  return success({
    home_id: home.id,
    home_name: home.name,
    rooms,
    modules,
    schedules,
  });
}, 'Netatmo/HomesData');
