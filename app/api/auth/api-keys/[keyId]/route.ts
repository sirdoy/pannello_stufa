/**
 * DELETE /api/auth/api-keys/[keyId]
 *
 * Revokes the specified API key permanently via the HA proxy.
 * Requires Auth0 session (D-07, T-157-06).
 * HA proxy JWT is obtained server-side and never returned to client (D-03).
 *
 * Security (T-157-03): keyId is validated as a finite positive integer
 * before proxying to the HA backend to prevent injection attacks.
 */

import { withAuthAndErrorHandler, noContent } from '@/lib/core';
import { login, deleteApiKey } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

export const dynamic = 'force-dynamic';

export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const keyIdRaw = params['keyId'] ?? '';
  const keyId = Number(keyIdRaw);

  // T-157-03: Validate numeric ID to prevent injection
  if (!Number.isFinite(keyId) || keyId <= 0 || !Number.isInteger(keyId)) {
    throw ApiError.badRequest('keyId must be a positive integer');
  }

  const username = process.env.HA_ADMIN_USER;
  const password = process.env.HA_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      'HA proxy auth not configured: missing HA_ADMIN_USER or HA_ADMIN_PASSWORD',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const { access_token } = await login(username, password);
  await deleteApiKey(access_token, keyId);
  return noContent();
}, 'Auth/ApiKeys/Delete');
