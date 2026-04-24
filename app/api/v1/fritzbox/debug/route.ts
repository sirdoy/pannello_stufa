import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/debug?endpoint=/api/v1/history/bandwidth?hours=1&limit=100&offset=0
 * Returns raw external API response for debugging.
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint');

  if (!endpoint) {
    return success({
      error: 'Missing ?endpoint= parameter',
      example: '/api/fritzbox/debug?endpoint=/api/v1/history/bandwidth?hours=1%26limit=100%26offset=0',
    });
  }

  const raw = await fritzboxClient.debugRequest(endpoint);

  return success({
    endpoint,
    raw,
  });
}, 'FritzBox/Debug');
