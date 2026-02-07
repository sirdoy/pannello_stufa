/**
 * Philips Hue Connection Status Route
 * Check if Hue is connected and return connection info
 * Includes both local and remote connection status
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHueStatus, hasRemoteTokens, getUsername } from '@/lib/hue/hueLocalHelper';
import { determineConnectionMode } from '@/lib/hue/hueConnectionStrategy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const localStatus = await getHueStatus();
  const hasRemote = await hasRemoteTokens();
  const connectionMode = await determineConnectionMode();
  const username = await getUsername();

  // Connected if we have username AND (local bridge OR remote tokens)
  // Remote pairing creates username without bridge_ip
  const hasUsername = !!username;
  const connected = hasUsername && (localStatus.connected || hasRemote);

  return success({
    ...localStatus,
    connected, // Override with combined status
    connection_mode: connectionMode,
    local_connected: localStatus.connected,
    remote_connected: hasRemote,
    has_username: hasUsername,
  });
}, 'Hue/Status');
