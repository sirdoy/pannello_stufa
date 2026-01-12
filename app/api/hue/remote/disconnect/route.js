/**
 * Hue Remote API - Disconnect Endpoint
 * Removes OAuth tokens (logout from remote access)
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { clearRemoteTokens } from '@/lib/hue/hueRemoteTokenHelper';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Check Auth0 authentication
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear remote tokens
    await clearRemoteTokens();

    // Check if local connection still exists
    const localConnection = await getHueConnection();
    const hasLocal = !!localConnection?.bridgeIp && !!localConnection?.username;

    return NextResponse.json({
      success: true,
      message: 'Hue Remote disconnected successfully',
      connection_mode: hasLocal ? 'local' : 'disconnected',
    });
  } catch (error) {
    console.error('❌ Hue Remote disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Hue Remote', message: error.message },
      { status: 500 }
    );
  }
}
