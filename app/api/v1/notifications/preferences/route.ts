import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { getPreferences, setPreferences } from '@/lib/push/notificationsProxy';
import { preferencesBody } from '@/lib/push/notificationsRequestSchemas';
import { zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** GET /api/v1/notifications/preferences — events the logged-in user receives (M61). */
export const GET = withAuthAndErrorHandler(async (_request, _context, session) => {
  const data = await getPreferences(session.user.sub);
  return success(data as unknown as Record<string, unknown>);
}, 'Notifications/GetPreferences');

/** PUT /api/v1/notifications/preferences — switch events on/off for the logged-in user (partial). */
export const PUT = withAuthAndErrorHandler(async (request, _context, session) => {
  const parsed = preferencesBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await setPreferences(session.user.sub, parsed.data.events);
  return success(data as unknown as Record<string, unknown>);
}, 'Notifications/SetPreferences');
