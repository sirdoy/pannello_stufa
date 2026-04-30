/**
 * types/automations.ts — Phase 180 (CONTEXT D-05).
 *
 * Re-exports the authoritative discriminated unions from
 * docs/api/automations.types.ts (which mirrors api/automations/models.py).
 *
 * Breaking shape change vs prior stub:
 *   - AutomationRule.id flips string -> number
 *   - last_execution_at -> last_triggered_at (number Unix seconds)
 *   - AutomationExecution: started_at/duration_ms -> triggered_at + trigger_source
 *   - AutomationRulePatch has NO `trigger` field (by API design)
 *
 * Three legacy consumers patched in same wave: app/automations/page.tsx,
 * app/automations/[rule_id]/page.tsx, __tests__/lib/automationsProxy.test.ts.
 *
 * Frontend imports MUST come from this file (NOT from @/docs/api/...).
 */

export * from '@/docs/api/automations.types';

import type {
  AutomationRule,
  AutomationRuleCreate,
  AutomationRulePatch,
  AutomationExecution,
} from '@/docs/api/automations.types';

export type { AutomationRule, AutomationRuleCreate, AutomationRulePatch, AutomationExecution };

/** @deprecated alias kept for legacy imports — use AutomationRuleCreate */
export type AutomationCreate = AutomationRuleCreate;

/** @deprecated alias kept for legacy imports — use AutomationRulePatch */
export type AutomationUpdate = AutomationRulePatch;
