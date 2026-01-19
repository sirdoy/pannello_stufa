// app/api/user/route.js (Next.js App Router)
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

/**
 * GET /api/user
 * Returns current authenticated user info
 * Protected: Requires Auth0 authentication
 */
export async function GET(request) {
  const session = await auth0.getSession(request);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }
  return Response.json({ user: session.user });
}
