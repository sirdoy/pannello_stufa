import { withAuthAndErrorHandler, success, parseQuery } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/automations/[rule_id]/executions
 * Returns paginated execution history for a rule. Requires authentication.
 */
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  const query = parseQuery(request);
  const limit = Number(query.get('limit') ?? '20');
  const offset = Number(query.get('offset') ?? '0');
  const data = await automationsProxy.getExecutions(rule_id, { limit, offset });
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/Executions');
