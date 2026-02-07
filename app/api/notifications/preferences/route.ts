/**
 * API Route: Notification Preferences
 *
 * GET /api/notifications/preferences
 * - Recupera le preferenze notifiche dell'utente
 *
 * PUT /api/notifications/preferences
 * - Aggiorna le preferenze notifiche dell'utente
 *
 * Body (PUT):
 * {
 *   preferences: {
 *     errors: {
 *       enabled: true,
 *       severityLevels: { info: false, warning: true, error: true, critical: true }
 *     },
 *     scheduler: {
 *       enabled: true,
 *       ignition: true,
 *       shutdown: true
 *     },
 *     maintenance: {
 *       enabled: true,
 *       threshold80: true,
 *       threshold90: true,
 *       threshold100: true
 *     }
 *   }
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { adminDbGet, adminDbSet, adminDbUpdate } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface NotificationPreferences {
  errors: {
    enabled: boolean;
    severityLevels: {
      info: boolean;
      warning: boolean;
      error: boolean;
      critical: boolean;
    };
  };
  scheduler: {
    enabled: boolean;
    ignition: boolean;
    shutdown: boolean;
  };
  maintenance: {
    enabled: boolean;
    threshold80: boolean;
    threshold90: boolean;
    threshold100: boolean;
  };
}

interface UpdatePreferencesBody {
  preferences: NotificationPreferences;
}

// Default preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  errors: {
    enabled: true,
    severityLevels: {
      info: false,
      warning: true,
      error: true,
      critical: true,
    },
  },
  scheduler: {
    enabled: true,
    ignition: true,
    shutdown: true,
  },
  maintenance: {
    enabled: true,
    threshold80: true,
    threshold90: true,
    threshold100: true,
  },
};

/**
 * GET /api/notifications/preferences
 * Get notification preferences
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;

  // Get preferences from Firebase
  const preferences = await adminDbGet(`users/${userId}/notificationPreferences`) as NotificationPreferences | null;

  if (preferences) {
    return success({ preferences });
  }

  // If not exists, initialize with defaults
  await adminDbSet(`users/${userId}/notificationPreferences`, DEFAULT_PREFERENCES);

  return success({
    preferences: DEFAULT_PREFERENCES,
    initialized: true,
  });
}, 'Notifications/GetPreferences');

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 * Protected: Requires Auth0 authentication
 */
export const PUT = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const body = await parseJsonOrThrow(request) as UpdatePreferencesBody;
  const { preferences } = body;

  // Validate required field
  validateRequired(preferences, 'preferences');

  // Update preferences on Firebase using Admin SDK
  await adminDbUpdate(`users/${userId}/notificationPreferences`, preferences);

  console.log(`Preferenze notifiche aggiornate per user ${userId}`);

  return success({
    message: 'Preferenze aggiornate con successo',
    preferences,
  });
}, 'Notifications/UpdatePreferences');
