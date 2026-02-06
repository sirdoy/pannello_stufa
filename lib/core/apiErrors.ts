/**
 * Centralized API Error Codes and Constants
 *
 * Provides consistent error handling across all API routes.
 * All error codes are in SCREAMING_SNAKE_CASE.
 *
 * Usage:
 *   import { ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
 *
 *   throw new ApiError(ERROR_CODES.NOT_FOUND, 'Schedule not found', HTTP_STATUS.NOT_FOUND);
 */

import type { HttpStatus, ErrorCode } from '@/types/api';

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// =============================================================================
// ERROR CODES
// =============================================================================

export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Network & External Services
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',

  // Stove-specific
  STOVE_OFFLINE: 'STOVE_OFFLINE',
  STOVE_TIMEOUT: 'STOVE_TIMEOUT',
  STOVE_ERROR: 'STOVE_ERROR',
  MAINTENANCE_REQUIRED: 'MAINTENANCE_REQUIRED',

  // Netatmo-specific
  NETATMO_NOT_CONNECTED: 'NETATMO_NOT_CONNECTED',
  NETATMO_TOKEN_EXPIRED: 'NETATMO_TOKEN_EXPIRED',
  NETATMO_TOKEN_INVALID: 'NETATMO_TOKEN_INVALID',
  NETATMO_RECONNECT_REQUIRED: 'NETATMO_RECONNECT_REQUIRED',

  // Hue-specific
  HUE_NOT_CONNECTED: 'HUE_NOT_CONNECTED',
  HUE_BRIDGE_NOT_FOUND: 'HUE_BRIDGE_NOT_FOUND',
  HUE_LINK_BUTTON_NOT_PRESSED: 'HUE_LINK_BUTTON_NOT_PRESSED',
  HUE_NOT_ON_LOCAL_NETWORK: 'HUE_NOT_ON_LOCAL_NETWORK',

  // Firebase
  FIREBASE_ERROR: 'FIREBASE_ERROR',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

// =============================================================================
// ERROR MESSAGES (Italian, for user-facing errors)
// =============================================================================

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication
  [ERROR_CODES.UNAUTHORIZED]: 'Non autenticato',
  [ERROR_CODES.FORBIDDEN]: 'Accesso negato',
  [ERROR_CODES.SESSION_EXPIRED]: 'Sessione scaduta',

  // Validation
  [ERROR_CODES.VALIDATION_ERROR]: 'Dati non validi',
  [ERROR_CODES.INVALID_INPUT]: 'Input non valido',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Campo obbligatorio mancante',

  // Resources
  [ERROR_CODES.NOT_FOUND]: 'Risorsa non trovata',
  [ERROR_CODES.ALREADY_EXISTS]: 'Risorsa già esistente',
  [ERROR_CODES.CONFLICT]: 'Conflitto con lo stato corrente',

  // Network
  [ERROR_CODES.NETWORK_ERROR]: 'Errore di connessione',
  [ERROR_CODES.TIMEOUT]: 'Timeout della richiesta',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Servizio non disponibile',
  [ERROR_CODES.EXTERNAL_API_ERROR]: 'Errore del servizio esterno',

  // Stove
  [ERROR_CODES.STOVE_OFFLINE]: 'Stufa non raggiungibile',
  [ERROR_CODES.STOVE_TIMEOUT]: 'Timeout comunicazione stufa',
  [ERROR_CODES.STOVE_ERROR]: 'Errore stufa',
  [ERROR_CODES.MAINTENANCE_REQUIRED]: 'Manutenzione richiesta - Pulizia necessaria',

  // Netatmo
  [ERROR_CODES.NETATMO_NOT_CONNECTED]: 'Netatmo non connesso',
  [ERROR_CODES.NETATMO_TOKEN_EXPIRED]: 'Token Netatmo scaduto',
  [ERROR_CODES.NETATMO_TOKEN_INVALID]: 'Token Netatmo non valido',
  [ERROR_CODES.NETATMO_RECONNECT_REQUIRED]: 'Riconnessione Netatmo richiesta',

  // Hue
  [ERROR_CODES.HUE_NOT_CONNECTED]: 'Philips Hue non connesso',
  [ERROR_CODES.HUE_BRIDGE_NOT_FOUND]: 'Bridge Hue non trovato',
  [ERROR_CODES.HUE_LINK_BUTTON_NOT_PRESSED]: 'Premi il pulsante sul bridge Hue',
  [ERROR_CODES.HUE_NOT_ON_LOCAL_NETWORK]: 'Non sei sulla rete locale del bridge Hue',

  // Firebase
  [ERROR_CODES.FIREBASE_ERROR]: 'Errore database',

  // Rate limiting
  [ERROR_CODES.RATE_LIMITED]: 'Troppe richieste, riprova più tardi',

  // Server
  [ERROR_CODES.INTERNAL_ERROR]: 'Errore interno del server',
  [ERROR_CODES.NOT_IMPLEMENTED]: 'Funzionalità non implementata',
};

// =============================================================================
// API ERROR CLASS
// =============================================================================

