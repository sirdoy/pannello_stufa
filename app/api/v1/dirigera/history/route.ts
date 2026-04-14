import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHistory } from '@/lib/dirigera/dirigeraProxy';
import type { SensorHistoryParams } from '@/types/dirigeraProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/history
 * Returns paginated sensor event history. Query params (sensor_id, event_type,
 * start, end, limit, offset) forwarded to the HA proxy. Invalid numerics are
 * dropped silently; HA proxy clamps limit 1-1000.
 * Protected: Requires Auth0 authentication.
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const params: SensorHistoryParams = {};
  const sensorId = searchParams.get('sensor_id');
  const eventType = searchParams.get('event_type');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  if (sensorId) params.sensor_id = sensorId;
  if (eventType) params.event_type = eventType;
  if (start && !Number.isNaN(Number(start))) params.start = Number(start);
  if (end && !Number.isNaN(Number(end))) params.end = Number(end);
  if (limit && !Number.isNaN(Number(limit))) params.limit = Number(limit);
  if (offset && !Number.isNaN(Number(offset))) params.offset = Number(offset);

  const data = Object.keys(params).length > 0
    ? await getHistory(params)
    : await getHistory();

  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/History');
