/**
 * API error types - derived from lib/core/apiErrors.js
 */

/** HTTP status codes (matching lib/core/apiErrors.js HTTP_STATUS) */
export type HttpStatus =
  | 200 // OK
  | 201 // CREATED
  | 204 // NO_CONTENT
  | 400 // BAD_REQUEST
  | 401 // UNAUTHORIZED
  | 403 // FORBIDDEN
  | 404 // NOT_FOUND
  | 409 // CONFLICT
  | 422 // UNPROCESSABLE_ENTITY
  | 429 // TOO_MANY_REQUESTS
  | 500 // INTERNAL_SERVER_ERROR
  | 502 // BAD_GATEWAY
  | 503 // SERVICE_UNAVAILABLE
  | 504; // GATEWAY_TIMEOUT

/** Error codes (matching lib/core/apiErrors.js ERROR_CODES) */
export type ErrorCode =
  // Authentication & Authorization
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  // Validation
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  | 'MISSING_REQUIRED_FIELD'
  // Resources
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'CONFLICT'
  // Network & External Services
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'EXTERNAL_API_ERROR'
  // Stove-specific
  | 'STOVE_OFFLINE'
  | 'STOVE_TIMEOUT'
  | 'STOVE_ERROR'
  | 'MAINTENANCE_REQUIRED'
  // Netatmo-specific
  | 'NETATMO_NOT_CONNECTED'
  | 'NETATMO_TOKEN_EXPIRED'
  | 'NETATMO_TOKEN_INVALID'
  | 'NETATMO_RECONNECT_REQUIRED'
  // Hue-specific
  | 'HUE_NOT_CONNECTED'
  | 'HUE_BRIDGE_NOT_FOUND'
  | 'HUE_LINK_BUTTON_NOT_PRESSED'
  | 'HUE_NOT_ON_LOCAL_NETWORK'
  | 'HUE_ERROR'
  // Fritz!Box-specific
  | 'TR064_NOT_ENABLED'
  | 'FRITZBOX_TIMEOUT'
  | 'FRITZBOX_NOT_CONFIGURED'
  // Weather-specific
  | 'WEATHER_API_ERROR'
  // Config
  | 'LOCATION_NOT_SET'
  // Firebase
  | 'FIREBASE_ERROR'
  // Rate limiting
  | 'RATE_LIMITED'
  // Server
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED';
