/**
 * API response types - matches lib/core/apiResponse.js patterns
 */

import type { ErrorCode } from './errors';

/** Successful API response */
export interface ApiSuccessResponse<T = Record<string, unknown>> {
  success: true;
  message?: string;
  /** Data is spread at top level for backward compatibility */
  [key: string]: unknown;
}

/** Error API response */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
  /** Additional error details spread at top level */
  details?: string;
  /** Device-specific: indicates reconnection needed */
  reconnect?: boolean;
}

/** Generic API response union */
export type ApiResponse<T = Record<string, unknown>> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

/** Type guard to check if response is successful */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/** Type guard to check if response is an error */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Stove status response
 * Example: GET /api/stove/status
 */
export interface StoveStatusResponse extends ApiSuccessResponse {
  status: import('../firebase').StoveStatus;
  power: import('../firebase').StovePowerLevel;
  temperature: number;
  maintenance?: {
    needsCleaning: boolean;
    hoursSinceLastCleaning: number;
  };
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> extends ApiSuccessResponse {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
