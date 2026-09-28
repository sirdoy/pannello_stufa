import { withAuthAndErrorHandler, success, noContent, badRequest, parseJson } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';
import { automationPatchSchema } from '@/lib/automations/requestSchemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/automations/[rule_id]
 * Returns a single automation rule. Requires authentication.
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  const data = await automationsProxy.getAutomation(rule_id);
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/Get');

/**
 * PATCH /api/v1/automations/[rule_id]
 * Updates an automation rule. Requires authentication.
 */
export const PATCH = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  const body = await parseJson(request);
  const result = automationPatchSchema.safeParse(body);
  if (!result.success) {
    return badRequest(result.error.issues.map((i) => i.message).join(', '));
  }
  // Cast through unknown: the schema declares condition/actions as `unknown`
  // (the HA backend owns authoritative discriminated-union validation).
  const data = await automationsProxy.updateAutomation(
    rule_id,
    result.data as unknown as Parameters<typeof automationsProxy.updateAutomation>[1]
  );
  return success(data as unknown as Record<string, unknown>);
}, 'Automations/Update');

/**
 * DELETE /api/v1/automations/[rule_id]
 * Deletes an automation rule. Requires authentication.
 */
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const rule_id = params['rule_id'] ?? '';
  await automationsProxy.deleteAutomation(rule_id);
  return noContent();
}, 'Automations/Delete');
