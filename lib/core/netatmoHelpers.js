/**
 * Netatmo-specific helpers for API routes
 *
 * Handles token validation for Netatmo integration.
 */

import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { ApiError, ERROR_CODES } from './apiErrors';

/**
 * Get a valid Netatmo access token or throw ApiError
 * @returns {Promise<string>} Valid access token
 * @throws {ApiError} If token is invalid or refresh fails
 */
export async function requireNetatmoToken() {
  const { accessToken, error, message } = await getValidAccessToken();

  if (error) {
    const { status, reconnect } = handleTokenError(error);

    throw new ApiError(
      reconnect ? ERROR_CODES.NETATMO_RECONNECT_REQUIRED : ERROR_CODES.NETATMO_TOKEN_INVALID,
      message || 'Token Netatmo non valido',
      status,
      reconnect ? { reconnect: true } : null
    );
  }

  return accessToken;
}
