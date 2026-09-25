/**
 * Profile endpoint
 *
 * Returns the signed-in user for the client-side useUser() hook (lib/auth/useUser.tsx):
 * 200 + user, or 204 when there is no session.
 *
 * When BYPASS_AUTH=true: returns the mock dev user (lib/auth/session.ts).
 */

import { NextResponse } from 'next/server';
import { authSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await authSession.getSession();

  if (!session?.user) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(session.user);
}
