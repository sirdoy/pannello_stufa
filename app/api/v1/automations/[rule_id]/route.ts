import { z } from 'zod';
import { withAuthAndErrorHandler, success, noContent, badRequest, parseJson } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';

export const dynamic = 'force-dynamic';

// BL-03 (REVIEW iteration 2): PATCH previously accepted ANY JSON without
// validation and forwarded it verbatim to the HA backend. The API route is
// the trust boundary between Auth0 sessions and the HA backend (which
// trusts requests bearing X-API-Key); skipping validation here lets an
// authenticated client smuggle arbitrary bodies through.
//
// AutomationRulePatch (types/automations.ts, D-12) intentionally has NO
// `trigger` field — triggers are immutable post-creation. `.strict()`
// rejects `trigger` and any other unknown key so a hand-crafted request
// cannot bypass the type-system guard.
const automationPatchSchema = z
  .object({
    name: z.string().min(1).max(128).optional(),
    description: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    condition: z.unknown().optional(),
    actions: z.array(z.unknown()).optional(),
    min_interval_seconds: z.number().int().min(0).optional(),
    max_triggers_per_hour: z.number().int().min(0).optional(),
    active_hours_start: z.string().nullable().optional(),
    active_hours_end: z.string().nullable().optional(),
  })
  .strict();

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
  const data = await automationsProxy.updateAutomation(rule_id, result.data);
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
