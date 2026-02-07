/**
 * API Route: Add Log Entry
 *
 * POST /api/log/add
 *
 * Adds a log entry to Firebase
 * Body: { action, device, value?, details?, ... }
 */

import { withAuthAndErrorHandler, success, parseJson } from '@/lib/core';
import { adminDbPush } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/log/add
 * Add a log entry
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;
  const body = (await parseJson(request)) as Record<string, unknown>;

  const logEntry = {
    ...body,
    timestamp: Date.now(),
    user: {
      email: user.email,
      name: user.name,
      picture: user.picture,
      sub: user.sub,
    },
    source: 'user',
  };

  await adminDbPush('log', logEntry);

  return success({});
}, 'Log/Add');
