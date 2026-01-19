import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbPush } from '@/lib/firebaseAdmin';
import {
  getStoveSyncConfig,
  enableStoveSync,
  disableStoveSync,
  syncLivingRoomWithStove,
  getAvailableRoomsForSync,
} from '@/lib/netatmoStoveSync';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/stove-sync
 * Get stove sync configuration and available rooms
 * Protected by Auth0 authentication
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const config = await getStoveSyncConfig();
    const availableRooms = await getAvailableRoomsForSync();

    return Response.json({
      config,
      availableRooms,
    });
  } catch (err) {
    console.error('Error in GET /api/netatmo/stove-sync:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}

/**
 * POST /api/netatmo/stove-sync
 * Enable/disable stove sync or trigger manual sync
 *
 * Body options:
 * 1. Enable: { action: 'enable', roomId: '...', roomName: '...', stoveTemperature?: 16 }
 * 2. Disable: { action: 'disable' }
 * 3. Manual sync: { action: 'sync', stoveIsOn: true/false }
 *
 * Protected by Auth0 authentication
 */
export async function POST(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const user = session.user;

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return Response.json({ error: 'action is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'enable': {
        const { roomId, roomName, stoveTemperature } = body;
        if (!roomId || !roomName) {
          return Response.json({ error: 'roomId and roomName are required' }, { status: 400 });
        }
        await enableStoveSync(roomId, roomName, stoveTemperature || 16);
        result = {
          success: true,
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
          success: true,
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
        if (typeof stoveIsOn !== 'boolean') {
          return Response.json({ error: 'stoveIsOn boolean is required' }, { status: 400 });
        }
        const syncResult = await syncLivingRoomWithStove(stoveIsOn);
        result = {
          success: syncResult.synced,
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
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return Response.json(result);
  } catch (err) {
    console.error('Error in POST /api/netatmo/stove-sync:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
