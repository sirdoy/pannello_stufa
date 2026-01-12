/**
 * Philips Hue Individual Scene Route
 * PUT: Update scene (name and/or light configurations)
 * DELETE: Delete scene
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/hue/scenes/[id]
 * Update scene name and/or actions
 */
export const PUT = auth0.withApiAuthRequired(async function handler(request, { params }) {
  try {
    const { id: sceneId } = await params;
    const updates = await request.json();

    // Validation: At least one field to update
    if (!updates.name && !updates.actions) {
      return NextResponse.json(
        { error: 'Almeno un campo (nome o configurazioni) deve essere fornito' },
        { status: 400 }
      );
    }

    // Validation: Name length if provided
    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Il nome della scena non può essere vuoto' },
          { status: 400 }
        );
      }
      if (updates.name.trim().length > 255) {
        return NextResponse.json(
          { error: 'Il nome della scena non può superare 255 caratteri' },
          { status: 400 }
        );
      }
    }

    // Validation: Actions format if provided
    if (updates.actions !== undefined) {
      if (!Array.isArray(updates.actions) || updates.actions.length === 0) {
        return NextResponse.json(
          { error: 'Le configurazioni devono essere un array non vuoto' },
          { status: 400 }
        );
      }

      for (const action of updates.actions) {
        if (!action.target?.rid || !action.action) {
          return NextResponse.json(
            { error: 'Formato configurazione non valido' },
            { status: 400 }
          );
        }
      }
    }

    // Get Hue connection from Firebase
    const connection = await getHueConnection();

    if (!connection) {
      return NextResponse.json({
        error: 'NOT_CONNECTED',
        message: 'Bridge Hue non connesso. Effettua prima il pairing.',
        reconnect: true,
      }, { status: 401 });
    }

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
        return NextResponse.json(
          { error: 'Scena non trovata. Potrebbe essere stata eliminata da un altro dispositivo.' },
          { status: 404 }
        );
      }

      console.error('❌ Hue API error updating scene:', firstError);
      throw new Error(firstError.description || 'Impossibile aggiornare la scena');
    }

    return NextResponse.json({
      success: true,
      scene: response.data?.[0] || null
    });

  } catch (error) {
    console.error('❌ Scene update error:', error);

    // Handle network timeout (not on local network)
    if (error.message === 'NETWORK_TIMEOUT') {
      return NextResponse.json({
        error: 'NOT_ON_LOCAL_NETWORK',
        message: 'Bridge Hue non raggiungibile. Assicurati di essere sulla stessa rete locale del bridge.',
        reconnect: false,
      }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message || 'Impossibile aggiornare la scena' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/hue/scenes/[id]
 * Delete scene from Hue bridge
 */
export const DELETE = auth0.withApiAuthRequired(async function handler(request, { params }) {
  try {
    const { id: sceneId } = await params;

    // Get Hue connection from Firebase
    const connection = await getHueConnection();

    if (!connection) {
      return NextResponse.json({
        error: 'NOT_CONNECTED',
        message: 'Bridge Hue non connesso. Effettua prima il pairing.',
        reconnect: true,
      }, { status: 401 });
    }

    // Delete scene via Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.deleteScene(sceneId);

    // Check for Hue API errors
    if (response.errors && response.errors.length > 0) {
      const firstError = response.errors[0];

      // If scene not found, consider it already deleted (idempotent)
      if (firstError.description?.includes('not found') || firstError.description?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          message: 'Scena già eliminata'
        });
      }

      console.error('❌ Hue API error deleting scene:', firstError);
      throw new Error(firstError.description || 'Impossibile eliminare la scena');
    }

    return NextResponse.json({
      success: true,
      message: 'Scena eliminata con successo'
    });

  } catch (error) {
    console.error('❌ Scene deletion error:', error);

    // Handle network timeout (not on local network)
    if (error.message === 'NETWORK_TIMEOUT') {
      return NextResponse.json({
        error: 'NOT_ON_LOCAL_NETWORK',
        message: 'Bridge Hue non raggiungibile. Assicurati di essere sulla stessa rete locale del bridge.',
        reconnect: false,
      }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message || 'Impossibile eliminare la scena' },
      { status: 500 }
    );
  }
});
