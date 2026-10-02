import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/telephony/calls
 * Returns paginated call history from Fritz!Box.
 * Forwards optional call_type, limit and offset query params to the HA proxy.
 * Protected: Requires an authenticated session
 *
 * Query params:
 *   call_type - Filter: received | missed | outgoing | rejected | active_received | active_outgoing
 *   limit     - Max items per page (default: backend default 100, max 1000)
 *   offset    - Pagination offset (default: 0)
 *
 * Success: { calls: { items: CallRecord[], total_count, limit, offset } }
 *   (backend PaginatedResponse[CallRecordModel], see docs/api/fritzbox.md)
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  // Only forward well-formed values.
  const callType = searchParams.get('call_type');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  if (callType && /^[a-z_]+$/.test(callType)) params.set('call_type', callType);
  if (limit && /^\d+$/.test(limit)) params.set('limit', limit);
  if (offset && /^\d+$/.test(offset)) params.set('offset', offset);

  const calls = await fritzboxClient.getCallHistory(params);
  return success({ calls });
}, 'FritzBox/TelephonyCalls');
