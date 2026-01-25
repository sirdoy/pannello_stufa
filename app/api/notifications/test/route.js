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
 *   broadcast?: boolean        // Send to all devices
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

// Predefined notification templates (using Phase 3 type names)
const TEMPLATES = {
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
  status_test: {
    title: 'ℹ️ Test Status',
    body: 'Notifica Status di test - categoria Routine (disabled by default)',
    priority: 'normal',
    type: 'status' // Phase 3 type name - Routine category
  }
};

/**
 * POST /api/notifications/test
 * Send a test notification to authenticated user
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;
  const sentAt = new Date().toISOString();

  // Parse optional body (empty object if no body)
  const body = await parseJson(request, {});
  const { deviceToken, template, customTitle, customBody, broadcast } = body;

  // Build notification from template or custom values
  let notificationConfig;

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
  const notification = {
    title: customTitle || notificationConfig.title,
    body: customBody || notificationConfig.body,
    icon: '/icons/icon-192.png',
    priority: notificationConfig.priority,
    data: {
      type: notificationConfig.type,
      url: '/settings/notifications',
      timestamp: sentAt,
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
    const tokensData = await adminDbGet(`users/${user.sub}/fcmTokens`);
    targetDevices = tokensData ? Object.keys(tokensData).length : 0;
    result = await sendNotificationToUser(user.sub, notification);
  }

  // Build delivery trace
  const trace = {
    sentAt,
    targetDevices,
    template: template || null,
    deliveryResults: {
      successCount: result.successCount || 0,
      failureCount: result.failureCount || 0,
      errors: []
    }
  };

  // Extract errors if any
  if (result.failureCount > 0 && result.responses) {
    trace.deliveryResults.errors = result.responses
      .filter(r => !r.success)
      .map(r => ({
        tokenPrefix: r.error?.message?.substring(0, 20) || 'unknown',
        errorCode: r.error?.code || 'unknown'
      }));
  }

  if (result.success) {
    return success({
      message: 'Test notification sent',
      trace
    });
  } else {
    // Return error with trace
    return badRequest(result.message || 'Impossibile inviare notifica', {
      errorCode: result.error || 'SEND_FAILED',
      trace
    });
  }
}, 'Notifications/Test');
