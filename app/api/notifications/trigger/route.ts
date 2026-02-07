/**
 * API Route: Trigger Notification
 *
 * POST /api/notifications/trigger
 *
 * Endpoint per triggerare notifiche basate su tipo predefinito.
 * Verifica automaticamente le preferenze utente prima dell'invio.
 *
 * Body:
 * {
 *   typeId: "stove_error_critical",  // ID tipo notifica
 *   data: { ... },                    // Dati dinamici
 *   userId?: "auth0|xxx"              // Opzionale: destinatario (default: utente corrente)
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { triggerNotificationServer } from '@/lib/notificationTriggersServer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/trigger
 * Trigger a typed notification with preference checking
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;
  const body = await parseJsonOrThrow(request);

  const { typeId, data = {}, userId: targetUserId } = body;

  // Validate required fields
  validateRequired(typeId, 'typeId');

  // Determine target user (default to current user)
  const userId = targetUserId || user.sub;

  // Check admin secret if targeting another user
  if (targetUserId && targetUserId !== user.sub) {
    const adminSecret = request.headers.get('x-admin-secret');
    const bodySecret = body.adminSecret;

    const isAdmin = adminSecret === process.env.ADMIN_SECRET ||
                    bodySecret === process.env.ADMIN_SECRET;

    if (!isAdmin) {
      return badRequest('Non autorizzato a inviare notifiche ad altri utenti');
    }
  }

  // Trigger notification using server-side helper
  const result = await triggerNotificationServer(userId, typeId, data);

  if (result.skipped) {
    return success({
      sent: false,
      reason: result.reason,
      message: 'Notifica non inviata (preferenze utente)',
    });
  }

  if (!result.success) {
    return badRequest(result.error || 'Impossibile inviare notifica');
  }

  return success({
    sent: true,
    typeId,
    sentTo: result.successCount,
    failed: result.failureCount,
  });
}, 'Notifications/Trigger');
