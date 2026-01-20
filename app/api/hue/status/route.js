/**
 * Philips Hue Connection Status Route
 * Check if Hue is connected and return connection info
 * Includes both local and remote connection status
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHueStatus, hasRemoteTokens } from '@/lib/hue/hueLocalHelper';
import { determineConnectionMode } from '@/lib/hue/hueConnectionStrategy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const localStatus = await getHueStatus();
  const hasRemote = await hasRemoteTokens();
  const connectionMode = await determineConnectionMode();

  return success({
    ...localStatus,
    connection_mode: connectionMode,
    local_connected: localStatus.connected,
    remote_connected: hasRemote,
  });
}, 'Hue/Status');
