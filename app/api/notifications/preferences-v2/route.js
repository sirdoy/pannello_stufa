/**
 * API Route: Notification Preferences v2 (Phase 3 Schema)
 *
 * GET /api/notifications/preferences-v2
 * - Recupera le preferenze notifiche dell'utente (nuovo schema Phase 3)
 *
 * PUT /api/notifications/preferences-v2
 * - Aggiorna le preferenze notifiche dell'utente (nuovo schema Phase 3)
 *
 * Uses Admin SDK to bypass Firestore security rules during development.
 */

import { withAuthAndErrorHandler, success, parseJsonOrThrow } from '@/lib/core';
import { getDefaultPreferences } from '@/lib/schemas/notificationPreferences';
import { getFirestore } from 'firebase-admin/firestore';
import { ensureFirebaseAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/preferences-v2
 * Get notification preferences (Phase 3 schema)
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;

  // Ensure Firebase Admin is initialized
  ensureFirebaseAdmin();
  const db = getFirestore();

  // Get preferences from Firestore using Admin SDK
  const docRef = db.collection('users').doc(userId).collection('settings').doc('notifications');
  const snapshot = await docRef.get();

  if (snapshot.exists) {
    return success({ preferences: snapshot.data() });
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
  const body = await parseJsonOrThrow(request);

  // Ensure Firebase Admin is initialized
  ensureFirebaseAdmin();
  const db = getFirestore();

  // Prepare update with metadata
  const update = {
    ...body,
    updatedAt: new Date().toISOString(),
  };

  // Save to Firestore using Admin SDK
  const docRef = db.collection('users').doc(userId).collection('settings').doc('notifications');
  await docRef.set(update, { merge: true });

  console.log(`✅ Notification preferences saved for user ${userId}`);

  return success({
    message: 'Preferenze salvate con successo',
    preferences: update,
  });
}, 'Notifications/UpdatePreferencesV2');
