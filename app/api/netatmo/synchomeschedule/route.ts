import { withAuthAndErrorHandler, success, parseJsonOrThrow, validateRequired } from '@/lib/core';
import { proxySyncHomeSchedule } from '@/lib/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/synchomeschedule
 * Sync a home schedule definition to Netatmo.
 * Body is forwarded transparently; home_id is required.
 */
export const POST = withAuthAndErrorHandler(async (request: NextRequest) => {
  const body = await parseJsonOrThrow(request) as Record<string, unknown>;
  validateRequired(body.home_id as string | undefined, 'home_id');
  const result = await proxySyncHomeSchedule(body);
  return success(result as unknown as Record<string, unknown>);
}, 'Netatmo/SyncHomeSchedule');
