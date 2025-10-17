// ✅ File: app/api/netatmo/callback/route.js

import { saveRefreshToken } from '@/lib/netatmoTokenHelper';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('❌ OAuth callback: missing authorization code');
    return Response.redirect(`${origin}/netatmo?error=missing_code`, 302);
  }

  try {
    // Exchange authorization code for tokens
    const res = await fetch('https://api.netatmo.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NETATMO_CLIENT_ID,
        client_secret: process.env.NETATMO_CLIENT_SECRET,
        code,
        redirect_uri: process.env.NETATMO_REDIRECT_URI,
      }),
    });

    const json = await res.json();

    // Handle Netatmo API errors
    if (json.error) {
      console.error('❌ Netatmo OAuth error:', json);
      return Response.redirect(
        `${origin}/netatmo?error=${encodeURIComponent(json.error_description || json.error)}`,
        302
      );
    }

    if (!json.refresh_token) {
      console.error('❌ No refresh_token received:', json);
      return Response.redirect(`${origin}/netatmo?error=no_token`, 302);
    }

    // ✅ Save refresh token to Firebase using centralized helper
    // Wait for Firebase write to complete before redirecting
    await saveRefreshToken(json.refresh_token);

    // ✅ Redirect to success page (dynamic origin, not hardcoded)
    return Response.redirect(`${origin}/netatmo/authorized`, 302);
  } catch (err) {
    console.error('❌ OAuth callback error:', err);
    return Response.redirect(
      `${origin}/netatmo?error=${encodeURIComponent(err.message)}`,
      302
    );
  }
}
