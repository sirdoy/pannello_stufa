/**
 * Philips Hue Connection Status Route
 * Check if Hue is connected and return connection info
 * Includes both local and remote connection status
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import { getHueStatus, getConnectionMode, hasRemoteTokens } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';
import { determineConnectionMode } from '@/lib/hue/hueConnectionStrategy';

export const dynamic = 'force-dynamic';

export const GET = auth0.withApiAuthRequired(async function handler(request) {
  try {
    const localStatus = await getHueStatus();
    const hasRemote = await hasRemoteTokens();
    const connectionMode = await determineConnectionMode();

    return NextResponse.json({
      ...localStatus,
      connection_mode: connectionMode,
      local_connected: localStatus.connected,
      remote_connected: hasRemote,
    });
  } catch (error) {
    console.error('❌ Hue status error:', error);
    return NextResponse.json(
      { error: error.message, connected: false, connection_mode: 'disconnected' },
      { status: 500 }
    );
  }
});
