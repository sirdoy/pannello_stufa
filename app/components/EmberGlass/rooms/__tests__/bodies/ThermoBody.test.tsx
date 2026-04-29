/**
 * ThermoBody jest spec — Plan 179-06 (ROOMS-05 / CONTEXT D-28 / D-53).
 *
 * TDD RED → GREEN.
 *
 * Covers:
 *   Test 1: Renders DualTempReadout with correct current/target/tone
 *   Test 2: ControlRow with 4 MiniButtons: −0.5°, +0.5°, Eco, Auto (unicode minus U+2212)
 *   Test 3: Click "−0.5°" decrements pending; DualTempReadout target updates immediately
 *   Test 4: Click "+0.5°" increments pending; DualTempReadout target updates immediately
 *   Test 5: After 500ms, setRoomSetpoint called once with final debounced value
 *   Test 6: When home_id is empty, setRoomSetpoint NOT called (Pitfall 8 gate)
 *   Test 7: "Eco" button calls setHomeMode('away')
 *   Test 8: "Auto" button calls setHomeMode('schedule')
 *   Test 9: ValveBody (named export from same file) renders same shape
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import type { RoomDevice } from '../../types';

// Controllable mock data (mutated per-test for Test 6)
const thermoDataMock = {
  topology: { home_id: 'home-1', rooms: [] as unknown[], modules: [] as unknown[] },
  status: { rooms: [] as unknown[] },
  refetch: jest.fn().mockResolvedValue(undefined),
  loading: false,
  error: null,
  connected: true,
  stale: false,
  staleness: null,
  lastUpdatedAt: null,
};

const mockSetRoomSetpoint = jest.fn().mockResolvedValue(undefined);
const mockSetHomeMode = jest.fn().mockResolvedValue(undefined);
const mockSetRoomMode = jest.fn().mockResolvedValue(undefined);

jest.mock(
  '@/app/components/devices/thermostat/hooks/useThermostatData',
  () => ({
    useThermostatData: () => thermoDataMock,
  }),
);

jest.mock(
  '@/app/components/devices/thermostat/hooks/useThermostatCommands',
  () => ({
    useThermostatCommands: () => ({
      setRoomSetpoint: mockSetRoomSetpoint,
      setHomeMode: mockSetHomeMode,
      setRoomMode: mockSetRoomMode,
      netatmoTempCmd: {},
      netatmoModeCmd: {},
    }),
  }),
);

import { ThermoBody, ValveBody } from '../../bodies/ThermoBody';

const thermoDevice: RoomDevice = {
  kind: 'thermo',
  name: 'Soggiorno',
  on: true,
  value: '21.3° → 21°',
  tone: 'var(--accent)',
  extra: {
    current: 21.3,
    target: 21.0,
    roomId: 'room-1',
  },
};

const valveDevice: RoomDevice = {
  kind: 'valve',
  name: 'Camera',
  on: true,
  value: '20.0° → 20°',
  tone: '#b080ff',
  extra: {
    current: 20.0,
    target: 20.0,
    roomId: 'room-2',
  },
};

describe('ThermoBody', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSetRoomSetpoint.mockClear();
    mockSetHomeMode.mockClear();
    mockSetRoomMode.mockClear();
    // Reset to valid home_id before each test
    thermoDataMock.topology = { home_id: 'home-1', rooms: [], modules: [] };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Test 1: renders DualTempReadout with current, target and tone', () => {
    render(<ThermoBody device={thermoDevice} />);
    const readout = screen.getByTestId('dual-temp-readout');
    expect(readout).toBeInTheDocument();
    // current = 21.3 → "21.3" visible
    expect(readout.textContent).toContain('21.3');
    // initial pending = target = 21.0 → "21.0" visible
    expect(readout.textContent).toContain('21.0');
  });

  it('Test 2: renders 4 MiniButtons with correct labels (unicode minus U+2212)', () => {
    render(<ThermoBody device={thermoDevice} />);
    expect(screen.getByRole('button', { name: '−0.5°' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+0.5°' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eco' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auto' })).toBeInTheDocument();
  });

  it('Test 3: click "−0.5°" decrements pending and DualTempReadout target updates immediately', () => {
    render(<ThermoBody device={thermoDevice} />);
    const readout = screen.getByTestId('dual-temp-readout');

    // initial target = 21.0
    expect(readout.textContent).toContain('21.0');

    fireEvent.click(screen.getByRole('button', { name: '−0.5°' }));

    // pending = 20.5 shown immediately (UI responds before debounce fires)
    expect(readout.textContent).toContain('20.5');
  });

  it('Test 4: click "+0.5°" increments pending and DualTempReadout target updates immediately', () => {
    render(<ThermoBody device={thermoDevice} />);

    fireEvent.click(screen.getByRole('button', { name: '+0.5°' }));

    // pending = 21.5
    expect(screen.getByTestId('dual-temp-readout').textContent).toContain('21.5');
  });

  it('Test 5: after 500ms setRoomSetpoint called once with final debounced value', async () => {
    render(<ThermoBody device={thermoDevice} />);

    fireEvent.click(screen.getByRole('button', { name: '+0.5°' }));

    // not yet called — 500ms has not passed
    expect(mockSetRoomSetpoint).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
    expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 21.5);
  });

  it('Test 6: when home_id is empty string, setRoomSetpoint is NOT called (Pitfall 8)', async () => {
    // Override topology to have empty home_id
    thermoDataMock.topology = { home_id: '', rooms: [], modules: [] };

    render(<ThermoBody device={thermoDevice} />);
    fireEvent.click(screen.getByRole('button', { name: '+0.5°' }));

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    // Pitfall 8 gate: homeId is empty → no network call
    expect(mockSetRoomSetpoint).not.toHaveBeenCalled();
  });

  it('Test 7: "Eco" button calls setHomeMode("away")', () => {
    render(<ThermoBody device={thermoDevice} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eco' }));
    expect(mockSetHomeMode).toHaveBeenCalledWith('away');
  });

  it('Test 8: "Auto" button calls setHomeMode("schedule")', () => {
    render(<ThermoBody device={thermoDevice} />);
    fireEvent.click(screen.getByRole('button', { name: 'Auto' }));
    expect(mockSetHomeMode).toHaveBeenCalledWith('schedule');
  });

  it('Test 9: ValveBody (named export from ThermoBody.tsx) renders same body shape', () => {
    render(<ValveBody device={valveDevice} />);
    expect(screen.getByTestId('dual-temp-readout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '−0.5°' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+0.5°' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eco' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auto' })).toBeInTheDocument();
  });
});
