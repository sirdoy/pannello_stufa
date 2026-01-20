/**
 * API Route: Health Check
 *
 * GET /api/health - Returns 200 OK if server is reachable
 * HEAD /api/health - Lightweight connectivity check (204)
 *
 * Used by useOnlineStatus hook to verify connectivity.
 * Note: No auth required for health check
 */

import { withErrorHandler, success, noContent } from '@/lib/core';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Returns status ok with timestamp
 */
export const GET = withErrorHandler(async () => {
  return success({ status: 'ok', timestamp: Date.now() });
}, 'Health/Check');

/**
 * HEAD /api/health
 * Lightweight connectivity check
 */
export const HEAD = withErrorHandler(async () => {
  return noContent();
}, 'Health/Head');
