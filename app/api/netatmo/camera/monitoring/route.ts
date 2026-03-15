import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
} from '@/lib/core';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { proxySetCameraMonitoring } from '@/lib/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface MonitoringBody {
  camera_id?: string;
  monitoring?: string;
}

/**
 * POST /api/netatmo/camera/monitoring
 * Toggles camera monitoring on/off via proxy.
 * Body: { camera_id, monitoring: "on" | "off" }
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request: NextRequest, _context: unknown, _session?: unknown) => {
  const body = await parseJsonOrThrow(request) as MonitoringBody;
  const { camera_id, monitoring } = body;

  if (!camera_id) {
    return badRequest('Parametro camera_id mancante');
  }

  if (!monitoring) {
    return badRequest('Parametro monitoring mancante');
  }

  if (monitoring !== 'on' && monitoring !== 'off') {
    return badRequest('Il parametro monitoring deve essere "on" o "off"');
  }

  try {
    const result = await proxySetCameraMonitoring(camera_id, { monitoring });
    return success(result as unknown as Record<string, unknown>);
  } catch (error) {
    await adminDbPush('log', {
      action: 'Toggle monitoraggio camera',
      camera_id,
      monitoring,
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}, 'Netatmo/CameraMonitoring');
