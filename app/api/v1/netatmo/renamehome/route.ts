/**
 * API Route: Netatmo RenameHome
 *
 * POST /api/v1/netatmo/renamehome
 *
 * Renames a home on Netatmo via the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, parseJson, HTTP_STATUS } from '@/lib/core';
import { proxyRenameHome } from '@/lib/netatmo/netatmoProxy';
import type { RenameHomeRequest } from '@/types/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request) as RenameHomeRequest;
  const data = await proxyRenameHome(body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/RenameHome');
