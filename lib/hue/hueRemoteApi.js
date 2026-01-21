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

/**
 * Hue Remote API Client
 * Pattern: Similar to HueApi (local), but uses cloud endpoints
 */
class HueRemoteApi {
  constructor(username, accessToken) {
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
  updateAccessToken(newToken) {
    this.accessToken = newToken;
    this.headers['Authorization'] = `Bearer ${newToken}`;
  }

  async request(endpoint, options = {}, isRetry = false) {
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
      console.error('❌ Hue Remote API error status:', response.status);
      console.error('❌ Hue Remote API error response body:', errorText);

      let error;
      try {
        error = JSON.parse(errorText);
        console.error('❌ Hue Remote API error parsed:', JSON.stringify(error, null, 2));
      } catch {
        error = { error_description: errorText };
      }

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
        const firstError = errors[0];
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
   * @param {object} v1Light - Remote API light (v1 format)
   * @returns {object} Normalized light (v2 format)
   */
  _normalizeLightV1toV2(v1Light) {
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
   * @param {object} v1Group - Remote API group (v1 format)
   * @returns {object} Normalized room (v2 format)
   */
  _normalizeGroupV1toV2(v1Group) {
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
   * @param {object} v1Scene - Remote API scene (v1 format)
   * @returns {object} Normalized scene (v2 format)
   */
  _normalizeSceneV1toV2(v1Scene) {
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
  async getLights() {
    const response = await this.request('/lights');

    // Normalize v1 → v2 format
    const normalized = Object.entries(response).map(([id, light]) =>
      this._normalizeLightV1toV2({ ...light, id })
    );

    return { data: normalized };
  }

  /**
   * Get single light
   */
  async getLight(lightId) {
    const response = await this.request(`/lights/${lightId}`);
    const normalized = this._normalizeLightV1toV2({ ...response, id: lightId });
    return { data: [normalized] };
  }

  /**
   * Control light (on/off, brightness, color)
   * @param {string} lightId
   * @param {object} state - v2 format: { on: { on: true }, dimming: { brightness: 50 }, ... }
   */
  async setLightState(lightId, state) {
    // Convert v2 state format to v1 format
    const v1State = {};

    if (state.on !== undefined) {
      v1State.on = state.on.on;
    }

    if (state.dimming !== undefined) {
      v1State.bri = Math.round((state.dimming.brightness / 100) * 254);
    }

    if (state.color?.xy !== undefined) {
      v1State.xy = [state.color.xy.x, state.color.xy.y];
    }

    if (state.color_temperature?.mirek !== undefined) {
      v1State.ct = state.color_temperature.mirek;
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
  async getRooms() {
    const response = await this.request('/groups');

    // Filter only rooms (type 'Room')
    const rooms = Object.entries(response)
      .filter(([, group]) => group.type === 'Room')
      .map(([id, group]) => this._normalizeGroupV1toV2({ ...group, id }));

    return { data: rooms };
  }

  /**
   * Get all zones (groups)
   */
  async getZones() {
    const response = await this.request('/groups');

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
  async getGroupedLight(groupId) {
    const response = await this.request(`/groups/${groupId}`);
    const normalized = this._normalizeGroupV1toV2({ ...response, id: groupId });
    return { data: [normalized] };
  }

  /**
   * Control room/zone lights together
   * @param {string} groupId
   * @param {object} state - v2 format
   */
  async setGroupedLightState(groupId, state) {
    // Convert v2 state format to v1 format
    const v1State = {};

    if (state.on !== undefined) {
      v1State.on = state.on.on;
    }

    if (state.dimming !== undefined) {
      v1State.bri = Math.round((state.dimming.brightness / 100) * 254);
    }

    if (state.color?.xy !== undefined) {
      v1State.xy = [state.color.xy.x, state.color.xy.y];
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
  async getScenes() {
    const response = await this.request('/scenes');

    const normalized = Object.entries(response).map(([id, scene]) =>
      this._normalizeSceneV1toV2({ ...scene, id })
    );

    return { data: normalized };
  }

  /**
   * Activate scene
   * Note: Remote API v1 activates scenes via /groups/{groupId}/action with scene parameter
   */
  async activateScene(sceneId) {
    // Get scene to find its group
    const sceneResponse = await this.request(`/scenes/${sceneId}`);
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
  async createScene(name, groupId, lightstates) {
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
  async updateScene(sceneId, updates) {
    return this.request(`/scenes/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete scene
   */
  async deleteScene(sceneId) {
    return this.request(`/scenes/${sceneId}`, {
      method: 'DELETE',
    });
  }

  // ==================== DEVICES ====================

  /**
   * Get all devices (lights, sensors, etc.)
   * Note: Remote API v1 doesn't have /devices, combine lights + sensors
   */
  async getDevices() {
    const [lights, sensors] = await Promise.all([
      this.request('/lights'),
      this.request('/sensors').catch(() => ({})),
    ]);

    return {
      lights: Object.keys(lights).length,
      sensors: Object.keys(sensors).length,
    };
  }

  /**
   * Get bridge info
   */
  async getBridge() {
    return this.request('/config');
  }
}

export default HueRemoteApi;
