/**
 * Auth0 profile endpoint
 *
 * Returns the authenticated user's profile for client-side useUser() calls.
 * Auth0 v4 client useUser() hook fetches from this endpoint via SWR.
 *
 * When BYPASS_AUTH=true: returns mock user for local dev without Auth0 credentials.
 * When BYPASS_AUTH=false: reads session from auth0 (real Auth0 session).
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth0.getSession();

  if (!session?.user) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(session.user);
}
