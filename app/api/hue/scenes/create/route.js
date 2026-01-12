/**
 * Philips Hue Scene Creation Route
 * POST: Create new scene with light configurations
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export const POST = auth0.withApiAuthRequired(async function handler(request) {
  try {
    const body = await request.json();
    const { name, groupRid, actions } = body;

    // Validation 1: Name required
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Il nome della scena è obbligatorio' },
        { status: 400 }
      );
    }

    // Validation 2: Name length
    if (name.trim().length > 255) {
      return NextResponse.json(
        { error: 'Il nome della scena non può superare 255 caratteri' },
        { status: 400 }
      );
    }

    // Validation 3: Group (room) required
    if (!groupRid || typeof groupRid !== 'string') {
      return NextResponse.json(
        { error: 'La selezione della stanza è obbligatoria' },
        { status: 400 }
      );
    }

    // Validation 4: Actions required and must be array
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: 'È necessaria almeno una configurazione luce' },
        { status: 400 }
      );
    }

    // Validation 5: Each action must have valid structure
    for (const action of actions) {
      if (!action.target?.rid || !action.action) {
        return NextResponse.json(
          { error: 'Formato configurazione luce non valido' },
          { status: 400 }
        );
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

    // Create scene via Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.createScene(name.trim(), groupRid, actions);

    // Check for Hue API errors
    if (response.errors && response.errors.length > 0) {
      const firstError = response.errors[0];
      console.error('❌ Hue API error creating scene:', firstError);
      throw new Error(firstError.description || 'Impossibile creare la scena');
    }

    const createdScene = response.data?.[0];

    return NextResponse.json({
      success: true,
      scene: createdScene || null
    });

  } catch (error) {
    console.error('❌ Scene creation error:', error);

    // Handle network timeout (not on local network)
    if (error.message === 'NETWORK_TIMEOUT') {
      return NextResponse.json({
        error: 'NOT_ON_LOCAL_NETWORK',
        message: 'Bridge Hue non raggiungibile. Assicurati di essere sulla stessa rete locale del bridge.',
        reconnect: false,
      }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message || 'Impossibile creare la scena' },
      { status: 500 }
    );
  }
});
