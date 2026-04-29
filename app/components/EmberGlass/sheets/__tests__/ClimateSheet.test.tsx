/**
 * ClimateSheet (SHEET-03 / CONTEXT D-06 / D-20) — Plan 178-05 spec.
 *
 * Drives the bundle-verbatim climate-sheet body component. Mocks the underlying
 * `useThermostatData` and `useThermostatCommands` hooks to assert the contract
 * surface (zone chips, RadialDial, Tipo SheetRow, mode pills, debounce, empty,
 * loading, error).
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { ClimateSheet } from '../ClimateSheet';

// ---------------------------------------------------------------------------
// Hook mocks
// ---------------------------------------------------------------------------
const mockSetRoomSetpoint = jest.fn().mockResolvedValue(undefined);
const mockSetHomeMode = jest.fn().mockResolvedValue(undefined);
const mockSetRoomMode = jest.fn().mockResolvedValue(undefined);

jest.mock(
  '@/app/components/devices/thermostat/hooks/useThermostatCommands',
  () => ({
    useThermostatCommands: () => ({
      setRoomSetpoint: mockSetRoomSetpoint,
      setHomeMode: mockSetHomeMode,
      setRoomMode: mockSetRoomMode,
      netatmoTempCmd: { execute: jest.fn(), isRetrying: false, lastError: null },
      netatmoModeCmd: { execute: jest.fn(), isRetrying: false, lastError: null },
    }),
  }),
);

const baseData = {
  connected: true,
  topology: {
    home_id: 'home-1',
    home_name: 'Casa',
    rooms: [
      { id: 'r1', name: 'Salotto' },
      { id: 'r2', name: 'Camera' },
    ],
    modules: [
      { id: 'm1', type: 'NATherm1', room_id: 'r1' },
      { id: 'm2', type: 'NRV', room_id: 'r2' },
    ],
  } as unknown as Record<string, unknown>,
  status: {
    mode: 'schedule',
    rooms: [
      { room_id: 'r1', temperature: 21.3, setpoint: 20, mode: 'schedule', heating: false },
      { room_id: 'r2', temperature: 19.0, setpoint: 18, mode: 'manual', heating: true },
    ],
  } as unknown as Record<string, unknown>,
  loading: false,
  error: null as string | null,
  stale: false,
  staleness: null,
  lastUpdatedAt: Date.now(),
  refetch: jest.fn().mockResolvedValue(undefined),
};

// `dataOverride` deliberately widened to `Record<string, unknown>` so individual tests
// can override `topology`/`status` with `null` (loading/error states).
let dataOverride: Record<string, unknown> = {};

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatData', () => ({
  useThermostatData: () => ({ ...baseData, ...dataOverride }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  dataOverride = {};
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ClimateSheet (SHEET-03 / CONTEXT D-06)', () => {
  test('Test 1: renders 2 zone chips + RadialDial + Tipo + Modalità label + 4 mode pills', () => {
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-zone-chip-0')).toHaveTextContent('Salotto');
    expect(screen.getByTestId('climate-sheet-zone-chip-1')).toHaveTextContent('Camera');
    expect(screen.getByTestId('radial-dial')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Modalità globale')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-mode-auto')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-mode-manuale')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-mode-eco')).toBeInTheDocument();
    expect(screen.getByTestId('climate-sheet-mode-off')).toBeInTheDocument();
  });

  test('Test 2: selecting zone 1 updates RadialDial label to Camera', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-zone-chip-1'));
    expect(screen.getByTestId('radial-dial-label')).toHaveTextContent(/Camera.*attuale 19\.0°/);
  });

  test('Test 3a: Tipo row label reflects NATherm1 (termostato) for r1', () => {
    render(<ClimateSheet />);
    expect(screen.getByText('Termostato di stanza')).toBeInTheDocument();
  });

  test('Test 3b: Tipo row label reflects NRV (termovalvola) for r2', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-zone-chip-1'));
    expect(screen.getByText('Termovalvola radiatore')).toBeInTheDocument();
  });

  test("Test 4: zone.on derived from mode !== 'hg' (toggle aria-checked off when hg)", () => {
    dataOverride = {
      status: {
        mode: 'schedule',
        rooms: [
          { room_id: 'r1', temperature: 21, setpoint: 20, mode: 'hg', heating: false },
          { room_id: 'r2', temperature: 19, setpoint: 18, mode: 'manual', heating: false },
        ],
      } as unknown as Record<string, unknown>,
    };
    render(<ClimateSheet />);
    const toggleWrap = screen.getByTestId('climate-sheet-tipo-toggle');
    expect(toggleWrap).toBeInTheDocument();
    const switchEl = toggleWrap.querySelector('[role="switch"]');
    expect(switchEl).not.toBeNull();
    expect(switchEl).toHaveAttribute('aria-checked', 'false');
  });

  test('Test 5: debounces setpoint write 500ms after RadialDial plus click', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('radial-dial-plus'));
    expect(mockSetRoomSetpoint).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockSetRoomSetpoint).toHaveBeenCalledWith('r1', 21);
  });

  test('Test 6: debouncing collapses 5 rapid plus clicks into one setpoint write', () => {
    render(<ClimateSheet />);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByTestId('radial-dial-plus'));
    }
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockSetRoomSetpoint).toHaveBeenCalledTimes(1);
    // Initial target was 20; +5 clicks → 25 (clamped at max=28).
    expect(mockSetRoomSetpoint).toHaveBeenCalledWith('r1', 25);
  });

  test('Test 7: changing zone resets pending; no spurious cross-zone write', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('radial-dial-plus'));
    fireEvent.click(screen.getByTestId('climate-sheet-zone-chip-1'));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    const r1Calls = mockSetRoomSetpoint.mock.calls.filter((c) => c[0] === 'r1');
    expect(r1Calls).toHaveLength(0);
  });

  test('Test 8a: Auto pill click calls setHomeMode(schedule)', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-mode-auto'));
    expect(mockSetHomeMode).toHaveBeenCalledWith('schedule');
  });

  test('Test 8b: Eco pill click calls setHomeMode(away)', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-mode-eco'));
    expect(mockSetHomeMode).toHaveBeenCalledWith('away');
  });

  test('Test 8c: Off pill click calls setHomeMode(hg)', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-mode-off'));
    expect(mockSetHomeMode).toHaveBeenCalledWith('hg');
  });

  test('Test 9a: Manuale pill click does NOT call setHomeMode (Pitfall 5)', () => {
    render(<ClimateSheet />);
    fireEvent.click(screen.getByTestId('climate-sheet-mode-manuale'));
    expect(mockSetHomeMode).not.toHaveBeenCalled();
  });

  test('Test 9b: Manuale pill is selected (aria-checked=true) when any room mode === manual', () => {
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet-mode-manuale')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('Test 10a: Tipo InlineToggle click on zone with mode!==hg calls setRoomMode(zoneId, "home")', () => {
    // r1 starts on (mode=schedule). Clicking the toggle flips off → 'home'.
    render(<ClimateSheet />);
    const toggleWrap = screen.getByTestId('climate-sheet-tipo-toggle');
    const switchEl = toggleWrap.querySelector('[role="switch"]') as HTMLElement;
    fireEvent.click(switchEl);
    expect(mockSetRoomMode).toHaveBeenCalledWith('r1', 'home');
  });

  test('Test 10b: Tipo InlineToggle click on zone with mode==hg calls setRoomMode(zoneId, "manual")', () => {
    dataOverride = {
      status: {
        mode: 'schedule',
        rooms: [
          { room_id: 'r1', temperature: 21, setpoint: 20, mode: 'hg', heating: false },
          { room_id: 'r2', temperature: 19, setpoint: 18, mode: 'home', heating: false },
        ],
      } as unknown as Record<string, unknown>,
    };
    render(<ClimateSheet />);
    const toggleWrap = screen.getByTestId('climate-sheet-tipo-toggle');
    const switchEl = toggleWrap.querySelector('[role="switch"]') as HTMLElement;
    fireEvent.click(switchEl);
    expect(mockSetRoomMode).toHaveBeenCalledWith('r1', 'manual');
  });

  test('Test 11: renders empty state Nessuna zona configurata when topology has 0 rooms', () => {
    dataOverride = {
      topology: { home_id: 'home-1', home_name: 'Casa', rooms: [], modules: [] } as unknown as Record<string, unknown>,
      status: { mode: 'schedule', rooms: [] } as unknown as Record<string, unknown>,
    };
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet-empty')).toHaveTextContent(
      'Nessuna zona configurata',
    );
  });

  test('Test 12: renders skeleton when loading and no cached data', () => {
    dataOverride = {
      topology: null,
      status: null,
      loading: true,
    };
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet-skeleton')).toBeInTheDocument();
  });

  test('Test 13: renders error state with verbatim error string', () => {
    dataOverride = {
      topology: null,
      status: null,
      error: 'Connection refused',
    };
    render(<ClimateSheet />);
    expect(screen.getByTestId('climate-sheet-error')).toBeInTheDocument();
    expect(
      screen.getByText('Non raggiungibile. Riprova più tardi.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });
});
