/**
 * Philips Hue Connection Status Route
 * Check if Hue is connected and return connection info
 */

import { NextResponse } from 'next/server';
import { getHueStatus } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export async function GET() {
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
}
