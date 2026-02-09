/**
 * Philips Hue API Wrapper
 * Local API v2 (CLIP v2)
 * Docs: https://developers.meethue.com/develop/hue-api-v2/
 */

import https from 'https';

interface HttpsRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface HttpsResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

/**
 * Helper function to make HTTPS requests that bypass SSL verification
 * (Bridge uses self-signed certificates)
 *
 * This is needed because Node.js fetch() doesn't properly support
 * the agent option for disabling SSL verification.
 */
function httpsRequest(url: string, options: HttpsRequestOptions = {}): Promise<HttpsResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false, // Accept self-signed certificates
      timeout: 5000, // 5 second timeout for local network detection
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          ok: res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode || 500,
          json: async () => JSON.parse(data),
          text: async () => data,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('NETWORK_TIMEOUT'));
    });

    req.on('error', (error) => {
      // Enhance timeout errors with clearer message
      if ((error as NodeJS.ErrnoException).code === 'ETIMEDOUT' || error.message === 'NETWORK_TIMEOUT') {
        reject(new Error('NETWORK_TIMEOUT'));
      } else {
        reject(error);
      }
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Hue Local API Client
 */
class HueApi {
  private bridgeIp: string;
  private applicationKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(bridgeIp: string, applicationKey: string) {
    this.bridgeIp = bridgeIp;
    this.applicationKey = applicationKey;
    this.baseUrl = `https://${bridgeIp}`;
    this.headers = {
      'hue-application-key': applicationKey,
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint: string, options: HttpsRequestOptions = {}): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await httpsRequest(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hue API error status:', response.status);
      console.error('❌ Hue API error response body:', errorText);

      let error: { errors?: Array<{ description?: string }>; error_description?: string; message?: string };
      try {
        error = JSON.parse(errorText);
        console.error('❌ Hue API error parsed:', JSON.stringify(error, null, 2));
      } catch {
        error = { error_description: errorText };
      }

      // Check for specific errors
      const errors = error.errors || [];
      if (errors.length > 0) {
        const firstError = errors[0]!;
        throw new Error(firstError.description || `Hue API error: ${response.status}`);
      }

      throw new Error(error.error_description || error.message || `Hue API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data;
  }

  // ==================== LIGHTS ====================

  /**
   * Get all lights
   */
  async getLights(): Promise<unknown> {
    return this.request('/clip/v2/resource/light');
  }

  /**
   * Get single light
   */
  async getLight(lightId: string): Promise<unknown> {
    return this.request(`/clip/v2/resource/light/${lightId}`);
  }

  /**
   * Control light (on/off, brightness, color)
   */
  async setLightState(lightId: string, state: Record<string, unknown>): Promise<unknown> {
    return this.request(`/clip/v2/resource/light/${lightId}`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
  }

  // ==================== ROOMS / ZONES ====================

  /**
   * Get all rooms
   */
  async getRooms(): Promise<unknown> {
    return this.request('/clip/v2/resource/room');
  }

  /**
   * Get all zones (groups of lights)
   */
  async getZones(): Promise<unknown> {
    return this.request('/clip/v2/resource/zone');
  }

  /**
   * Get grouped light (room/zone aggregated state)
   */
  async getGroupedLight(groupId: string): Promise<unknown> {
    return this.request(`/clip/v2/resource/grouped_light/${groupId}`);
  }

  /**
   * Control room/zone lights together
   */
  async setGroupedLightState(groupId: string, state: Record<string, unknown>): Promise<unknown> {
    return this.request(`/clip/v2/resource/grouped_light/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
  }

  // ==================== SCENES ====================

  /**
   * Get all scenes
   */
  async getScenes(): Promise<unknown> {
    return this.request('/clip/v2/resource/scene');
  }

  /**
   * Activate scene
   */
  async activateScene(sceneId: string): Promise<unknown> {
    return this.request(`/clip/v2/resource/scene/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify({
        recall: { action: 'active' }
      }),
    });
  }

  /**
   * Create new scene
   * @param name - Scene name
   * @param groupRid - Room/zone resource ID
   * @param actions - Array of light actions
   * @returns Created scene data
   */
  async createScene(name: string, groupRid: string, actions: unknown[]): Promise<unknown> {
    return this.request('/clip/v2/resource/scene', {
      method: 'POST',
      body: JSON.stringify({
        name,
        group: { rid: groupRid, rtype: 'room' },
        actions
      }),
    });
  }

  /**
   * Update existing scene
   * @param sceneId - Scene ID
   * @param updates - { name?, actions? }
   * @returns Update response
   */
  async updateScene(sceneId: string, updates: { name?: string; actions?: unknown[] }): Promise<unknown> {
    const payload: { name?: string; actions?: unknown[] } = {};

    if (updates.name !== undefined) {
      payload.name = updates.name;
    }

    if (updates.actions !== undefined) {
      payload.actions = updates.actions;
    }

    return this.request(`/clip/v2/resource/scene/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete scene
   * @param sceneId - Scene ID to delete
   * @returns Delete response
   */
  async deleteScene(sceneId: string): Promise<unknown> {
    return this.request(`/clip/v2/resource/scene/${sceneId}`, {
      method: 'DELETE',
    });
  }

  // ==================== DEVICES ====================

  /**
   * Get all devices (bridges, sensors, etc.)
   */
  async getDevices(): Promise<unknown> {
    return this.request('/clip/v2/resource/device');
  }

  /**
   * Get bridge info
   */
  async getBridge(): Promise<unknown> {
    return this.request('/clip/v2/resource/bridge');
  }
}

// ==================== DISCOVERY & PAIRING ====================

interface HueBridge {
  id: string;
  internalipaddress: string;
}

interface ApplicationKeyResult {
  username: string;
  clientkey: string;
}

/**
 * Discover Hue bridges on network using Philips discovery service
 */
export async function discoverBridges(): Promise<HueBridge[]> {
  try {
    const response = await fetch('https://discovery.meethue.com');
    const bridges = await response.json() as HueBridge[];
    return bridges; // Array of {id, internalipaddress}
  } catch (error) {
    console.error('❌ Bridge discovery error:', error);
    throw new Error('Failed to discover bridges');
  }
}

/**
 * Create new application key (requires link button press)
 * @param bridgeIp - Bridge IP address
 * @param devicetype - App name#instance (e.g., "pannello_stufa#home")
 */
export async function createApplicationKey(bridgeIp: string, devicetype = 'pannello_stufa#home'): Promise<ApplicationKeyResult> {
  try {
    const response = await httpsRequest(`https://${bridgeIp}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        devicetype,
        generateclientkey: true,
      }),
    });

    const data = await response.json() as Array<{ error?: { type: number; description?: string }; success?: { username: string; clientkey: string } }>;

    // Check for errors
    if (data[0]?.error) {
      const error = data[0].error;
      if (error.type === 101) {
        // Link button not pressed
        throw new Error('LINK_BUTTON_NOT_PRESSED');
      }
      throw new Error(error.description || 'Failed to create application key');
    }

    // Success
    if (data[0]?.success) {
      return {
        username: data[0].success.username,
        clientkey: data[0].success.clientkey,
      };
    }

    throw new Error('Unexpected response from bridge');
  } catch (error) {
    console.error('❌ Create app key error:', error);
    if ((error as Error).message === 'LINK_BUTTON_NOT_PRESSED') {
      throw error;
    }
    throw new Error('Failed to connect to bridge: ' + (error as Error).message);
  }
}

export default HueApi;
