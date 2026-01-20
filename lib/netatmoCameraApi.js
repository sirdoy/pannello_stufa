/**
 * Netatmo Camera API Wrapper
 * Integration for Netatmo Security cameras (Welcome, Presence)
 *
 * API Documentation: https://dev.netatmo.com/apidocumentation/security
 */

const NETATMO_API_BASE = 'https://api.netatmo.com';

/**
 * Make authenticated API request
 */
async function makeRequest(endpoint, accessToken, options = {}) {
  const url = `${NETATMO_API_BASE}/api/${endpoint}`;
  const method = options.method || 'GET';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...options.headers,
  };

  const config = {
    method,
    headers,
  };

  if (options.body) {
    if (method === 'POST') {
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      config.body = new URLSearchParams(options.body);
    }
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (data.error) {
    throw new Error(`Netatmo API Error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return data;
}

// ============================================================================
// DATA ENDPOINTS
// ============================================================================

/**
 * Get homes data including cameras using Security API
 * Returns: cameras, persons, events
 *
 * IMPORTANT: Uses 'gethomedata' (Security API) instead of 'homesdata' (Energy API)
 * because 'homesdata' returns cameras as modules without vpn_url/status,
 * while 'gethomedata' returns full camera data with streaming URLs.
 *
 * @param {string} accessToken - OAuth access token
 * @param {number} size - Number of events to retrieve (default 50, max ~200)
 */
async function getCamerasData(accessToken, size = 50) {
  // Use Security API endpoint which returns cameras with full data
  // Pass size parameter to get more events
  const data = await makeRequest('gethomedata', accessToken, {
    method: 'POST',
    body: {
      size: size.toString(),
    },
  });

  // gethomedata returns data in body.homes array
  return data.body?.homes || [];
}

/**
 * Get camera events for a specific home
 * @param {string} accessToken - OAuth access token
 * @param {string} homeId - Home ID
 * @param {number} size - Number of events to retrieve (default 10)
 */
async function getCameraEvents(accessToken, homeId, size = 10) {
  const data = await makeRequest('gethomedata', accessToken, {
    method: 'POST',
    body: {
      home_id: homeId,
      size: size.toString(),
    },
  });

  return data.body?.homes?.[0]?.events || [];
}

/**
 * Get events older than a specific event (for pagination)
 * Uses Netatmo's geteventsuntil endpoint
 * @param {string} accessToken - OAuth access token
 * @param {string} homeId - Home ID
 * @param {string} eventId - Get events older than this event
 * @param {number} size - Number of events to retrieve (default 30)
 */
async function getEventsUntil(accessToken, homeId, eventId, size = 30) {
  const data = await makeRequest('geteventsuntil', accessToken, {
    method: 'POST',
    body: {
      home_id: homeId,
      event_id: eventId,
      size: size.toString(),
    },
  });

  return data.body?.events_list || [];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse cameras from homes data
 * Searches ALL homes for cameras (not just the first one)
 * Filters out undefined values for Firebase compatibility
 */
function parseCameras(homesData) {
  if (!homesData || homesData.length === 0) return [];

  // Search ALL homes for cameras (cameras may be in a different home than thermostats)
  const allCameras = [];

  for (const home of homesData) {
    const homeCameras = home.cameras || [];
    for (const camera of homeCameras) {
      const parsed = {
        id: camera.id,
        name: camera.name || 'Camera',
        type: camera.type, // NACamera (Welcome) or NOC (Presence)
        status: camera.status || 'unknown',
        is_local: camera.is_local || false,
        home_id: home.id, // Track which home the camera belongs to
        home_name: home.name || 'Casa',
      };

      // Only add optional properties if defined
      if (camera.vpn_url) {
        parsed.vpn_url = camera.vpn_url;
      }
      if (camera.local_url) {
        parsed.local_url = camera.local_url;
      }
      if (camera.sd_status) {
        parsed.sd_status = camera.sd_status;
      }
      if (camera.alim_status) {
        parsed.alim_status = camera.alim_status;
      }
      if (camera.light_mode_status) {
        parsed.light_mode_status = camera.light_mode_status;
      }

      allCameras.push(parsed);
    }
  }

  return allCameras;
}

/**
 * Parse persons from homes data
 * Searches ALL homes for persons
 * Filters out undefined values for Firebase compatibility
 */
function parsePersons(homesData) {
  if (!homesData || homesData.length === 0) return [];

  // Search ALL homes for persons (deduplicate by ID)
  const personsMap = new Map();

  for (const home of homesData) {
    const homePersons = home.persons || [];
    for (const person of homePersons) {
      // Skip if we already have this person
      if (personsMap.has(person.id)) continue;

      const parsed = {
        id: person.id,
        name: person.pseudo || 'Sconosciuto',
        out_of_sight: person.out_of_sight ?? true,
      };

      // Only add optional properties if defined
      if (person.last_seen !== undefined) {
        parsed.last_seen = person.last_seen;
      }

      if (person.face) {
        parsed.face = {
          id: person.face.id,
          key: person.face.key,
        };
      }

      personsMap.set(person.id, parsed);
    }
  }

  return Array.from(personsMap.values());
}

/**
 * Parse events from homes data
 * Captures all available Netatmo event fields:
 * - Basic: id, type, time, camera_id
 * - Media: snapshot, video_id, video_status, vignette
 * - Details: message, sub_type, person_id, is_arrival
 */
function parseEvents(events) {
  if (!events || events.length === 0) return [];

  return events.map(event => {
    const parsed = {
      id: event.id,
      type: event.type,
      time: event.time,
      camera_id: event.camera_id,
    };

    // Event message/description from Netatmo
    if (event.message) {
      parsed.message = event.message;
    }

    // Sub-type for outdoor cameras: 1=human, 2=animal, 3=vehicle
    if (event.sub_type !== undefined) {
      parsed.sub_type = event.sub_type;
    }

    // Person detection
    if (event.person_id) {
      parsed.person_id = event.person_id;
    }
    if (event.is_arrival !== undefined) {
      parsed.is_arrival = event.is_arrival;
    }

    // Snapshot image
    if (event.snapshot) {
      parsed.snapshot = {
        id: event.snapshot.id,
        key: event.snapshot.key,
      };
      // Some events have snapshot URL directly
      if (event.snapshot.url) {
        parsed.snapshot.url = event.snapshot.url;
      }
    }

    // Vignette (small preview image)
    if (event.vignette) {
      parsed.vignette = {
        id: event.vignette.id,
        key: event.vignette.key,
      };
      if (event.vignette.url) {
        parsed.vignette.url = event.vignette.url;
      }
    }

    // Video
    if (event.video_id) {
      parsed.video_id = event.video_id;
      parsed.video_status = event.video_status;
    }

    // Additional context
    if (event.event_list) {
      // Some events are grouped with sub-events
      parsed.event_list = event.event_list;
    }

    return parsed;
  });
}

/**
 * Get snapshot URL for a camera
 * Returns VPN URL (always works) or local URL (faster, same network only)
 */
function getSnapshotUrl(camera, preferLocal = false) {
  if (preferLocal && camera.is_local && camera.local_url) {
    return `${camera.local_url}/live/snapshot_720.jpg`;
  }
  if (camera.vpn_url) {
    return `${camera.vpn_url}/live/snapshot_720.jpg`;
  }
  return null;
}

/**
 * Get HLS live stream URL for a camera
 * Returns the m3u8 playlist URL for live video streaming
 * @param {Object} camera - Camera object with vpn_url or local_url
 * @param {boolean} preferLocal - Whether to prefer local URL (faster but only works on same network)
 * @returns {string|null} HLS stream URL or null if not available
 */
function getLiveStreamUrl(camera, preferLocal = false) {
  if (preferLocal && camera.is_local && camera.local_url) {
    return `${camera.local_url}/live/index.m3u8`;
  }
  if (camera.vpn_url) {
    return `${camera.vpn_url}/live/index.m3u8`;
  }
  return null;
}

/**
 * Get event snapshot URL
 * Tries snapshot first, falls back to vignette
 */
function getEventSnapshotUrl(event) {
  // Try direct URL first (some events have it)
  if (event.snapshot?.url) {
    return event.snapshot.url;
  }

  // Try snapshot with id/key
  if (event.snapshot?.id && event.snapshot?.key) {
    return `https://api.netatmo.com/api/getcamerapicture?image_id=${event.snapshot.id}&key=${event.snapshot.key}`;
  }

  // Fall back to vignette (smaller preview)
  if (event.vignette?.url) {
    return event.vignette.url;
  }
  if (event.vignette?.id && event.vignette?.key) {
    return `https://api.netatmo.com/api/getcamerapicture?image_id=${event.vignette.id}&key=${event.vignette.key}`;
  }

  return null;
}

/**
 * Get sub-type name for outdoor camera events
 * Sub-types: 1=human, 2=animal, 3=vehicle
 */
function getSubTypeName(subType) {
  switch (subType) {
    case 1:
      return 'Persona';
    case 2:
      return 'Animale';
    case 3:
      return 'Veicolo';
    default:
      return null;
  }
}

/**
 * Get sub-type icon
 */
function getSubTypeIcon(subType) {
  switch (subType) {
    case 1:
      return '🚶';
    case 2:
      return '🐾';
    case 3:
      return '🚗';
    default:
      return null;
  }
}

/**
 * Get event video URL (HLS stream)
 * Requires the camera object to get the vpn_url
 * @param {Object} event - Event object with video_id
 * @param {Object} camera - Camera object with vpn_url
 * @returns {string|null} HLS video URL or null if not available
 */
function getEventVideoUrl(event, camera) {
  if (!event.video_id || !camera?.vpn_url) return null;
  // Video status can be: 'recording', 'available', 'deleted'
  if (event.video_status === 'deleted') return null;
  return `${camera.vpn_url}/vod/${event.video_id}/index.m3u8`;
}

/**
 * Get event video thumbnail URL
 * @param {Object} event - Event object with video_id
 * @param {Object} camera - Camera object with vpn_url
 * @returns {string|null} Thumbnail URL or null if not available
 */
function getEventVideoThumbnail(event, camera) {
  if (!event.video_id || !camera?.vpn_url) return null;
  if (event.video_status === 'deleted') return null;
  return `${camera.vpn_url}/vod/${event.video_id}/thumbnail.jpg`;
}

/**
 * Get camera type display name
 */
function getCameraTypeName(type) {
  switch (type) {
    case 'NACamera':
      return 'Welcome (Indoor)';
    case 'NOC':
      return 'Presence (Outdoor)';
    case 'NDB':
      return 'Doorbell';
    default:
      return type || 'Camera';
  }
}

/**
 * Get event type display name (Italian)
 */
function getEventTypeName(type) {
  switch (type) {
    case 'person':
      return 'Persona riconosciuta';
    case 'movement':
      return 'Movimento';
    case 'human':
      return 'Persona';
    case 'animal':
      return 'Animale';
    case 'vehicle':
      return 'Veicolo';
    case 'outdoor':
      return 'Movimento esterno';
    default:
      return type || 'Evento';
  }
}

/**
 * Get event icon emoji
 */
function getEventIcon(type) {
  switch (type) {
    case 'person':
      return '👤';
    case 'human':
      return '🚶';
    case 'animal':
      return '🐾';
    case 'vehicle':
      return '🚗';
    case 'movement':
      return '📷';
    case 'outdoor':
      return '🌳';
    default:
      return '📷';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const NETATMO_CAMERA_API = {
  // Data endpoints
  getCamerasData,
  getCameraEvents,
  getEventsUntil,

  // Helpers
  parseCameras,
  parsePersons,
  parseEvents,
  getSnapshotUrl,
  getLiveStreamUrl,
  getEventSnapshotUrl,
  getEventVideoUrl,
  getEventVideoThumbnail,
  getCameraTypeName,
  getEventTypeName,
  getEventIcon,
  getSubTypeName,
  getSubTypeIcon,
};

export default NETATMO_CAMERA_API;
export {
  getCamerasData,
  getCameraEvents,
  getEventsUntil,
  parseCameras,
  parsePersons,
  parseEvents,
  getSnapshotUrl,
  getLiveStreamUrl,
  getEventSnapshotUrl,
  getEventVideoUrl,
  getEventVideoThumbnail,
  getCameraTypeName,
  getEventTypeName,
  getEventIcon,
  getSubTypeName,
  getSubTypeIcon,
};
