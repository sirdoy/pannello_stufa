/**
 * Philips Hue Disconnect Route
 * Clear all Hue data from Firebase
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import { clearHueConnection } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export const POST = auth0.withApiAuthRequired(async function handler(request) {
  try {
    await clearHueConnection();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Hue disconnect error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
