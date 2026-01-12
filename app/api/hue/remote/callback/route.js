/**
 * Hue Remote API - OAuth Callback Endpoint
 * Receives authorization code and exchanges for tokens
 */

import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { ref, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import {
  exchangeCodeForTokens,
  saveRemoteTokens,
  setConnectionMode,
} from '@/lib/hue/hueRemoteTokenHelper';
import { hasRemoteTokens } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check Auth0 authentication
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(new URL('/?error=missing_params', request.url));
    }

    // Validate state (CSRF protection)
    const stateRef = ref(db, getEnvironmentPath(`hue_oauth_state/${session.user.sub}`));
    const stateSnapshot = await get(stateRef);

    if (!stateSnapshot.exists()) {
      return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
    }

    const savedState = stateSnapshot.val();

    if (savedState.state !== state) {
      // Clean up invalid state
      await remove(stateRef);
      return NextResponse.redirect(new URL('/?error=state_mismatch', request.url));
    }

    // Check state expiration (10 minutes)
    const expiresAt = new Date(savedState.expires_at);
    if (expiresAt < new Date()) {
      await remove(stateRef);
      return NextResponse.redirect(new URL('/?error=state_expired', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save refresh token to Firebase
    await saveRemoteTokens(tokens.refresh_token);

    // Determine connection mode (hybrid if local exists, remote otherwise)
    const hasLocal = await hasRemoteTokens(); // This will be true if we just saved tokens
    const connectionMode = hasLocal ? 'hybrid' : 'remote';
    await setConnectionMode(connectionMode);

    // Clean up state
    await remove(stateRef);

    // Redirect to home with success message
    return NextResponse.redirect(new URL('/?hue_remote=connected', request.url));
  } catch (error) {
    console.error('❌ Hue OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=oauth_failed&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
