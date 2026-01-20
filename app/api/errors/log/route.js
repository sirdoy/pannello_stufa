/**
 * API Route: Log Stove Error
 *
 * POST /api/errors/log
 *
 * Logga un errore stufa su Firebase per tracking storico
 * Usato da errorMonitor service quando rileva nuovi errori
 *
 * Body:
 * {
 *   errorCode: 3,
 *   errorDescription: "Pellet esaurito",
 *   severity: "critical|error|warning|info",
 *   additionalData: { ... }  // opzionale
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
  validateRequired,
  validateEnum,
} from '@/lib/core';
import { adminDbPush } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const VALID_SEVERITIES = ['info', 'warning', 'error', 'critical'];

/**
 * POST /api/errors/log
 * Log a stove error to Firebase
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request);
  const { errorCode, errorDescription, severity, additionalData } = body;

  // Validate required fields
  validateRequired(errorCode, 'errorCode', true); // allow 0
  validateRequired(errorDescription, 'errorDescription');
  validateRequired(severity, 'severity');
  validateEnum(severity, VALID_SEVERITIES, 'severity');

  // Create error log
  const errorLog = {
    errorCode,
    errorDescription,
    severity,
    timestamp: Date.now(),
    resolved: false,
    ...(additionalData || {}),
  };

  // Save to Firebase using Admin SDK
  const errorId = await adminDbPush('errors', errorLog);

  console.log(`Errore stufa loggato: ${errorCode} - ${errorDescription} (${severity})`);

  return success({
    message: 'Errore loggato con successo',
    errorId,
    errorLog,
  });
}, 'Errors/Log');
