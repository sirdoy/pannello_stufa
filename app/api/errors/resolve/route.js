/**
 * API Route: Resolve Stove Error
 *
 * POST /api/errors/resolve
 *
 * Marca un errore stufa come risolto
 * Aggiunge timestamp risoluzione e flag resolved=true
 *
 * Body:
 * {
 *   errorId: "firebase_error_id"
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  notFound,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { adminDbGet, adminDbUpdate } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/errors/resolve
 * Mark a stove error as resolved
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request);
  const { errorId } = body;

  // Validate required field
  validateRequired(errorId, 'errorId');

  // Verify error exists
  const errorData = await adminDbGet(`errors/${errorId}`);

  if (!errorData) {
    return notFound('Errore non trovato');
  }

  // If already resolved, return success
  if (errorData.resolved) {
    return success({
      message: 'Errore gia risolto',
      errorId,
      resolvedAt: errorData.resolvedAt,
    });
  }

  // Mark as resolved using Admin SDK
  const updates = {
    resolved: true,
    resolvedAt: Date.now(),
  };

  await adminDbUpdate(`errors/${errorId}`, updates);

  console.log(`Errore stufa risolto: ${errorId} (${errorData.errorCode})`);

  return success({
    message: 'Errore risolto con successo',
    errorId,
    resolvedAt: updates.resolvedAt,
  });
}, 'Errors/Resolve');
