/**
 * Hue Connection Strategy
 * Selects between Local API (fast, same network) and Remote API (cloud, anywhere)
 * Priority: Local first, then Remote fallback
 */

import https from 'https';
import HueApi from './hueApi';
import HueRemoteApi from './hueRemoteApi';
import { getHueConnection, getUsername, hasRemoteTokens, type ConnectionMode } from './hueLocalHelper';
import { getValidRemoteAccessToken, setConnectionMode } from './hueRemoteTokenHelper';

/**
 * Check if local bridge is reachable
 * Uses https module with rejectUnauthorized: false for self-signed certs
 * @param bridgeIp - Bridge IP address
 * @param timeout - Timeout in milliseconds (default: 2000)
 * @returns True if bridge is reachable
 */
async function checkLocalBridge(bridgeIp: string, timeout = 2000): Promise<boolean> {
  if (!bridgeIp) return false;

  return new Promise((resolve) => {
    const req = https.request({
      hostname: bridgeIp,
      port: 443,
      path: '/clip/v2/resource/bridge',
      method: 'GET',
      timeout,
      rejectUnauthorized: false, // Bridge uses self-signed certificate
    }, (res) => {
      // Bridge is reachable if we get any response (200, 403, etc.)
      resolve(res.statusCode === 200 || res.statusCode === 403);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.end();
  });
}

/**
 * Determine current connection mode based on availability
 * @returns Connection mode
 */
export async function determineConnectionMode(): Promise<ConnectionMode> {
  try {
    const connection = await getHueConnection();
    const hasLocal = !!connection?.bridgeIp && !!connection?.username;
    const hasRemote = await hasRemoteTokens();

    if (!hasLocal && !hasRemote) {
      return 'disconnected';
    }

    if (hasLocal && hasRemote) {
      // Check if local is actually reachable
      const isLocalReachable = await checkLocalBridge(connection.bridgeIp);
      if (isLocalReachable) {
        return 'hybrid'; // Both available, local preferred
      }
      return 'remote'; // Local configured but not reachable, use remote
    }

    if (hasLocal) {
      return 'local';
    }

    return 'remote';
  } catch (error) {
    console.error('❌ Error determining connection mode:', error);
    return 'disconnected';
  }
}

/**
 * Hue Connection Strategy
 * Selects and returns appropriate provider (Local or Remote)
 */
export class HueConnectionStrategy {
  /**
   * Get provider based on availability (priority: local > remote)
   * @returns Hue API provider instance
   * @throws Error if no connection available
   */
  static async getProvider(): Promise<HueApi | HueRemoteApi> {
    try {
      // Try local first (fastest, no rate limits)
      const localConnection = await getHueConnection();

      if (localConnection?.bridgeIp && localConnection?.username) {
        const isLocalReachable = await checkLocalBridge(localConnection.bridgeIp);

        if (isLocalReachable) {
          // Update connection mode (don't await, don't block)
          const hasRemote = await hasRemoteTokens();
          setConnectionMode(hasRemote ? 'hybrid' : 'local').catch(() => {});

          return new HueApi(localConnection.bridgeIp, localConnection.username);
        }
      }

      // Local not available, try remote
      const hasRemote = await hasRemoteTokens();

      if (hasRemote) {
        const username = await getUsername();
        if (!username) {
          throw new Error('HUE_NO_USERNAME: Remote API requires bridge username from local pairing');
        }

        const { accessToken, error, message } = await getValidRemoteAccessToken();
        if (error || !accessToken) {
          throw new Error(`HUE_REMOTE_AUTH_FAILED: ${error || 'No access token'}${message ? ` - ${message}` : ''}`);
        }

        // Update connection mode (don't await, don't block)
        setConnectionMode('remote').catch(() => {});

        return new HueRemoteApi(username, accessToken);
      }

      // Neither local nor remote available
      throw new Error('HUE_NOT_CONNECTED: No Hue connection available (local or remote)');
    } catch (error) {
      console.error('❌ [Hue Strategy] Error:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get provider with explicit mode (for testing or manual override)
   * @param mode - 'local' or 'remote'
   * @returns Hue API provider instance
   */
  static async getProviderForMode(mode: 'local' | 'remote'): Promise<HueApi | HueRemoteApi> {
    if (mode === 'local') {
      const localConnection = await getHueConnection();
      if (!localConnection?.bridgeIp || !localConnection?.username) {
        throw new Error('HUE_LOCAL_NOT_CONFIGURED');
      }
      return new HueApi(localConnection.bridgeIp, localConnection.username);
    }

    if (mode === 'remote') {
      const username = await getUsername();
      if (!username) {
        throw new Error('HUE_NO_USERNAME');
      }

      const { accessToken, error } = await getValidRemoteAccessToken();
      if (error || !accessToken) {
        throw new Error(`HUE_REMOTE_AUTH_FAILED: ${error}`);
      }

      return new HueRemoteApi(username, accessToken);
    }

    throw new Error(`Invalid mode: ${mode}`);
  }
}

export default HueConnectionStrategy;
