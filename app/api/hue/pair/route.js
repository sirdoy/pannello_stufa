/**
 * Philips Hue Bridge Pairing Route
 * Create application key (requires link button press within 30 seconds)
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import { createApplicationKey } from '@/lib/hue/hueApi';
import { saveHueConnection } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { bridgeIp, bridgeId } = await request.json();

    if (!bridgeIp) {
      return NextResponse.json(
        { error: 'Bridge IP required' },
        { status: 400 }
      );
    }

    // Create application key (requires link button press)
    const result = await createApplicationKey(bridgeIp);

    // Save to Firebase
    await saveHueConnection(
      bridgeIp,
      result.username,
      result.clientkey,
      bridgeId
    );

    return NextResponse.json({
      success: true,
      username: result.username,
    });

  } catch (error) {
    console.error('❌ Pairing error:', error);

    if (error.message === 'LINK_BUTTON_NOT_PRESSED') {
      return NextResponse.json({
        success: false,
        error: 'LINK_BUTTON_NOT_PRESSED',
        message: 'Premi il pulsante sul bridge entro 30 secondi',
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
