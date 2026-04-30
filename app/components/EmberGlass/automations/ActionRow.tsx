'use client';
/**
 * ActionRow — Phase 180 Plan 06 Task 2
 * Numbered card with type-select dropdown + per-type form body + ↑/↓/remove IconBtns.
 *
 * Design rules:
 *   - D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 *   - D-09b: unknown action types (not in ACTION_TYPES) render fallback "Tipo non supportato — {type}"
 *     as a read-only option in the select + fallback body. No crash. Fail-open.
 *   - T-180-06-06: legacy type literals shown in dropdown (accepted risk — public API surface)
 *
 * ActionRow does NOT know about __key — that lives in ActionsSection (parent).
 */

import { ChevronUp, ChevronDown, X } from 'lucide-react';
import type { ActionItem } from '@/types/automations';
import { ACTION_TYPES, defaultAction } from './lib/automations-config';
import { IconBtn } from './primitives/IconBtn';
import { ActionForm } from './forms/ActionForms';

const KNOWN_TYPE_IDS = new Set(ACTION_TYPES.map((a) => a.id));

export interface ActionRowProps {
  action: ActionItem;
  index: number;
  total: number;
  onChange: (next: ActionItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function ActionRow({
  action,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onValidationChange,
}: ActionRowProps) {
  const meta = ACTION_TYPES.find((a) => a.id === action.type);
  const isLegacy = !KNOWN_TYPE_IDS.has(action.type as ActionItem['type']);
  const tone = meta?.tone ?? 'var(--text-2)';
  const Icon = meta?.Icon;

  const handleTypeChange = (newType: string) => {
    if (KNOWN_TYPE_IDS.has(newType as ActionItem['type'])) {
      // Full reset — no partial preservation of previous action fields (T-180-06-04)
      onChange(defaultAction(newType as ActionItem['type']));
    }
  };

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: `color-mix(in oklab, ${tone} 8%, rgba(255,255,255,0.03))`,
        border: `0.5px solid color-mix(in oklab, ${tone} 18%, rgba(255,255,255,0.06))`,
      }}
    >
      {/* ── Header row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        {/* Number badge */}
        <span
          aria-label={`Azione numero ${index + 1}`}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-2)',
            fontSize: 10,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>

        {/* Icon area */}
        {Icon && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `color-mix(in oklab, ${tone} 20%, rgba(255,255,255,0.05))`,
              color: tone,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={13} />
          </div>
        )}

        {/* Type select */}
        <select
          value={action.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          aria-label="Tipo azione"
          style={{
            flex: 1,
            height: 28,
            borderRadius: 7,
            background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            color: '#fff',
            padding: '0 8px',
            fontSize: 12,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {ACTION_TYPES.map((a) => (
            <option key={a.id} value={a.id} style={{ color: '#000' }}>
              {a.label}
            </option>
          ))}
          {/* D-09b: legacy type rendered as 12th read-only option */}
          {isLegacy && (
            <option value={action.type} style={{ color: '#000' }}>
              {action.type} (legacy)
            </option>
          )}
        </select>

        {/* Reorder + remove */}
        <IconBtn
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Sposta su"
        >
          <ChevronUp size={12} />
        </IconBtn>
        <IconBtn
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Sposta giù"
        >
          <ChevronDown size={12} />
        </IconBtn>
        <IconBtn onClick={onRemove} aria-label="Rimuovi azione">
          <X size={12} />
        </IconBtn>
      </div>

      {/* ── Body: form or fallback ── */}
      {isLegacy ? (
        <div style={{ fontSize: 12, color: 'var(--text-2)', padding: 4 }}>
          Tipo non supportato —{' '}
          <code style={{ fontFamily: 'ui-monospace, monospace' }}>{action.type}</code>
        </div>
      ) : (
        <ActionForm
          action={action}
          onChange={onChange}
          onValidationChange={onValidationChange}
        />
      )}
    </div>
  );
}
