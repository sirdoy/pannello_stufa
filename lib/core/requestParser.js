/**
 * Request Parsing Utilities
 *
 * Provides safe request body parsing with error handling.
 * Eliminates repetitive try-catch blocks in routes.
 *
 * Usage:
 *   import { parseJson, parseQuery, validateRequired } from '@/lib/core/requestParser';
 *
 *   const body = await parseJson(request);
 *   const { id, name } = validateRequired(body, ['id', 'name']);
 */

import { ApiError, ERROR_CODES, HTTP_STATUS } from './apiErrors';

// =============================================================================
// JSON BODY PARSING
// =============================================================================

/**
 * Safely parse JSON body from request
 * Returns default value on parse error instead of throwing
 *
 * @param {Request} request - HTTP request object
 * @param {object} defaultValue - Default value if parsing fails
 * @returns {Promise<object>} Parsed body or default value
 *
 * @example
 * const body = await parseJson(request);
 * const body = await parseJson(request, { power: 3 }); // with defaults
 */
export async function parseJson(request, defaultValue = {}) {
  try {
    const contentType = request.headers.get('content-type');

    // Return default if no body or wrong content type
    if (!contentType?.includes('application/json')) {
      return defaultValue;
    }

    const text = await request.text();
    if (!text || text.trim() === '') {
      return defaultValue;
    }

    return JSON.parse(text);
  } catch {
    return defaultValue;
  }
}

/**
 * Parse JSON body and throw on failure
 * Use when body is required
 *
 * @param {Request} request - HTTP request object
 * @returns {Promise<object>} Parsed body
 * @throws {ApiError} If parsing fails
 *
 * @example
 * const body = await parseJsonOrThrow(request);
 */
export async function parseJsonOrThrow(request) {
  try {
    const text = await request.text();
    if (!text || text.trim() === '') {
      throw ApiError.badRequest('Body richiesto');
    }
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.badRequest('JSON non valido');
  }
}

// =============================================================================
// QUERY PARAMETER PARSING
// =============================================================================

/**
 * Parse query parameters from URL
 *
 * @param {Request} request - HTTP request object
 * @returns {URLSearchParams} Query parameters
 *
 * @example
 * const query = parseQuery(request);
 * const id = query.get('id');
 */
export function parseQuery(request) {
  const url = new URL(request.url);
  return url.searchParams;
}

/**
 * Parse query parameters as object
 *
 * @param {Request} request - HTTP request object
 * @returns {object} Query parameters as key-value pairs
 *
 * @example
 * const { page, limit } = parseQueryObject(request);
 */
