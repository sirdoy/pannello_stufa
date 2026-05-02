'use client';
/**
 * AutomationEditor — Plan 07 Task 2
 * Full editor body: name+desc fields + 4-tab nav + 4 sections + footer + dirty-tracking.
 *
 * Design rules:
 *   - D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 *   - D-12: TriggerSection read-only in edit mode (isNew=false)
 *   - D-13: POST full body (create) OR PATCH delta (edit) via parent callbacks
 *   - D-14: Save disabled when name.trim() === '' OR actions.length === 0 OR hasJsonError
 *   - D-15: Unsaved-changes guard via ConfirmationDialog on close attempt when isDirty
 *   - D-16: Delete confirm dialog (danger variant) in edit mode
 *   - BLOCKER 1: actionValidation Map keyed by stable __key (NOT row index);
 *              pruning useEffect drops stale entries on row removal/reorder/type-swap
 *
 * Imports withKey + stripKeys + KeyedAction from lib/with-key.ts
 * (canonical module created by Plan 02 lib foundation, wave 2).
 */
import { useState, useMemo, useEffect } from 'react';
import type {
  AutomationRule,
  AutomationRuleCreate,
  AutomationRulePatch,
  ActionItem,
} from '@/types/automations';
import type { UIDraft, UIConditionGroup } from './types';
import { emptyDraft } from './types';
import { apiToDraft, draftToApi, computePatchDelta } from './lib/automations-mappers';
// KeyedAction + withKey + stripKeys created in Plan 02 (lib/with-key.ts, lib foundation).
// This plan IMPORTS them; it does not create them.
// Plan 06's ActionsSection imports the same module.
import { withKey, stripKeys, type KeyedAction } from './lib/with-key';
import { TextInput } from './primitives/TextInput';
import { FieldLabel } from './primitives/FieldLabel';
import { TriggerSection } from './sections/TriggerSection';
import { ConditionsSection } from './sections/ConditionsSection';
import { ActionsSection } from './sections/ActionsSection';
import { AdvancedSection } from './sections/AdvancedSection';
// ConfirmationDialog ships as a DEFAULT export — `import { ConfirmationDialog }` is incorrect.
// Verified by direct read of app/components/ui/ConfirmationDialog.tsx.
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';

const TABS = ['Trigger', 'Condizioni', 'Azioni', 'Avanzate'] as const;

// ─── Local helpers ────────────────────────────────────────────────────────────

/**
 * Count leaf conditions in the UI draft's UIConditionGroup shape.
 * Avoids double-conversion via the API countConditions function.
 * kind:'cond' = 1 leaf (except always_true => 0); kind:'group' = sum of
 * children; empty = 0.
 *
 * WR-01 (REVIEW iteration 2): mirror countConditions' always_true => 0
 * rule so the editor's tab badge agrees with the AutomationRow pill after
 * save/refetch. Previously a user adding "Sempre vero" saw "Condizioni 1"
 * in the tab while the row showed no condition pill at all.
 */
function countDraftConditions(group: UIConditionGroup): number {
  return group.items.reduce((sum, item) => {
    if (item.kind === 'group') return sum + countDraftConditions(item);
    if ((item as { type?: string }).type === 'always_true') return sum;
    return sum + 1;
  }, 0);
}

