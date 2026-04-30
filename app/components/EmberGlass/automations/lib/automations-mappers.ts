/**
 * Phase 180 — Pure mappers: API ↔ UI draft (no React, no side effects).
 * Implements D-10 condition root normalization.
 *
 * Exports:
 *   - apiToDraft(rule: AutomationRule): UIDraft
 *   - draftToApi(draft: UIDraft): AutomationRuleCreate
 *   - computePatchDelta(original: AutomationRule, draft: AutomationRule): AutomationRulePatch
 */
import type {
  AutomationRule,
  AutomationRuleCreate,
  AutomationRulePatch,
  ConditionNode,
} from '@/types/automations';
import type { UIDraft, UIConditionGroup, UIConditionNode } from '../types';

// ─── API → UI ────────────────────────────────────────────────────────────────

/**
 * Convert an AutomationRule from the API into the UI editor's UIDraft shape.
 * D-10: bare leaf → wrapped AND root group; always_true → empty AND group.
 */
export function apiToDraft(rule: AutomationRule): UIDraft {
  return {
    name: rule.name,
    description: rule.description ?? null,
    enabled: rule.enabled,
    trigger: rule.trigger ?? null,
    conditions: conditionNodeToUIGroup(rule.condition),
    actions: [...rule.actions],
    min_interval_seconds: rule.min_interval_seconds,
    max_triggers_per_hour: rule.max_triggers_per_hour,
    active_hours_start: rule.active_hours_start ?? null,
    active_hours_end: rule.active_hours_end ?? null,
  };
}

/**
 * Convert a ConditionNode (API) to UIConditionGroup (always a group at root).
 * D-10 normalization:
 *  - always_true → { kind: 'group', op: 'AND', items: [] }
 *  - and|or composite → group with op + recursively mapped items
 *  - bare leaf → wraps in { kind: 'group', op: 'AND', items: [{ kind: 'cond', ...leaf }] }
 */
function conditionNodeToUIGroup(node: ConditionNode): UIConditionGroup {
  if (node.type === 'always_true') {
    return { kind: 'group', op: 'AND', items: [] };
  }
  if (node.type === 'and' || node.type === 'or') {
    return {
      kind: 'group',
      op: node.type === 'and' ? 'AND' : 'OR',
      items: node.conditions.map(asUINode),
    };
  }
  // bare leaf — wrap in AND root for editing
  return {
    kind: 'group',
    op: 'AND',
    items: [asUILeaf(node)],
  };
}

/**
 * Convert a ConditionNode child to a UIConditionNode.
 * and|or composites recurse into a UIConditionGroup; everything else is a leaf.
 */
function asUINode(node: ConditionNode): UIConditionNode {
  if (node.type === 'and' || node.type === 'or') {
    return conditionNodeToUIGroup(node);
  }
  return asUILeaf(node);
}

function asUILeaf(node: ConditionNode): UIConditionNode {
  // Spread node into UIConditionLeaf shape. Use type assertion because ConditionNode
  // may be a composite (already guarded by callers) or a leaf.
  const { ...rest } = node as unknown as Record<string, unknown>;
  return { kind: 'cond', ...rest } as UIConditionNode;
}

// ─── UI → API ────────────────────────────────────────────────────────────────

/**
 * Convert the editor's UIDraft into an AutomationRuleCreate body for POST.
 * D-10 normalization:
 *  - empty items → { type: 'always_true' }
 *  - single leaf item → bare leaf (unwrap AND)
 *  - otherwise → { type: op.lowercase, conditions: [...] }
 */
export function draftToApi(draft: UIDraft): AutomationRuleCreate {
  return {
    name: draft.name,
    description: draft.description,
    enabled: draft.enabled,
    trigger: draft.trigger,
    condition: uiGroupToConditionNode(draft.conditions),
    actions: draft.actions,
    min_interval_seconds: draft.min_interval_seconds,
    max_triggers_per_hour: draft.max_triggers_per_hour,
    active_hours_start: draft.active_hours_start ?? undefined,
    active_hours_end: draft.active_hours_end ?? undefined,
  };
}

/**
 * Convert a UIConditionGroup back to a ConditionNode for the API.
 */
function uiGroupToConditionNode(group: UIConditionGroup): ConditionNode {
  if (group.items.length === 0) {
    return { type: 'always_true' };
  }
  if (group.items.length === 1 && group.items[0]!.kind === 'cond') {
    // Unwrap single-leaf AND group — emit bare leaf
    const { kind: _kind, ...leaf } = group.items[0]! as { kind: string } & Record<string, unknown>;
    return leaf as unknown as ConditionNode;
  }
  return {
    type: group.op.toLowerCase() as 'and' | 'or',
    conditions: group.items.map(asApiNode),
  };
}

/**
 * Convert a UIConditionNode to a ConditionNode.
 */
function asApiNode(node: UIConditionNode): ConditionNode {
  if (node.kind === 'group') {
    return uiGroupToConditionNode(node);
  }
  // leaf — strip the `kind` field
  const { kind: _kind, ...leaf } = node as { kind: string } & Record<string, unknown>;
  return leaf as unknown as ConditionNode;
}

// ─── PATCH delta ──────────────────────────────────────────────────────────────

/**
 * Recursively sort object keys for stable JSON.stringify comparison.
 * Pitfall 3 fix: different key insertion orders should NOT produce spurious diffs.
 * Arrays are preserved in order (not sorted).
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(obj)
        .sort()
        .map(k => [k, canonicalize(obj[k])])
    );
  }
  return value;
}

/**
 * Compute the PATCH delta between an original AutomationRule and a modified one.
 *
 * Returns only the fields that differ (via JSON.stringify after key-canonicalization).
 * TypeScript-locked: AutomationRulePatch has no `trigger` field, so the type
 * system prevents accidental inclusion (D-12, Pitfall 4).
 *
 * Field whitelist (matches AutomationRulePatch fields):
 *   name, description, enabled, condition, actions,
 *   min_interval_seconds, max_triggers_per_hour,
 *   active_hours_start, active_hours_end
 */
export function computePatchDelta(
  original: AutomationRule,
  draft: AutomationRule
): AutomationRulePatch {
  const patchFields = [
    'name',
    'description',
    'enabled',
    'condition',
    'actions',
    'min_interval_seconds',
    'max_triggers_per_hour',
    'active_hours_start',
    'active_hours_end',
  ] as const;

  type PatchField = (typeof patchFields)[number];

  const patch: AutomationRulePatch = {};

  for (const field of patchFields) {
    const origVal = original[field as keyof AutomationRule];
    const draftVal = draft[field as keyof AutomationRule];

    if (JSON.stringify(canonicalize(origVal)) !== JSON.stringify(canonicalize(draftVal))) {
      (patch as Record<PatchField, unknown>)[field] = draftVal;
    }
  }

  return patch;
}
