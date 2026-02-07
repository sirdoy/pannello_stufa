import { withAuthAndErrorHandler, success } from '@/lib/core';

/**
 * GET /api/user
 * Returns current authenticated user info
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  return success({ user: session.user });
}, 'User/Get');
