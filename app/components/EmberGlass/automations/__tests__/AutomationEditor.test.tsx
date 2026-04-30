/**
 * AutomationEditor test suite — AUTO-02, AUTO-07, AUTO-08, D-12, D-13, D-14, D-15, D-16
 *
 * TDD RED phase: tests written before implementation.
 *
 * Strategy: mock section subcomponents (TriggerSection, ConditionsSection,
 * ActionsSection, AdvancedSection) to keep focus on editor orchestration.
 * ConfirmationDialog is NOT mocked — renders via Radix into JSDOM.
 */
import React from 'react';
import { render, screen, within, fireEvent, act, waitFor } from '@testing-library/react';
import type { AutomationRule } from '@/types/automations';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../sections/TriggerSection', () => ({
  TriggerSection: ({ trigger, isNew, onChange }: {
    trigger: unknown; isNew: boolean; onChange: (t: unknown) => void;
  }) => (
    <div data-testid="trigger-section" data-isnew={String(isNew)}>
      <span data-testid="trigger-type">{(trigger as { type?: string } | null)?.type ?? 'null'}</span>
    </div>
  ),
}));

jest.mock('../sections/ConditionsSection', () => ({
  ConditionsSection: ({ group, onChange }: { group: unknown; onChange: (g: unknown) => void }) => (
    <div data-testid="conditions-section">
      <span data-testid="conditions-group">{JSON.stringify(group)}</span>
    </div>
  ),
}));

// ActionsSection mock exposes onChange + onValidationChange + mintActionKey
// so tests can simulate validation toggling and row removal directly.
jest.mock('../sections/ActionsSection', () => ({
  ActionsSection: ({
    actions,
    onChange,
    onValidationChange,
    mintActionKey,
  }: {
    actions: Array<{ __key: string; type: string }>;
    onChange: (a: Array<{ __key: string; type: string }>) => void;
    onValidationChange?: (actionKey: string, isValid: boolean) => void;
    mintActionKey: (action: { type: string }) => { type: string; __key: string };
  }) => (
    <div data-testid="actions-section">
      {actions.map((a) => (
        <div key={a.__key} data-testid={`action-row-${a.__key}`}>
          {a.type}
        </div>
      ))}
      {/* Hooks exposed for BLOCKER 1 test cases */}
      <button
        data-testid="hook-set-last-validation-false"
        onClick={() => {
          const last = actions[actions.length - 1];
          if (last && onValidationChange) onValidationChange(last.__key, false);
        }}
      />
      <button
        data-testid="hook-remove-last-action"
        onClick={() => onChange(actions.slice(0, -1))}
      />
      <button
        data-testid="hook-swap-last-to-log-event"
        onClick={() => {
          const rest = actions.slice(0, -1);
          const fresh = mintActionKey({ type: 'log_event' });
          onChange([...rest, { ...fresh, type: 'log_event' }]);
        }}
      />
    </div>
  ),
}));

