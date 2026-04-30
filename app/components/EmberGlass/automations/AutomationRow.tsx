'use client';

/**
 * AutomationRow — Phase 180 Plan 08 Task 2
 *
 * Glass row card with icon + name + description + InlineToggle + 4 status pills.
 *
 * Design rules:
 *  - D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 *  - D-17: InlineToggle MUST stop propagation via wrapper div + onChange e.stopPropagation()
 *    per <inline_toggle_contract> so the row's onClick (onOpen) does not fire on toggle.
 *  - D-20: lastRun pill uses useRelativeTime(last_triggered_at * 1000); shows "mai" when null.
 *
 * Bundle source: automations.jsx lines 172-212
 */

import { Zap } from 'lucide-react';
import type { AutomationRule } from '@/types/automations';
import { useRelativeTime } from '@/lib/hooks/useRelativeTime';
// InlineToggle is a NAMED export — verified by direct read of InlineToggle.tsx.
import { InlineToggle } from '../InlineToggle';
import { TRIGGER_TYPES } from './lib/automations-config';
import { describeTrigger } from './lib/describeTrigger';
import { countConditions } from './lib/countConditions';
import { Pill } from './primitives/Pill';

export interface AutomationRowProps {
  rule: AutomationRule;
  /** Called when the user clicks anywhere on the row except the toggle. */
  onOpen: (rule: AutomationRule) => void;
  /** Called when the InlineToggle is clicked. Receives (id, currentEnabled). */
  onToggle: (id: number, currentEnabled: boolean) => Promise<void>;
}

export function AutomationRow({ rule, onOpen, onToggle }: AutomationRowProps) {
  const triggerMeta = TRIGGER_TYPES.find((t) => t.id === rule.trigger?.type);
  const tone = triggerMeta?.tone ?? 'var(--text-2)';
  const Icon = triggerMeta?.Icon ?? Zap;

  const condCount = countConditions(rule.condition);
  const actionCount = rule.actions.length;

  // D-20: Unix seconds → milliseconds; useRelativeTime returns null when tsMs is null.
  const lastRun = useRelativeTime(
    rule.last_triggered_at != null ? rule.last_triggered_at * 1000 : null
  );

  const containerBg = rule.enabled
    ? `linear-gradient(135deg, color-mix(in oklab, ${tone} 10%, rgba(255,255,255,0.04)) 0%, rgba(255,255,255,0.03) 100%)`
    : 'rgba(255,255,255,0.03)';
  const containerBorder = rule.enabled
    ? `0.5px solid color-mix(in oklab, ${tone} 22%, rgba(255,255,255,0.06))`
    : '0.5px solid rgba(255,255,255,0.06)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(rule)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(rule);
        }
      }}
      aria-label={`Apri automazione ${rule.name}`}
      style={{
        borderRadius: 'var(--r-card)',
        padding: 14,
        background: containerBg,
        border: containerBorder,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header row: icon + name/description + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        {/* Icon container */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            flexShrink: 0,
            background: rule.enabled
              ? `color-mix(in oklab, ${tone} 18%, transparent)`
              : 'rgba(255,255,255,0.05)',
            color: rule.enabled ? tone : 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} />
        </div>

        {/* Name + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {rule.name}
          </div>
          {rule.description && (
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 400,
                color: 'var(--text-2)',
                lineHeight: 1.4,
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {rule.description}
            </div>
          )}
        </div>

        {/*
          D-17 + <inline_toggle_contract> double stop-propagation pattern (Pattern A):
          - Outer wrapper div: stops mouse-click bubbling even before onChange fires.
          - InlineToggle onChange: stops propagation in the event handler itself.
          Both are required for belt-and-suspenders coverage (keyboard + pointer events).
        */}
        <div onClick={(e) => e.stopPropagation()}>
          <InlineToggle
            on={rule.enabled}
            color={tone}
            onChange={(e) => {
              e.stopPropagation();
              void onToggle(rule.id, rule.enabled);
            }}
          />
        </div>
      </div>

      {/* Pills row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {/* Pill 1: Trigger (tone-colored) */}
        <Pill tone={tone}>{describeTrigger(rule.trigger)}</Pill>

        {/* Pill 2: Condizioni (neutral, hidden when count=0) */}
        {condCount > 0 && (
          <Pill>{condCount === 1 ? '1 condizione' : `${condCount} condizioni`}</Pill>
        )}

        {/* Pill 3: Azioni (neutral, hidden when count=0) */}
        {actionCount > 0 && (
          <Pill>{actionCount === 1 ? '1 azione' : `${actionCount} azioni`}</Pill>
        )}

        {/* Pill 4: Last run (muted) */}
        <Pill muted>ultima esecuzione: {lastRun ?? 'mai'}</Pill>
      </div>
    </div>
  );
}
