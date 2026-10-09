/**
 * Phase 180 — Plan 05 Task 1: ConditionForms.tsx tests
 *
 * Tests: TimeWindowForm, SensorConditionForm (ROADMAP M70), TemperatureRangeForm,
 *        AlwaysTrueForm, and the ConditionForm dispatcher (D-09b legacy fallback).
 */
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import {
  TimeWindowForm,
  SensorConditionForm,
  TemperatureRangeForm,
  AlwaysTrueForm,
  ConditionForm,
} from '../../forms/ConditionForms';
import { resetAutomationSensorsCache } from '../../hooks/useAutomationSensors';
import type { SensorCondition } from '../../lib/sensor-catalog';
import type { AutomationSensor, ConditionNode } from '@/types/automations';

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

// ─── SensorConditionForm ─────────────────────────────────────────────────────

const sensor = (over: Partial<AutomationSensor> & Pick<AutomationSensor, 'sensor_id'>): AutomationSensor => {
  const [provider = '', device_id = '', metric = ''] = over.sensor_id.split(':');
  return {
    provider,
    device_id,
    metric,
    device_name: null,
    room: null,
    value: null,
    value_type: 'number',
    unit: null,
    options: null,
    ...over,
  };
};

const SENSORS: AutomationSensor[] = [
  sensor({ sensor_id: 'netatmo:r1:temperature', device_name: 'Sala', value: 19.5, unit: '°C' }),
  sensor({ sensor_id: 'netatmo:r1:setpoint', device_name: 'Sala', value: 20, unit: '°C' }),
  sensor({
    sensor_id: 'dirigera:w1:is_open',
    device_name: 'Finestra',
    room: 'Cucina',
    value: false,
    value_type: 'boolean',
  }),
  sensor({ sensor_id: 'dirigera:w1:battery_percentage', device_name: 'Finestra', room: 'Cucina', value: 80, unit: '%' }),
  sensor({
    sensor_id: 'thermorossi:default:stove_state',
    value: 'working',
    value_type: 'string',
    options: ['off', 'igniting', 'working'],
  }),
];

function mockSensors(response: { ok: boolean; status?: number; sensors?: AutomationSensor[] }) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: async () => ({ success: true, sensors: response.sensors ?? [] }),
  }) as unknown as typeof fetch;
}

