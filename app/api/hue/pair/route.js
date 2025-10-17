/**
 * Philips Hue Bridge Pairing Route
 * Create application key (requires link button press within 30 seconds)
 */

import { NextResponse } from 'next/server';
import { createApplicationKey } from '@/lib/hue/hueApi';
import { saveHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { bridgeIp, bridgeId } = await request.json();

    if (!bridgeIp) {
      return NextResponse.json(
        { error: 'Bridge IP required' },
        { status: 400 }
      );
    }

    console.log('🔗 Attempting to pair with bridge:', bridgeIp);

    // Create application key (requires link button press)
    const result = await createApplicationKey(bridgeIp);

    console.log('✅ Pairing successful:', {
      username: result.username,
      hasClientkey: !!result.clientkey,
    });

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
