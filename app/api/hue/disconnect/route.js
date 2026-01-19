/**
 * Philips Hue Disconnect Route
 * Clear all Hue data from Firebase
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import { clearHueConnection } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    await clearHueConnection();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Hue disconnect error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
