/**
 * Netatmo-specific helpers for API routes
 *
 * Handles token validation for Netatmo integration.
 */

import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { ApiError, ERROR_CODES } from './apiErrors';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { triggerNetatmoAlertServer } from '@/lib/notificationTriggersServer';
import { getEnvironmentPath } from '@/lib/environmentHelper';

// Cooldown period for Netatmo connection lost notifications (1 hour)
const NETATMO_NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Send Netatmo connection lost notification with cooldown
 * Prevents spam by only sending once per hour
 */
async function sendNetatmoConnectionLostNotification() {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) return;

  try {
    // Check cooldown
    const lastNotifyPath = getEnvironmentPath('netatmo/lastConnectionLostNotification');
    const lastNotify = await adminDbGet(lastNotifyPath);
    const now = Date.now();

    if (lastNotify && (now - lastNotify) < NETATMO_NOTIFICATION_COOLDOWN_MS) {
      return; // Already notified recently
    }

    // Send notification
    await triggerNetatmoAlertServer(adminUserId, 'connection_lost', {
      message: 'Il termostato Netatmo richiede riconnessione. Verifica le credenziali.',
    });
    console.log('⚠️ Notifica netatmo_connection_lost inviata');

    // Save notification timestamp
    await adminDbSet(lastNotifyPath, now);

  } catch (error) {
    console.error('❌ Errore invio notifica netatmo_connection_lost:', error.message);
  }
}

/**
 * Get a valid Netatmo access token or throw ApiError
 * @returns {Promise<string>} Valid access token
 * @throws {ApiError} If token is invalid or refresh fails
 */
export async function requireNetatmoToken() {
  const { accessToken, error, message } = await getValidAccessToken();

  if (error) {
    const { status, reconnect } = handleTokenError(error);

    // Send notification if reconnect is required (async, don't block)
    if (reconnect) {
      sendNetatmoConnectionLostNotification().catch(err =>
        console.error('❌ Errore notifica Netatmo:', err.message)
      );
    }

    throw new ApiError(
      reconnect ? ERROR_CODES.NETATMO_RECONNECT_REQUIRED : ERROR_CODES.NETATMO_TOKEN_INVALID,
      message || 'Token Netatmo non valido',
      status,
      reconnect ? { reconnect: true } : null
    );
  }

  return accessToken;
}