export function parseQueryObject(request) {
  const params = parseQuery(request);
  const obj = {};
  for (const [key, value] of params.entries()) {
    obj[key] = value;
  }
  return obj;
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate that required fields are present
 * Throws ApiError if any field is missing
 *
 * Supports two patterns:
 * 1. validateRequired(object, ['field1', 'field2']) - validate object has fields
 * 2. validateRequired(value, 'fieldName', allowZero?) - validate single value is present
 *
 * @param {object|any} data - Object to validate OR single value
 * @param {string[]|string} fields - Required field names OR single field name
 * @param {boolean} allowZero - For single value pattern, allow 0 as valid
 * @returns {object|any} Original data/value if valid
 * @throws {ApiError} If any field is missing
 *
 * @example
 * // Object pattern
 * const { name, email } = validateRequired(body, ['name', 'email']);
 *
 * @example
 * // Single value pattern
 * validateRequired(userId, 'userId');
 */
export function validateRequired(data, fields, allowZero = false) {
  // Single value pattern: validateRequired(value, 'fieldName', allowZero?)
  if (typeof fields === 'string') {
    const value = data;
    const fieldName = fields;
    const isEmpty = value === undefined || value === null || value === '' ||
                    (!allowZero && value === 0);

    if (isEmpty) {
      throw new ApiError(
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        `Campo obbligatorio mancante: ${fieldName}`,
        HTTP_STATUS.BAD_REQUEST,
        { missing: [fieldName] }
      );
    }

    return value;
  }

  // Object pattern: validateRequired(object, ['field1', 'field2'])
  const missing = fields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new ApiError(
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      `Campi obbligatori mancanti: ${missing.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST,
      { missing }
    );
  }

  return data;
}

/**
 * Validate that a value is one of allowed values
 *
 * @param {any} value - Value to validate
 * @param {any[]} allowed - Allowed values
 * @param {string} fieldName - Field name for error message
 * @returns {any} Original value if valid
 * @throws {ApiError} If value is not allowed
 *
 * @example
 * const status = validateEnum(body.status, ['active', 'inactive'], 'status');
 */
export function validateEnum(value, allowed, fieldName) {
  if (!allowed.includes(value)) {
    throw new ApiError(
      ERROR_CODES.INVALID_INPUT,
      `${fieldName} deve essere uno di: ${allowed.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST,
      { field: fieldName, allowed }
    );
  }
  return value;
}

/**
 * Validate that a value is within a numeric range
 *
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {string} fieldName - Field name for error message
 * @returns {number} Original value if valid
 * @throws {ApiError} If value is out of range
 *
 * @example
 * const power = validateRange(body.power, 1, 5, 'power');
 */
export function validateRange(value, min, max, fieldName) {
  const num = Number(value);

  if (isNaN(num)) {
    throw new ApiError(
      ERROR_CODES.INVALID_INPUT,
      `${fieldName} deve essere un numero`,
      HTTP_STATUS.BAD_REQUEST,
      { field: fieldName }
    );
  }

  if (num < min || num > max) {
    throw new ApiError(
      ERROR_CODES.INVALID_INPUT,
      `${fieldName} deve essere tra ${min} e ${max}`,
      HTTP_STATUS.BAD_REQUEST,
      { field: fieldName, min, max }
    );
  }

  return num;
}

/**
 * Validate email format
 *
 * @param {string} email - Email to validate
 * @returns {string} Original email if valid
 * @throws {ApiError} If email format is invalid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    throw new ApiError(
      ERROR_CODES.INVALID_INPUT,
      'Formato email non valido',
      HTTP_STATUS.BAD_REQUEST,
      { field: 'email' }
    );
  }

  return email;
}

/**
 * Validate that a value is a non-empty string
 *
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {string} Original value if valid
 * @throws {ApiError} If value is not a non-empty string
 */
export function validateString(value, fieldName) {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(
      ERROR_CODES.INVALID_INPUT,
      `${fieldName} deve essere una stringa non vuota`,
      HTTP_STATUS.BAD_REQUEST,
      { field: fieldName }
    );
  }

  return value.trim();
}

/**
 * Validate that a value is an array
 *
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @param {number} minLength - Minimum array length (optional)
 * @returns {array} Original value if valid
 * @throws {ApiError} If value is not an array
 */
export function validateArray(value, fieldName, minLength = 0) {
  if (!Array.isArray(value)) {
    throw new ApiError(
      ERROR_CODES.INVALID_INPUT,
      `${fieldName} deve essere un array`,
      HTTP_STATUS.BAD_REQUEST,
      { field: fieldName }
    );
  }

  if (value.length < minLength) {
    throw new ApiError(
      ERROR_CODES.INVALID_INPUT,
      `${fieldName} deve contenere almeno ${minLength} elementi`,
      HTTP_STATUS.BAD_REQUEST,
      { field: fieldName, minLength }
    );
  }

  return value;
}

/**
 * Validate that a value is a boolean
 *
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {boolean} Boolean value
 * @throws {ApiError} If value cannot be converted to boolean
 */
export function validateBoolean(value, fieldName) {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }

  throw new ApiError(
    ERROR_CODES.INVALID_INPUT,
    `${fieldName} deve essere un booleano`,
    HTTP_STATUS.BAD_REQUEST,
    { field: fieldName }
  );
}

// =============================================================================
// PATH PARAMETER HELPERS
// =============================================================================

/**
 * Get path parameter from dynamic route context
 * For routes like /api/items/[id]/route.js
 *
 * @param {object} context - Route context with params
 * @param {string} paramName - Parameter name
 * @returns {Promise<string>} Parameter value
 * @throws {ApiError} If parameter is missing
 *
 * @example
 * const id = await getPathParam(context, 'id');
 */
export async function getPathParam(context, paramName) {
  const params = await context.params;
  const value = params?.[paramName];

  if (!value) {
    throw new ApiError(
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      `Parametro ${paramName} mancante`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return value;
}

/**
 * Get optional path parameter
 *
 * @param {object} context - Route context with params
 * @param {string} paramName - Parameter name
 * @param {any} defaultValue - Default value if missing
 * @returns {Promise<any>} Parameter value or default
 */
export async function getOptionalPathParam(context, paramName, defaultValue = null) {
  const params = await context.params;
  return params?.[paramName] ?? defaultValue;
}

// =============================================================================
// EXPORT DEFAULT OBJECT
// =============================================================================

const requestParser = {
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
};

export default requestParser;
