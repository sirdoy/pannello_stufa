/**
 * GET /api/netatmo/getroommeasure
 *
 * Thin proxy for historical room measurement data.
 * Validates room_id (required) and scale (optional, must be a valid scale value),
 * then forwards all query params to the Netatmo proxy /getroommeasure endpoint.
 *
 * ENERGY-07: historical room temperature data accessible via proxy.
 */

import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { getProxyRoomMeasure } from '@/lib/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_SCALES = ['max', '30min', '1hour', '1day'] as const;
type ValidScale = (typeof VALID_SCALES)[number];

export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const room_id = searchParams.get('room_id');
  const scale = searchParams.get('scale') ?? '1hour';

  if (!room_id) return badRequest('room_id richiesto');
  if (!VALID_SCALES.includes(scale as ValidScale)) {
    return badRequest(`Scala non valida '${scale}'. Valori accettati: ${VALID_SCALES.join(', ')}`);
  }

  // Build forwarded query string from all relevant params
  const params = new URLSearchParams({ room_id, scale });
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  const result = await getProxyRoomMeasure(params);
  return success(result as unknown as Record<string, unknown>);
}, 'Netatmo/GetRoomMeasure');
