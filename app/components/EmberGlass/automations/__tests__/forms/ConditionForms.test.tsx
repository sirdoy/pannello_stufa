/**
 * Phase 180 — Plan 05 Task 1: ConditionForms.tsx tests
 *
 * Tests: TimeWindowForm, DeviceStateForm, TemperatureRangeForm,
 *        AlwaysTrueForm, and the ConditionForm dispatcher (D-09b legacy fallback).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  TimeWindowForm,
  DeviceStateForm,
  TemperatureRangeForm,
  AlwaysTrueForm,
  ConditionForm,
} from '../../forms/ConditionForms';
import type { ConditionNode } from '@/types/automations';

// ─── TimeWindowForm ──────────────────────────────────────────────────────────

describe('TimeWindowForm', () => {
  const baseCond: ConditionNode = {
    type: 'time_window',
    start_time: '08:00',
    end_time: '20:00',
  };

  it('renders label "Da" and "A"', () => {
    render(<TimeWindowForm cond={baseCond} onChange={jest.fn()} />);
    expect(screen.getByText('Da')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders 2 time inputs with aria-labels', () => {
    render(<TimeWindowForm cond={baseCond} onChange={jest.fn()} />);
    // type=time inputs are not role=textbox in jsdom; use aria-label instead
    expect(screen.getByLabelText('Ora inizio finestra')).toBeInTheDocument();
    expect(screen.getByLabelText('Ora fine finestra')).toBeInTheDocument();
  });

  it('calls onChange with updated start_time when start input changes', () => {
    const onChange = jest.fn();
    render(<TimeWindowForm cond={baseCond} onChange={onChange} />);
    const startInput = screen.getByLabelText('Ora inizio finestra');
    fireEvent.change(startInput, { target: { value: '09:00' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'time_window', start_time: '09:00', end_time: '20:00' })
    );
  });

  it('calls onChange with updated end_time when end input changes', () => {
    const onChange = jest.fn();
    render(<TimeWindowForm cond={baseCond} onChange={onChange} />);
    const endInput = screen.getByLabelText('Ora fine finestra');
    fireEvent.change(endInput, { target: { value: '22:00' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'time_window', start_time: '08:00', end_time: '22:00' })
    );
  });

  it('uses API field names start_time and end_time (not start/end)', () => {
    const onChange = jest.fn();
    render(<TimeWindowForm cond={baseCond} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Ora inizio finestra'), { target: { value: '10:00' } });
    const arg = onChange.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).toHaveProperty('start_time', '10:00');
    expect(arg).not.toHaveProperty('start');
  });
});

// ─── DeviceStateForm ─────────────────────────────────────────────────────────

describe('DeviceStateForm', () => {
  const baseCond: ConditionNode = {
    type: 'device_state',
    sensor_id: 'plug.salotto',
    expected_state: 'on',
  };

  it('renders labels "Sensore (ID)" and "Stato atteso"', () => {
    render(<DeviceStateForm cond={baseCond} onChange={jest.fn()} />);
    expect(screen.getByText('Sensore (ID)')).toBeInTheDocument();
    expect(screen.getByText('Stato atteso')).toBeInTheDocument();
  });

  it('calls onChange with updated sensor_id', () => {
    const onChange = jest.fn();
    render(<DeviceStateForm cond={baseCond} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('ID sensore'), { target: { value: 'plug.cucina' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'device_state', sensor_id: 'plug.cucina', expected_state: 'on' })
    );
  });

  it('calls onChange with updated expected_state', () => {
    const onChange = jest.fn();
    render(<DeviceStateForm cond={baseCond} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Stato atteso'), { target: { value: 'off' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'device_state', sensor_id: 'plug.salotto', expected_state: 'off' })
    );
  });

  it('uses API field name sensor_id (not sensor)', () => {
    const onChange = jest.fn();
    render(<DeviceStateForm cond={baseCond} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('ID sensore'), { target: { value: 'x' } });
    const arg = onChange.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).toHaveProperty('sensor_id');
    expect(arg).not.toHaveProperty('sensor');
  });
});

// ─── TemperatureRangeForm ────────────────────────────────────────────────────

describe('TemperatureRangeForm', () => {
  const baseCond: ConditionNode = {
    type: 'temperature_range',
    min_temp: null,
    max_temp: null,
  };

  it('renders labels "Min" and "Max"', () => {
    render(<TemperatureRangeForm cond={baseCond} onChange={jest.fn()} />);
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('renders 2 NumInputs with unit °C visible', () => {
    render(<TemperatureRangeForm cond={baseCond} onChange={jest.fn()} />);
    const units = screen.getAllByText('°C');
    expect(units.length).toBe(2);
  });

  it('calls onChange with updated min_temp', () => {
    const onChange = jest.fn();
    render(<TemperatureRangeForm cond={baseCond} onChange={onChange} />);
    const minInput = screen.getByLabelText('Temperatura minima');
    fireEvent.change(minInput, { target: { value: '15' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'temperature_range', min_temp: 15 })
    );
  });

  it('calls onChange with null for min_temp when input cleared', () => {
    const onChange = jest.fn();
    const condWithValues: ConditionNode = { type: 'temperature_range', min_temp: 15, max_temp: 25 };
    render(<TemperatureRangeForm cond={condWithValues} onChange={onChange} />);
    const minInput = screen.getByLabelText('Temperatura minima');
    fireEvent.change(minInput, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'temperature_range', min_temp: null })
    );
  });

  it('uses API field names min_temp and max_temp (not min/max)', () => {
    const onChange = jest.fn();
    render(<TemperatureRangeForm cond={baseCond} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Temperatura minima'), { target: { value: '10' } });
    const arg = onChange.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).toHaveProperty('min_temp', 10);
    expect(arg).not.toHaveProperty('min');
  });
});

// ─── AlwaysTrueForm ──────────────────────────────────────────────────────────

describe('AlwaysTrueForm', () => {
  const baseCond: ConditionNode = { type: 'always_true' };

  it('renders the Italian copy verbatim', () => {
    render(<AlwaysTrueForm cond={baseCond} onChange={jest.fn()} />);
    expect(screen.getByText('Nessun parametro — sempre vero.')).toBeInTheDocument();
  });

  it('renders no input elements', () => {
    const { container } = render(<AlwaysTrueForm cond={baseCond} onChange={jest.fn()} />);
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('select')).toBeNull();
  });
});

// ─── ConditionForm dispatcher ─────────────────────────────────────────────────

describe('ConditionForm dispatcher', () => {
  it('renders TimeWindowForm for type="time_window"', () => {
    const cond: ConditionNode = { type: 'time_window', start_time: '08:00', end_time: '20:00' };
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(screen.getByText('Da')).toBeInTheDocument();
  });

  it('renders DeviceStateForm for type="device_state"', () => {
    const cond: ConditionNode = { type: 'device_state', sensor_id: '', expected_state: '' };
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(screen.getByText('Sensore (ID)')).toBeInTheDocument();
  });

  it('renders TemperatureRangeForm for type="temperature_range"', () => {
    const cond: ConditionNode = { type: 'temperature_range', min_temp: null, max_temp: null };
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(screen.getByText('Min')).toBeInTheDocument();
  });

  it('renders AlwaysTrueForm for type="always_true"', () => {
    const cond: ConditionNode = { type: 'always_true' };
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(screen.getByText('Nessun parametro — sempre vero.')).toBeInTheDocument();
  });

  it('renders legacy fallback for type="sensor_state_change" (D-09b conditions parallel)', () => {
    // Legacy sensor types are preserved verbatim, not creatable from picker
    const cond = { type: 'sensor_state_change' } as unknown as ConditionNode;
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(screen.getByText(/Tipo non supportato/)).toBeInTheDocument();
    expect(screen.getByText(/sensor_state_change/)).toBeInTheDocument();
  });

  it('renders legacy fallback for type="sensor_threshold" (D-09b conditions parallel)', () => {
    const cond = { type: 'sensor_threshold' } as unknown as ConditionNode;
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(screen.getByText(/Tipo non supportato/)).toBeInTheDocument();
  });

  it('renders legacy fallback for unknown type (D-09b conditions parallel)', () => {
    const cond = { type: 'netatmo_temperature_threshold' } as unknown as ConditionNode;
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(screen.getByText(/Tipo non supportato/)).toBeInTheDocument();
  });
});
