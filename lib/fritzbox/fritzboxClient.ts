/**
 * Fritz!Box Client
 *
 * Handles communication with HomeAssistant Network API
 * - JWT authentication with auto-login and token caching
 * - Timeout handling (15s default, 10s for health checks)
 * - Response transformation to internal types
 * - Configuration validation
 *
 * Endpoints used (generic, not fritzbox-specific namespace):
 *   /health          - No auth
 *   /api/v1/devices  - JWT required
 *   /api/v1/bandwidth - JWT required
 *   /api/v1/wan      - JWT required
 */

import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

// Read API credentials from environment at module scope
const API_URL = process.env.HOMEASSISTANT_API_URL;
const API_USER = process.env.HOMEASSISTANT_USER;
const API_PASSWORD = process.env.HOMEASSISTANT_PASSWORD;

// JWT token cache (in-memory, module scope)
let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * Fritz!Box API Client
 * Singleton class for HomeAssistant Network API communication
 */
class FritzBoxClient {
  /**
   * Get a valid JWT token, logging in if needed
   */
  private async getToken(): Promise<string> {
    // Return cached token if still valid (with 60s margin)
    if (cachedToken && Date.now() < tokenExpiry - 60_000) {
      return cachedToken;
    }

    if (!API_URL || !API_USER || !API_PASSWORD) {
      throw ApiError.fritzboxNotConfigured();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(API_USER)}&password=${encodeURIComponent(API_PASSWORD)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        throw ApiError.fritzboxNotConfigured();
      }

      if (!response.ok) {
        throw new ApiError(
          ERROR_CODES.EXTERNAL_API_ERROR,
          `Login failed: ${response.statusText}`,
          HTTP_STATUS.BAD_GATEWAY
        );
      }

      const data = (await response.json()) as { access_token: string; token_type: string };
      cachedToken = data.access_token;
      // Default JWT expiry: 30 min from now
      tokenExpiry = Date.now() + 30 * 60 * 1000;
      return cachedToken;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw ApiError.fritzboxTimeout();
      }
      throw new ApiError(
        ERROR_CODES.EXTERNAL_API_ERROR,
        `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HTTP_STATUS.BAD_GATEWAY
      );
    }
  }

  /**
   * Make authenticated request to the API
   */
  private async request(
    endpoint: string,
    options: { timeout?: number; requiresAuth?: boolean } = {}
  ): Promise<unknown> {
    const { timeout = 15000, requiresAuth = true } = options;

    if (!API_URL) {
      throw ApiError.fritzboxNotConfigured();
    }

    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {};
      if (requiresAuth) {
        const token = await this.getToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - token expired or invalid, retry once with fresh token
      if (response.status === 401 && requiresAuth) {
        cachedToken = null;
        tokenExpiry = 0;
        const freshToken = await this.getToken();
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${freshToken}` },
        });
        if (!retryResponse.ok) {
          throw ApiError.fritzboxNotConfigured();
        }
        return await retryResponse.json();
      }

      // Handle 503 - service unavailable (router unreachable)
      if (response.status === 503) {
        throw ApiError.fritzboxTimeout();
      }

      // Handle 429 - rate limited by upstream API
      if (response.status === 429) {
        throw new ApiError(
          ERROR_CODES.RATE_LIMITED,
          'Upstream API rate limit exceeded',
          HTTP_STATUS.TOO_MANY_REQUESTS
        );
      }

      // Handle other errors
      if (!response.ok) {
        let detail = response.statusText;
        try {
          const errorBody = (await response.json()) as { detail?: string; error?: { message?: string } };
          if (errorBody.detail) detail = errorBody.detail;
          else if (errorBody.error?.message) detail = errorBody.error.message;
        } catch {
          // ignore parse errors
        }
        throw new ApiError(
          ERROR_CODES.EXTERNAL_API_ERROR,
          `Fritz!Box API error: ${detail}`,
          HTTP_STATUS.BAD_GATEWAY
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw ApiError.fritzboxTimeout();
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        ERROR_CODES.EXTERNAL_API_ERROR,
        `Fritz!Box request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HTTP_STATUS.BAD_GATEWAY
      );
    }
  }

  /**
   * Ping API to check connectivity
   * Uses /health endpoint (no auth required)
   */
  async ping(): Promise<unknown> {
    return this.request('/health', { timeout: 10000, requiresAuth: false });
  }

  /**
   * Get network devices connected to Fritz!Box
   *
   * Raw: { devices: [{ ip, name, mac, status: 0|1 }], is_stale, fetched_at }
   * Returns: array of transformed devices
   */
  async getDevices(): Promise<Array<{ id: string; name: string; ip: string; mac: string; active: boolean }>> {
    const raw = (await this.request('/api/v1/devices')) as {
      devices: Array<{ ip: string; name: string; mac: string; status: number }>;
      is_stale: boolean;
      fetched_at: string;
    };

    return (raw.devices || []).map(d => ({
      id: d.mac || d.ip, // Use MAC as ID, fallback to IP
      name: d.name || d.ip,
      ip: d.ip,
      mac: d.mac,
      active: d.status === 1,
    }));
  }

  /**
   * Get bandwidth usage statistics
   *
   * Raw: { upstream_bps, downstream_bps, bytes_sent, bytes_received, is_stale, fetched_at }
   * Returns: transformed BandwidthData
   */
  async getBandwidth(): Promise<{ download: number; upload: number; timestamp: number }> {
    const raw = (await this.request('/api/v1/bandwidth')) as {
      upstream_bps: number;
      downstream_bps: number;
      is_stale: boolean;
      fetched_at: string;
    };

    return {
      download: raw.downstream_bps / 1_000_000, // bps → Mbps
      upload: raw.upstream_bps / 1_000_000,
      timestamp: new Date(raw.fetched_at).getTime(),
    };
  }

  /**
   * Get historical bandwidth data
   *
   * Raw: { items: [{ timestamp, bytes_sent, bytes_received, upstream_rate, downstream_rate }], total_count, limit, offset }
   * Returns: array of { time, download, upload } points sorted ascending
   */
  async getBandwidthHistory(hours: number = 24): Promise<Array<{ time: number; download: number; upload: number }>> {
    // Fetch all pages
    const limit = 1000;
    let offset = 0;
    const allItems: Array<{ timestamp: number; upstream_rate: number; downstream_rate: number }> = [];

    // First request to get total_count
    const firstPage = (await this.request(`/api/v1/history/bandwidth?hours=${hours}&limit=${limit}&offset=0`)) as {
      items: Array<{ timestamp: number; bytes_sent: number; bytes_received: number; upstream_rate: number; downstream_rate: number }>;
      total_count: number;
      limit: number;
      offset: number;
    };

    allItems.push(...firstPage.items);
    const totalCount = firstPage.total_count;

    // Fetch remaining pages in parallel if needed
    if (totalCount > limit) {
      const remainingPages = [];
      for (offset = limit; offset < totalCount; offset += limit) {
        remainingPages.push(
          this.request(`/api/v1/history/bandwidth?hours=${hours}&limit=${limit}&offset=${offset}`) as Promise<typeof firstPage>
        );
      }
      const pages = await Promise.all(remainingPages);
      for (const page of pages) {
        allItems.push(...page.items);
      }
    }

    // Transform: timestamp (Unix seconds) → ms, rates (bps) → Mbps
    return allItems
      .map(item => ({
        time: item.timestamp * 1000,
        download: item.downstream_rate / 1_000_000,
        upload: item.upstream_rate / 1_000_000,
      }))
      .sort((a, b) => a.time - b.time);
  }

  /**
   * Get WAN connection status
   *
   * Raw: { external_ip, is_connected, is_linked, uptime, max_upstream_bps, max_downstream_bps, ... }
   * Returns: transformed WanData
   */
  async getWanStatus(): Promise<{
    connected: boolean; uptime: number; externalIp?: string; linkSpeed?: number; timestamp: number;
  }> {
    const raw = (await this.request('/api/v1/wan')) as {
      external_ip: string;
      is_connected: boolean;
      is_linked: boolean;
      uptime: number;
      max_downstream_bps: number;
      max_upstream_bps: number;
      is_stale: boolean;
      fetched_at: string;
    };

    return {
      connected: raw.is_connected,
      uptime: raw.uptime,
      externalIp: raw.external_ip || undefined,
      linkSpeed: raw.max_downstream_bps ? raw.max_downstream_bps / 1_000_000 : undefined,
      timestamp: new Date(raw.fetched_at).getTime(),
    };
  }
}

/**
 * Singleton instance of FritzBoxClient
 */
export const fritzboxClient = new FritzBoxClient();
