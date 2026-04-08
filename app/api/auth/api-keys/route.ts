/**
 * GET /api/auth/api-keys  — List all API keys
 * POST /api/auth/api-keys — Create a new API key
 *
 * Both endpoints require Auth0 session (D-07, T-157-06).
 * HA proxy JWT is obtained server-side and never returned to client (D-03).
 *
 * POST returns the full api_key once at creation (APIKeyResponse) — this is
 * intentional per HA proxy design (T-157-02). The access_token is discarded.
 */

import { NextResponse } from 'next/server';
import { withAuthAndErrorHandler, created } from '@/lib/core';
import { login, listApiKeys, createApiKey } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import type { APIKeyCreate } from '@/types/authProxy';

export const dynamic = 'force-dynamic';

// Internal helper: validate env vars and return admin credentials
function getAdminCredentials(): { username: string; password: string } {
  const username = process.env.HA_ADMIN_USER;
  const password = process.env.HA_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      'HA proxy auth not configured: missing HA_ADMIN_USER or HA_ADMIN_PASSWORD',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  return { username, password };
}

/**
 * GET /api/auth/api-keys
 * Returns list of API keys. JWT never exposed to client.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const { username, password } = getAdminCredentials();
  const { access_token } = await login(username, password);
  const data = await listApiKeys(access_token);
  // NextResponse.json to preserve { keys: [...], count: N } shape
  return NextResponse.json(data);
}, 'Auth/ApiKeys/List');

/**
 * POST /api/auth/api-keys
 * Creates a new API key. Requires { name } in request body.
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await request.json()) as Partial<APIKeyCreate>;

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw ApiError.badRequest('name is required and must be a non-empty string');
  }

  const { username, password } = getAdminCredentials();
  const { access_token } = await login(username, password);
  const data = await createApiKey(access_token, body.name);
  return created(data as unknown as Record<string, unknown>);
}, 'Auth/ApiKeys/Create');