describe('SensorConditionForm', () => {
  const empty: SensorCondition = { type: 'device_state', sensor_id: '', expected_state: '' };

  beforeEach(() => {
    resetAutomationSensorsCache();
    mockSensors({ ok: true, sensors: SENSORS });
  });

  it('lists the devices by name, with room and kind, and no id to type', async () => {
    render(<SensorConditionForm cond={empty} onChange={jest.fn()} />);
    const device = await screen.findByRole('combobox', { name: 'Dispositivo' });
    expect(within(device).getByRole('option', { name: 'Sala (Netatmo)' })).toBeInTheDocument();
    expect(within(device).getByRole('option', { name: 'Finestra · Cucina (Sensore IKEA)' })).toBeInTheDocument();
    expect(within(device).getByRole('option', { name: 'Stufa' })).toBeInTheDocument();
    expect(screen.queryByLabelText('ID sensore')).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/automations/sensors');
  });

  it('picking a room starts a "temperature below the current value" threshold', async () => {
    const onChange = jest.fn();
    render(<SensorConditionForm cond={empty} onChange={onChange} />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Dispositivo' }), {
      target: { value: 'netatmo:r1' },
    });
    expect(onChange).toHaveBeenCalledWith({
      type: 'sensor_threshold',
      sensor_id: 'netatmo:r1:temperature',
      metric: 'temperature',
      operator: 'lt',
      threshold: 19.5,
    });
  });

  it('picking a window sensor starts with "open"', async () => {
    const onChange = jest.fn();
    render(<SensorConditionForm cond={empty} onChange={onChange} />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Dispositivo' }), {
      target: { value: 'dirigera:w1' },
    });
    expect(onChange).toHaveBeenCalledWith({
      type: 'device_state',
      sensor_id: 'dirigera:w1:is_open',
      expected_state: 'true',
    });
  });

  it('shows a saved threshold: device, metric with its current value, operator and value', async () => {
    const cond: SensorCondition = {
      type: 'sensor_threshold',
      sensor_id: 'netatmo:r1:temperature',
      metric: 'temperature',
      operator: 'lt',
      threshold: 18,
    };
    render(<SensorConditionForm cond={cond} onChange={jest.fn()} />);
    expect(await screen.findByRole('combobox', { name: 'Dispositivo' })).toHaveValue('netatmo:r1');
    const metric = screen.getByRole('combobox', { name: 'Cosa leggere' });
    expect(metric).toHaveValue('netatmo:r1:temperature');
    expect(within(metric).getByRole('option', { name: 'Temperatura · ora 19.5 °C' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Confronto' })).toHaveValue('lt');
    expect(screen.getByLabelText('Valore')).toHaveValue(18);
    expect(screen.getByText('°C')).toBeInTheDocument();
  });

  it('changes the threshold value and the operator', async () => {
    const onChange = jest.fn();
    const cond: SensorCondition = {
      type: 'sensor_threshold',
      sensor_id: 'netatmo:r1:temperature',
      metric: 'temperature',
      operator: 'lt',
      threshold: 18,
    };
    render(<SensorConditionForm cond={cond} onChange={onChange} />);
    fireEvent.change(await screen.findByLabelText('Valore'), { target: { value: '17.5' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...cond, threshold: 17.5 });
    fireEvent.change(screen.getByRole('combobox', { name: 'Confronto' }), { target: { value: 'gte' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...cond, operator: 'gte' });
  });

  it('"equal to" on a number is saved as device_state', async () => {
    const onChange = jest.fn();
    const cond: SensorCondition = {
      type: 'sensor_threshold',
      sensor_id: 'netatmo:r1:setpoint',
      metric: 'setpoint',
      operator: 'gt',
      threshold: 7,
    };
    render(<SensorConditionForm cond={cond} onChange={onChange} />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Confronto' }), { target: { value: 'eq' } });
    expect(onChange).toHaveBeenCalledWith({
      type: 'device_state',
      sensor_id: 'netatmo:r1:setpoint',
      expected_state: '7',
    });
  });

  it('switching metric on the same device resets the comparison for that metric', async () => {
    const onChange = jest.fn();
    const cond: SensorCondition = { type: 'device_state', sensor_id: 'dirigera:w1:is_open', expected_state: 'true' };
    render(<SensorConditionForm cond={cond} onChange={onChange} />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Cosa leggere' }), {
      target: { value: 'dirigera:w1:battery_percentage' },
    });
    expect(onChange).toHaveBeenCalledWith({
      type: 'sensor_threshold',
      sensor_id: 'dirigera:w1:battery_percentage',
      metric: 'battery_percentage',
      operator: 'lt',
      threshold: 80,
    });
  });

  it('a boolean sensor offers its two states in words and reads a stored word', async () => {
    const onChange = jest.fn();
    const cond: SensorCondition = { type: 'device_state', sensor_id: 'dirigera:w1:is_open', expected_state: 'True' };
    render(<SensorConditionForm cond={cond} onChange={onChange} />);
    const value = await screen.findByRole('combobox', { name: 'Valore' });
    expect(value).toHaveValue('true');
    expect(within(value).getByRole('option', { name: 'aperta' })).toBeInTheDocument();
    fireEvent.change(value, { target: { value: 'false' } });
    expect(onChange).toHaveBeenCalledWith({ ...cond, expected_state: 'false' });
  });

  it('a stove rule written with another entity slot is still recognised and keeps its id', async () => {
    const onChange = jest.fn();
    const cond: SensorCondition = { type: 'device_state', sensor_id: 'thermorossi:_:stove_state', expected_state: 'working' };
    render(<SensorConditionForm cond={cond} onChange={onChange} />);
    expect(await screen.findByRole('combobox', { name: 'Dispositivo' })).toHaveValue('thermorossi:default');
    const value = screen.getByRole('combobox', { name: 'Valore' });
    expect(within(value).getByRole('option', { name: 'accesa' })).toBeInTheDocument();
    fireEvent.change(value, { target: { value: 'off' } });
    expect(onChange).toHaveBeenCalledWith({ ...cond, expected_state: 'off' });
  });

  it('a sensor that is not in the list falls back to the id typed by hand', async () => {
    const onChange = jest.fn();
    const cond: SensorCondition = { type: 'device_state', sensor_id: 'hue:99:on', expected_state: 'on' };
    render(<SensorConditionForm cond={cond} onChange={onChange} />);
    expect(await screen.findByLabelText('ID sensore')).toHaveValue('hue:99:on');
    expect(screen.getByText(/non è fra quelli che il sistema vede ora/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('ID sensore'), { target: { value: 'hue:98:on' } });
    expect(onChange).toHaveBeenCalledWith({ type: 'device_state', sensor_id: 'hue:98:on', expected_state: 'on' });
    fireEvent.click(screen.getByRole('button', { name: /scegli dall.elenco/i }));
    expect(onChange).toHaveBeenLastCalledWith(empty);
  });

  it('the id can be typed by hand on request, with a threshold too', async () => {
    const onChange = jest.fn();
    const cond: SensorCondition = { type: 'device_state', sensor_id: '', expected_state: '' };
    const { rerender } = render(<SensorConditionForm cond={cond} onChange={onChange} />);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Dispositivo' }), {
      target: { value: '__manual__' },
    });
    const typed: SensorCondition = { ...cond, sensor_id: 'tuya:p9:power_w' };
    rerender(<SensorConditionForm cond={typed} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Confronto' }), { target: { value: 'gt' } });
    expect(onChange).toHaveBeenLastCalledWith({
      type: 'sensor_threshold',
      sensor_id: 'tuya:p9:power_w',
      metric: 'power_w',
      operator: 'gt',
      threshold: 0,
    });
  });

  it('falls back to the id typed by hand when the list cannot be loaded', async () => {
    mockSensors({ ok: false, status: 502 });
    render(<SensorConditionForm cond={empty} onChange={jest.fn()} />);
    expect(await screen.findByLabelText('ID sensore')).toBeInTheDocument();
    expect(screen.getByText(/Elenco dei sensori non disponibile \(HTTP 502\)/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /scegli dall.elenco/i })).not.toBeInTheDocument();
  });

  it('asks the list once for several condition rows', async () => {
    render(
      <>
        <SensorConditionForm cond={empty} onChange={jest.fn()} />
        <SensorConditionForm cond={empty} onChange={jest.fn()} />
      </>,
    );
    expect(await screen.findAllByRole('combobox', { name: 'Dispositivo' })).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
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

  it.each([
    [{ type: 'device_state', sensor_id: '', expected_state: '' }],
    [{ type: 'sensor_threshold', sensor_id: 'netatmo:r1:temperature', metric: 'temperature', operator: 'lt', threshold: 18 }],
  ] as Array<[ConditionNode]>)('renders SensorConditionForm for %j', async (cond) => {
    resetAutomationSensorsCache();
    mockSensors({ ok: true, sensors: SENSORS });
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(await screen.findByRole('combobox', { name: 'Dispositivo' })).toBeInTheDocument();
    expect(screen.queryByText(/Tipo non supportato/)).not.toBeInTheDocument();
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

  it('renders legacy fallback for unknown type (D-09b conditions parallel)', () => {
    const cond = { type: 'netatmo_temperature_threshold' } as unknown as ConditionNode;
    render(<ConditionForm cond={cond} onChange={jest.fn()} />);
    expect(screen.getByText(/Tipo non supportato/)).toBeInTheDocument();
  });
});