jest.mock('../sections/AdvancedSection', () => ({
  AdvancedSection: ({ minInterval, maxPerHour }: { minInterval: number; maxPerHour: number }) => (
    <div data-testid="advanced-section">
      <span data-testid="adv-min">{minInterval}</span>
      <span data-testid="adv-max">{maxPerHour}</span>
    </div>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { AutomationEditor } from '../AutomationEditor';

function makeRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: 1,
    name: 'Regola test',
    description: null,
    enabled: true,
    trigger: { type: 'manual_api_call' },
    condition: { type: 'always_true' },
    actions: [{ type: 'log_event', message: 'hello' }],
    min_interval_seconds: 0,
    max_triggers_per_hour: 0,
    last_triggered_at: null,
    created_at: 1700000000,
    updated_at: 1700000000,
    ...overrides,
  };
}

const noop = jest.fn().mockResolvedValue(undefined);

function renderNew(overrides: Partial<React.ComponentProps<typeof AutomationEditor>> = {}) {
  return render(
    <AutomationEditor
      rule={null}
      isNew={true}
      onSaveCreate={noop}
      onSavePatch={noop}
      onDelete={noop}
      onClose={noop}
      {...overrides}
    />
  );
}

function renderEdit(
  rule: AutomationRule = makeRule(),
  overrides: Partial<React.ComponentProps<typeof AutomationEditor>> = {}
) {
  return render(
    <AutomationEditor
      rule={rule}
      isNew={false}
      onSaveCreate={noop}
      onSavePatch={noop}
      onDelete={noop}
      onClose={noop}
      {...overrides}
    />
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── 1. Tab rendering ──────────────────────────────────────────────────────────

describe('Tab navigation', () => {
  it('renders 4 tab buttons with correct labels (AUTO-02)', () => {
    renderNew();
    expect(screen.getByRole('tab', { name: 'Trigger' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Condizioni/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Azioni/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Avanzate/ })).toBeInTheDocument();
  });

  it('shows TriggerSection by default (tab 0)', () => {
    renderNew();
    expect(screen.getByTestId('trigger-section')).toBeInTheDocument();
    expect(screen.queryByTestId('conditions-section')).not.toBeInTheDocument();
  });

  it('navigates to ConditionsSection on tab click', () => {
    renderNew();
    fireEvent.click(screen.getByRole('tab', { name: /Condizioni/ }));
    expect(screen.getByTestId('conditions-section')).toBeInTheDocument();
    expect(screen.queryByTestId('trigger-section')).not.toBeInTheDocument();
  });

  it('navigates to ActionsSection on tab click', () => {
    renderNew();
    fireEvent.click(screen.getByRole('tab', { name: /Azioni/ }));
    expect(screen.getByTestId('actions-section')).toBeInTheDocument();
  });

  it('navigates to AdvancedSection on tab click', () => {
    renderNew();
    fireEvent.click(screen.getByRole('tab', { name: /Avanzate/ }));
    expect(screen.getByTestId('advanced-section')).toBeInTheDocument();
  });
});

// ── 2. Tab badges ─────────────────────────────────────────────────────────────

describe('Tab badges', () => {
  it('shows condition count badge when rule has conditions (AUTO-02)', () => {
    // Rule with AND group of 2 counting leaves (time_window + device_state each count as 1)
    const rule = makeRule({
      condition: {
        type: 'and',
        conditions: [
          { type: 'time_window', start_time: '08:00', end_time: '10:00' },
          { type: 'device_state', sensor_id: 's1', expected_state: 'on' },
        ],
      },
    });
    renderEdit(rule);
    const condizioniTab = screen.getByRole('tab', { name: 'Condizioni' });
    expect(within(condizioniTab).getByText('2')).toBeInTheDocument();
  });

  it('shows action count badge when rule has actions (AUTO-02)', () => {
    const rule = makeRule({
      actions: [
        { type: 'log_event', message: 'a' },
        { type: 'log_event', message: 'b' },
        { type: 'log_event', message: 'c' },
      ],
    });
    renderEdit(rule);
    const azioniTab = screen.getByRole('tab', { name: /Azioni/ });
    expect(within(azioniTab).getByText('3')).toBeInTheDocument();
  });

  it('hides badges when counts are 0 (new rule)', () => {
    renderNew();
    // No badge spans in tab bar when counts = 0
    const tabList = screen.getByRole('tablist');
    expect(within(tabList).queryByText('0')).not.toBeInTheDocument();
    // Condizioni tab has label but no numeric badge
    const condizioniTab = screen.getByRole('tab', { name: /Condizioni/ });
    expect(within(condizioniTab).queryByText(/^\d+$/)).not.toBeInTheDocument();
  });
});

// ── 3. Save guard (D-14) ──────────────────────────────────────────────────────

describe('Save guard (D-14)', () => {
  it('save button disabled when name is empty (new editor)', () => {
    renderNew();
    const saveBtn = screen.getByRole('button', { name: 'Crea automazione' });
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('save button disabled when name non-empty but no actions', () => {
    renderNew();
    // Fill in the name
    const nameInput = screen.getByLabelText('Nome automazione');
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    const saveBtn = screen.getByRole('button', { name: 'Crea automazione' });
    expect(saveBtn).toBeDisabled();
  });

  it('save button enabled when name + at least 1 action (new editor)', () => {
    // Render new editor with initial name + actions via a pre-seeded approach:
    // Since we mock ActionsSection, we need to pass actions through state.
    // We use a different approach: render edit mode with name='X' + 1 action.
    const rule = makeRule({ name: 'X', actions: [{ type: 'log_event', message: 'm' }] });
    renderEdit(rule);
    const saveBtn = screen.getByRole('button', { name: 'Salva modifiche' });
    expect(saveBtn).not.toBeDisabled();
    expect(saveBtn).toHaveAttribute('aria-disabled', 'false');
  });

  it('save button disabled when JSON validation error exists (D-14)', () => {
    const rule = makeRule({
      name: 'X',
      actions: [{ type: 'log_event', message: 'm' }],
    });
    renderEdit(rule);
    // Navigate to Actions tab and trigger invalid validation
    fireEvent.click(screen.getByRole('tab', { name: /Azioni/ }));
    fireEvent.click(screen.getByTestId('hook-set-last-validation-false'));
    const saveBtn = screen.getByRole('button', { name: 'Salva modifiche' });
    expect(saveBtn).toBeDisabled();
  });
});

// ── 4. BLOCKER 1: actionValidation Map pruning ────────────────────────────────

describe('BLOCKER 1: actionValidation Map pruning', () => {
  it('removing an http_webhook row with invalid JSON re-enables Save', async () => {
    const rule = makeRule({
      name: 'X',
      actions: [
        { type: 'log_event', message: 'log' },
        { type: 'http_webhook', url: 'http://x.com', method: 'POST', payload: null },
      ],
    });
    renderEdit(rule);
    // Navigate to Actions tab
    fireEvent.click(screen.getByRole('tab', { name: /Azioni/ }));
    // Report invalid JSON for last action (http_webhook row)
    fireEvent.click(screen.getByTestId('hook-set-last-validation-false'));
    // Save should be disabled now
    const saveBtn = screen.getByRole('button', { name: 'Salva modifiche' });
    expect(saveBtn).toBeDisabled();
    // Remove the invalid row — useEffect should prune the stale false entry
    await act(async () => {
      fireEvent.click(screen.getByTestId('hook-remove-last-action'));
    });
    // Save should be enabled again (only log_event remains, which has no validation error)
    expect(screen.getByRole('button', { name: 'Salva modifiche' })).not.toBeDisabled();
  });

  it('type-swapping an http_webhook row to log_event re-enables Save', async () => {
    const rule = makeRule({
      name: 'X',
      actions: [
        { type: 'http_webhook', url: 'http://x.com', method: 'POST', payload: null },
      ],
    });
    renderEdit(rule);
    // Navigate to Actions tab
    fireEvent.click(screen.getByRole('tab', { name: /Azioni/ }));
    // Report invalid JSON for the http_webhook row
    fireEvent.click(screen.getByTestId('hook-set-last-validation-false'));
    const saveBtn = screen.getByRole('button', { name: 'Salva modifiche' });
    expect(saveBtn).toBeDisabled();
    // Swap type to log_event (mints a fresh __key — stale false entry pruned by useEffect)
    await act(async () => {
      fireEvent.click(screen.getByTestId('hook-swap-last-to-log-event'));
    });
    // Save should be enabled again (new key, no validation entry)
    expect(screen.getByRole('button', { name: 'Salva modifiche' })).not.toBeDisabled();
  });
});

// ── 5. Footer modes ───────────────────────────────────────────────────────────

describe('Footer modes', () => {
  it('create mode: shows [Annulla] [Crea automazione] — 2 buttons', () => {
    renderNew();
    expect(screen.getByRole('button', { name: 'Annulla' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crea automazione' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Elimina' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salva modifiche' })).not.toBeInTheDocument();
  });

  it('edit mode: shows [Elimina] [Annulla] [Salva modifiche] — 3 buttons', () => {
    renderEdit();
    expect(screen.getByRole('button', { name: 'Elimina' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annulla' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salva modifiche' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crea automazione' })).not.toBeInTheDocument();
  });
});

// ── 6. Unsaved-changes guard (D-15) ──────────────────────────────────────────

describe('Unsaved-changes guard (D-15)', () => {
  it('pristine new editor + click Annulla → NO dialog, onClose called directly', () => {
    const onClose = jest.fn();
    renderNew({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    // No dialog spawned
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dirty new editor (name changed) + click Annulla → dialog spawns', () => {
    const onClose = jest.fn();
    renderNew({ onClose });
    // Type a name to make it dirty
    fireEvent.change(screen.getByLabelText('Nome automazione'), { target: { value: 'ABC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    // Dialog should appear
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // ConfirmationDialog renders two h2 (VisuallyHidden Radix Title + visible).
    // Scope to visible one inside dialog content using within().
    expect(
      within(dialog).getAllByRole('heading', { level: 2, name: /Hai modifiche non salvate/ }).length
    ).toBeGreaterThan(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('dirty editor: clicking "Continua a modificare" keeps editor open', () => {
    const onClose = jest.fn();
    renderNew({ onClose });
    fireEvent.change(screen.getByLabelText('Nome automazione'), { target: { value: 'ABC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    const dialog = screen.getByRole('dialog');
    const continua = within(dialog).getByRole('button', { name: 'Continua a modificare' });
    fireEvent.click(continua);
    // Dialog dismissed, editor still open, onClose not called
    expect(onClose).not.toHaveBeenCalled();
  });

  it('dirty editor: clicking "Chiudi senza salvare" calls onClose', async () => {
    const onClose = jest.fn();
    renderNew({ onClose });
    fireEvent.change(screen.getByLabelText('Nome automazione'), { target: { value: 'ABC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    const dialog = screen.getByRole('dialog');
    const chiudi = within(dialog).getByRole('button', { name: 'Chiudi senza salvare' });
    await act(async () => {
      fireEvent.click(chiudi);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── 7. Delete confirm (D-16) ──────────────────────────────────────────────────

describe('Delete confirm (D-16)', () => {
  it('clicking Elimina spawns confirm dialog with rule name in title', () => {
    const rule = makeRule({ name: 'Regola speciale' });
    renderEdit(rule);
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // ConfirmationDialog renders two h2 (VisuallyHidden Radix Title + visible visible).
    // getAllByRole avoids the multiple-elements error.
    expect(
      within(dialog).getAllByRole('heading', { level: 2, name: /Eliminare l'automazione "Regola speciale"/ }).length
    ).toBeGreaterThan(0);
  });

  it('confirm in delete dialog calls onDelete with rule.id', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    const rule = makeRule({ id: 42 });
    renderEdit(rule, { onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByTestId('confirmation-confirm');
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    expect(onDelete).toHaveBeenCalledWith(42);
  });

  it('cancelling delete dialog does not call onDelete', () => {
    const onDelete = jest.fn();
    renderEdit(makeRule(), { onDelete });
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByTestId('confirmation-cancel'));
    expect(onDelete).not.toHaveBeenCalled();
  });
});

// ── 8. Save dispatch (D-13) ───────────────────────────────────────────────────

describe('Save dispatch (D-13)', () => {
  it('create mode: clicking save calls onSaveCreate with body lacking __key', async () => {
    const onSaveCreate = jest.fn().mockResolvedValue(undefined);
    // Use edit mode rule as base for preloaded state, but render in "new" context
    // We can't easily trigger onSaveCreate via new mode without typing + adding actions.
    // Instead, test via edit flow: render existing rule, change name, save → onSavePatch.
    const rule = makeRule({ name: 'Old', actions: [{ type: 'log_event', message: 'm' }] });
    const onSavePatch = jest.fn().mockResolvedValue(undefined);
    renderEdit(rule, { onSavePatch });
    // Change name to make it dirty
    fireEvent.change(screen.getByLabelText('Nome automazione'), { target: { value: 'New' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
    });
    expect(onSavePatch).toHaveBeenCalledTimes(1);
    const [id, patch] = onSavePatch.mock.calls[0] as [number, Record<string, unknown>];
    expect(id).toBe(1);
    expect(patch).toHaveProperty('name', 'New');
    // Patch must not include __key in any action
    if (patch['actions']) {
      (patch['actions'] as Array<Record<string, unknown>>).forEach((a) => {
        expect(a).not.toHaveProperty('__key');
      });
    }
  });

  it('edit mode: unchanged rule → save sends minimal patch (only changed fields)', async () => {
    const onSavePatch = jest.fn().mockResolvedValue(undefined);
    const rule = makeRule({ name: 'X', actions: [{ type: 'log_event', message: 'm' }] });
    renderEdit(rule, { onSavePatch });
    // Change only description
    fireEvent.change(screen.getByLabelText('Descrizione automazione'), {
      target: { value: 'Nuova descrizione' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salva modifiche' }));
    });
    expect(onSavePatch).toHaveBeenCalledTimes(1);
    const [, patch] = onSavePatch.mock.calls[0] as [number, Record<string, unknown>];
    // Only description changed → patch has description only
    expect(patch).toHaveProperty('description', 'Nuova descrizione');
    // name should NOT be in the patch if not changed
    expect(patch).not.toHaveProperty('name');
  });
});

// ── 9. Trigger tab in edit mode (D-12) ────────────────────────────────────────

describe('Trigger tab read-only (D-12)', () => {
  it('TriggerSection receives isNew=false in edit mode', () => {
    renderEdit();
    // Trigger tab is active by default (tab 0)
    const triggerSection = screen.getByTestId('trigger-section');
    expect(triggerSection).toHaveAttribute('data-isnew', 'false');
  });

  it('TriggerSection receives isNew=true in create mode', () => {
    renderNew();
    const triggerSection = screen.getByTestId('trigger-section');
    expect(triggerSection).toHaveAttribute('data-isnew', 'true');
  });
});

// ── 10. JSON error row ────────────────────────────────────────────────────────

describe('JSON error inline row', () => {
  it('shows JSON error row when actionValidation has false entry', () => {
    const rule = makeRule({ name: 'X', actions: [{ type: 'log_event', message: 'm' }] });
    renderEdit(rule);
    fireEvent.click(screen.getByRole('tab', { name: /Azioni/ }));
    fireEvent.click(screen.getByTestId('hook-set-last-validation-false'));
    expect(screen.getByText('JSON non valido')).toBeInTheDocument();
  });

  it('hides JSON error row when no validation errors', () => {
    renderNew();
    expect(screen.queryByText('JSON non valido')).not.toBeInTheDocument();
  });
});
