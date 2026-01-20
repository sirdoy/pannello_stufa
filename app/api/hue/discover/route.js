/**
 * Philips Hue Bridge Discovery Route
 * Discover Hue bridges on the local network
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { discoverBridges } from '@/lib/hue/hueApi';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const bridges = await discoverBridges();

  return success({
    bridges, // Array of {id, internalipaddress}
  });
}, 'Hue/Discover');
