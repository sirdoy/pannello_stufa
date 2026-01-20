/**
 * Philips Hue Disconnect Route
 * Clear all Hue data from Firebase
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { clearHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async () => {
  await clearHueConnection();
  return success({});
}, 'Hue/Disconnect');
