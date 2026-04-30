/**
 * Phase 180 — Automations tab UI types.
 *
 * Re-exports the authoritative API discriminated unions and adds
 * UI-internal draft shapes (UIDraft, UIConditionGroup, UIConditionLeaf).
 *
 * Pattern mirrors app/components/EmberGlass/rooms/types.ts (Phase 179).
 */
export type {
  AutomationRule,
  AutomationRuleCreate,
  AutomationRulePatch,
  AutomationExecution,
  TriggerType,
  ConditionNode,
  ActionItem,
} from '@/types/automations';

import type { TriggerType, ActionItem } from '@/types/automations';

/** UI-internal: a leaf condition (any type from ConditionNode minus and/or). */
export interface UIConditionLeaf {
  kind: 'cond';
  type: string; // discriminator from API ConditionNode (sensor_state_change, time_window, ..., always_true)
  // The remaining keys are leaf-type-specific. We type loosely here and the
  // form components narrow via the discriminator before reading fields.
  [key: string]: unknown;
}

/** UI-internal: an AND/OR group (recursive). */
export interface UIConditionGroup {
  kind: 'group';
  op: 'AND' | 'OR';
  items: UIConditionNode[];
}

export type UIConditionNode = UIConditionLeaf | UIConditionGroup;

/** UI-internal: the editor's draft shape. Always-AND root group (D-10). */
export interface UIDraft {
  name: string;
  description: string | null;
  enabled: boolean;
  trigger: TriggerType | null;
  conditions: UIConditionGroup; // root is always a group (op: 'AND' on first edit)
  actions: ActionItem[];
  min_interval_seconds: number;
  max_triggers_per_hour: number;
  active_hours_start: string | null;
  active_hours_end: string | null;
}

/** Empty draft for "Nuova automazione" flow. */
export function emptyDraft(): UIDraft {
  return {
    name: '',
    description: null,
    enabled: true,
    trigger: { type: 'manual_api_call' },
    conditions: { kind: 'group', op: 'AND', items: [] },
    actions: [],
    min_interval_seconds: 0,
    max_triggers_per_hour: 0,
    active_hours_start: null,
    active_hours_end: null,
  };
}
