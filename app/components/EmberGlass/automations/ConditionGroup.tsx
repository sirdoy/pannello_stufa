'use client';
/**
 * Phase 180 — Plan 05 Task 3: ConditionGroup.tsx
 *
 * Recursive AND/OR group editor with:
 * - Operator toggle (AND ↔ OR) with Italian labels and opColors
 * - Depth-aware left sidebar (only at depth > 0)
 * - Item separators rendered BETWEEN items
 * - "+ Condizione" always visible; "+ Gruppo X" ABSENT (not just disabled) at depth >= 2 (D-11)
 * - Children dispatch: kind='cond' → ConditionItem, kind='group' → ConditionGroup (depth+1)
 * D-02: inline-style + var(--token) only.
 */
import type { UIConditionGroup, UIConditionLeaf, UIConditionNode } from './types';
import type { ConditionNode } from '@/types/automations';
import { defaultCondition } from './lib/automations-config';
import { ConditionItem } from './ConditionItem';
import { AddChip } from './primitives/AddChip';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum nesting depth. + Gruppo button is hidden when depth >= MAX_DEPTH (D-11). */
const MAX_DEPTH = 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const opColor = (op: 'AND' | 'OR') => (op === 'AND' ? '#5eafff' : '#ffb84a');
const opLabel = (op: 'AND' | 'OR') => (op === 'AND' ? 'TUTTE (E)' : 'ALMENO UNA (O)');
const opShort = (op: 'AND' | 'OR') => (op === 'AND' ? 'E' : 'O');
const oppositeOp = (op: 'AND' | 'OR'): 'AND' | 'OR' => (op === 'AND' ? 'OR' : 'AND');

// ─── ConditionGroup ──────────────────────────────────────────────────────────

export interface ConditionGroupProps {
  group: UIConditionGroup;
  depth: number;
  onChange: (next: UIConditionGroup) => void;
}

export function ConditionGroup({ group, depth, onChange }: ConditionGroupProps) {
  const oc = opColor(group.op);

  const toggleOp = () => onChange({ ...group, op: oppositeOp(group.op) });

  const addCondition = () =>
    onChange({
      ...group,
      items: [
        ...group.items,
        { kind: 'cond', ...defaultCondition('time_window') } as UIConditionLeaf,
      ],
    });

  const addGroup = () =>
    onChange({
      ...group,
      items: [
        ...group.items,
        { kind: 'group', op: oppositeOp(group.op), items: [] } satisfies UIConditionGroup,
      ],
    });

  const updateItem = (idx: number, next: UIConditionNode) => {
    const items = group.items.map((x, i) => (i === idx ? next : x));
    onChange({ ...group, items });
  };

  const removeItem = (idx: number) => {
    const items = group.items.filter((_, i) => i !== idx);
    onChange({ ...group, items });
  };

  const counter =
    group.items.length === 0
      ? 'vuoto'
      : group.items.length === 1
        ? '1 elemento'
        : `${group.items.length} elementi`;

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* Left sidebar — only at depth > 0 */}
      {depth > 0 && (
        <div
          style={{
            width: 2,
            background: `color-mix(in oklab, ${oc} 35%, transparent)`,
            alignSelf: 'stretch',
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Header: operator toggle + counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={toggleOp}
            aria-label={`Operatore gruppo: ${opLabel(group.op)}`}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: `0.5px solid color-mix(in oklab, ${oc} 30%, transparent)`,
              background: `color-mix(in oklab, ${oc} 20%, transparent)`,
              color: oc,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {opLabel(group.op)}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{counter}</span>
        </div>

        {/* Items with separators between them */}
        {group.items.map((item, i) => (
          <div key={i}>
            {/* Separator BETWEEN items (not before first, not after last) */}
            {i > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: '0 0 8px 0',
                  fontSize: 10,
                  color: oc,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                }}
              >
                <div
                  style={{
                    height: 1,
                    width: 12,
                    background: `color-mix(in oklab, ${oc} 40%, transparent)`,
                  }}
                />
                <span>{opShort(group.op)}</span>
                <div
                  style={{
                    height: 1,
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                  }}
                />
              </div>
            )}
            {item.kind === 'cond' ? (
              <ConditionItem
                cond={item as unknown as ConditionNode}
                onChange={(next) =>
                  updateItem(i, { kind: 'cond', ...(next as object) } as UIConditionLeaf)
                }
                onRemove={() => removeItem(i)}
              />
            ) : (
              <ConditionGroup
                group={item}
                depth={depth + 1}
                onChange={(next) => updateItem(i, next)}
              />
            )}
          </div>
        ))}

        {/* Footer: + Condizione always; + Gruppo X ABSENT when depth >= MAX_DEPTH (D-11) */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <AddChip onClick={addCondition} aria-label="Aggiungi condizione">
            + Condizione
          </AddChip>
          {depth < MAX_DEPTH && (
            <AddChip onClick={addGroup} aria-label="Aggiungi gruppo">
              + Gruppo {opShort(oppositeOp(group.op))}
            </AddChip>
          )}
        </div>
      </div>
    </div>
  );
}
