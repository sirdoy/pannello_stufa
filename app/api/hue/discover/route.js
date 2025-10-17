/**
 * Philips Hue Bridge Discovery Route
 * Find Hue bridges on network using Philips discovery service
 */

import { NextResponse } from 'next/server';
import { discoverBridges } from '@/lib/hue/hueApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bridges = await discoverBridges();

    console.log('🔍 Discovered bridges:', JSON.stringify(bridges, null, 2));

    if (!bridges || bridges.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_BRIDGES_FOUND',
        message: 'Nessun bridge Hue trovato sulla rete',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bridges,
    });

  } catch (error) {
    console.error('❌ Bridge discovery error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
