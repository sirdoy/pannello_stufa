/**
 * ActionsSection tests — Phase 180 Plan 06 Task 3
 * Covers: empty state, picker (11 tiles), add/remove/reorder,
 * and BLOCKER 1 contract cases (stable __key across operations).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionsSection } from '../../sections/ActionsSection';
import { defaultAction } from '../../lib/automations-config';
import type { KeyedAction } from '../../lib/with-key';
import type { ActionItem } from '@/types/automations';

// ─── Test-local mintActionKey factory ────────────────────────────────────────
// Uses a deterministic counter so test assertions can check key mutation.
let keyCounter = 0;
const mintActionKey = jest.fn((action: ActionItem): KeyedAction => ({
  ...action,
  __key: `k_${++keyCounter}`,
}));

beforeEach(() => {
  keyCounter = 0;
  mintActionKey.mockClear();
  // Reset counter so each test gets predictable keys starting from k_1
});

// Helper to build KeyedAction from ActionItem
function keyed(action: ActionItem, key: string): KeyedAction {
  return { ...action, __key: key };
}

// ─── Empty state ─────────────────────────────────────────────────────────────
describe('ActionsSection — empty state', () => {
  it('shows "Nessuna azione. Aggiungine almeno una." when actions is empty', () => {
    render(
      <ActionsSection
        actions={[]}
        onChange={jest.fn()}
        mintActionKey={mintActionKey}
      />,
    );
    expect(screen.getByText(/Nessuna azione\. Aggiungine almeno una\./i)).toBeInTheDocument();
  });

  it('shows "+ Aggiungi azione" CTA', () => {
    render(
      <ActionsSection
        actions={[]}
        onChange={jest.fn()}
        mintActionKey={mintActionKey}
      />,
    );
    expect(screen.getByRole('button', { name: /Aggiungi azione/i })).toBeInTheDocument();
  });
});

// ─── Picker overlay ───────────────────────────────────────────────────────────
describe('ActionsSection — picker overlay', () => {
  it('clicking "+ Aggiungi azione" opens picker', () => {
    render(
      <ActionsSection
        actions={[]}
        onChange={jest.fn()}
        mintActionKey={mintActionKey}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Aggiungi azione/i }));
    expect(screen.getByText('Scegli tipo azione')).toBeInTheDocument();
  });

  it('picker shows EXACTLY 11 tiles (D-09 lock)', () => {
    render(
      <ActionsSection
        actions={[]}
        onChange={jest.fn()}
        mintActionKey={mintActionKey}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Aggiungi azione/i }));
    // Count tile buttons by aria-pressed (TypeTile renders as button with aria-pressed)
    const tiles = screen.getAllByRole('button', { name: /Annulla/ });
    // There should be 11 type tiles + 1 Annulla = let's count buttons excluding Annulla
    const allButtons = screen.getAllByRole('button');
    // Minus the Annulla button (1)
    const tileBtns = allButtons.filter((b) => b.textContent !== 'Annulla');
    expect(tileBtns.length).toBe(11);
  });

  it('clicking a picker tile (Scrivi log) fires onChange with keyed action and closes picker', () => {
    const onChange = jest.fn();
    render(
      <ActionsSection
        actions={[]}
        onChange={onChange}
        mintActionKey={mintActionKey}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Aggiungi azione/i }));
    // Click "Scrivi log" tile
    fireEvent.click(screen.getByRole('button', { name: /Scrivi log/i }));
    // mintActionKey should have been called with a log_event action
    expect(mintActionKey).toHaveBeenCalledWith(expect.objectContaining({ type: 'log_event' }));
    // onChange should have been called with an array containing the new keyed action
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ type: 'log_event', __key: 'k_1' })]),
    );
    // Picker should be closed (Annulla button gone)
    expect(screen.queryByText('Scegli tipo azione')).not.toBeInTheDocument();
  });

  it('"Annulla" closes picker without adding', () => {
    const onChange = jest.fn();
    render(
      <ActionsSection
        actions={[]}
        onChange={onChange}
        mintActionKey={mintActionKey}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Aggiungi azione/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('Scegli tipo azione')).not.toBeInTheDocument();
  });
});

// ─── Non-empty state ──────────────────────────────────────────────────────────
describe('ActionsSection — non-empty', () => {
  it('renders ActionRow per action with correct index ordering', () => {
    const actions: KeyedAction[] = [
      keyed(defaultAction('log_event'), 'k_log'),
      keyed(defaultAction('thermorossi'), 'k_thermo'),
    ];
    render(
      <ActionsSection
        actions={actions}
        onChange={jest.fn()}
        mintActionKey={mintActionKey}
      />,
    );
    // Both number badges should appear
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

// ─── Reorder ──────────────────────────────────────────────────────────────────
describe('ActionsSection — reorder preserves __key', () => {
  it('move middle action up preserves all __key values', () => {
    const a1 = keyed(defaultAction('log_event'), 'k_1');
    const a2 = keyed(defaultAction('thermorossi'), 'k_2');
    const a3 = keyed(defaultAction('http_webhook'), 'k_3');
    const onChange = jest.fn();
    render(
      <ActionsSection
        actions={[a1, a2, a3]}
        onChange={onChange}
        mintActionKey={mintActionKey}
      />,
    );
    // Click "Sposta su" for the second row (index=1)
    const upBtns = screen.getAllByRole('button', { name: 'Sposta su' });
    fireEvent.click(upBtns[1]!); // second row's up button
    const result: KeyedAction[] = onChange.mock.calls[0]?.[0];
    expect(result).toHaveLength(3);
    // After moving index 1 up: [a2, a1, a3]
    expect(result[0]?.__key).toBe('k_2');
    expect(result[1]?.__key).toBe('k_1');
    expect(result[2]?.__key).toBe('k_3');
  });
});

// ─── Remove ───────────────────────────────────────────────────────────────────
describe('ActionsSection — remove', () => {
  it('remove handler filters the row', () => {
    const a1 = keyed(defaultAction('log_event'), 'k_log');
    const a2 = keyed(defaultAction('thermorossi'), 'k_thermo');
    const onChange = jest.fn();
    render(
      <ActionsSection
        actions={[a1, a2]}
        onChange={onChange}
        mintActionKey={mintActionKey}
      />,
    );
    // Remove first row
    const removeBtns = screen.getAllByRole('button', { name: 'Rimuovi azione' });
    fireEvent.click(removeBtns[0]!);
    const result: KeyedAction[] = onChange.mock.calls[0]?.[0];
    expect(result).toHaveLength(1);
    expect(result[0]?.__key).toBe('k_thermo');
  });
});

// ─── BLOCKER 1 contract — remove preserves siblings' __key ───────────────────
describe('ActionsSection — BLOCKER 1: remove preserves siblings keys', () => {
  it('removing row 0 preserves row 1 __key verbatim', () => {
    const httpAction = keyed(
      { type: 'http_webhook', url: '', method: 'POST', payload: null },
      'k_http',
    );
    const logAction = keyed({ type: 'log_event', message: '' }, 'k_log');
    const onChange = jest.fn();
    render(
      <ActionsSection
        actions={[httpAction, logAction]}
        onChange={onChange}
        mintActionKey={mintActionKey}
      />,
    );
    const removeBtns = screen.getAllByRole('button', { name: 'Rimuovi azione' });
    fireEvent.click(removeBtns[0]!); // remove http_webhook row
    const result: KeyedAction[] = onChange.mock.calls[0]?.[0];
    expect(result).toHaveLength(1);
    expect(result[0]?.__key).toBe('k_log'); // NOT 'k_http'
    expect(result[0]?.type).toBe('log_event');
  });
});

// ─── BLOCKER 1 contract — type-swap mints fresh __key ────────────────────────
describe('ActionsSection — BLOCKER 1: type-swap mints fresh __key', () => {
  it('changing type in ActionRow triggers mintActionKey and produces new __key', () => {
    const httpAction = keyed(
      { type: 'http_webhook', url: '', method: 'POST', payload: null },
      'k_http',
    );
    const onChange = jest.fn();
    render(
      <ActionsSection
        actions={[httpAction]}
        onChange={onChange}
        mintActionKey={mintActionKey}
      />,
    );
    // Simulate user changing type via ActionRow's type select
    const select = screen.getByRole('combobox', { name: /Tipo azione/i });
    fireEvent.change(select, { target: { value: 'log_event' } });
    const result: KeyedAction[] = onChange.mock.calls[0]?.[0];
    expect(result).toHaveLength(1);
    // The new __key should NOT be 'k_http' (a fresh one was minted)
    expect(result[0]?.__key).not.toBe('k_http');
    expect(result[0]?.type).toBe('log_event');
    // mintActionKey should have been called with log_event defaultAction
    expect(mintActionKey).toHaveBeenCalledWith(expect.objectContaining({ type: 'log_event' }));
  });
});

// ─── BLOCKER 1 contract — in-place field edit preserves __key ────────────────
describe('ActionsSection — BLOCKER 1: in-place edit preserves __key', () => {
  it('field edit on same type preserves __key verbatim', () => {
    const logAction = keyed({ type: 'log_event', message: '' }, 'k_log');
    const onChange = jest.fn();
    render(
      <ActionsSection
        actions={[logAction]}
        onChange={onChange}
        mintActionKey={mintActionKey}
      />,
    );
    // Simulate ActionRow's onChange with updated message (same type)
    const messageInput = screen.getByLabelText('Messaggio');
    fireEvent.change(messageInput, { target: { value: 'updated' } });
    const result: KeyedAction[] = onChange.mock.calls[0]?.[0];
    expect(result).toHaveLength(1);
    expect(result[0]?.__key).toBe('k_log'); // preserved
    expect((result[0] as { type: string; message: string; __key: string }).message).toBe('updated');
  });
});

// ─── BLOCKER 1 contract — validation forwarder uses stable __key ─────────────
describe('ActionsSection — BLOCKER 1: validation forwarder uses string key', () => {
  it('ActionRow onValidationChange(false) emits (actionKey, false) via onValidationChange prop', () => {
    const httpAction = keyed(
      { type: 'http_webhook', url: '', method: 'POST', payload: null },
      'k_http',
    );
    const onValidationChange = jest.fn();
    render(
      <ActionsSection
        actions={[httpAction]}
        onChange={jest.fn()}
        mintActionKey={mintActionKey}
        onValidationChange={onValidationChange}
      />,
    );
    // Trigger JSON validation error in HttpWebhookForm
    const textarea = screen.getByLabelText('Payload JSON');
    fireEvent.change(textarea, { target: { value: '{invalid' } });
    // onValidationChange should have been called with ('k_http', false) — NOT (0, false)
    expect(onValidationChange).toHaveBeenCalledWith('k_http', false);
  });
});
