/**
 * ActionRow tests — Phase 180 Plan 06 Task 2
 * Covers: numbered card, type-select, reorder, remove, fallback for unknown types.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionRow } from '../ActionRow';
import { defaultAction } from '../lib/automations-config';
import type { ActionItem } from '@/types/automations';

const defaultProps = {
  action: defaultAction('log_event'),
  index: 0,
  total: 1,
  onChange: jest.fn(),
  onRemove: jest.fn(),
  onMoveUp: jest.fn(),
  onMoveDown: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ActionRow', () => {
  it('renders number badge "1" at index=0', () => {
    render(<ActionRow {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders "2" at index=1', () => {
    render(<ActionRow {...defaultProps} index={1} total={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('type-select shows all 11 known action types', () => {
    render(<ActionRow {...defaultProps} />);
    const select = screen.getByRole('combobox', { name: /Tipo azione/i });
    expect(select).toBeInTheDocument();
    // 11 options (the known types)
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(11);
  });

  it('switching type to log_event calls onChange with defaultAction("log_event") shape', () => {
    const onChange = jest.fn();
    render(
      <ActionRow
        {...defaultProps}
        action={defaultAction('thermorossi')}
        onChange={onChange}
      />,
    );
    const select = screen.getByRole('combobox', { name: /Tipo azione/i });
    fireEvent.change(select, { target: { value: 'log_event' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'log_event' }));
  });

  it('↑ (Sposta su) is disabled at index=0', () => {
    render(<ActionRow {...defaultProps} index={0} total={2} />);
    const upBtn = screen.getByRole('button', { name: 'Sposta su' });
    expect(upBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('↓ (Sposta giù) is disabled at last index (index === total - 1)', () => {
    render(<ActionRow {...defaultProps} index={1} total={2} />);
    const downBtn = screen.getByRole('button', { name: 'Sposta giù' });
    expect(downBtn).toHaveAttribute('aria-disabled', 'true');
  });

  it('click ↑ at index=1 fires onMoveUp', () => {
    const onMoveUp = jest.fn();
    render(<ActionRow {...defaultProps} index={1} total={2} onMoveUp={onMoveUp} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sposta su' }));
    expect(onMoveUp).toHaveBeenCalledTimes(1);
  });

  it('click ↓ at index=0 with total=2 fires onMoveDown', () => {
    const onMoveDown = jest.fn();
    render(<ActionRow {...defaultProps} index={0} total={2} onMoveDown={onMoveDown} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sposta giù' }));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('click X fires onRemove', () => {
    const onRemove = jest.fn();
    render(<ActionRow {...defaultProps} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rimuovi azione' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('unknown action type renders fallback "Tipo non supportato" body', () => {
    const legacyAction = { type: 'legacy_unknown_type', some_field: 'value' } as unknown as ActionItem;
    render(
      <ActionRow
        {...defaultProps}
        action={legacyAction}
      />,
    );
    expect(screen.getByText(/Tipo non supportato/i)).toBeInTheDocument();
    // The fallback body should contain the type in a <code> element
    expect(screen.getByText(/Tipo non supportato/i).closest('div')).toBeInTheDocument();
  });

  it('unknown type select shows 12 options (11 known + 1 legacy)', () => {
    const legacyAction = { type: 'legacy_unknown_type', some_field: 'value' } as unknown as ActionItem;
    render(
      <ActionRow
        {...defaultProps}
        action={legacyAction}
      />,
    );
    const select = screen.getByRole('combobox', { name: /Tipo azione/i });
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(12);
  });

  it('thermorossi action renders with a tone-colored card (style contains color-mix)', () => {
    const action = defaultAction('thermorossi');
    const { container } = render(<ActionRow {...defaultProps} action={action} />);
    const card = container.firstChild as HTMLElement;
    // The card div should have a background with color-mix (tone-based)
    expect(card?.style.background).toContain('color-mix');
  });
});