/**
 * Custom API Error class for consistent error handling
 *
 * @example
 * throw new ApiError(ERROR_CODES.NOT_FOUND, 'Schedule not found', HTTP_STATUS.NOT_FOUND);
 *
 * @example
 * throw ApiError.notFound('Schedule not found');
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly status: HttpStatus;
  public readonly details: Record<string, unknown> | null;

  constructor(
    code: ErrorCode,
    message?: string,
    status: HttpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details: Record<string, unknown> | null = null
  ) {
    super(message || ERROR_MESSAGES[code] || 'Unknown error');
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;

    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Serialize error for JSON response
   */
  toJSON(): { error: string; code: ErrorCode; details?: Record<string, unknown> } {
    const json: { error: string; code: ErrorCode; details?: Record<string, unknown> } = {
      error: this.message,
      code: this.code,
    };

    if (this.details) {
      json.details = this.details;
    }

    return json;
  }

  // =============================================================================
  // STATIC FACTORY METHODS
  // =============================================================================

  static unauthorized(message: string = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED]): ApiError {
    return new ApiError(ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message: string = ERROR_MESSAGES[ERROR_CODES.FORBIDDEN]): ApiError {
    return new ApiError(ERROR_CODES.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(message: string = ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]): ApiError {
    return new ApiError(ERROR_CODES.NOT_FOUND, message, HTTP_STATUS.NOT_FOUND);
  }

  static badRequest(message: string = ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR], details: Record<string, unknown> | null = null): ApiError {
    return new ApiError(ERROR_CODES.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
  }

  static validation(message: string, details: Record<string, unknown> | null = null): ApiError {
    return new ApiError(ERROR_CODES.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
  }

  static timeout(message: string = ERROR_MESSAGES[ERROR_CODES.TIMEOUT]): ApiError {
    return new ApiError(ERROR_CODES.TIMEOUT, message, HTTP_STATUS.GATEWAY_TIMEOUT);
  }

  static serviceUnavailable(message: string = ERROR_MESSAGES[ERROR_CODES.SERVICE_UNAVAILABLE]): ApiError {
    return new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, message, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  static internal(message: string = ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], details: Record<string, unknown> | null = null): ApiError {
    return new ApiError(ERROR_CODES.INTERNAL_ERROR, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }

  // Device-specific errors

  static stoveOffline(details: Record<string, unknown> | null = null): ApiError {
    return new ApiError(
      ERROR_CODES.STOVE_OFFLINE,
      'Stufa non raggiungibile. Verifica che sia accesa e connessa alla rete.',
      HTTP_STATUS.GATEWAY_TIMEOUT,
      details
    );
  }

  static stoveTimeout(): ApiError {
    return new ApiError(
      ERROR_CODES.STOVE_TIMEOUT,
      'Timeout comunicazione con la stufa',
      HTTP_STATUS.GATEWAY_TIMEOUT
    );
  }

  static maintenanceRequired(): ApiError {
    return new ApiError(
      ERROR_CODES.MAINTENANCE_REQUIRED,
      'Manutenzione richiesta - Conferma la pulizia prima di accendere',
      HTTP_STATUS.FORBIDDEN
    );
  }

  static netatmoReconnect(message: string = 'Token Netatmo scaduto, riconnessione richiesta'): ApiError {
    return new ApiError(
      ERROR_CODES.NETATMO_RECONNECT_REQUIRED,
      message,
      HTTP_STATUS.UNAUTHORIZED,
      { reconnect: true }
    );
  }

  static hueNotConnected(): ApiError {
    return new ApiError(
      ERROR_CODES.HUE_NOT_CONNECTED,
      'Hue non connesso. Connetti localmente o abilita accesso remoto.',
      HTTP_STATUS.UNAUTHORIZED,
      { reconnect: true }
    );
  }

  static hueNotOnLocalNetwork(): ApiError {
    return new ApiError(
      ERROR_CODES.HUE_NOT_ON_LOCAL_NETWORK,
      'Bridge Hue non raggiungibile. Assicurati di essere sulla stessa rete locale.',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }
}

// =============================================================================
// LEGACY ERROR MAPPING
// =============================================================================

/**
 * Maps legacy error messages to ApiError instances
 * Used during migration period
 */
export function mapLegacyError(error: Error): ApiError {
  const message = error.message || '';

  // Stove errors
  if (message === 'STOVE_TIMEOUT') {
    return ApiError.stoveTimeout();
  }

  // Hue errors
  if (message.includes('HUE_NOT_CONNECTED')) {
    return ApiError.hueNotConnected();
  }
  if (message === 'NETWORK_TIMEOUT') {
    return ApiError.hueNotOnLocalNetwork();
  }
  if (message === 'LINK_BUTTON_NOT_PRESSED') {
    return new ApiError(
      ERROR_CODES.HUE_LINK_BUTTON_NOT_PRESSED,
      ERROR_MESSAGES[ERROR_CODES.HUE_LINK_BUTTON_NOT_PRESSED],
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Netatmo errors
  if (message.includes('token') && (message.includes('expired') || message.includes('invalid'))) {
    return ApiError.netatmoReconnect();
  }

  // Generic errors
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return ApiError.timeout(message);
  }

  // Default to internal error
  return ApiError.internal(message || 'Errore sconosciuto');
}
