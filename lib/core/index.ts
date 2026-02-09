/**
 * Core API Utilities - Unified Export
 *
 * This file re-exports all core utilities for convenient importing.
 *
 * Usage:
 *   import { withAuth, success, parseJson, ERROR_CODES } from '@/lib/core';
 *
 * Or import from specific modules:
 *   import { withAuth } from '@/lib/core/middleware';
 *   import { success, error } from '@/lib/core/apiResponse';
 */

// =============================================================================
// ERRORS
// =============================================================================

export {
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
  ApiError,
  mapLegacyError,
} from './apiErrors';

// =============================================================================
// RESPONSES
// =============================================================================

export {
  // Success responses
  success,
  created,
  noContent,

  // Error responses
  error,
  handleError,

  // Common errors
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  timeout,
  serverError,

  // Device-specific
  stoveOffline,
  maintenanceRequired,
  netatmoReconnect,
  hueNotConnected,
  hueNotOnLocalNetwork,

  // Redirect
  redirect,
} from './apiResponse';

// =============================================================================
// MIDDLEWARE
// =============================================================================

export {
  // Error handling
  withErrorHandler,

  // Combined
  withAuthAndErrorHandler,

  // Special
  withCronSecret,
  withHueHandler,
} from './middleware';

// =============================================================================
// NETATMO HELPERS
// =============================================================================

export {
  requireNetatmoToken,
} from './netatmoHelpers';

// =============================================================================
// REQUEST PARSING
// =============================================================================

export {
  // JSON parsing
  parseJson,
  parseJsonOrThrow,

  // Query parsing
  parseQuery,
  parseQueryObject,

  // Validation
  validateRequired,
  validateEnum,
  validateRange,
  validateEmail,
  validateString,
  validateArray,
  validateBoolean,

  // Path parameters
  getPathParam,
  getOptionalPathParam,
} from './requestParser';
