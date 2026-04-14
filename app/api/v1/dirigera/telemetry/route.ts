import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getTelemetry } from '@/lib/dirigera/dirigeraProxy';
import type { SensorTelemetryParams } from '@/types/dirigeraProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/telemetry
 * Returns paginated sensor telemetry (battery, light_level) from the HA proxy.
 * Query params (sensor_id, start, end, limit, offset) forwarded.
 * Invalid numerics are dropped silently; HA proxy clamps limit 1-1000.
 * Protected: Requires Auth0 authentication.
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const params: SensorTelemetryParams = {};
  const sensorId = searchParams.get('sensor_id');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  if (sensorId) params.sensor_id = sensorId;
  if (start && !Number.isNaN(Number(start))) params.start = Number(start);
  if (end && !Number.isNaN(Number(end))) params.end = Number(end);
  if (limit && !Number.isNaN(Number(limit))) params.limit = Number(limit);
  if (offset && !Number.isNaN(Number(offset))) params.offset = Number(offset);

  const data = Object.keys(params).length > 0
    ? await getTelemetry(params)
    : await getTelemetry();

  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/Telemetry');
