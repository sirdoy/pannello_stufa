/**
 * Hue Remote API - OAuth Callback Endpoint
 * Receives authorization code and exchanges for tokens
 * Note: Uses withErrorHandler only since redirects handle auth errors
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/core';
import { auth0 } from '@/lib/auth0';
import { ref, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import {
  exchangeCodeForTokens,
  saveRemoteTokens,
  setConnectionMode,
} from '@/lib/hue/hueRemoteTokenHelper';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request) => {

  // Check Auth0 authentication
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Check for OAuth error from Philips
  if (error) {
    console.error('❌ [Hue OAuth Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(new URL(`/?error=hue_oauth_error&desc=${encodeURIComponent(errorDescription || error)}`, request.url));
  }


  // Validate required parameters
  if (!code || !state) {
    console.error('❌ [Hue OAuth Callback] Missing code or state');
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  // Validate state (CSRF protection)
  // State is stored with itself as key, so we can look it up directly
  const envPath = getEnvironmentPath(`hue_oauth_state/${state}`);
  const stateRef = ref(db, envPath);
  const stateSnapshot = await get(stateRef);

  if (!stateSnapshot.exists()) {
    console.error('❌ [Hue OAuth Callback] State not found in Firebase - may have been used or expired');
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
  }

  const savedState = stateSnapshot.val();

  // Verify the state belongs to this user (CSRF protection)
  const sanitizedUserId = session.user.sub.replace(/[.#$/\[\]|]/g, '_');
  if (savedState.user_id !== sanitizedUserId) {
    console.error('❌ [Hue OAuth Callback] State belongs to different user');
    await remove(stateRef);
    return NextResponse.redirect(new URL('/?error=state_user_mismatch', request.url));
  }

  // Check state expiration (10 minutes)
  const expiresAt = new Date(savedState.expires_at);
  if (expiresAt < new Date()) {
    console.error('❌ [Hue OAuth Callback] State expired');
    await remove(stateRef);
    return NextResponse.redirect(new URL('/?error=state_expired', request.url));
  }


  // Exchange code for tokens
  try {
    const tokens = await exchangeCodeForTokens(code);

    // Save refresh token to Firebase
    await saveRemoteTokens(tokens.refresh_token);

    // Determine connection mode (hybrid if local exists, remote otherwise)
    const localConnection = await getHueConnection();
    const hasLocal = !!localConnection?.bridgeIp && !!localConnection?.username;
    const connectionMode = hasLocal ? 'hybrid' : 'remote';
    await setConnectionMode(connectionMode);

    // Clean up state
    await remove(stateRef);

    // Redirect to home with success message
    return NextResponse.redirect(new URL('/?hue_remote=connected', request.url));
  } catch (tokenError: unknown) {
    const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error';
    console.error('❌ [Hue OAuth Callback] Token exchange failed:', errorMessage);
    await remove(stateRef);
    return NextResponse.redirect(new URL(`/?error=token_exchange_failed&desc=${encodeURIComponent(errorMessage)}`, request.url));
  }
}, 'Hue/Remote/Callback');
