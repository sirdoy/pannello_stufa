/**
 * Philips Hue Disconnect Route
 * Clear all Hue data from Firebase
 */

import { NextResponse } from 'next/server';
import { clearHueData } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await clearHueData();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Hue disconnect error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
