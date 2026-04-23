/**
 * POST /api/auth/logout
 *
 * Clears the ha_auth httpOnly session-marker cookie.
 *
 * The underlying HA proxy JWT has no server-side invalidation in this phase —
 * clearing the cookie simply means it no longer accompanies subsequent
 * requests, forcing a fresh login. No HA-proxy call is made; this route is
 * a purely local-cookie mutation.
 *
 * Requires Auth0 session (D-07, T-157-06) via withAuthAndErrorHandler.
 * Threat mitigations — see plan threat_model (T-170-02 sameSite=lax, T-170-06
 * Auth0-session gate, T-170-08 httpOnly set at login).
 */

import { cookies } from 'next/headers';
import { withAuthAndErrorHandler, success } from '@/lib/core';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async () => {
  const cookieStore = await cookies();
  cookieStore.delete('ha_auth');
  return success({ authenticated: false });
}, 'Auth/Logout');
