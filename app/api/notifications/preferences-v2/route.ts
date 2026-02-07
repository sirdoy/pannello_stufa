/**
 * API Route: Notification Preferences v2 (Phase 3 Schema)
 *
 * GET /api/notifications/preferences-v2
 * - Recupera le preferenze notifiche dell'utente (nuovo schema Phase 3)
 *
 * PUT /api/notifications/preferences-v2
 * - Aggiorna le preferenze notifiche dell'utente (nuovo schema Phase 3)
 *
 * Uses Admin SDK to access Firebase Realtime Database.
 */

import { withAuthAndErrorHandler, success, parseJsonOrThrow } from '@/lib/core';
import { getDefaultPreferences } from '@/lib/schemas/notificationPreferences';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/preferences-v2
 * Get notification preferences (Phase 3 schema)
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;

  // Get preferences from RTDB using Admin SDK
  const prefs = await adminDbGet(`users/${userId}/settings/notifications`) as Record<string, unknown> | null;

  if (prefs) {
    return success({ preferences: prefs });
  }

  // No preferences yet - return defaults
  const defaults = getDefaultPreferences();

  return success({
    preferences: defaults,
    isDefault: true,
  });
}, 'Notifications/GetPreferencesV2');

/**
 * PUT /api/notifications/preferences-v2
 * Update notification preferences (Phase 3 schema)
 * Protected: Requires Auth0 authentication
 */
export const PUT = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const body = await parseJsonOrThrow(request) as Record<string, unknown>;

  // Prepare update with metadata
  const update = {
    ...body,
    updatedAt: new Date().toISOString(),
  };

  // Save to RTDB using Admin SDK
  await adminDbSet(`users/${userId}/settings/notifications`, update);

  console.log(`✅ Notification preferences saved for user ${userId}`);

  return success({
    message: 'Preferenze salvate con successo',
    preferences: update,
  });
}, 'Notifications/UpdatePreferencesV2');
