/**
 * Philips Hue Bridge Discovery Route
 * Discover Hue bridges on the local network
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import { discoverBridges } from '@/lib/hue/hueApi';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const bridges = await discoverBridges();

    return NextResponse.json({
      success: true,
      bridges, // Array of {id, internalipaddress}
    });

  } catch (error) {
    console.error('❌ Bridge discovery error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        bridges: [],
      },
      { status: 500 }
    );
  }
}
