import { withAuthAndErrorHandler, success } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/automations/[rule_id]/trigger
 * Runs the saved rule's actions now, bypassing conditions and safety guards. Requires authentication.
 */
export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  const data = await automationsProxy.triggerAutomation(rule_id);
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/Trigger');
