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
import type { HttpStatus, ErrorCode } from '@/types/api';
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES, ApiError } from './apiErrors';

// =============================================================================
// SUCCESS RESPONSES
// =============================================================================

/**
 * Standard success response
 * @param data - Response data
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse
 *
 * @example
 * return success({ schedule: scheduleData });
 * return success({ created: true }, 'Programma creato', 201);
 */
export function success(
  data: Record<string, unknown>,
  message: string | null = null,
  status: HttpStatus = HTTP_STATUS.OK
): NextResponse {
  const response: Record<string, unknown> = {
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
 * @param data - Response data
 * @param message - Optional success message
 * @returns NextResponse
 */
export function created(data: Record<string, unknown>, message: string | null = null): NextResponse {
  return success(data, message, HTTP_STATUS.CREATED);
}

/**
 * No content response (204)
 * @returns NextResponse
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

/**
 * Standard error response
 * @param message - Error message
 * @param code - Error code from ERROR_CODES
 * @param status - HTTP status code
 * @param details - Additional error details
 * @returns NextResponse
 *
 * @example
 * return error('Schedule not found', ERROR_CODES.NOT_FOUND, 404);
 */
export function error(
  message: string,
  code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
  status: HttpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details: Record<string, unknown> | null = null
): NextResponse {
  const response: Record<string, unknown> = {
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
 * @param apiError - ApiError instance
 * @returns NextResponse
 */
function fromApiError(apiError: ApiError): NextResponse {
  const response: Record<string, unknown> = {
    success: false,
    error: apiError.message,
    code: apiError.code,
  };

  // Spread details at top level for backward compatibility
  // (e.g., reconnect: true should be at top level, not nested in details)
  if (apiError.details) {
    Object.assign(response, apiError.details);
  }

  return NextResponse.json(response, { status: apiError.status });
}

/**
 * Handle any error (ApiError or standard Error)
 * @param err - Error instance
 * @param context - Optional context for logging
 * @returns NextResponse
 */
export function handleError(err: Error | ApiError, context: string | null = null): NextResponse {
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
 * @param message - Error message
 * @returns NextResponse
 */
export function unauthorized(message: string = ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED]): NextResponse {
  return error(message, ERROR_CODES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Forbidden response (403)
 * @param message - Error message
 * @returns NextResponse
 */
export function forbidden(message: string = ERROR_MESSAGES[ERROR_CODES.FORBIDDEN]): NextResponse {
  return error(message, ERROR_CODES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
}

/**
 * Not found response (404)
 * @param message - Error message
 * @returns NextResponse
 */
export function notFound(message: string = ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]): NextResponse {
  return error(message, ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

/**
 * Bad request response (400)
 * @param message - Error message
 * @param details - Validation details
 * @returns NextResponse
 */
export function badRequest(
  message: string = ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
  details: Record<string, unknown> | null = null
): NextResponse {
  return error(message, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, details);
}

// =============================================================================
// EXPORT ALL UTILITIES
// =============================================================================

