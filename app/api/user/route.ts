import { withAuthAndErrorHandler, success } from '@/lib/core';

/**
 * GET /api/user
 * Returns current authenticated user info
 * Protected: Requires an authenticated session
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  return success({ user: session.user });
}, 'User/Get');
