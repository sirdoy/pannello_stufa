/**
 * ThermoBody — thermostat or valve of a Netatmo room (ROADMAP M84 + M81).
 *
 * Measured and target temperature, "−0.5°" / "+0.5°" (setpoint clamped 7–30, sent 500 ms after the
 * last tap) and "Programma" (room back to the schedule). Commands act on the single room; the
 * button that started a command shows a spinner and the others are locked until it settles.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { RoomDevice } from '../../types';

const thermoDataMock = {
  topology: { home_id: 'home-1', rooms: [] as unknown[], modules: [] as unknown[] } as
    | { home_id: string; rooms: unknown[]; modules: unknown[] }
    | null,
  status: { rooms: [] as unknown[] },
  refetch: jest.fn().mockResolvedValue(undefined),
};

const mockSetRoomSetpoint = jest.fn<Promise<void>, [string, number]>();
const mockSetRoomMode = jest.fn<Promise<void>, [string, string]>();
const mockSetHomeMode = jest.fn<Promise<void>, [string]>();
const mockUseThermostatCommands = jest.fn();

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatData', () => ({
  useThermostatData: () => thermoDataMock,
}));

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatCommands', () => ({
  useThermostatCommands: (params: unknown) => mockUseThermostatCommands(params),
}));

import { ThermoBody } from '../../bodies/ThermoBody';

interface CommandsParams {
  homeId: string;
  refetch: () => Promise<void>;
  setError: (message: string | null) => void;
}

// Unicode minus U+2212, as in the source
const MINUS = '−0.5°';
const PLUS = '+0.5°';
const SCHEDULE = 'Programma';

function makeDevice(extra: Record<string, unknown> = {}, overrides: Partial<RoomDevice> = {}): RoomDevice {
  return {
    id: 14,
    kind: 'thermo',
    name: 'Termostato sala',
    on: true,
    statusLabel: 'Riscalda',
    value: '21.3° → 21.0°',
    tone: '#5eafff',
    extra: { current: 21.3, target: 21, roomId: 'room-1', ...extra },
    ...overrides,
  };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const button = (name: string) => screen.getByRole('button', { name });
const tap = (name: string) => fireEvent.click(button(name));
const readout = () => screen.getByTestId('dual-temp-readout').textContent;

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

function expectSpinner(name: string) {
  expect(button(name)).toHaveAttribute('aria-busy', 'true');
  expect(within(button(name)).getByTestId('mini-button-spinner')).toBeInTheDocument();
}

function expectIdle(name: string) {
  expect(button(name)).not.toHaveAttribute('aria-busy');
  expect(button(name)).toBeEnabled();
  expect(within(button(name)).queryByTestId('mini-button-spinner')).not.toBeInTheDocument();
}

describe('ThermoBody', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    thermoDataMock.topology = { home_id: 'home-1', rooms: [], modules: [] };
    mockSetRoomSetpoint.mockResolvedValue(undefined);
    mockSetRoomMode.mockResolvedValue(undefined);
    mockSetHomeMode.mockResolvedValue(undefined);
    mockUseThermostatCommands.mockImplementation(() => ({
      setRoomSetpoint: mockSetRoomSetpoint,
      setRoomMode: mockSetRoomMode,
      setHomeMode: mockSetHomeMode,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('layout', () => {
    it('shows the measured and the target temperature', () => {
      render(<ThermoBody device={makeDevice()} />);
      expect(readout()).toBe('Attuale21.3°Target21.0°');
    });

    it('has the three buttons of the room and no whole-house command', () => {
      render(<ThermoBody device={makeDevice()} />);

      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        MINUS,
        PLUS,
        SCHEDULE,
      ]);
      expect(screen.queryByRole('button', { name: 'Eco' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Auto' })).not.toBeInTheDocument();
    });

    it('renders the same body for a valve', () => {
      render(<ThermoBody device={makeDevice({}, { kind: 'valve', name: 'Valvola camera' })} />);

      expect(readout()).toBe('Attuale21.3°Target21.0°');
      expect(button(MINUS)).toBeEnabled();
      expect(button(PLUS)).toBeEnabled();
      expect(button(SCHEDULE)).toBeEnabled();
    });

    it('gives the commands hook the home id of the topology', () => {
      render(<ThermoBody device={makeDevice()} />);

      const params = mockUseThermostatCommands.mock.calls[0]![0] as CommandsParams;
      expect(params.homeId).toBe('home-1');
      expect(params.refetch).toBe(thermoDataMock.refetch);
    });
  });

  describe('setpoint', () => {
    it('moves the target at once and sends it 500 ms after the tap', async () => {
      render(<ThermoBody device={makeDevice()} />);

      tap(PLUS);
      expect(readout()).toBe('Attuale21.3°Target21.5°');

      await advance(499);
      expect(mockSetRoomSetpoint).not.toHaveBeenCalled();

      await advance(1);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
      expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 21.5);
      expect(mockSetHomeMode).not.toHaveBeenCalled();
    });

    it('lowers the target by half a degree', async () => {
      render(<ThermoBody device={makeDevice()} />);

      tap(MINUS);
      expect(readout()).toBe('Attuale21.3°Target20.5°');

      await advance(500);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
      expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 20.5);
    });

    it('sends one command with the final value when taps follow each other', async () => {
      render(<ThermoBody device={makeDevice()} />);

      tap(PLUS);
      await advance(400);
      tap(PLUS);
      await advance(400);
      tap(PLUS);
      await advance(499);
      expect(mockSetRoomSetpoint).not.toHaveBeenCalled();

      await advance(1);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
      expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 22.5);
    });

    it('sends nothing when the taps end on the starting target', async () => {
      render(<ThermoBody device={makeDevice()} />);

      tap(PLUS);
      tap(MINUS);
      expect(readout()).toBe('Attuale21.3°Target21.0°');
      await advance(1000);

      expect(mockSetRoomSetpoint).not.toHaveBeenCalled();
    });

    it('keeps one decimal without floating point drift', async () => {
      render(<ThermoBody device={makeDevice({ target: 19.1 })} />);

      tap(PLUS);
      tap(PLUS);
      tap(PLUS);
      await advance(500);

      expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 20.6);
    });

    it('never goes above 30°', async () => {
      render(<ThermoBody device={makeDevice({ target: 29.5 })} />);

      tap(PLUS);
      tap(PLUS);
      tap(PLUS);
      expect(readout()).toBe('Attuale21.3°Target30.0°');

      await advance(500);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
      expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 30);
    });

    it('never goes below 7°', async () => {
      render(<ThermoBody device={makeDevice({ target: 7.5 })} />);

      tap(MINUS);
      tap(MINUS);
      tap(MINUS);
      expect(readout()).toBe('Attuale21.3°Target7.0°');

      await advance(500);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
      expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 7);
    });

    it('sends nothing when the target is already at a limit', async () => {
      const { unmount } = render(<ThermoBody device={makeDevice({ target: 30 })} />);
      tap(PLUS);
      await advance(1000);
      unmount();

      render(<ThermoBody device={makeDevice({ target: 7 })} />);
      tap(MINUS);
      await advance(1000);

      expect(mockSetRoomSetpoint).not.toHaveBeenCalled();
    });

    it('starts from 20° when the room has no target', async () => {
      render(<ThermoBody device={makeDevice({ target: undefined })} />);
      expect(readout()).toBe('Attuale21.3°Target20.0°');

      tap(PLUS);
      await advance(500);
      expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 20.5);
    });
  });

  describe('command in progress', () => {
    it('shows the spinner on "+0.5°", locks the others and ignores taps until it settles', async () => {
      const command = deferred();
      mockSetRoomSetpoint.mockReturnValueOnce(command.promise);
      render(<ThermoBody device={makeDevice()} />);

      tap(PLUS);
      // Before the command starts nothing is locked
      expectIdle(PLUS);
      expectIdle(MINUS);
      expectIdle(SCHEDULE);

      await advance(500);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);

      expectSpinner(PLUS);
      expect(button(PLUS)).toBeEnabled();
      expect(button(MINUS)).toBeDisabled();
      expect(button(SCHEDULE)).toBeDisabled();
      expect(within(button(MINUS)).queryByTestId('mini-button-spinner')).not.toBeInTheDocument();

      // Taps while it runs: the target does not move, nothing is sent
      tap(PLUS);
      tap(MINUS);
      tap(SCHEDULE);
      expect(readout()).toBe('Attuale21.3°Target21.5°');
      await advance(1000);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
      expect(mockSetRoomMode).not.toHaveBeenCalled();

      await act(async () => {
        command.resolve();
      });

      expectIdle(PLUS);
      expectIdle(MINUS);
      expectIdle(SCHEDULE);

      // Back to normal: the next tap sends again
      tap(PLUS);
      await advance(500);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(2);
      expect(mockSetRoomSetpoint).toHaveBeenLastCalledWith('room-1', 22);
    });

    it('shows the spinner on "−0.5°" when the last tap lowered the target', async () => {
      const command = deferred();
      mockSetRoomSetpoint.mockReturnValueOnce(command.promise);
      render(<ThermoBody device={makeDevice()} />);

      tap(PLUS);
      tap(MINUS);
      tap(MINUS);
      await advance(500);
      expect(mockSetRoomSetpoint).toHaveBeenCalledWith('room-1', 20.5);

      expectSpinner(MINUS);
      expect(button(MINUS)).toBeEnabled();
      expect(button(PLUS)).toBeDisabled();
      expect(button(SCHEDULE)).toBeDisabled();

      await act(async () => {
        command.resolve();
      });

      expectIdle(MINUS);
      expectIdle(PLUS);
      expectIdle(SCHEDULE);
    });
  });

  describe('"Programma"', () => {
    it('gives the single room back to the schedule', async () => {
      render(<ThermoBody device={makeDevice()} />);

      tap(SCHEDULE);
      await advance(0);

      expect(mockSetRoomMode).toHaveBeenCalledTimes(1);
      expect(mockSetRoomMode).toHaveBeenCalledWith('room-1', 'home');
      expect(mockSetHomeMode).not.toHaveBeenCalled();
      expect(mockSetRoomSetpoint).not.toHaveBeenCalled();
    });

    it('shows the spinner, locks the steps and sends once until it settles', async () => {
      const command = deferred();
      mockSetRoomMode.mockReturnValueOnce(command.promise);
      render(<ThermoBody device={makeDevice()} />);

      tap(SCHEDULE);
      await advance(0);

      expectSpinner(SCHEDULE);
      expect(button(SCHEDULE)).toBeEnabled();
      expect(button(MINUS)).toBeDisabled();
      expect(button(PLUS)).toBeDisabled();

      tap(SCHEDULE);
      tap(PLUS);
      await advance(1000);
      expect(mockSetRoomMode).toHaveBeenCalledTimes(1);
      expect(mockSetRoomSetpoint).not.toHaveBeenCalled();
      expect(readout()).toBe('Attuale21.3°Target21.0°');

      await act(async () => {
        command.resolve();
      });

      expectIdle(SCHEDULE);
      expectIdle(MINUS);
      expectIdle(PLUS);
    });
  });

  describe('locked', () => {
    it.each([
      ['the home id is empty', () => { thermoDataMock.topology = { home_id: '', rooms: [], modules: [] }; }, {}],
      ['the topology is not loaded', () => { thermoDataMock.topology = null; }, {}],
      ['the room id is empty', () => undefined, { roomId: '' }],
      ['the room id is missing', () => undefined, { roomId: undefined }],
    ])('disables every button and sends nothing when %s', async (_label, arrange, extra) => {
      arrange();
      render(<ThermoBody device={makeDevice(extra)} />);

      expect(button(MINUS)).toBeDisabled();
      expect(button(PLUS)).toBeDisabled();
      expect(button(SCHEDULE)).toBeDisabled();

      tap(PLUS);
      tap(MINUS);
      tap(SCHEDULE);
      await advance(1000);

      expect(readout()).toBe('Attuale21.3°Target21.0°');
      expect(mockSetRoomSetpoint).not.toHaveBeenCalled();
      expect(mockSetRoomMode).not.toHaveBeenCalled();
    });
  });

  describe('errors', () => {
    it('reports a refused command to the card through onError', () => {
      const onError = jest.fn();
      render(<ThermoBody device={makeDevice()} onError={onError} />);

      const params = mockUseThermostatCommands.mock.calls[0]![0] as CommandsParams;
      params.setError('Netatmo non raggiungibile');

      expect(onError).toHaveBeenCalledWith('Netatmo non raggiungibile');
    });

    it('clears the previous error before sending the setpoint', async () => {
      const onError = jest.fn();
      render(<ThermoBody device={makeDevice()} onError={onError} />);

      tap(PLUS);
      expect(onError).not.toHaveBeenCalled();

      await advance(500);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(null);
    });

    it('clears the previous error before "Programma"', async () => {
      const onError = jest.fn();
      render(<ThermoBody device={makeDevice()} onError={onError} />);

      tap(SCHEDULE);
      await advance(0);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(null);
    });

    it('works without onError', async () => {
      render(<ThermoBody device={makeDevice()} />);

      const params = mockUseThermostatCommands.mock.calls[0]![0] as CommandsParams;
      expect(() => params.setError('Comando fallito')).not.toThrow();

      tap(PLUS);
      await advance(500);
      expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
    });
  });
});
