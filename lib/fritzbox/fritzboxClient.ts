/**
 * Fritz!Box Client
 *
 * Handles communication with Fritz!Box TR-064 API
 * - Basic authentication with credentials from environment
 * - Timeout handling (15s default, 10s for health checks)
 * - TR-064 error detection (403 status)
 * - Configuration validation
 */

import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

// Read Fritz!Box credentials from environment at module scope
const FRITZBOX_URL = process.env.FRITZBOX_URL;
const FRITZBOX_USER = process.env.FRITZBOX_USER;
const FRITZBOX_PASSWORD = process.env.FRITZBOX_PASSWORD;

/**
 * Fritz!Box API Client
 * Singleton class for Fritz!Box TR-064 API communication
 */
class FritzBoxClient {
  /**
   * Make authenticated request to Fritz!Box API
   * @param endpoint - API endpoint path
   * @param timeout - Request timeout in milliseconds (default: 15s)
   * @returns Response data as JSON
   */
  private async request(endpoint: string, timeout = 15000): Promise<unknown> {
    // Validate configuration
    if (!FRITZBOX_URL || !FRITZBOX_USER || !FRITZBOX_PASSWORD) {
      throw ApiError.fritzboxNotConfigured();
    }

    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Create Basic Auth header
      const credentials = Buffer.from(`${FRITZBOX_USER}:${FRITZBOX_PASSWORD}`).toString('base64');

      const response = await fetch(`${FRITZBOX_URL}${endpoint}`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle TR-064 not enabled (403)
      if (response.status === 403) {
        throw ApiError.tr064NotEnabled({
          setupGuideUrl: '/docs/fritzbox-setup',
          tr064Enabled: false,
        });
      }

      // Handle other errors
      if (!response.ok) {
        throw new ApiError(
          ERROR_CODES.EXTERNAL_API_ERROR,
          `Fritz!Box API error: ${response.statusText}`,
          HTTP_STATUS.BAD_GATEWAY
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw ApiError.fritzboxTimeout();
      }

      // Re-throw ApiErrors as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Wrap other errors
      throw new ApiError(
        ERROR_CODES.EXTERNAL_API_ERROR,
        `Fritz!Box request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HTTP_STATUS.BAD_GATEWAY
      );
    }
  }

  /**
   * Ping Fritz!Box API to check connectivity
   * @returns Health check response
   */
  async ping(): Promise<unknown> {
    return this.request('/api/v1/health', 10000);
  }

  /**
   * Get network devices connected to Fritz!Box
   * @returns List of network devices
   */
  async getDevices(): Promise<unknown> {
    return this.request('/api/v1/devices');
  }

  /**
   * Get bandwidth usage statistics
   * @returns Bandwidth data
   */
  async getBandwidth(): Promise<unknown> {
    return this.request('/api/v1/bandwidth');
  }

  /**
   * Get WAN connection status
   * @returns WAN status information
   */
  async getWanStatus(): Promise<unknown> {
    return this.request('/api/v1/wan');
  }
}

/**
 * Singleton instance of FritzBoxClient
 * Used throughout the application for Fritz!Box API calls
 */
export const fritzboxClient = new FritzBoxClient();
