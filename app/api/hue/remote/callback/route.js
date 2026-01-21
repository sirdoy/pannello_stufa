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
  console.log('🔐 [Hue OAuth Callback] Received callback...');

  // Check Auth0 authentication
  const session = await auth0.getSession();
  if (!session?.user) {
    console.log('❌ [Hue OAuth Callback] No session found');
    return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
  }
  console.log('✅ [Hue OAuth Callback] User authenticated:', session.user.sub);

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

  console.log('📥 [Hue OAuth Callback] Code received:', code ? '✅ present' : '❌ missing');
  console.log('📥 [Hue OAuth Callback] State received:', state ? '✅ present' : '❌ missing');

  // Validate required parameters
  if (!code || !state) {
    console.error('❌ [Hue OAuth Callback] Missing code or state');
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  // Validate state (CSRF protection)
  // Sanitize user ID for Firebase path (replace special chars like | with _)
  const sanitizedUserId = session.user.sub.replace(/[.#$/\[\]|]/g, '_');
  const envPath = getEnvironmentPath(`hue_oauth_state/${sanitizedUserId}`);
  console.log('🔍 [Hue OAuth Callback] Looking for state at:', envPath);
  const stateRef = ref(db, envPath);
  const stateSnapshot = await get(stateRef);

  if (!stateSnapshot.exists()) {
    console.error('❌ [Hue OAuth Callback] State not found in Firebase');
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
  }

  const savedState = stateSnapshot.val();
  console.log('✅ [Hue OAuth Callback] State found in Firebase');
  console.log('🔍 [Hue OAuth Callback] Expected state:', savedState.state?.substring(0, 16) + '...');
  console.log('🔍 [Hue OAuth Callback] Received state:', state?.substring(0, 16) + '...');

  if (savedState.state !== state) {
    console.error('❌ [Hue OAuth Callback] State mismatch - possible double-click or expired auth');
    // Clean up invalid state
    await remove(stateRef);
    return NextResponse.redirect(new URL('/?error=state_mismatch', request.url));
  }

  // Check state expiration (10 minutes)
  const expiresAt = new Date(savedState.expires_at);
  if (expiresAt < new Date()) {
    console.error('❌ [Hue OAuth Callback] State expired');
    await remove(stateRef);
    return NextResponse.redirect(new URL('/?error=state_expired', request.url));
  }

  console.log('✅ [Hue OAuth Callback] State validated, exchanging code for tokens...');

  // Exchange code for tokens
  try {
    const tokens = await exchangeCodeForTokens(code);
    console.log('✅ [Hue OAuth Callback] Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Save refresh token to Firebase
    await saveRemoteTokens(tokens.refresh_token);
    console.log('✅ [Hue OAuth Callback] Tokens saved to Firebase');

    // Determine connection mode (hybrid if local exists, remote otherwise)
    const localConnection = await getHueConnection();
    const hasLocal = !!localConnection?.bridgeIp && !!localConnection?.username;
    const connectionMode = hasLocal ? 'hybrid' : 'remote';
    await setConnectionMode(connectionMode);
    console.log('✅ [Hue OAuth Callback] Connection mode set to:', connectionMode);

    // Clean up state
    await remove(stateRef);
    console.log('🎉 [Hue OAuth Callback] OAuth flow completed successfully!');

    // Redirect to home with success message
    return NextResponse.redirect(new URL('/?hue_remote=connected', request.url));
  } catch (tokenError) {
    console.error('❌ [Hue OAuth Callback] Token exchange failed:', tokenError.message);
    await remove(stateRef);
    return NextResponse.redirect(new URL(`/?error=token_exchange_failed&desc=${encodeURIComponent(tokenError.message)}`, request.url));
  }
}, 'Hue/Remote/Callback');
