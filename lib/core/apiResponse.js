/**
 * Centralized API Response Utilities
 *
 * Provides consistent response formatting across all API routes.
 * Always uses NextResponse.json() for consistency.
 *
 * Usage:
 *   import { success, error, badRequest } from '@/lib/core/apiResponse';
 *
 *   return success({ user: userData });
 *   return error('Something went wrong', ERROR_CODES.INTERNAL_ERROR, 500);
 *   return badRequest('Invalid email format');
 */

import { NextResponse } from 'next/server';
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES, ApiError } from './apiErrors';

// =============================================================================
// SUCCESS RESPONSES
// =============================================================================

/**
 * Standard success response
 * @param {object} data - Response data
 * @param {string} message - Optional success message
 * @param {number} status - HTTP status code (default: 200)
 * @returns {NextResponse}
 *
 * @example
 * return success({ schedule: scheduleData });
 * return success({ created: true }, 'Programma creato', 201);
 */
export function success(data, message = null, status = HTTP_STATUS.OK) {
  const response = {
    success: true,
    ...data,
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status });
}

/**
 * Created response (201)
 * @param {object} data - Response data
 * @param {string} message - Optional success message
 * @returns {NextResponse}
 */
export function created(data, message = null) {
  return success(data, message, HTTP_STATUS.CREATED);
}

/**
 * No content response (204)
 * @returns {NextResponse}
 */
