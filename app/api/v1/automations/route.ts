import { withAuthAndErrorHandler, success, created, parseQuery } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/automations
 * Returns paginated list of automation rules. Requires authentication.
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const params = parseQuery(request);
  const limit = Number(params.get('limit') ?? '20');
  const offset = Number(params.get('offset') ?? '0');
  const data = await automationsProxy.getAutomations({ limit, offset });
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/List');

/**
 * POST /api/v1/automations
 * Creates a new automation rule. Requires authentication.
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await request.json();
  const data = await automationsProxy.createAutomation(body);
  return created(data as unknown as Record<string, unknown>);
}, 'Automations/Create');
