// app/api/user/route.js (Next.js App Router)
import { auth0 } from '@/lib/auth0';

/**
 * GET /api/user
 * Returns current authenticated user info
 * Protected: Requires Auth0 authentication
 */
export const GET = auth0.withApiAuthRequired(async function getUserInfo(request) {
  const { user } = await auth0.getSession(request);
  return Response.json({ user });
});
