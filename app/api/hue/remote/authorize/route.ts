/**
 * Hue Remote API - OAuth Authorization Endpoint
 * Initiates OAuth 2.0 flow by redirecting user to Philips Hue authorization page
 * Note: Uses withAuth manually since it needs session before redirect
 */

import { NextResponse } from 'next/server';
import { withErrorHandler, unauthorized, redirect } from '@/lib/core';
import { auth0 } from '@/lib/auth0';
import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request) => {

  // Check Auth0 authentication
  const session = await auth0.getSession();
  if (!session?.user) {
    return unauthorized();
  }

  // Check required env variables
  const clientId = process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
  const appId = process.env.NEXT_PUBLIC_HUE_APP_ID;

  if (!clientId || !appId) {
    console.error('❌ [Hue OAuth] Missing required env variables');
    return NextResponse.redirect(new URL('/?error=hue_config_missing', request.url));
  }

  // Generate random state for CSRF protection (Web Crypto API)
  const state = Array.from(
    globalThis.crypto.getRandomValues(new Uint8Array(32)),
    (byte) => byte.toString(16).padStart(2, '0')
  ).join('');

  // Save state to Firebase for validation in callback
  // Use state value as key to prevent overwrites from multiple OAuth flows
  const sanitizedUserId = session.user.sub.replace(/[.#$/\[\]|]/g, '_');
  const envPath = getEnvironmentPath(`hue_oauth_state/${state}`);
  const stateRef = ref(db, envPath);
  await set(stateRef, {
    user_id: sanitizedUserId,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
  });

  // Build redirect URI (dynamically based on request URL)
  const baseUrl = new URL(request.url);
  const redirectUri = `${baseUrl.protocol}//${baseUrl.host}/api/hue/remote/callback`;

  // Build Philips Hue authorization URL (v1 API uses /oauth2/auth)
  const authUrl = new URL('https://api.meethue.com/oauth2/auth');
  authUrl.searchParams.set('clientid', clientId);
  authUrl.searchParams.set('appid', appId);
  authUrl.searchParams.set('deviceid', 'pannello-stufa-device');
  authUrl.searchParams.set('devicename', 'Pannello Stufa PWA');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);


  // Redirect to Philips Hue OAuth
  return NextResponse.redirect(authUrl.toString());
}, 'Hue/Remote/Authorize');
