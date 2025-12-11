/**
 * Philips Hue Connection Status Route
 * Check if Hue is connected and return connection info
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import { getHueStatus } from '@/lib/hue/hueTokenHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export const GET = auth0.withApiAuthRequired(async function handler(request) {
  try {
    const status = await getHueStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('❌ Hue status error:', error);
    return NextResponse.json(
      { error: error.message, connected: false },
      { status: 500 }
    );
  }
});
