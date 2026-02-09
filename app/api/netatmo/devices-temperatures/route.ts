import { withAuthAndErrorHandler, success, notFound, requireNetatmoToken } from '@/lib/core';
import NETATMO_API from '@/lib/netatmoApi';

export const dynamic = 'force-dynamic';

interface TemperatureResult {
  room_id: string;
  room_name: string;
  temperature?: number;
  setpoint?: number;
  mode?: string;
  heating: boolean;
}

/**
 * GET /api/netatmo/devices-temperatures
 * Retrieves temperatures from all Netatmo rooms (Energy API)
 * Protected: Requires Auth0 authentication
 *
 * Note: Uses homesdata + homestatus (Energy API) instead of deprecated devicelist endpoint
 */
export const GET = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();

  // Get homes data for home_id and room names
  const homesData = await NETATMO_API.getHomesData(accessToken);
  if (!homesData || homesData.length === 0) {
    return notFound('Nessuna casa trovata');
  }

  const home = homesData[0];
  if (!home) {
    return notFound('No home data available');
  }
  const homeId = home.id;

  // Get home status for real-time temperatures
  const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);
  const temperatures = NETATMO_API.extractTemperatures(homeStatus);

  // Enrich with room names from topology
  const rooms = home.rooms ?? [];
  const results: TemperatureResult[] = temperatures.map(temp => {
    const room = rooms.find(r => r.id === temp.room_id);
    return {
      room_id: temp.room_id,
      room_name: room?.name || temp.room_id,
      temperature: temp.temperature,
      setpoint: temp.setpoint,
      mode: temp.mode,
      heating: temp.heating,
    };
  });

  return success({ temperatures: results, home_id: homeId });
}, 'Netatmo/DevicesTemperatures');
