import { withErrorHandler, redirect } from '@/lib/core';
import { saveRefreshToken } from '@/lib/netatmoTokenHelper';
import { getNetatmoCredentials } from '@/lib/netatmoCredentials';

export const dynamic = 'force-dynamic';

interface NetatmoTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

/**
 * GET /api/netatmo/callback
 * OAuth callback handler for Netatmo authorization
 * Note: No auth middleware - this validates OAuth tokens directly
 */
export const GET = withErrorHandler(async (request: any, _context: any): Promise<any> => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    console.error('OAuth callback: missing authorization code');
    return redirect(`${origin}/netatmo?error=missing_code`);
  }

  // Get environment-specific credentials
  const credentials = getNetatmoCredentials();

  // Exchange authorization code for tokens
  const res = await fetch('https://api.netatmo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      redirect_uri: credentials.redirectUri,
    }),
  });

  const json = await res.json() as NetatmoTokenResponse;

  // Handle Netatmo API errors
  if (json.error) {
    console.error('Netatmo OAuth error:', json);
    return redirect(
      `${origin}/netatmo?error=${encodeURIComponent(json.error_description || json.error)}`
    );
  }

  if (!json.refresh_token) {
    console.error('No refresh_token received:', json);
    return redirect(`${origin}/netatmo?error=no_token`);
  }

  // Save refresh token to Firebase using centralized helper
  // Wait for Firebase write to complete before redirecting
  await saveRefreshToken(json.refresh_token);

  // Redirect to success page (dynamic origin, not hardcoded)
  return redirect(`${origin}/netatmo/authorized`);
}, 'Netatmo/Callback');
