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

interface ResolveErrorBody {
  errorId: string;
}

interface ErrorData {
  errorCode: number;
  resolved?: boolean;
  resolvedAt?: number;
  [key: string]: unknown;
}

/**
 * POST /api/errors/resolve
 * Mark a stove error as resolved
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await parseJsonOrThrow(request)) as ResolveErrorBody;
  const { errorId } = body;

  // Validate required field
  validateRequired(errorId, 'errorId');

  // Verify error exists
  const errorData = (await adminDbGet(`errors/${errorId}`)) as ErrorData | null;

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


  return success({
    message: 'Errore risolto con successo',
    errorId,
    resolvedAt: updates.resolvedAt,
  });
}, 'Errors/Resolve');
