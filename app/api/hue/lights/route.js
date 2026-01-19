/**
 * Philips Hue Lights Route
 * GET: Fetch all lights
 * Uses Strategy Pattern (automatic local/remote fallback)
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import { HueConnectionStrategy } from '@/lib/hue/hueConnectionStrategy';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Get provider (local or remote via strategy)
    const provider = await HueConnectionStrategy.getProvider();

    // Fetch lights using unified interface
    const response = await provider.getLights();

    return NextResponse.json({
      lights: response.data || [],
      success: true,
    });

  } catch (error) {
    console.error('❌ Hue lights fetch error:', error);

    // Handle not connected errors
    if (error.message.includes('HUE_NOT_CONNECTED')) {
      return NextResponse.json({
        error: 'NOT_CONNECTED',
        message: 'Hue not connected. Connect locally or enable remote access.',
        reconnect: true,
      }, { status: 401 });
    }

    // Handle network timeout (local API)
    if (error.message === 'NETWORK_TIMEOUT') {
      return NextResponse.json({
        error: 'NOT_ON_LOCAL_NETWORK',
        message: 'Bridge Hue non raggiungibile. Assicurati di essere sulla stessa rete locale del bridge.',
        reconnect: false,
      }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
