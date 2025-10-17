/**
 * Philips Hue API Wrapper
 * Local API v2 (CLIP v2)
 * Docs: https://developers.meethue.com/develop/hue-api-v2/
 */

/**
 * Hue Local API Client
 */
class HueApi {
  constructor(bridgeIp, applicationKey) {
    this.bridgeIp = bridgeIp;
    this.applicationKey = applicationKey;
    this.baseUrl = `https://${bridgeIp}`;
    this.headers = {
      'hue-application-key': applicationKey,
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    console.log('🔍 Hue API Request:', url);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
      // Disable SSL verification for self-signed certificate
      // Note: In production, you should properly validate the certificate
    });

    console.log('🔍 Hue API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hue API error status:', response.status);
      console.error('❌ Hue API error response body:', errorText);

      let error;
      try {
        error = JSON.parse(errorText);
        console.error('❌ Hue API error parsed:', JSON.stringify(error, null, 2));
      } catch {
        error = { error_description: errorText };
      }

      // Check for specific errors
      const errors = error.errors || [];
      if (errors.length > 0) {
        const firstError = errors[0];
        throw new Error(firstError.description || `Hue API error: ${response.status}`);
      }

      throw new Error(error.error_description || error.message || `Hue API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 Hue API Response:', JSON.stringify(data).substring(0, 200) + '...');

    return data;
  }

  // ==================== LIGHTS ====================

  /**
   * Get all lights
   */
  async getLights() {
    return this.request('/clip/v2/resource/light');
  }

  /**
   * Get single light
   */
  async getLight(lightId) {
    return this.request(`/clip/v2/resource/light/${lightId}`);
  }

  /**
   * Control light (on/off, brightness, color)
   */
  async setLightState(lightId, state) {
    return this.request(`/clip/v2/resource/light/${lightId}`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
  }

  // ==================== ROOMS / ZONES ====================

  /**
   * Get all rooms
   */
  async getRooms() {
    return this.request('/clip/v2/resource/room');
  }

  /**
   * Get all zones (groups of lights)
   */
  async getZones() {
    return this.request('/clip/v2/resource/zone');
  }

  /**
   * Get grouped light (room/zone aggregated state)
   */
  async getGroupedLight(groupId) {
    return this.request(`/clip/v2/resource/grouped_light/${groupId}`);
  }

  /**
   * Control room/zone lights together
   */
  async setGroupedLightState(groupId, state) {
    return this.request(`/clip/v2/resource/grouped_light/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
  }

  // ==================== SCENES ====================

  /**
   * Get all scenes
   */
  async getScenes() {
    return this.request('/clip/v2/resource/scene');
  }

  /**
   * Activate scene
   */
  async activateScene(sceneId) {
    return this.request(`/clip/v2/resource/scene/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify({
        recall: { action: 'active' }
      }),
    });
  }

  // ==================== DEVICES ====================

  /**
   * Get all devices (bridges, sensors, etc.)
   */
  async getDevices() {
    return this.request('/clip/v2/resource/device');
  }

  /**
   * Get bridge info
   */
  async getBridge() {
    return this.request('/clip/v2/resource/bridge');
  }
}

// ==================== DISCOVERY & PAIRING ====================

/**
 * Discover Hue bridges on network using Philips discovery service
 */
export async function discoverBridges() {
  try {
    const response = await fetch('https://discovery.meethue.com');
    const bridges = await response.json();
    return bridges; // Array of {id, internalipaddress}
  } catch (error) {
    console.error('❌ Bridge discovery error:', error);
    throw new Error('Failed to discover bridges');
  }
}

/**
 * Create new application key (requires link button press)
 * @param {string} bridgeIp - Bridge IP address
 * @param {string} devicetype - App name#instance (e.g., "pannello_stufa#home")
 */
export async function createApplicationKey(bridgeIp, devicetype = 'pannello_stufa#home') {
  try {
    const response = await fetch(`https://${bridgeIp}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        devicetype,
        generateclientkey: true,
      }),
    });

    const data = await response.json();
    console.log('🔍 Create app key response:', JSON.stringify(data, null, 2));

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
    if (error.message === 'LINK_BUTTON_NOT_PRESSED') {
      throw error;
    }
    throw new Error('Failed to connect to bridge: ' + error.message);
  }
}

export default HueApi;
