'use client';
/**
 * TriggerSection — 2-tile type picker + per-type config panel + edit-mode read-only
 *
 * Bundle source: automations.jsx lines 325-345
 * D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 * D-08: exactly 2 tiles (schedule_cron + manual_api_call) — NOT 5. API truth wins.
 * D-12: in edit mode (isNew=false), tiles are disabled + inline note above grid.
 *
 * Security T-180-04-02 — 3 layers of disabled tile protection:
 *   1. onClick={isNew ? handler : undefined} — handler structurally absent
 *   2. TypeTile disabled prop → pointerEvents: none (CSS-level)
 *   3. aria-disabled="true" on TypeTile button (semantic)
 *
 * Security T-180-04-03 — D-08c: TRIGGER_TYPES is a 2-element tuple so UI
 *   cannot render a 3rd tile; backend would 422 on save anyway.
 */
import type { TriggerType } from '@/types/automations';
import { TRIGGER_TYPES, defaultTrigger } from '../lib/automations-config';
import { TypeTile } from '../primitives/TypeTile';
import { TriggerForm } from '../forms/TriggerForms';

export interface TriggerSectionProps {
  trigger: TriggerType | null;
  onChange: (next: TriggerType) => void;
  isNew: boolean;
}

export function TriggerSection({ trigger, onChange, isNew }: TriggerSectionProps) {
  const selectedTone = trigger
    ? (TRIGGER_TYPES.find((t) => t.id === trigger.type)?.tone ?? 'var(--text-2)')
    : 'var(--text-2)';

  return (
    <div>
      {/* D-12 edit-mode inline note above tile grid */}
      {!isNew && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-2)',
            marginBottom: 10,
          }}
        >
          Per cambiare il trigger, elimina e ricrea l&apos;automazione.
        </div>
      )}

      {/* 2-tile grid — D-08 lock: TRIGGER_TYPES has exactly 2 entries */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {TRIGGER_TYPES.map((t) => {
          const Icon = t.Icon;
          return (
            <TypeTile
              key={t.id}
              icon={<Icon size={13} />}
              label={t.label}
              desc={t.desc}
              tone={t.tone}
              selected={trigger?.type === t.id}
              disabled={!isNew}
              onClick={
                isNew
                  ? () => {
                      // Only fire onChange when switching to a different type
                      if (trigger?.type !== t.id) {
                        onChange(defaultTrigger(t.id));
                      }
                    }
                  : undefined
              }
              aria-label={t.label}
            />
          );
        })}
      </div>

      {/* Config panel — tone-colored bg + border from selected trigger type */}
      {trigger && (
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background: `color-mix(in oklab, ${selectedTone} 8%, rgba(255,255,255,0.03))`,
            border: `0.5px solid color-mix(in oklab, ${selectedTone} 20%, rgba(255,255,255,0.06))`,
          }}
        >
          <TriggerForm trigger={trigger} onChange={onChange} isNew={isNew} />
        </div>
      )}
    </div>
  );
}
