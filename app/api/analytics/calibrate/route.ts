import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { adminDbUpdate } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { CalibrationSettings } from '@/types/analytics';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const body = await request.json() as { actualKg?: number; estimatedKg?: number; pelletCostPerKg?: number };

  // Validate input
  if (body.actualKg !== undefined && body.estimatedKg !== undefined) {
    if (typeof body.actualKg !== 'number' || body.actualKg <= 0) {
      return badRequest('actualKg must be a positive number');
    }
    if (typeof body.estimatedKg !== 'number' || body.estimatedKg <= 0) {
      return badRequest('estimatedKg must be a positive number');
    }
  }

  const userId = session.user.sub;
  const settingsPath = getEnvironmentPath(`users/${userId}/analyticsSettings`);

  const updates: Partial<CalibrationSettings> = {};

  if (body.actualKg !== undefined && body.estimatedKg !== undefined) {
    updates.pelletCalibrationFactor = parseFloat((body.actualKg / body.estimatedKg).toFixed(4));
    updates.lastCalibrationDate = new Date().toISOString();
    updates.lastCalibrationActual = body.actualKg;
    updates.lastCalibrationEstimated = body.estimatedKg;
  }

  if (body.pelletCostPerKg !== undefined) {
    if (typeof body.pelletCostPerKg !== 'number' || body.pelletCostPerKg <= 0) {
      return badRequest('pelletCostPerKg must be a positive number');
    }
    updates.pelletCostPerKg = body.pelletCostPerKg;
  }

  if (Object.keys(updates).length === 0) {
    return badRequest('No valid calibration data provided');
  }

  await adminDbUpdate(settingsPath, updates as Record<string, unknown>);

  return success({ calibrated: true, ...updates });
});
