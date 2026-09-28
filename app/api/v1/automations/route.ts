import { withAuthAndErrorHandler, success, created, badRequest, parseQuery, parseJson } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';
import { automationCreateSchema } from '@/lib/automations/requestSchemas';
import type { AutomationRuleCreate } from '@/types/automations';

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
  const body = await parseJson(request);
  const result = automationCreateSchema.safeParse(body);
  if (!result.success) {
    return badRequest(result.error.issues.map(i => i.message).join(', '));
  }
  // The HA backend performs authoritative validation of the discriminated
  // unions; we forward result.data verbatim.
  const data = await automationsProxy.createAutomation(result.data as unknown as AutomationRuleCreate);
  return created(data as unknown as Record<string, unknown>);
}, 'Automations/Create');
