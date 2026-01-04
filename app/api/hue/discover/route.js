/**
 * Philips Hue Bridge Discovery Route
 * Discover Hue bridges on the local network
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import { discoverBridges } from '@/lib/hue/hueApi';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export const GET = auth0.withApiAuthRequired(async function handler(request) {
  try {
    console.log('🔍 Discovering Hue bridges...');

    const bridges = await discoverBridges();

    console.log(`✅ Found ${bridges.length} bridge(s):`, bridges);

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
});
