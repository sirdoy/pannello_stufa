/**
 * Philips Hue Remote API Client (Cloud API v1)
 * Uses OAuth 2.0 for authentication
 * Normalizes v1 responses to match Local API (CLIP v2) format
 *
 * Features:
 * - Automatic token refresh on 401 (handles expired access tokens)
 * - Retries request once after token refresh
 */

import { forceTokenRefresh } from './hueRemoteTokenHelper';

const HUE_REMOTE_BASE_URL = 'https://api.meethue.com';

interface V1Light {
  id: string;
  name?: string;
  state?: {
    on?: boolean;
    bri?: number;
    xy?: [number, number];
    ct?: number;
  };
}

interface V1Group {
  id: string;
  name?: string;
  type?: string;
  lights?: string[];
}

interface V1Scene {
  id: string;
  name?: string;
  group?: string;
}

/**
 * Hue Remote API Client
 * Pattern: Similar to HueApi (local), but uses cloud endpoints
 */
class HueRemoteApi {
  private username: string;
  private accessToken: string;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(username: string, accessToken: string) {
    this.username = username;
    this.accessToken = accessToken;
    this.baseUrl = `${HUE_REMOTE_BASE_URL}/bridge/${username}`;
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Update access token (used after token refresh)
   */
  updateAccessToken(newToken: string): void {
    this.accessToken = newToken;
    this.headers['Authorization'] = `Bearer ${newToken}`;
  }

  async request(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error: { errors?: Array<{ description?: string }>; error_description?: string; message?: string };
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error_description: errorText };
      }

      console.error('❌ [Hue Remote API] Error:', response.status, error.error_description || error.message || errorText);

      // Handle 401 - Token expired, try to refresh and retry
      if (response.status === 401 && !isRetry) {
        console.log('🔄 [Hue Remote API] Token expired, attempting refresh...');

        const refreshResult = await forceTokenRefresh();
        if (refreshResult.accessToken) {
          console.log('✅ [Hue Remote API] Token refreshed, retrying request...');
          this.updateAccessToken(refreshResult.accessToken);
          return this.request(endpoint, options, true); // Retry once
        }

        console.error('❌ [Hue Remote API] Token refresh failed:', refreshResult.error);
        throw new Error(`Token refresh failed: ${refreshResult.message || refreshResult.error}`);
      }

      // Check for specific errors
      const errors = error.errors || [];
      if (errors.length > 0) {
        const firstError = errors[0]!;
        throw new Error(firstError.description || `Hue Remote API error: ${response.status}`);
      }

