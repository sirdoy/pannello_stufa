/**
 * Camera Display Helpers
 * Display utility functions for Netatmo Security camera event and device type names.
 *
 * API proxy routes and data fetching are handled server-side.
 * See: app/api/v1/netatmo/camera/
 */

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get camera type display name
 */
export function getCameraTypeName(type: string): string {
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
export function getEventTypeName(type: string): string {
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
export function getEventIcon(type: string): string {
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

/**
 * Get sub-type name for outdoor camera events
 * Sub-types: 1=human, 2=animal, 3=vehicle
 */
export function getSubTypeName(subType: number): string | null {
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
export function getSubTypeIcon(subType: number): string | null {
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

// ============================================================================
// EXPORTS
// ============================================================================

const NETATMO_CAMERA_API = {
  getCameraTypeName,
  getEventTypeName,
  getEventIcon,
  getSubTypeName,
  getSubTypeIcon,
};

export default NETATMO_CAMERA_API;
