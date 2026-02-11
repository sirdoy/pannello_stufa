/**
 * API Route: User PID Automation Config
 *
 * GET /api/user/pid-config
 * - Recupera la configurazione PID automation dell'utente
 *
 * POST /api/user/pid-config
 * - Aggiorna la configurazione PID automation dell'utente
 *
 * Body (POST):
 * {
 *   enabled: boolean,
 *   targetRoomId: string | null,
 *   manualSetpoint: number,
 *   kp?: number,
 *   ki?: number,
 *   kd?: number
 * }
 */

import {
  withAuthAndErrorHandler,
  success,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface PIDConfig {
  enabled: boolean;
  targetRoomId: string | null;
  manualSetpoint: number;
  kp: number;
  ki: number;
  kd: number;
}

const DEFAULT_PID_CONFIG: PIDConfig = {
  enabled: false,
  targetRoomId: null,
  manualSetpoint: 20,
  kp: 0.5,
  ki: 0.1,
  kd: 0.05,
};

/**
 * GET /api/user/pid-config
 * Get user PID automation config
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (_request, _context, session) => {
  const userId = session.user.sub;

  const config = (await adminDbGet(`users/${userId}/pidAutomation`)) as Partial<PIDConfig> | null;

  return success({
    ...DEFAULT_PID_CONFIG,
    ...config,
  });
}, 'User/GetPidConfig');

/**
 * POST /api/user/pid-config
 * Update user PID automation config
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, _context, session) => {
  const userId = session.user.sub;
  const body = (await parseJsonOrThrow(request)) as Partial<PIDConfig>;

  // Validate required field
  validateRequired(body.enabled !== undefined ? String(body.enabled) : undefined, 'enabled');

  // Validate enabled + targetRoomId combination
  if (body.enabled && !body.targetRoomId) {
    throw new Error('targetRoomId is required when enabled is true');
  }

  // Validate manualSetpoint range
  if (body.manualSetpoint !== undefined) {
    if (body.manualSetpoint < 15 || body.manualSetpoint > 25) {
      throw new Error('manualSetpoint must be between 15 and 25');
    }
  }

  // Merge with defaults
  const fullConfig = {
    ...DEFAULT_PID_CONFIG,
    ...body,
    updatedAt: Date.now(),
  };

  await adminDbSet(`users/${userId}/pidAutomation`, fullConfig);

  return success({
    message: 'Configurazione PID salvata con successo',
    config: fullConfig,
  });
}, 'User/SetPidConfig');
