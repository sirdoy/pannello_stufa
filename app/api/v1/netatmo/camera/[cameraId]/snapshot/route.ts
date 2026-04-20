import { withAuthAndErrorHandler, getPathParam } from '@/lib/core';
import { getProxyCameraSnapshot } from '@/lib/netatmo/netatmoProxy';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/netatmo/camera/[cameraId]/snapshot
 * Redirects (302) to the live Netatmo CDN snapshot URL so <img src=...> consumers
 * render the JPEG directly. This preserves the legacy camera snapshot behavior
 * (Phase 168 Q3 decision — keep <img> compatibility without forcing a consumer rewrite).
 *
 * Protected: Requires Auth0 authentication (auth gate runs before the redirect).
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const { snapshot_url } = await getProxyCameraSnapshot(cameraId);
  return NextResponse.redirect(snapshot_url, {
    status: 302,
    headers: {
      // No-cache on the redirect itself — snapshot URL changes each poll cycle.
      'Cache-Control': 'no-cache, no-store',
    },
  });
}, 'Netatmo/Camera/Snapshot');