/**
 * Recursively sort object keys for stable JSON.stringify dirty comparison.
 * Pitfall 3 fix: different key insertion orders should NOT produce spurious diffs.
 * BLOCKER 1: skip `__key` so adding+removing a row doesn't permanently mark dirty.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        // Skip our internal __key so it never affects dirty comparison.
        if (k === '__key') return acc;
        acc[k] = canonicalize((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AutomationEditorProps {
  /** Existing rule for edit mode; null for create mode. */
  rule: AutomationRule | null;
  /** true for new automations, false for editing existing. */
  isNew: boolean;
  /** Called in create mode — receives the full POST body. */
  onSaveCreate: (body: AutomationRuleCreate) => Promise<void>;
  /** Called in edit mode — receives rule id + PATCH delta. */
  onSavePatch: (id: number, patch: AutomationRulePatch) => Promise<void>;
  /** Called in edit mode — receives rule id. */
  onDelete: (id: number) => Promise<void>;
  /** Called after cancel / unsaved-changes confirm / save success (parent owns Sheet state). */
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AutomationEditor({
  rule,
  isNew,
  onSaveCreate,
  onSavePatch,
  onDelete,
  onClose,
}: AutomationEditorProps) {
  // Build initial draft from API rule (edit) or empty (create).
  // Augment actions with stable __keys immediately on mount.
  //
  // INVARIANT (BL-04 + WR-04, REVIEW iteration 2): The parent MUST set
  // `key={rule.id}` (or 'new') on this component so it remounts whenever
  // the selected rule changes. The empty-deps `useMemo` and the two
  // `useState` initializers below are mount-once: without remount, swapping
  // the `rule` prop would be silently ignored and the editor would stick
  // on whatever rule it first saw. AutomationsTab (the only current caller)
  // satisfies this invariant — do NOT drop that key in future refactors.
  const initial: UIDraft = useMemo(
    () => (rule ? apiToDraft(rule) : emptyDraft()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentional: stable snapshot on mount only — see invariant above
  );
  const initialKeyed: UIDraft = useMemo(
    () => ({ ...initial, actions: initial.actions.map(withKey) }),
    [initial]
  );

  // original is the immutable snapshot for dirty tracking.
  // Mount-once initializer — relies on parent `key={rule.id}` invariant above.
  const [original] = useState<UIDraft>(initialKeyed);
  const [draft, setDraft] = useState<UIDraft>(initialKeyed);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Map<actionKey: string, isValid: boolean>
  // Keyed by stable per-action __key (NOT row index) — BLOCKER 1 fix.
  const [actionValidation, setActionValidation] = useState<Map<string, boolean>>(new Map());

  // BLOCKER 1 fix: prune validation entries whose action no longer exists in draft.actions.
  // Triggers on add (new key appears, no entry → fine), remove (key gone → drop entry),
  // reorder (key positions change but identity preserved → fine),
  // type-swap (parent re-keys → drop stale false entry).
  useEffect(() => {
    const liveKeys = new Set(
      (draft.actions as KeyedAction[]).map((a) => a.__key)
    );
    setActionValidation((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const k of next.keys()) {
        if (!liveKeys.has(k)) {
          next.delete(k);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [draft.actions]);

  // ─── Derived values ────────────────────────────────────────────────────────

  const baseline = isNew ? emptyDraft() : original;
  const isDirty =
    JSON.stringify(canonicalize(baseline)) !== JSON.stringify(canonicalize(draft));

  const hasJsonError = Array.from(actionValidation.values()).some((v) => v === false);
  const saveAllowed =
    draft.name.trim().length >= 1 &&
    draft.actions.length >= 1 &&
    !hasJsonError;

  const condCount = countDraftConditions(draft.conditions);
  const actionCount = draft.actions.length;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const requestClose = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    onClose();
  };

  const handleSave = async () => {
    // T-180-07-01: handleSave guard — even if caller bypasses disabled attr via JS.
    if (!saveAllowed) return;
    // Strip internal __key fields before serializing for API (BLOCKER 1 — no __key on wire).
    const draftForApi: UIDraft = {
      ...draft,
      actions: stripKeys(draft.actions as KeyedAction[]),
    };
    const apiBody = draftToApi(draftForApi);
    if (isNew || !rule) {
      await onSaveCreate(apiBody);
    } else {
      // D-13: PATCH delta — computePatchDelta never includes `trigger` (TypeScript-enforced).
      const patch = computePatchDelta(rule, apiBody as unknown as AutomationRule);
      await onSavePatch(rule.id, patch);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!rule) return;
    setShowDeleteDialog(false);
    await onDelete(rule.id);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Name + Description block (18px margin-bottom; 10px spacer between fields) */}
      <div style={{ marginBottom: 18 }}>
        <FieldLabel htmlFor="rule-name">Nome</FieldLabel>
        <TextInput
          id="rule-name"
          value={draft.name}
          onChange={(v) => setDraft({ ...draft, name: v })}
          placeholder="Es. Buongiorno"
          aria-label="Nome automazione"
        />
        <div style={{ height: 10 }} />
        <FieldLabel htmlFor="rule-desc">Descrizione</FieldLabel>
        <TextInput
          id="rule-desc"
          value={draft.description ?? ''}
          onChange={(v) => setDraft({ ...draft, description: v === '' ? null : v })}
          placeholder="Breve descrizione"
          aria-label="Descrizione automazione"
        />
      </div>

      {/* 4-tab segmented control (16px margin-bottom) */}
      <div
        role="tablist"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          padding: 4,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          marginBottom: 16,
        }}
      >
        {TABS.map((tab, i) => {
          const active = activeTab === i;
          // Badge visible on Condizioni (i=1) and Azioni (i=2) tabs when count > 0.
          const badgeCount = i === 1 ? condCount : i === 2 ? actionCount : 0;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '8px 4px',
                borderRadius: 9,
                border: 'none',
                background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
                color: active ? '#fff' : 'var(--text-2)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {tab}
              {(i === 1 || i === 2) && badgeCount > 0 && (
                <span
                  aria-label={`${badgeCount} ${i === 1 ? 'condizioni' : 'azioni'}`}
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 999,
                  }}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active section body — render one at a time (D-04) */}
      {activeTab === 0 && (
        <TriggerSection
          trigger={draft.trigger}
          onChange={(t) => setDraft({ ...draft, trigger: t })}
          isNew={isNew}
        />
      )}
      {activeTab === 1 && (
        <ConditionsSection
          group={draft.conditions}
          onChange={(g) => setDraft({ ...draft, conditions: g as UIConditionGroup })}
        />
      )}
      {activeTab === 2 && (
        <ActionsSection
          actions={draft.actions as KeyedAction[]}
          onChange={(a) => setDraft({ ...draft, actions: a })}
          // BLOCKER 1: forward stable key + isValid to parent's Map (NOT row index).
          onValidationChange={(actionKey: string, isValid: boolean) =>
            setActionValidation((prev) => {
              const next = new Map(prev);
              next.set(actionKey, isValid);
              return next;
            })
          }
          // Mint a new __key when a row is added or its type swapped.
          // This forces the old validation entry to be pruned by the useEffect above.
          mintActionKey={withKey}
        />
      )}
      {activeTab === 3 && (
        <AdvancedSection
          minInterval={draft.min_interval_seconds}
          maxPerHour={draft.max_triggers_per_hour}
          onMinIntervalChange={(v) => setDraft({ ...draft, min_interval_seconds: v })}
          onMaxPerHourChange={(v) => setDraft({ ...draft, max_triggers_per_hour: v })}
        />
      )}

      {/* Inline JSON error row (between section body and footer when hasJsonError) */}
      {hasJsonError && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#ff6676',
            marginTop: 12,
          }}
        >
          JSON non valido
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 24,
          marginBottom: 20,
        }}
      >
        {/* Elimina — edit mode only (D-16) */}
        {!isNew && rule && (
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            style={{
              height: 46,
              flex: '0 0 auto',
              padding: '0 16px',
              borderRadius: 12,
              color: '#ff6676',
              background: 'rgba(255,102,118,0.08)',
              border: '0.5px solid rgba(255,102,118,0.25)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Elimina
          </button>
        )}

        {/* Annulla */}
        <button
          type="button"
          onClick={requestClose}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: '0.5px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Annulla
        </button>

        {/* Salva — D-14 three-layer guard: disabled attr + aria-disabled + handleSave guard */}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!saveAllowed}
          aria-disabled={!saveAllowed}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: 'none',
            background: saveAllowed ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
            boxShadow: saveAllowed
              ? '0 4px 20px color-mix(in oklab, var(--accent) 40%, transparent)'
              : 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: saveAllowed ? 'pointer' : 'not-allowed',
          }}
        >
          {isNew ? 'Crea automazione' : 'Salva modifiche'}
        </button>
      </div>

      {/* Unsaved-changes dialog (D-15) — default import per <confirmation_dialog_contract> */}
      <ConfirmationDialog
        isOpen={showUnsavedDialog}
        onClose={() => setShowUnsavedDialog(false)}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          onClose();
        }}
        title="Hai modifiche non salvate. Chiudere lo stesso?"
        confirmLabel="Chiudi senza salvare"
        cancelLabel="Continua a modificare"
        variant="default"
      />

      {/* Delete confirm dialog (D-16) — danger variant; edit mode only */}
      {!isNew && rule && (
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={() => void handleDeleteConfirm()}
          title={`Eliminare l'automazione "${rule.name}"?`}
          confirmLabel="Elimina"
          cancelLabel="Annulla"
          variant="danger"
        />
      )}
    </div>
  );
}
