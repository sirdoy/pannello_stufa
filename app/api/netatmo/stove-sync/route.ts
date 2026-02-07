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
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface Room {
  id: string;
  name: string;
}

interface StoveSyncEnableBody {
  action: 'enable';
  rooms?: Room[];
  roomId?: string;
  roomName?: string;
  stoveTemperature?: number;
}

interface StoveSyncDisableBody {
  action: 'disable';
}

interface StoveSyncSyncBody {
  action: 'sync';
  stoveIsOn?: boolean;
}

type StoveSyncBody = StoveSyncEnableBody | StoveSyncDisableBody | StoveSyncSyncBody;

interface SyncResult {
  synced: boolean;
  temperature?: number;
  roomNames?: string;
  rooms?: Room[];
  [key: string]: unknown;
}

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
export const POST = withAuthAndErrorHandler(async (request: NextRequest, _context: unknown, session?: any) => {
  const user = session?.user;
  const body = await parseJsonOrThrow(request) as StoveSyncBody;
  const { action } = body;

  validateRequired(action, 'action');

  let result: Record<string, unknown>;

  switch (action) {
    case 'enable': {
      // Support both single room (legacy) and multiple rooms (new)
      let rooms = (body as StoveSyncEnableBody).rooms;
      const stoveTemperature = (body as StoveSyncEnableBody).stoveTemperature || 16;

      if (!rooms) {
        // Legacy single-room API
        const { roomId, roomName } = body as StoveSyncEnableBody;
        validateRequired(roomId, 'roomId');
        validateRequired(roomName, 'roomName');
        rooms = [{ id: roomId!, name: roomName! }];
      }

      if (!Array.isArray(rooms) || rooms.length === 0) {
        return badRequest('rooms must be a non-empty array or provide roomId/roomName');
      }

      await enableStoveSync(rooms, stoveTemperature);
      const roomNames = rooms.map(r => r.name).join(', ');

      result = {
        message: `Stove sync enabled for: ${roomNames}`,
        config: await getStoveSyncConfig(),
      };

      // Log action
      await adminDbPush('log', {
        action: 'Sincronizzazione stufa attivata',
        device: DEVICE_TYPES.THERMOSTAT,
        value: roomNames,
        rooms: rooms.map(r => ({ id: r.id, name: r.name })),
        stoveTemperature,
        timestamp: Date.now(),
        user: user ? {
          email: user.email,
          name: user.name,
          sub: user.sub,
        } : null,
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
        user: user ? {
          email: user.email,
          name: user.name,
          sub: user.sub,
        } : null,
        source: 'manual',
      });
      break;
    }

    case 'sync': {
      const { stoveIsOn } = body as StoveSyncSyncBody;
      validateBoolean(stoveIsOn, 'stoveIsOn');

      const syncResult = await syncLivingRoomWithStove(stoveIsOn!) as SyncResult;
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
          value: syncResult.temperature ? `${syncResult.temperature}°C` : syncResult.roomNames,
          rooms: syncResult.rooms,
          roomNames: syncResult.roomNames,
          temperature: syncResult.temperature,
          timestamp: Date.now(),
          user: user ? {
            email: user.email,
            name: user.name,
            sub: user.sub,
          } : null,
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
