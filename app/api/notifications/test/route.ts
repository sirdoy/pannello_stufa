/**
 * API Route: Test Notifica Push
 *
 * POST /api/notifications/test
 *
 * Invia una notifica di test all'utente autenticato
 *
 * Body (optional):
 * {
 *   deviceToken?: string,      // Specific device
 *   template?: string,         // Template name
 *   customTitle?: string,      // Custom title (overrides template)
 *   customBody?: string,       // Custom body (overrides template)
 *   broadcast?: boolean,       // Send to all devices
 *   priority?: string          // Priority override (high, normal, low)
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJson,
} from '@/lib/core';
import { sendNotificationToUser, sendPushNotification, adminDbGet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface TestNotificationBody {
  deviceToken?: string;
  template?: string;
  customTitle?: string;
  customBody?: string;
  broadcast?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface DeliveryError {
  tokenPrefix: string;
  errorCode: string;
}

/** FCM error (FirebaseError) or the raw error of a single-token send → trace entry */
function describeSendError(error: unknown): DeliveryError {
  const { message, code } = (typeof error === 'object' && error !== null ? error : {}) as {
    message?: unknown;
    code?: unknown;
  };
  return {
    tokenPrefix: typeof message === 'string' && message ? message.substring(0, 20) : 'unknown',
    errorCode: typeof code === 'string' && code ? code : 'unknown',
  };
}

interface NotificationTemplate {
  title: string;
  body: string;
  priority: 'high' | 'normal' | 'low';
  type: string;
}

// Predefined notification templates (using Phase 3 type names)
const TEMPLATES: Record<string, NotificationTemplate> = {
  error_alert: {
    title: '❌ Errore Stufa',
    body: 'Attenzione: rilevato errore nel sistema. Verifica lo stato della stufa.',
    priority: 'high',
    type: 'ERROR' // Phase 3 type name
  },
  scheduler_success: {
    title: '🔥 Accensione Completata',
    body: 'La stufa e stata accesa automaticamente dallo scheduler.',
    priority: 'normal',
    type: 'scheduler_success' // Phase 3 type name
  },
  maintenance_reminder: {
    title: '🔧 Promemoria Manutenzione',
    body: 'E il momento di effettuare la pulizia ordinaria della stufa.',
    priority: 'normal',
    type: 'maintenance' // Phase 3 type name
  },
  critical_test: {
    title: '🚨 Test CRITICAL',
    body: 'Notifica CRITICAL di test - bypassa DND e ha rate limit 5/min',
    priority: 'high',
    type: 'CRITICAL' // Phase 3 type name - bypasses DND
  },
  low_priority_test: {
    title: 'ℹ️ Test LOW Priority',
    body: 'Notifica LOW priority di test - subject to all rate limits',
    priority: 'low',
    type: 'status' // Phase 3 type name - Routine category
  }
};

/**
 * POST /api/notifications/test
 * Send a test notification to authenticated user
 * Protected: Requires an authenticated session
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;
  const sentAt = new Date().toISOString();

  // Parse optional body (empty object if no body)
  const body = await parseJson(request, {}) as TestNotificationBody;
  const { deviceToken, template, customTitle, customBody, priority } = body;

  // Build notification from template or custom values
  let notificationConfig: NotificationTemplate;

  if (template && TEMPLATES[template]) {
    // Use template values
    notificationConfig = TEMPLATES[template];
  } else {
    // Use custom or default values
    notificationConfig = {
      title: 'Notifica di Test',
      body: 'Se vedi questo messaggio, le notifiche funzionano correttamente!',
      priority: 'normal',
      type: 'test'
    };
  }

  // Custom title/body override template
  // Priority from request overrides template (map 'low' to 'normal' for NotificationPayload compatibility)
  const finalPriority: 'high' | 'normal' = priority
    ? (priority === 'low' ? 'normal' : priority)
    : notificationConfig.priority === 'low' ? 'normal' : notificationConfig.priority;

  const notification = {
    title: customTitle || notificationConfig.title,
    body: customBody || notificationConfig.body,
    icon: '/icons/icon-192.png',
    priority: finalPriority,
    data: {
      type: notificationConfig.type,
      priority: finalPriority,
      url: '/settings/notifications',
      timestamp: sentAt,
      isTest: 'true' // Must be string to match NotificationPayload type
    },
  };

  // Determine target devices
  let result;
  let targetDevices = 0;

  if (deviceToken) {
    // Send to specific device
    targetDevices = 1;
    result = await sendPushNotification(deviceToken, notification, user.sub);
  } else {
    // Broadcast to all user devices (default if neither deviceToken nor broadcast specified)
    const tokensData = await adminDbGet(`users/${user.sub}/fcmTokens`) as Record<string, unknown> | null;
    targetDevices = tokensData ? Object.keys(tokensData).length : 0;
    result = await sendNotificationToUser(user.sub, notification);
  }

  // Build delivery trace (a skipped send has no counts or per-token responses)
  const sent = 'successCount' in result ? result : null;
  const errors: DeliveryError[] = [];

  // Extract errors if any
  if (sent && sent.failureCount > 0 && sent.responses) {
    for (const r of sent.responses) {
      if (!r.success) errors.push(describeSendError(r.error));
    }
  }

  const trace = {
    sentAt,
    targetDevices,
    template: template || null,
    deliveryResults: {
      successCount: sent?.successCount || 0,
      failureCount: sent?.failureCount || 0,
      errors
    }
  };

  if (result.success) {
    return success({
      message: 'Test notification sent',
      trace
    });
  } else {
    // Return error with trace
    const skipped = 'successCount' in result ? null : result;
    return badRequest(skipped?.message || 'Impossibile inviare notifica', {
      errorCode: skipped?.error || 'SEND_FAILED',
      trace
    });
  }
}, 'Notifications/Test');
