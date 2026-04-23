/**
 * POST /api/auth/login
 *
 * Server-side login via HA proxy.
 *
 * Accepts an OPTIONAL JSON body `{ username, password }`. When absent (or empty)
 * falls back to HA_ADMIN_USER / HA_ADMIN_PASSWORD env vars to authenticate with
 * the HA proxy backend.
 *
 * On success sets a short-lived httpOnly session-marker cookie
 * (see lib/auth0.ts:46-52 for analogous flag set) so the client can distinguish
 * authenticated state without ever holding the HA proxy JWT itself.
 *
 * Security (D-03, T-157-01, T-170-01): the JWT returned by the HA proxy is
 * NEVER captured as a binding, never returned to the client, never logged.
 * The HA-proxy login call below is awaited for its side effect (credential
 * validation) and its return value is discarded.
 *
 * Threat mitigations — see plan threat_model (T-170-01…T-170-09):
 *   - T-170-07: tolerant body parse (request.text() + JSON.parse guarded);
 *   - T-170-08: httpOnly cookie flag blocks JS read;
 *   - T-170-09: secure flag in production only (matches lib/auth0.ts:49).
 *
 * Requires Auth0 session (D-07, T-157-06) via withAuthAndErrorHandler.
 */

import { cookies } from 'next/headers';
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { login } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request?: Request) => {
  // Tolerant body parse (RESEARCH Pitfall 4: request.json() throws on empty
  // body in Next.js 16). `request` is optional so phase-157 test callers that
  // invoke POST() with zero args still work.
  let body: { username?: string; password?: string } = {};
  const raw = request ? await request.text() : '';
  if (raw.trim().length > 0) {
    try {
      body = JSON.parse(raw) as { username?: string; password?: string };
    } catch {
      throw ApiError.badRequest('Invalid JSON body');
    }
  }

  const username = body.username ?? process.env.HA_ADMIN_USER;
  const password = body.password ?? process.env.HA_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      'HA proxy auth not configured: missing HA_ADMIN_USER or HA_ADMIN_PASSWORD',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  // T-157-01 / T-170-01: call login() for its side effect; DISCARD result.
  // The HA proxy token is intentionally not captured in any variable.
  await login(username, password);

  // Set the httpOnly session-marker cookie (D-15, flags mirror lib/auth0.ts:46-52).
  // If login() rejects above, this line is never reached — cookie stays absent
  // (see Test 8: 429 propagation asserts mockSet is NOT called).
  const cookieStore = await cookies();
  cookieStore.set('ha_auth', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60, // 3600 seconds = 1 hour
  });

  return success({ authenticated: true });
}, 'Auth/Login');
