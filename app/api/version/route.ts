/**
 * API Route: Deployed version (M17)
 *
 * GET /api/version - commits of the frontend deployment serving this request and
 * of the backend running on the Pi. The PWA compares them with the build it runs
 * and asks the user to reload after a deploy.
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { haGet } from '@/lib/haClient';
import { FRONTEND_BUILD_ID } from '@/lib/buildVersion';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  let backend: string | null = null;
  try {
    const health = await haGet<{ version?: string | null }>('/health', { timeout: 5000 });
    backend = health.version ?? null;
  } catch {
    // Pi unreachable: still report the frontend build
  }
  const response = success({ frontend: FRONTEND_BUILD_ID, backend });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}, 'Version/Get');
