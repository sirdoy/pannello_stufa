import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { withErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { unauthorized } from '@/lib/core/apiResponse';
import { STOVE_EVENTS, dispatchStoveEvent } from '@/lib/notifications/stoveEvents';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  event: z.enum(STOVE_EVENTS),
  data: z.record(z.string(), z.unknown()).default({}),
  ts: z.number().int().positive(),
});

function hasValidSecret(authHeader: string | null): boolean {
  const secret = process.env.STOVE_EVENTS_SECRET;
  if (!secret || !authHeader?.startsWith('Bearer ')) return false;
  const given = Buffer.from(authHeader.slice(7));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * POST /api/internal/stove-events
 * Webhook called by the Pi scheduler (Bearer STOVE_EVENTS_SECRET, no user
 * session): sends the push notification for a stove event to ADMIN_USER_ID.
 */
export const POST = withErrorHandler(async (request) => {
  if (!hasValidSecret(request.headers.get('authorization'))) {
    return unauthorized('Invalid stove events secret');
  }
  const parsed = bodySchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return badRequest(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    return success({ delivered: false, reason: 'no_admin_user' });
  }
  const result = await dispatchStoveEvent(adminUserId, parsed.data);
  return success({ delivered: !result?.skipped, event: parsed.data.event });
}, 'Internal/StoveEvents');
