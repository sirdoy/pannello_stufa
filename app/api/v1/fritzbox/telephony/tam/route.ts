import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/telephony/tam
 * Returns answering machine (TAM) status from Fritz!Box.
 * Protected: Requires an authenticated session
 *
 * Success: { tam: { tam: { total_messages, new_messages, tam_enabled, tam_name }, is_stale, fetched_at } }
 *   (backend TamStatusResponse, see docs/api/fritzbox.md)
 * Errors:
 *   - All health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const tam = await fritzboxClient.getTamStatus();
  return success({ tam });
}, 'FritzBox/TelephonyTam');
