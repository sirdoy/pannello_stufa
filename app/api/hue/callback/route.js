/**
 * Philips Hue OAuth Callback Route
 * Handles OAuth authorization code exchange
 */

import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/hue/hueApi';
import { saveInitialTokens } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('❌ Hue OAuth error:', error);
      return NextResponse.redirect(new URL(`/lights?error=${error}`, request.url));
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      code,
      process.env.HUE_CLIENT_ID,
      process.env.HUE_CLIENT_SECRET,
      process.env.HUE_REDIRECT_URI
    );

    // Save tokens to Firebase
    await saveInitialTokens(
      tokens.access_token,
      tokens.refresh_token,
      'hue_user' // Default username, could be fetched from /resource/bridge
    );

    // Redirect to authorized page
    return NextResponse.redirect(new URL('/lights/authorized', request.url));

  } catch (error) {
    console.error('❌ Hue callback error:', error);
    return NextResponse.redirect(
      new URL(`/lights?error=callback_failed&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
