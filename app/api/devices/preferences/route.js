/**
 * Device Preferences API
 * GET: Fetch user device preferences
 * POST: Update user device preferences
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import {
  getDevicePreferences,
  updateDevicePreferences,
} from '@/lib/devicePreferencesService';
import { DEVICE_CONFIG } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/devices/preferences
 * Fetch device preferences for current user
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession();
    const userId = session?.user?.sub;

    if (!userId) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const preferences = await getDevicePreferences(userId);

    // Also return device config for UI rendering
    const devices = Object.values(DEVICE_CONFIG).map(device => ({
      id: device.id,
      name: device.name,
      icon: device.icon,
      color: device.color,
      enabled: preferences[device.id] === true,
      description: getDeviceDescription(device.id),
    }));

    return NextResponse.json({
      preferences,
      devices,
    });
  } catch (error) {
    console.error('Error fetching device preferences:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle preferenze' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices/preferences
 * Update device preferences for current user
 * Body: { preferences: { deviceId: boolean, ... } }
 */
export async function POST(request) {
  try {
    const session = await auth0.getSession();
    const userId = session?.user?.sub;

    if (!userId) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Preferenze non valide' },
        { status: 400 }
      );
    }

    // Validate that all keys are valid device IDs
    const validDeviceIds = Object.keys(DEVICE_CONFIG);
    const invalidKeys = Object.keys(preferences).filter(
      key => !validDeviceIds.includes(key)
    );

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Device ID non validi: ${invalidKeys.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate that all values are booleans
    const invalidValues = Object.entries(preferences).filter(
      ([_, value]) => typeof value !== 'boolean'
    );

    if (invalidValues.length > 0) {
      return NextResponse.json(
        { error: 'Tutti i valori devono essere booleani' },
        { status: 400 }
      );
    }

    await updateDevicePreferences(userId, preferences);

    return NextResponse.json({
      success: true,
      message: 'Preferenze aggiornate con successo',
    });
  } catch (error) {
    console.error('Error updating device preferences:', error);
    return NextResponse.json(
      { error: 'Errore nel salvataggio delle preferenze' },
      { status: 500 }
    );
  }
}

/**
 * Get device description for UI
 */
function getDeviceDescription(deviceId) {
  const descriptions = {
    stove: 'Stufa a pellet Thermorossi - controllo accensione, spegnimento, potenza e ventilazione',
    thermostat: 'Termostato Netatmo Energy - gestione multi-room temperatura e programmazione',
    lights: 'Luci Philips Hue - controllo luci smart, scene e automazioni',
    sonos: 'Sistema audio Sonos - controllo musica multi-room e integrazione Spotify',
  };

  return descriptions[deviceId] || 'Dispositivo smart home';
}
