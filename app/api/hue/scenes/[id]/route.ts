/**
 * Philips Hue Individual Scene Route
 * PUT: Update scene (name and/or light configurations)
 * DELETE: Delete scene
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  notFound,
  hueNotConnected,
  hueNotOnLocalNetwork,
  getPathParam,
  parseJsonOrThrow,
  validateArray,
} from '@/lib/core';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/hue/scenes/[id]
 * Update scene name and/or actions
 */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const sceneId = await getPathParam(context, 'id');
  const updates = await parseJsonOrThrow(request);

  // Validation: At least one field to update
  if (!updates.name && !updates.actions) {
    return badRequest('Almeno un campo (nome o configurazioni) deve essere fornito');
  }

  // Validation: Name length if provided
  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
      return badRequest('Il nome della scena non puo essere vuoto');
    }
    if (updates.name.trim().length > 255) {
      return badRequest('Il nome della scena non puo superare 255 caratteri');
    }
  }

  // Validation: Actions format if provided
  if (updates.actions !== undefined) {
    validateArray(updates.actions, 'actions', 1);

    for (const action of updates.actions) {
      if (!action.target?.rid || !action.action) {
        return badRequest('Formato configurazione non valido');
      }
    }
  }

  // Get Hue connection from Firebase
  const connection = await getHueConnection();

  if (!connection) {
    return hueNotConnected();
  }

  try {
    // Update scene via Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);

    // Prepare update payload (trim name if provided)
    const payload = {};
    if (updates.name !== undefined) {
      payload.name = updates.name.trim();
    }
    if (updates.actions !== undefined) {
      payload.actions = updates.actions;
    }

    const response = await hueApi.updateScene(sceneId, payload);

    // Check for Hue API errors
    if (response.errors && response.errors.length > 0) {
      const firstError = response.errors[0];

      // Special handling for "not found" errors
      if (firstError.description?.includes('not found') || firstError.description?.includes('does not exist')) {
        return notFound('Scena non trovata. Potrebbe essere stata eliminata da un altro dispositivo.');
      }

      console.error('Hue API error updating scene:', firstError);
      throw new Error(firstError.description || 'Impossibile aggiornare la scena');
    }

    return success({
      scene: response.data?.[0] || null,
    });
  } catch (err) {
    // Handle network timeout (not on local network)
    if (err.message === 'NETWORK_TIMEOUT') {
      return hueNotOnLocalNetwork();
    }
    throw err;
  }
}, 'Hue/Scene/Update');

/**
 * DELETE /api/hue/scenes/[id]
 * Delete scene from Hue bridge
 */
export const DELETE = withAuthAndErrorHandler(async (request, context) => {
  const sceneId = await getPathParam(context, 'id');

  // Get Hue connection from Firebase
  const connection = await getHueConnection();

  if (!connection) {
    return hueNotConnected();
  }

  try {
    // Delete scene via Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.deleteScene(sceneId);

    // Check for Hue API errors
    if (response.errors && response.errors.length > 0) {
      const firstError = response.errors[0];

      // If scene not found, consider it already deleted (idempotent)
      if (firstError.description?.includes('not found') || firstError.description?.includes('does not exist')) {
        return success({
          message: 'Scena gia eliminata',
        });
      }

      console.error('Hue API error deleting scene:', firstError);
      throw new Error(firstError.description || 'Impossibile eliminare la scena');
    }

    return success({
      message: 'Scena eliminata con successo',
    });
  } catch (err) {
    // Handle network timeout (not on local network)
    if (err.message === 'NETWORK_TIMEOUT') {
      return hueNotOnLocalNetwork();
    }
    throw err;
  }
}, 'Hue/Scene/Delete');