      throw new Error(error.error_description || error.message || `Hue Remote API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  // ==================== RESPONSE NORMALIZERS ====================
  // Remote API uses v1 format, Local API uses v2 format
  // These functions normalize v1 → v2 for compatibility

  /**
   * Normalize v1 light to v2 format
   * @param v1Light - Remote API light (v1 format)
   * @returns Normalized light (v2 format)
   */
  _normalizeLightV1toV2(v1Light: V1Light): Record<string, unknown> {
    return {
      id: v1Light.id,
      type: 'light',
      on: {
        on: v1Light.state?.on || false,
      },
      dimming: {
        brightness: v1Light.state?.bri
          ? Math.round((v1Light.state.bri / 254) * 100)
          : 0,
      },
      color: v1Light.state?.xy
        ? {
            xy: {
              x: v1Light.state.xy[0],
              y: v1Light.state.xy[1],
            },
          }
        : undefined,
      color_temperature: v1Light.state?.ct
        ? {
            mirek: v1Light.state.ct,
          }
        : undefined,
      metadata: {
        name: v1Light.name || 'Unknown Light',
      },
    };
  }

  /**
   * Normalize v1 group to v2 format
   * @param v1Group - Remote API group (v1 format)
   * @returns Normalized room (v2 format)
   */
  _normalizeGroupV1toV2(v1Group: V1Group): Record<string, unknown> {
    return {
      id: v1Group.id,
      type: 'room',
      metadata: {
        name: v1Group.name || 'Unknown Room',
      },
      children: v1Group.lights?.map(lightId => ({
        rid: lightId,
        rtype: 'light',
      })) || [],
      services: [{
        rid: v1Group.id,
        rtype: 'grouped_light',
      }],
    };
  }

  /**
   * Normalize v1 scene to v2 format
   * @param v1Scene - Remote API scene (v1 format)
   * @returns Normalized scene (v2 format)
   */
  _normalizeSceneV1toV2(v1Scene: V1Scene): Record<string, unknown> {
    return {
      id: v1Scene.id,
      type: 'scene',
      metadata: {
        name: v1Scene.name || 'Unknown Scene',
      },
      group: {
        rid: v1Scene.group || v1Scene.id,
        rtype: 'room',
      },
    };
  }

  // ==================== LIGHTS ====================

  /**
   * Get all lights
   */
  async getLights(): Promise<{ data: Record<string, unknown>[] }> {
    const response = await this.request('/lights') as Record<string, V1Light>;

    // Normalize v1 → v2 format
    const normalized = Object.entries(response).map(([id, light]) =>
      this._normalizeLightV1toV2({ ...light, id })
    );

    return { data: normalized };
  }

  /**
   * Get single light
   */
  async getLight(lightId: string): Promise<{ data: Record<string, unknown>[] }> {
    const response = await this.request(`/lights/${lightId}`) as V1Light;
    const normalized = this._normalizeLightV1toV2({ ...response, id: lightId });
    return { data: [normalized] };
  }

  /**
   * Control light (on/off, brightness, color)
   * @param lightId - Light ID
   * @param state - v2 format: { on: { on: true }, dimming: { brightness: 50 }, ... }
   */
  async setLightState(lightId: string, state: Record<string, unknown>): Promise<unknown> {
    // Convert v2 state format to v1 format
    const v1State: Record<string, unknown> = {};

    if (state.on !== undefined) {
      v1State.on = (state.on as { on: boolean }).on;
    }

    if (state.dimming !== undefined) {
      v1State.bri = Math.round(((state.dimming as { brightness: number }).brightness / 100) * 254);
    }

    if ((state.color as { xy?: { x: number; y: number } })?.xy !== undefined) {
      const xy = (state.color as { xy: { x: number; y: number } }).xy;
      v1State.xy = [xy.x, xy.y];
    }

    if ((state.color_temperature as { mirek?: number })?.mirek !== undefined) {
      v1State.ct = (state.color_temperature as { mirek: number }).mirek;
    }

    return this.request(`/lights/${lightId}/state`, {
      method: 'PUT',
      body: JSON.stringify(v1State),
    });
  }

  // ==================== ROOMS / ZONES ====================

  /**
   * Get all rooms (groups)
   */
  async getRooms(): Promise<{ data: Record<string, unknown>[] }> {
    const response = await this.request('/groups') as Record<string, V1Group>;

    // Filter only rooms (type 'Room')
    const rooms = Object.entries(response)
      .filter(([, group]) => group.type === 'Room')
      .map(([id, group]) => this._normalizeGroupV1toV2({ ...group, id }));

    return { data: rooms };
  }

  /**
   * Get all zones (groups)
   */
  async getZones(): Promise<{ data: Record<string, unknown>[] }> {
    const response = await this.request('/groups') as Record<string, V1Group>;

    // Filter only zones (type 'Zone')
    const zones = Object.entries(response)
      .filter(([, group]) => group.type === 'Zone')
      .map(([id, group]) => this._normalizeGroupV1toV2({ ...group, id }));

    return { data: zones };
  }

  /**
   * Get grouped light (room/zone aggregated state)
   * Note: Remote API doesn't have /grouped_light resource, use /groups
   */
  async getGroupedLight(groupId: string): Promise<{ data: Record<string, unknown>[] }> {
    const response = await this.request(`/groups/${groupId}`) as V1Group;
    const normalized = this._normalizeGroupV1toV2({ ...response, id: groupId });
    return { data: [normalized] };
  }

  /**
   * Control room/zone lights together
   * @param groupId - Group ID
   * @param state - v2 format
   */
  async setGroupedLightState(groupId: string, state: Record<string, unknown>): Promise<unknown> {
    // Convert v2 state format to v1 format
    const v1State: Record<string, unknown> = {};

    if (state.on !== undefined) {
      v1State.on = (state.on as { on: boolean }).on;
    }

    if (state.dimming !== undefined) {
      v1State.bri = Math.round(((state.dimming as { brightness: number }).brightness / 100) * 254);
    }

    if ((state.color as { xy?: { x: number; y: number } })?.xy !== undefined) {
      const xy = (state.color as { xy: { x: number; y: number } }).xy;
      v1State.xy = [xy.x, xy.y];
    }

    return this.request(`/groups/${groupId}/action`, {
      method: 'PUT',
      body: JSON.stringify(v1State),
    });
  }

  // ==================== SCENES ====================

  /**
   * Get all scenes
   */
  async getScenes(): Promise<{ data: Record<string, unknown>[] }> {
    const response = await this.request('/scenes') as Record<string, V1Scene>;

    const normalized = Object.entries(response).map(([id, scene]) =>
      this._normalizeSceneV1toV2({ ...scene, id })
    );

    return { data: normalized };
  }

  /**
   * Activate scene
   * Note: Remote API v1 activates scenes via /groups/{groupId}/action with scene parameter
   */
  async activateScene(sceneId: string): Promise<unknown> {
    // Get scene to find its group
    const sceneResponse = await this.request(`/scenes/${sceneId}`) as V1Scene;
    const groupId = sceneResponse.group;

    if (!groupId) {
      throw new Error('Scene does not have associated group');
    }

    return this.request(`/groups/${groupId}/action`, {
      method: 'PUT',
      body: JSON.stringify({
        scene: sceneId,
      }),
    });
  }

  /**
   * Create new scene
   * Note: Remote API scene creation is less documented, implement basic version
   */
  async createScene(name: string, groupId: string, lightstates?: Record<string, unknown>): Promise<unknown> {
    return this.request('/scenes', {
      method: 'POST',
      body: JSON.stringify({
        name,
        type: 'GroupScene',
        group: groupId,
        lightstates: lightstates || {},
        recycle: false,
      }),
    });
  }

  /**
   * Update existing scene
   */
  async updateScene(sceneId: string, updates: Record<string, unknown>): Promise<unknown> {
    return this.request(`/scenes/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete scene
   */
  async deleteScene(sceneId: string): Promise<unknown> {
    return this.request(`/scenes/${sceneId}`, {
      method: 'DELETE',
    });
  }

  // ==================== DEVICES ====================

  /**
   * Get all devices (lights, sensors, etc.)
   * Note: Remote API v1 doesn't have /devices, combine lights + sensors
   */
  async getDevices(): Promise<{ lights: number; sensors: number }> {
    const [lights, sensors] = await Promise.all([
      this.request('/lights') as Promise<Record<string, unknown>>,
      this.request('/sensors').catch(() => ({})) as Promise<Record<string, unknown>>,
    ]);

    return {
      lights: Object.keys(lights).length,
      sensors: Object.keys(sensors).length,
    };
  }

  /**
   * Get bridge info
   */
  async getBridge(): Promise<unknown> {
    return this.request('/config');
  }
}

export default HueRemoteApi;
