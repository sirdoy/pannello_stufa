/**
 * Hue Remote API - OAuth Authorization Endpoint
 * Initiates OAuth 2.0 flow by redirecting user to Philips Hue authorization page
 */

import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check Auth0 authentication
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Save state to Firebase for validation in callback
    const stateRef = ref(db, getEnvironmentPath(`hue_oauth_state/${session.user.sub}`));
    await set(stateRef, {
      state,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    // Build redirect URI (dynamically based on request URL)
    const baseUrl = new URL(request.url);
    const redirectUri = `${baseUrl.protocol}//${baseUrl.host}/api/hue/remote/callback`;

    // Build Philips Hue authorization URL (v1 API uses /oauth2/auth)
    const authUrl = new URL('https://api.meethue.com/oauth2/auth');
    authUrl.searchParams.set('clientid', process.env.NEXT_PUBLIC_HUE_CLIENT_ID);
    authUrl.searchParams.set('appid', process.env.NEXT_PUBLIC_HUE_APP_ID);
    authUrl.searchParams.set('deviceid', 'pannello-stufa-device');
    authUrl.searchParams.set('devicename', 'Pannello Stufa PWA');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    // Redirect to Philips Hue OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('❌ Hue OAuth authorize error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow', message: error.message },
      { status: 500 }
    );
  }
}
