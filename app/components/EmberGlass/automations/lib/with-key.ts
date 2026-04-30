import type { ActionItem } from '@/types/automations';

let counter = 0;

/**
 * UI-only augmentation: a stable per-row key so the editor can track
 * per-action validation results across reorder / remove / type-swap
 * without leaking stale entries (BLOCKER 1 fix in Plan 07).
 *
 * `__key` is STRIPPED before any API call (see stripKeys below).
 */
export type KeyedAction = ActionItem & { __key: string };

/**
 * Mint a stable `__key` for a brand-new row OR for a type-swapped row
 * whose previous `__key` must be invalidated. Idempotent given the
 * caller controls when to mint.
 */
export const withKey = (action: ActionItem): KeyedAction => ({
  ...action,
  __key: `act_${Date.now()}_${++counter}`,
});

/**
 * Strip `__key` from every row before serializing for the API.
 * Used by AutomationEditor.handleSave (Plan 07); never call from forms/sections.
 */
export const stripKeys = (actions: KeyedAction[]): ActionItem[] =>
  actions.map(({ __key, ...rest }) => {
    void __key;
    return rest as ActionItem;
  });
