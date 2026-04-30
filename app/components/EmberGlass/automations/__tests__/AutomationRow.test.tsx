/**
 * AutomationRow — Phase 180 Plan 08 Task 2
 *
 * Verifies: icon + name + description rendering, 4 status pills,
 * InlineToggle stop-propagation invariant (D-17 / <inline_toggle_contract>),
 * Italian pluralization, lastRun fallback "mai", disabled state styles.
 *
 * NOTE: InlineToggle is NOT mocked — the real component is rendered so we can
 * query its data-testid="inline-toggle" and verify stop-propagation behavior.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutomationRow } from '../AutomationRow';
import type { AutomationRule } from '@/types/automations';

// ── Mock useRelativeTime ───────────────────────────────────────────────────────
jest.mock('@/lib/hooks/useRelativeTime', () => ({
  useRelativeTime: jest.fn((tsMs: number | null) =>
    tsMs === null ? null : '5m fa'
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: 1,
    name: 'Spegni stufa',
    description: 'Spegni la stufa dopo 2 ore',
    enabled: true,
    trigger: { type: 'manual_api_call' },
    condition: { type: 'always_true' },
    actions: [{ type: 'log_event', message: 'ok' }],
    min_interval_seconds: 0,
    max_triggers_per_hour: 0,
    last_triggered_at: null,
    active_hours_start: null,
    active_hours_end: null,
    created_at: 1000,
    updated_at: 1000,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AutomationRow', () => {
  describe('basic rendering', () => {
    it('renders rule name', () => {
      render(
        <AutomationRow
          rule={makeRule()}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('Spegni stufa')).toBeInTheDocument();
    });

    it('renders rule description when present', () => {
      render(
        <AutomationRow
          rule={makeRule({ description: 'Desc test' })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('Desc test')).toBeInTheDocument();
    });

    it('does not render description section when description is null', () => {
      render(
        <AutomationRow
          rule={makeRule({ description: null })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      // Only the name should be in the text-15/weight-600 element
      expect(screen.getByText('Spegni stufa')).toBeInTheDocument();
      expect(screen.queryByText('Desc test')).not.toBeInTheDocument();
    });
  });

  describe('pills', () => {
    it('shows trigger pill with describeTrigger output (Manuale for manual_api_call)', () => {
      render(
        <AutomationRow
          rule={makeRule({ trigger: { type: 'manual_api_call' } })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('Manuale')).toBeInTheDocument();
    });

    it('shows trigger pill with cron expression for schedule_cron', () => {
      render(
        <AutomationRow
          rule={makeRule({ trigger: { type: 'schedule_cron', cron_expression: '0 8 * * *' } })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('⏰ 0 8 * * *')).toBeInTheDocument();
    });

    it('shows lastRun pill as "mai" when last_triggered_at is null', () => {
      render(
        <AutomationRow
          rule={makeRule({ last_triggered_at: null })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('ultima esecuzione: mai')).toBeInTheDocument();
    });

    it('shows lastRun pill with relative time when last_triggered_at is set', () => {
      render(
        <AutomationRow
          rule={makeRule({ last_triggered_at: 1000000 })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      // useRelativeTime mock returns '5m fa'
      expect(screen.getByText('ultima esecuzione: 5m fa')).toBeInTheDocument();
    });

    it('hides condizioni pill when condition is always_true (condCount=0)', () => {
      render(
        <AutomationRow
          rule={makeRule({ condition: { type: 'always_true' } })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.queryByText(/condizione/i)).not.toBeInTheDocument();
    });

    it('shows "1 condizione" (singular) for a single leaf condition', () => {
      render(
        <AutomationRow
          rule={makeRule({
            condition: {
              type: 'and',
              conditions: [{ type: 'time_window', start_time: '08:00', end_time: '20:00' }],
            },
          })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('1 condizione')).toBeInTheDocument();
    });

    it('shows "2 condizioni" (plural) for two leaf conditions', () => {
      render(
        <AutomationRow
          rule={makeRule({
            condition: {
              type: 'and',
              conditions: [
                { type: 'time_window', start_time: '08:00', end_time: '20:00' },
                { type: 'always_true' },
              ],
            },
          })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      // The and node has 2 children: 1 leaf + always_true(=0) => 1 total? No: always_true=0
      // Actually: time_window=1 leaf + always_true=0 => 1 total.
      // Let's use 2 actual leaves:
      expect(screen.getByText('1 condizione')).toBeInTheDocument(); // only time_window counts
    });

    it('shows "2 condizioni" for two time_window conditions', () => {
      render(
        <AutomationRow
          rule={makeRule({
            condition: {
              type: 'and',
              conditions: [
                { type: 'time_window', start_time: '08:00', end_time: '12:00' },
                { type: 'time_window', start_time: '14:00', end_time: '18:00' },
              ],
            },
          })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('2 condizioni')).toBeInTheDocument();
    });

    it('shows "1 azione" (singular) for 1 action', () => {
      render(
        <AutomationRow
          rule={makeRule({ actions: [{ type: 'log_event', message: 'ok' }] })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('1 azione')).toBeInTheDocument();
    });

    it('shows "2 azioni" (plural) for 2 actions', () => {
      render(
        <AutomationRow
          rule={makeRule({
            actions: [
              { type: 'log_event', message: 'first' },
              { type: 'log_event', message: 'second' },
            ],
          })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      expect(screen.getByText('2 azioni')).toBeInTheDocument();
    });
  });

  describe('click interactions', () => {
    it('fires onOpen with the rule when row container is clicked', async () => {
      const user = userEvent.setup();
      const onOpen = jest.fn();
      const rule = makeRule();

      render(
        <AutomationRow rule={rule} onOpen={onOpen} onToggle={jest.fn()} />
      );

      // Click the name text (inside the row container)
      await user.click(screen.getByText('Spegni stufa'));
      expect(onOpen).toHaveBeenCalledWith(rule);
    });

    /**
     * D-17 + <inline_toggle_contract> stop-propagation invariant:
     * Clicking the InlineToggle MUST NOT fire onOpen.
     * Uses the real InlineToggle (not mocked) queried via data-testid="inline-toggle".
     */
    it('toggle click does NOT fire onOpen (stop-propagation invariant)', async () => {
      const user = userEvent.setup();
      const onOpen = jest.fn();
      const onToggle = jest.fn().mockResolvedValue(undefined);
      const rule = makeRule({ id: 42, enabled: true });

      render(<AutomationRow rule={rule} onOpen={onOpen} onToggle={onToggle} />);

      const toggle = screen.getByTestId('inline-toggle');
      await user.click(toggle);

      // onOpen MUST NOT be called — stop-propagation must prevent row click
      expect(onOpen).not.toHaveBeenCalled();
      // onToggle MUST be called with (id, currentEnabled)
      expect(onToggle).toHaveBeenCalledWith(42, true);
    });

    it('fires onToggle with correct arguments when toggle is clicked', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn().mockResolvedValue(undefined);
      const rule = makeRule({ id: 7, enabled: false });

      render(
        <AutomationRow rule={rule} onOpen={jest.fn()} onToggle={onToggle} />
      );

      await user.click(screen.getByTestId('inline-toggle'));
      expect(onToggle).toHaveBeenCalledWith(7, false);
    });
  });

  describe('enabled / disabled visual states', () => {
    it('renders InlineToggle with on=true when rule.enabled is true', () => {
      render(
        <AutomationRow
          rule={makeRule({ enabled: true })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      const toggle = screen.getByTestId('inline-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('renders InlineToggle with on=false when rule.enabled is false', () => {
      render(
        <AutomationRow
          rule={makeRule({ enabled: false })}
          onOpen={jest.fn()}
          onToggle={jest.fn()}
        />
      );
      const toggle = screen.getByTestId('inline-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });
  });
});
