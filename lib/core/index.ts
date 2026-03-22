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
  ApiError,
} from './apiErrors';

// =============================================================================
// RESPONSES
// =============================================================================

export {
  // Success responses
  success,
  noContent,

  // Error responses
  error,

  // Common errors
  forbidden,
  notFound,
  badRequest,
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
  withIdempotency,
} from './middleware';

// =============================================================================
// REQUEST PARSING
// =============================================================================

export {
  // JSON parsing
  parseJson,
  parseJsonOrThrow,

  // Query parsing
  parseQuery,

  // Validation
  validateRequired,
  validateEnum,

  // Path parameters
  getPathParam,
} from './requestParser';
