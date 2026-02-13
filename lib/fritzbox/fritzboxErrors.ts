/**
 * Fritz!Box Error Codes
 *
 * Fritz!Box-specific error code constants
 * Re-exports from centralized apiErrors module for convenience
 */

import { ERROR_CODES } from '@/lib/core/apiErrors';

/**
 * Fritz!Box error codes
 * Convenience object for Fritz!Box-specific errors
 */
export const FRITZBOX_ERROR_CODES = {
  TR064_NOT_ENABLED: ERROR_CODES.TR064_NOT_ENABLED,
  FRITZBOX_TIMEOUT: ERROR_CODES.FRITZBOX_TIMEOUT,
  FRITZBOX_NOT_CONFIGURED: ERROR_CODES.FRITZBOX_NOT_CONFIGURED,
} as const;
