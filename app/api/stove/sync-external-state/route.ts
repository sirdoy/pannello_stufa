/**
 * API Route: Sync External State to Firebase
 *
 * Called when client polling detects external changes (manual actions, auto-shutdown)
 * Updates Firebase state so all devices receive real-time updates
 */

import { withAuthAndErrorHandler, success, badRequest, parseJsonOrThrow, validateRequired } from '@/lib/core';
import { updateStoveState } from '@/lib/stoveStateService';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request);

  // Validate required fields
  validateRequired(body, ['status']);

  const { status, fanLevel, powerLevel, errorCode, errorDescription } = body as {
    status: string;
    fanLevel?: number | null;
    powerLevel?: number | null;
    errorCode?: number;
    errorDescription?: string;
  };

  // Sync to Firebase for multi-device real-time updates
  await updateStoveState({
    status,
    fanLevel,
    powerLevel,
    errorCode: errorCode ?? 0,
    errorDescription: errorDescription ?? '',
    source: 'manual' // External changes are treated as manual actions
  });

  return success({ message: 'External state synced to Firebase' });
}, 'Stove/SyncExternalState');
