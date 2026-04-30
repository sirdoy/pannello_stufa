'use client';
/**
 * ActionsSection — Phase 180 Plan 06 Task 3
 * Ordered action list + 11-tile type picker overlay + "+ Aggiungi azione" CTA.
 *
 * Design rules:
 *   - D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 *   - D-09: ACTION_TYPES.length === 11 tiles in picker (never 9)
 *   - BLOCKER 1 fix: LOCKED KeyedAction[] contract — all behavioral invariants below.
 *
 * KeyedAction[] contract (LOCKED per <actions_section_contract> in Plan 06):
 *
 *   1. addAction(typeId) → mints a fresh __key via mintActionKey(defaultAction(typeId))
 *   2. updateAt(idx, next) → preserves __key for in-place field edits;
 *                            mints a NEW __key on type-swap so Plan 07's pruning
 *                            useEffect drops the stale validation entry
 *   3. removeAt(idx) → preserves every other row's __key verbatim
 *   4. moveUp(idx)/moveDown(idx) → preserves every row's __key (only positions change)
 *   5. React key={a.__key} — stable across reorder, NOT key={i}
 *   6. Validation forwarder: emits (a.__key, isValid) upstream — NOT row index
 *   7. NEVER strips __key here — parent (Plan 07) owns stripKeys before API call
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ActionItem } from '@/types/automations';
import type { KeyedAction } from '../lib/with-key';
import { ACTION_TYPES, defaultAction } from '../lib/automations-config';
import { ActionRow } from '../ActionRow';
import { TypeTile } from '../primitives/TypeTile';

export interface ActionsSectionProps {
  /** NOT ActionItem[] — carries per-row stable keys for BLOCKER 1 fix */
  actions: KeyedAction[];
  /** NOT (ActionItem[]) => void — carries KeyedAction[] for type safety */
  onChange: (next: KeyedAction[]) => void;
  /** REQUIRED — provided by parent AutomationEditor (Plan 07) */
  mintActionKey: (action: ActionItem) => KeyedAction;
  /** Keyed validation callback: emits (actionKey: string, isValid: boolean) — NOT row index */
  onValidationChange?: (actionKey: string, isValid: boolean) => void;
}

export function ActionsSection({
  actions,
  onChange,
  mintActionKey,
  onValidationChange,
}: ActionsSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // ── 1. Add: picker tile → append a brand-new keyed row ──────────────────
  const addAction = (id: ActionItem['type']) => {
    onChange([...actions, mintActionKey(defaultAction(id))]);
    setPickerOpen(false);
  };

  // ── 2. Update: field edit preserves __key; type-swap mints NEW __key ─────
  const updateAt = (idx: number, next: ActionItem) => {
    const prev = actions[idx];
    if (!prev) return;
    const wasTypeSwap = prev.type !== next.type;
    const merged: KeyedAction = wasTypeSwap
      ? mintActionKey(next)          // fresh key — type changed → Plan 07 drops stale entry
      : { ...next, __key: prev.__key }; // preserve key — only fields changed
    onChange(actions.map((a, i) => (i === idx ? merged : a)));
  };

  // ── 3. Remove: preserves every other row's __key verbatim ────────────────
  const removeAt = (idx: number) => onChange(actions.filter((_, i) => i !== idx));

  // ── 4. Reorder: only positions change, all __keys preserved ──────────────
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...actions];
    [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
    onChange(next);
  };
  const moveDown = (idx: number) => {
    if (idx === actions.length - 1) return;
    const next = [...actions];
    [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
    onChange(next);
  };

  return (
    <div>
      {/* Intro copy */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-2)',
          marginBottom: 14,
          lineHeight: 1.5,
        }}
      >
        Quando il trigger scatta e le condizioni sono verificate, queste azioni vengono eseguite in
        sequenza.
      </div>

      {/* Empty state */}
      {actions.length === 0 && !pickerOpen && (
        <div
          style={{
            padding: 24,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px dashed rgba(255,255,255,0.12)',
            color: 'var(--text-2)',
            fontSize: 13,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Nessuna azione. Aggiungine almeno una.
        </div>
      )}

      {/* Action rows — React key={a.__key} for stable reconciliation (rule 5) */}
      {actions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {actions.map((a, i) => (
            <ActionRow
              key={a.__key}
              action={a}
              index={i}
              total={actions.length}
              onChange={(next) => updateAt(i, next)}
              onRemove={() => removeAt(i)}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
              // Rule 6: forwarder bridges ActionRow's (isValid: boolean) to parent's (key, isValid)
              onValidationChange={(isValid) => onValidationChange?.(a.__key, isValid)}
            />
          ))}
        </div>
      )}

      {/* Picker overlay or "+ Aggiungi azione" CTA */}
      {pickerOpen ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            padding: 10,
            borderRadius: 14,
          }}
        >
          {/* Picker header */}
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Scegli tipo azione
          </div>

          {/* 2-col tile grid — D-09: exactly 11 tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ACTION_TYPES.map((a) => {
              const Icon = a.Icon;
              return (
                <TypeTile
                  key={a.id}
                  icon={<Icon size={13} />}
                  label={a.label}
                  tone={a.tone}
                  selected={false}
                  onClick={() => addAction(a.id)}
                  aria-label={a.label}
                />
              );
            })}
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '8px 0',
              borderRadius: 9,
              border: '0.5px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Annulla
          </button>
        </div>
      ) : (
        /* Add CTA — full-width dashed button */
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Aggiungi azione"
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px dashed rgba(255,255,255,0.15)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} /> Aggiungi azione
        </button>
      )}
    </div>
  );
}
