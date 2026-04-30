'use client';
/**
 * Phase 180 — Plan 05 Task 3: ConditionsSection.tsx
 *
 * Wrapper section for the Conditions tab.
 * Renders intro copy + ConditionGroup at depth 0 (D-10 always-AND root).
 * D-02: inline-style + var(--token) only.
 */
import type { UIConditionGroup } from '../types';
import { ConditionGroup } from '../ConditionGroup';

export interface ConditionsSectionProps {
  group: UIConditionGroup;
  onChange: (next: UIConditionGroup) => void;
}

export function ConditionsSection({ group, onChange }: ConditionsSectionProps) {
  return (
    <div>
      {/* Intro copy — UI-SPEC §Copywriting Contract + bundle line 413 */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-2)',
          marginBottom: 14,
          lineHeight: 1.5,
        }}
      >
        Le condizioni devono essere soddisfatte affinché le azioni vengano eseguite. Puoi
        combinarle con E/O e annidare gruppi.
      </div>

      {/* Root ConditionGroup at depth 0 (D-10) */}
      <ConditionGroup group={group} depth={0} onChange={onChange} />
    </div>
  );
}
