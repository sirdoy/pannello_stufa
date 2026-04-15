/**
 * API response types - matches lib/core/apiResponse.js patterns
 */

import type { ErrorCode } from './errors';

/** Successful API response (T is merged at the top level for backward compatibility) */
export type ApiSuccessResponse<T extends Record<string, unknown> = Record<string, unknown>> =
  { success: true; message?: string } & T;

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
export type ApiResponse<T extends Record<string, unknown> = Record<string, unknown>> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;


/**
 * Stove status response
 * Example: GET /api/v1/thermorossi/status
 */
export type StoveStatusResponse = ApiSuccessResponse<{
  status: import('../firebase').StoveStatus;
  power: import('../firebase').StovePowerLevel;
  temperature: number;
  maintenance?: {
    needsCleaning: boolean;
    hoursSinceLastCleaning: number;
  };
}>;

/**
 * Generic paginated response
 */
export type PaginatedResponse<T> = ApiSuccessResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}>;
