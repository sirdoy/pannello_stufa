/**
 * Hue Remote API - Disconnect Endpoint
 * Removes OAuth tokens (logout from remote access)
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { clearRemoteTokens } from '@/lib/hue/hueRemoteTokenHelper';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async () => {
  // Clear remote tokens
  await clearRemoteTokens();

  // Check if local connection still exists
  const localConnection = await getHueConnection();
  const hasLocal = !!localConnection?.bridgeIp && !!localConnection?.username;

  return success({
    message: 'Hue Remote disconnected successfully',
    connection_mode: hasLocal ? 'local' : 'disconnected',
  });
}, 'Hue/Remote/Disconnect');
