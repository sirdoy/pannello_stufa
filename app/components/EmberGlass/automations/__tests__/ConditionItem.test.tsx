/**
 * Phase 180 — Plan 05 Task 2: ConditionItem.tsx tests
 *
 * Tests: type-select + form + remove button + legacy fallback (D-09b).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConditionItem } from '../ConditionItem';
import type { ConditionNode } from '@/types/automations';

// ─── Picker types ────────────────────────────────────────────────────────────

describe('ConditionItem — picker types', () => {
  const timeWindowCond: ConditionNode = {
    type: 'time_window',
    start_time: '08:00',
    end_time: '20:00',
  };

  it('renders type select with 4 picker options for a time_window cond', () => {
    render(<ConditionItem cond={timeWindowCond} onChange={jest.fn()} onRemove={jest.fn()} />);
    const select = screen.getByRole('combobox', { name: /tipo condizione/i });
    expect(select).toBeInTheDocument();
    // Check 4 picker types are present
    expect(screen.getByRole('option', { name: /fascia oraria/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /stato dispositivo/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /intervallo temperatura/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /sempre vero/i })).toBeInTheDocument();
  });

  it('renders the remove button with aria-label "Rimuovi condizione"', () => {
    render(<ConditionItem cond={timeWindowCond} onChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Rimuovi condizione' })).toBeInTheDocument();
  });

  it('fires onRemove when remove button clicked', () => {
    const onRemove = jest.fn();
    render(<ConditionItem cond={timeWindowCond} onChange={jest.fn()} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rimuovi condizione' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders TimeWindowForm body for time_window type', () => {
    render(<ConditionItem cond={timeWindowCond} onChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('Da')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders DeviceStateForm body for device_state type', () => {
    const cond: ConditionNode = { type: 'device_state', sensor_id: '', expected_state: '' };
    render(<ConditionItem cond={cond} onChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('Sensore (ID)')).toBeInTheDocument();
  });

  it('renders TemperatureRangeForm body for temperature_range type', () => {
    const cond: ConditionNode = { type: 'temperature_range', min_temp: null, max_temp: null };
    render(<ConditionItem cond={cond} onChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('renders AlwaysTrueForm body for always_true type', () => {
    const cond: ConditionNode = { type: 'always_true' };
    render(<ConditionItem cond={cond} onChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('Nessun parametro — sempre vero.')).toBeInTheDocument();
  });
});

// ─── Type-switch fires defaultCondition (wipes irrelevant fields) ────────────

describe('ConditionItem — type switch', () => {
  it('switching from time_window to device_state calls onChange with defaultCondition shape', () => {
    const onChange = jest.fn();
    const cond: ConditionNode = { type: 'time_window', start_time: '08:00', end_time: '20:00' };
    render(<ConditionItem cond={cond} onChange={onChange} onRemove={jest.fn()} />);
    const select = screen.getByRole('combobox', { name: /tipo condizione/i });
    fireEvent.change(select, { target: { value: 'device_state' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0]?.[0] as Record<string, unknown>;
    // defaultCondition('device_state') shape
    expect(arg).toHaveProperty('type', 'device_state');
    expect(arg).toHaveProperty('sensor_id');
    expect(arg).toHaveProperty('expected_state');
    // Must NOT carry over start_time/end_time from previous cond (T-180-05-02 mitigation)
    expect(arg).not.toHaveProperty('start_time');
    expect(arg).not.toHaveProperty('end_time');
  });

  it('switching from device_state to temperature_range does not preserve sensor_id', () => {
    const onChange = jest.fn();
    const cond: ConditionNode = { type: 'device_state', sensor_id: 'plug.x', expected_state: 'on' };
    render(<ConditionItem cond={cond} onChange={onChange} onRemove={jest.fn()} />);
    fireEvent.change(screen.getByRole('combobox', { name: /tipo condizione/i }), {
      target: { value: 'temperature_range' },
    });
    const arg = onChange.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).toHaveProperty('type', 'temperature_range');
    expect(arg).toHaveProperty('min_temp');
    expect(arg).not.toHaveProperty('sensor_id');
  });
});

// ─── Legacy types (D-09b) ─────────────────────────────────────────────────────

describe('ConditionItem — legacy type fallback (D-09b)', () => {
  it('renders 5th dropdown option for legacy sensor_state_change type', () => {
    const cond = { type: 'sensor_state_change' } as unknown as ConditionNode;
    render(<ConditionItem cond={cond} onChange={jest.fn()} onRemove={jest.fn()} />);
    const select = screen.getByRole('combobox', { name: /tipo condizione/i });
    // Should have 5 options: 4 picker + 1 legacy
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(5);
    // The legacy option should have value matching the type
    const legacyOption = Array.from(options).find(o => o.getAttribute('value') === 'sensor_state_change');
    expect(legacyOption).toBeDefined();
    expect(legacyOption?.textContent).toContain('sensor_state_change');
  });

  it('renders fallback body for legacy sensor_state_change type', () => {
    const cond = { type: 'sensor_state_change' } as unknown as ConditionNode;
    render(<ConditionItem cond={cond} onChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText(/Tipo non supportato/)).toBeInTheDocument();
    // The code element in the fallback should show the type
    const codeEl = document.querySelector('code');
    expect(codeEl).not.toBeNull();
    expect(codeEl?.textContent).toBe('sensor_state_change');
  });

  it('still renders remove button for legacy types', () => {
    const cond = { type: 'sensor_threshold' } as unknown as ConditionNode;
    render(<ConditionItem cond={cond} onChange={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Rimuovi condizione' })).toBeInTheDocument();
  });
});