export function noContent() {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

/**
 * Standard error response
 * @param {string} message - Error message
 * @param {string} code - Error code from ERROR_CODES
 * @param {number} status - HTTP status code
 * @param {object} details - Additional error details
 * @returns {NextResponse}
 *
 * @example
 * return error('Schedule not found', ERROR_CODES.NOT_FOUND, 404);
 */
export function error(message, code = ERROR_CODES.INTERNAL_ERROR, status = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
  const response = {
    success: false,
    error: message,
    code,
  };

  if (details) {
    // Spread details into response for backward compatibility
    Object.assign(response, details);
  }

  return NextResponse.json(response, { status });
}

/**
 * Convert ApiError to NextResponse
 * @param {ApiError} apiError - ApiError instance
 * @returns {NextResponse}
 */
export function fromApiError(apiError) {
  const response = apiError.toJSON();
  response.success = false;

  return NextResponse.json(response, { status: apiError.status });
}

/**
 * Handle any error (ApiError or standard Error)
 * @param {Error} err - Error instance
 * @param {string} context - Optional context for logging
 * @returns {NextResponse}
 */
export function handleError(err, context = null) {
  if (context) {
    console.error(`[${context}]`, err.message || err);
  }

  if (err instanceof ApiError) {
    return fromApiError(err);
  }

  // Map known error patterns
  const message = err.message || '';

  // Stove timeout
  if (message === 'STOVE_TIMEOUT') {
    return error(
      'Stufa non raggiungibile',
      ERROR_CODES.STOVE_TIMEOUT,
      HTTP_STATUS.GATEWAY_TIMEOUT,
      { details: 'La stufa potrebbe essere spenta o offline. Verifica che sia accesa e connessa alla rete.' }
    );
  }

  // Network timeout
  if (message === 'NETWORK_TIMEOUT') {
    return error(
      'Bridge non raggiungibile',
      ERROR_CODES.HUE_NOT_ON_LOCAL_NETWORK,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      { details: 'Assicurati di essere sulla stessa rete locale del bridge.' }
    );
  }

  // Hue not connected
  if (message.includes('HUE_NOT_CONNECTED')) {
    return error(
      'Hue non connesso',
      ERROR_CODES.HUE_NOT_CONNECTED,
      HTTP_STATUS.UNAUTHORIZED,
      { reconnect: true }
    );
  }

  // Generic server error
  return error(
    err.message || 'Errore interno del server',
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

// =============================================================================
// COMMON ERROR SHORTCUTS
// =============================================================================

/**
 * Unauthorized response (401)
 * @param {string} message - Error message
 * @returns {NextResponse}
 */
export function unauthorized(message = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED]) {
  return error(message, ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Forbidden response (403)
 * @param {string} message - Error message
 * @returns {NextResponse}
 */
export function forbidden(message = ERROR_MESSAGES[ERROR_CODES.FORBIDDEN]) {
  return error(message, ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
}

/**
 * Not found response (404)
 * @param {string} message - Error message
 * @returns {NextResponse}
 */
export function notFound(message = ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]) {
  return error(message, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

/**
 * Bad request response (400)
 * @param {string} message - Error message
 * @param {object} details - Validation details
 * @returns {NextResponse}
 */
export function badRequest(message = ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR], details = null) {
  return error(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, details);
}

/**
 * Validation error response (400)
 * Alias for badRequest with specific code
 * @param {string} message - Error message
 * @param {object} details - Validation details
 * @returns {NextResponse}
 */
export function validationError(message, details = null) {
  return error(message, ERROR_CODES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST, details);
}

/**
 * Timeout response (504)
 * @param {string} message - Error message
 * @param {object} details - Additional details
 * @returns {NextResponse}
 */
export function timeout(message = ERROR_MESSAGES[ERROR_CODES.TIMEOUT], details = null) {
  return error(message, ERROR_CODES.TIMEOUT, HTTP_STATUS.GATEWAY_TIMEOUT, details);
}

/**
 * Service unavailable response (503)
 * @param {string} message - Error message
 * @returns {NextResponse}
 */
export function serviceUnavailable(message = ERROR_MESSAGES[ERROR_CODES.SERVICE_UNAVAILABLE]) {
  return error(message, ERROR_CODES.SERVICE_UNAVAILABLE, HTTP_STATUS.SERVICE_UNAVAILABLE);
}

/**
 * Internal server error response (500)
 * @param {string} message - Error message
 * @returns {NextResponse}
 */
export function serverError(message = ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR]) {
  return error(message, ERROR_CODES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

// =============================================================================
// DEVICE-SPECIFIC ERROR SHORTCUTS
// =============================================================================

/**
 * Stove offline/timeout response
 * @returns {NextResponse}
 */
export function stoveOffline() {
  return error(
    'Stufa non raggiungibile',
    ERROR_CODES.STOVE_OFFLINE,
    HTTP_STATUS.GATEWAY_TIMEOUT,
    { details: 'La stufa potrebbe essere spenta o offline. Verifica che sia accesa e connessa alla rete.' }
  );
}

/**
 * Maintenance required response
 * @returns {NextResponse}
 */
export function maintenanceRequired() {
  return error(
    'Manutenzione richiesta',
    ERROR_CODES.MAINTENANCE_REQUIRED,
    HTTP_STATUS.FORBIDDEN,
    { details: 'Conferma la pulizia prima di accendere la stufa.' }
  );
}

/**
 * Netatmo reconnect required response
 * @param {string} message - Error message
 * @returns {NextResponse}
 */
export function netatmoReconnect(message = 'Token Netatmo scaduto') {
  return error(message, ERROR_CODES.NETATMO_RECONNECT_REQUIRED, HTTP_STATUS.UNAUTHORIZED, { reconnect: true });
}

/**
 * Hue not connected response
 * @returns {NextResponse}
 */
export function hueNotConnected() {
  return error(
    'Hue non connesso',
    ERROR_CODES.HUE_NOT_CONNECTED,
    HTTP_STATUS.UNAUTHORIZED,
    { reconnect: true }
  );
}

/**
 * Hue not on local network response
 * @returns {NextResponse}
 */
export function hueNotOnLocalNetwork() {
  return error(
    'Bridge Hue non raggiungibile',
    ERROR_CODES.HUE_NOT_ON_LOCAL_NETWORK,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    { details: 'Assicurati di essere sulla stessa rete locale del bridge.' }
  );
}

// =============================================================================
// REDIRECT RESPONSE
// =============================================================================

/**
 * Redirect response (302)
 * @param {string} url - Redirect URL
 * @returns {Response}
 */
export function redirect(url) {
  return Response.redirect(url, HTTP_STATUS.MOVED_TEMPORARILY || 302);
}

// =============================================================================
// EXPORT ALL UTILITIES
// =============================================================================

const apiResponse = {
  // Success
  success,
  created,
  noContent,

  // Errors
  error,
  fromApiError,
  handleError,

  // Common errors
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  validationError,
  timeout,
  serviceUnavailable,
  serverError,

  // Device-specific
  stoveOffline,
  maintenanceRequired,
  netatmoReconnect,
  hueNotConnected,
  hueNotOnLocalNetwork,

  // Redirect
  redirect,
};

export default apiResponse;
