/**
 * API Route: Sonos Devices List — deprecated alias of /api/v1/sonos/speakers (ROADMAP T6)
 *
 * GET /api/v1/sonos/devices
 *
 * Kept for clients still running an older bundle: same data as /speakers with the
 * speaker array renamed `devices`. Remove together with the backend /devices alias.
 *
 * Protected: Requires an authenticated session
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSpeakers } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const { speakers, ...rest } = await getSpeakers();
  return success({ devices: speakers, ...rest });
}, 'Sonos/Devices');
