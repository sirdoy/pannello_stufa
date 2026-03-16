import { withAuthAndErrorHandler, badRequest, parseQuery } from '@/lib/core';
import { getProxyCameraSnapshot } from '@/lib/netatmoProxy';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/snapshot?cameraId=<id>
 * Redirects to the live camera snapshot URL from the Netatmo CDN.
 *
 * Performs an auth-gated redirect: verifies the session server-side, then
 * issues a 302 redirect to the Netatmo VPN snapshot URL. The browser follows
 * the redirect and loads the image directly from the CDN.
 *
 * This is more resilient than server-side proxying because:
 * - No dependency on the Next.js server's network access to v.netatmo.com
 * - The browser can access the CDN URL regardless of server network topology
 * - <img> tags follow redirects natively
 *
 * Protected: Requires Auth0 authentication
 *
 * Uses query parameter instead of path segment to avoid Turbopack routing issues
 * with MAC address IDs that contain colons (e.g., 70:ee:50:3b:1f:4f).
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const cameraId = parseQuery(request).get('cameraId');

  if (!cameraId) {
    return badRequest('Parametro cameraId mancante');
  }

  // Get the snapshot URL from the proxy (JSON response with snapshot_url field)
  const { snapshot_url } = await getProxyCameraSnapshot(cameraId);

  // Redirect browser to the Netatmo CDN URL — browser follows the redirect and
  // loads the JPEG directly. This avoids server-side CDN access requirements.
  return NextResponse.redirect(snapshot_url, {
    status: 302,
    headers: {
      // No-cache on the redirect itself — snapshot URL changes each poll cycle
      'Cache-Control': 'no-cache, no-store',
    },
  });
}, 'Netatmo/CameraSnapshot');
