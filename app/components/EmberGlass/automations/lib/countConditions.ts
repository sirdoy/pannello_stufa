import type { ConditionNode } from '@/types/automations';

/**
 * Recursively counts leaf condition nodes.
 * D-22: leaf => 1, always_true => 0, AND/OR => sum-of-children
 *
 * Operates on the API ConditionNode shape (NOT the UI's UIConditionGroup).
 * Used by:
 *  - AutomationRow tab badge ("N condizioni")
 *  - AutomationEditor Condizioni tab numeric badge
 */
export function countConditions(node: ConditionNode | null | undefined): number {
  if (!node) return 0;
  if (node.type === 'always_true') return 0;
  if (node.type === 'and' || node.type === 'or') {
    return node.conditions.reduce((sum, c) => sum + countConditions(c), 0);
  }
  return 1; // any leaf
}
