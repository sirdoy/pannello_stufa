/**
 * Philips Hue Scene Creation Route
 * POST: Create new scene with light configurations
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  hueNotConnected,
  hueNotOnLocalNetwork,
  parseJsonOrThrow,
  validateString,
  validateArray,
} from '@/lib/core';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request);
  const { name, groupRid, actions } = body;

  // Validation 1: Name required
  validateString(name, 'name');

  // Validation 2: Name length
  if (name.trim().length > 255) {
    return badRequest('Il nome della scena non puo superare 255 caratteri');
  }

  // Validation 3: Group (room) required
  validateString(groupRid, 'groupRid');

  // Validation 4: Actions required and must be array
  validateArray(actions, 'actions', 1);

  // Validation 5: Each action must have valid structure
  for (const action of actions) {
    if (!action.target?.rid || !action.action) {
      return badRequest('Formato configurazione luce non valido');
    }
  }

  // Get Hue connection from Firebase
  const connection = await getHueConnection();

  if (!connection) {
    return hueNotConnected();
  }

  try {
    // Create scene via Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.createScene(name.trim(), groupRid, actions);

    // Check for Hue API errors
    if (response.errors && response.errors.length > 0) {
      const firstError = response.errors[0];
      console.error('Hue API error creating scene:', firstError);
      throw new Error(firstError.description || 'Impossibile creare la scena');
    }

    const createdScene = response.data?.[0];

    return success({
      scene: createdScene || null,
    });
  } catch (err) {
    // Handle network timeout (not on local network)
    if (err.message === 'NETWORK_TIMEOUT') {
      return hueNotOnLocalNetwork();
    }
    throw err;
  }
}, 'Hue/Scene/Create');
