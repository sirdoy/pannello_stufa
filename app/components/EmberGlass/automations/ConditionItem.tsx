'use client';
/**
 * Phase 180 — Plan 05 Task 2: ConditionItem.tsx
 *
 * Leaf row with type-select + per-type form + remove button.
 * D-09b (conditions parallel): legacy sensor types rendered as readonly "Tipo non supportato" row
 * (sensor_state_change, netatmo_temperature_threshold); device_state and sensor_threshold share
 * the "Sensore o dispositivo" entry.
 * T-180-05-02: switching type uses defaultCondition (wipes irrelevant fields — no field leakage).
 * D-02: inline-style + var(--token) only.
 */
import { X } from 'lucide-react';
import InlineSelect from '@/app/components/ui/InlineSelect';
import type { ConditionNode } from '@/types/automations';
import { CONDITION_TYPES, defaultCondition } from './lib/automations-config';
import { IconBtn } from './primitives/IconBtn';
import { ConditionForm } from './forms/ConditionForms';

const PICKER_IDS = ['time_window', 'device_state', 'always_true'] as const;
type PickerId = (typeof PICKER_IDS)[number];

export interface ConditionItemProps {
  cond: ConditionNode;
  onChange: (next: ConditionNode) => void;
  onRemove: () => void;
}

export function ConditionItem({ cond, onChange, onRemove }: ConditionItemProps) {
  // Composite nodes are handled by ConditionGroup, never reach ConditionItem
  if (cond.type === 'and' || cond.type === 'or') return null;

  // A threshold on a sensor is edited by the same form as device_state (ROADMAP M70)
  const pickerType = cond.type === 'sensor_threshold' ? 'device_state' : cond.type;

  // Look up tone from catalog; fall back for legacy/unknown types
  const current = CONDITION_TYPES.find((c) => c.id === pickerType);
  const tone = current?.tone ?? 'var(--text-2)';

  // Determine if current cond is a legacy type not in the picker
  const isLegacy = !PICKER_IDS.includes(pickerType as PickerId);

  // Dropdown options: the picker types + (if legacy, show it as an extra non-creatable option)
  const options: Array<{ id: string; label: string }> = [
    ...CONDITION_TYPES.map((c) => ({ id: c.id, label: c.label })),
    ...(isLegacy ? [{ id: cond.type, label: `${cond.type} (legacy)` }] : []),
  ];

  const handleTypeChange = (newType: string) => {
    // Only picker types can be set from the dropdown (T-180-05-02)
    if (newType !== pickerType && (PICKER_IDS as readonly string[]).includes(newType)) {
      onChange(defaultCondition(newType as PickerId));
    }
    // Legacy types cannot be set FROM the dropdown — only preserved if loaded from API
  };

  return (
    <div
      style={{
        padding: 10,
        borderRadius: 12,
        background: `color-mix(in oklab, ${tone} 8%, rgba(255,255,255,0.03))`,
        border: `0.5px solid color-mix(in oklab, ${tone} 18%, rgba(255,255,255,0.06))`,
      }}
    >
      {/* Header: type-select + remove button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <InlineSelect
          size="xs"
          className="min-w-0 flex-1"
          value={pickerType}
          onChange={(e) => handleTypeChange(e.target.value)}
          aria-label="Tipo condizione"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </InlineSelect>
        <IconBtn onClick={onRemove} aria-label="Rimuovi condizione">
          <X size={12} />
        </IconBtn>
      </div>

      {/* Body: per-type form (or legacy fallback) */}
      <ConditionForm cond={cond} onChange={onChange} />
    </div>
  );
}
