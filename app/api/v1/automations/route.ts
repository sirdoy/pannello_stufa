import { z } from 'zod';
import { withAuthAndErrorHandler, success, created, badRequest, parseQuery, parseJson } from '@/lib/core';
import { automationsProxy } from '@/lib/automations';
import type { AutomationRuleCreate } from '@/types/automations';

// BL-02 (REVIEW iteration 2): widened schema accepts the full editor body
// (trigger/condition/actions + scheduling fields). Previously Zod silently
// stripped unknown keys, so the Phase 180 editor's POST would lose every
// field except name/description/enabled — the backend would receive a
// stripped body and either 422-validate or create a rule with default
// empty arrays/null trigger and the user's intended actions lost.
//
// trigger/condition/actions are typed as `unknown` here — the HA backend
// owns the authoritative discriminated-union validation. We only enforce
// shape (object/array) plus trim non-empty name and bound the integer
// scheduling fields. `.passthrough()` keeps any future API additions
// flowing without requiring a schema bump.
const automationCreateSchema = z
  .object({
    name: z.string().min(1).max(128),
    description: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
    trigger: z.unknown().nullable().optional(),
    condition: z.unknown().optional(),
    actions: z.array(z.unknown()).optional(),
    min_interval_seconds: z.number().int().min(0).optional(),
    max_triggers_per_hour: z.number().int().min(0).optional(),
    active_hours_start: z.string().nullable().optional(),
    active_hours_end: z.string().nullable().optional(),
  })
  .passthrough();

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
  // Schema accepts the full Phase 180 editor body (trigger/condition/actions/
  // scheduling) plus the legacy admin-form body (name/description/enabled).
  // The HA backend performs authoritative validation of the discriminated
  // unions; we forward result.data verbatim.
  const data = await automationsProxy.createAutomation(result.data as unknown as AutomationRuleCreate);
  return created(data as unknown as Record<string, unknown>);
}, 'Automations/Create');
