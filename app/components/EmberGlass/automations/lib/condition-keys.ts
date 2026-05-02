/**
 * WR-03 (REVIEW iteration 2): stable per-item keys for ConditionGroup
 * children. Mirrors the action-row __key pattern in lib/with-key.ts.
 *
 * The key is UI-only and MUST be stripped before any API serialization
 * (handled in lib/automations-mappers.ts uiGroupToConditionNode + asApiNode).
 */
import type { UIConditionGroup, UIConditionLeaf, UIConditionNode } from '../types';

let counter = 0;

/**
 * Mint a stable __key for a brand-new condition leaf or group.
 * Caller controls when to mint (on add, on type-swap if needed).
 */
export function mintConditionKey(kind: 'cond' | 'group'): string {
  counter += 1;
  return `${kind}_${Date.now()}_${counter}`;
}

/**
 * Recursively augment every node in a UIConditionGroup tree with a __key
 * if it doesn't already have one. Used by apiToDraft to seed keys for
 * items loaded from the API (which never carry __key).
 */
export function withConditionKeys(group: UIConditionGroup): UIConditionGroup {
  return {
    ...group,
    __key: group.__key ?? mintConditionKey('group'),
    items: group.items.map(withNodeKey),
  };
}

function withNodeKey(node: UIConditionNode): UIConditionNode {
  if (node.kind === 'group') return withConditionKeys(node);
  return withLeafKey(node);
}

function withLeafKey(leaf: UIConditionLeaf): UIConditionLeaf {
  if (leaf.__key !== undefined) return leaf;
  return { ...leaf, __key: mintConditionKey('cond') };
}
