import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
  validateRequired,
  validateBoolean,
} from '@/lib/core';
import { adminDbPush } from '@/lib/firebaseAdmin';
import {
  getStoveSyncConfig,
  enableStoveSync,
  disableStoveSync,
  syncLivingRoomWithStove,
  getAvailableRoomsForSync,
} from '@/lib/netatmoStoveSync';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/stove-sync
 * Get stove sync configuration and available rooms
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const config = await getStoveSyncConfig();
  const availableRooms = await getAvailableRoomsForSync();

  return success({
    config,
    availableRooms,
  });
}, 'Netatmo/StoveSync');

/**
 * POST /api/netatmo/stove-sync
 * Enable/disable stove sync or trigger manual sync
 *
 * Body options:
 * 1. Enable: { action: 'enable', roomId: '...', roomName: '...', stoveTemperature?: 16 }
 * 2. Disable: { action: 'disable' }
 * 3. Manual sync: { action: 'sync', stoveIsOn: true/false }
 *
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;
  const body = await parseJsonOrThrow(request);
  const { action } = body;

  validateRequired(action, 'action');

  let result;

  switch (action) {
    case 'enable': {
      const { roomId, roomName, stoveTemperature } = body;
      validateRequired(roomId, 'roomId');
      validateRequired(roomName, 'roomName');

      await enableStoveSync(roomId, roomName, stoveTemperature || 16);
      result = {
        message: `Stove sync enabled for "${roomName}"`,
        config: await getStoveSyncConfig(),
      };

      // Log action
      await adminDbPush('log', {
        action: 'Sincronizzazione stufa attivata',
        device: DEVICE_TYPES.THERMOSTAT,
        value: roomName,
        roomId,
        roomName,
        stoveTemperature: stoveTemperature || 16,
        timestamp: Date.now(),
        user: {
          email: user.email,
          name: user.name,
          sub: user.sub,
        },
        source: 'manual',
      });
      break;
    }

    case 'disable': {
      await disableStoveSync();
      result = {
        message: 'Stove sync disabled',
        config: await getStoveSyncConfig(),
      };

      // Log action
      await adminDbPush('log', {
        action: 'Sincronizzazione stufa disattivata',
        device: DEVICE_TYPES.THERMOSTAT,
        timestamp: Date.now(),
        user: {
          email: user.email,
          name: user.name,
          sub: user.sub,
        },
        source: 'manual',
      });
      break;
    }

    case 'sync': {
      const { stoveIsOn } = body;
      validateBoolean(stoveIsOn, 'stoveIsOn');

      const syncResult = await syncLivingRoomWithStove(stoveIsOn);
      result = {
        synced: syncResult.synced,
        ...syncResult,
        config: await getStoveSyncConfig(),
      };

      // Log action
      if (syncResult.synced) {
        await adminDbPush('log', {
          action: stoveIsOn ? 'Sincronizzazione stufa ON' : 'Sincronizzazione stufa OFF',
          device: DEVICE_TYPES.THERMOSTAT,
          value: `${syncResult.temperature}°C`,
          roomId: syncResult.roomId,
          roomName: syncResult.roomName,
          temperature: syncResult.temperature,
          timestamp: Date.now(),
          user: {
            email: user.email,
            name: user.name,
            sub: user.sub,
          },
          source: 'manual',
        });
      }
      break;
    }

    default:
      return badRequest(`Unknown action: ${action}`);
  }

  return success(result);
}, 'Netatmo/StoveSync');
