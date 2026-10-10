/**
 * DevicePrimaryControl spec: one-tap command on the right of a DeviceCard header
 * (ROADMAP M84 + M81).
 *
 *   - light → toggle of the single light (`handleLightToggle(lightId, !on)`)
 *   - plug  → toggle (`togglePlug(id, on)`), reports an unconfirmed command
 *   - sonos → play / pause of the zone
 *   - other kinds and unreachable devices → nothing
 *
 * Command in progress: the control is busy and ignores a second tap until the command settles.
 * The commands hooks are mocked; InlineToggle and usePendingActions are the real ones.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { DevicePrimaryControl } from '../DevicePrimaryControl';
import type { DeviceKind, RoomDevice } from '../types';

// --- Lights -------------------------------------------------------------
const mockHandleLightToggle = jest.fn();
const mockUseRoomLightCommands = jest.fn();
jest.mock('../useRoomLightCommands', () => ({
  useRoomLightCommands: (onError?: (message: string | null) => void) => mockUseRoomLightCommands(onError),
}));

// --- Tuya ---------------------------------------------------------------
const mockTogglePlug = jest.fn();
jest.mock('@/app/components/devices/tuya/hooks/useTuyaCommands', () => ({
  useTuyaCommands: () => ({ togglePlug: mockTogglePlug, setTimer: jest.fn(), cancelTimer: jest.fn() }),
}));

// --- Sonos --------------------------------------------------------------
const mockHandlePlay = jest.fn();
const mockHandlePause = jest.fn();
const mockSonosFetchData = jest.fn();
const mockSonosApplyMutation = jest.fn();
const mockUseSonosCommands = jest.fn();
jest.mock('@/app/components/devices/sonos/hooks/useSonosFullData', () => ({
  useSonosFullData: () => ({
    data: null,
    loading: false,
    error: null,
    stale: false,
    fetchData: mockSonosFetchData,
    applyMutation: mockSonosApplyMutation,
  }),
}));
jest.mock('@/app/components/devices/sonos/hooks/useSonosCommands', () => ({
  useSonosCommands: (params: unknown) => mockUseSonosCommands(params),
}));

// --- Helpers ------------------------------------------------------------

function makeDevice(over: Partial<RoomDevice> = {}): RoomDevice {
  return {
    id: 1,
    kind: 'light',
    name: 'Lampada',
    on: true,
    value: '',
    tone: '#f5c84a',
    extra: { lightId: '5', brightness: 80 },
    ...over,
  };
}

const plug = (over: Partial<RoomDevice> = {}) =>
  makeDevice({ kind: 'plug', name: 'Presa', extra: { id: 'plug-1', power: 12, today_kwh: 1 }, ...over });

const sonos = (over: Partial<RoomDevice> = {}) =>
  makeDevice({ kind: 'sonos', name: 'Sala', extra: { id: 'RINCON_A:1', track: '', artist: '', volume: 20 }, ...over });

/** A promise the test settles by hand, to hold a command "in progress" */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Clicks and lets the command settle */
async function clickAndSettle(el: HTMLElement) {
  await act(async () => {
    fireEvent.click(el);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockHandleLightToggle.mockResolvedValue(undefined);
  mockTogglePlug.mockResolvedValue({ data_confirmed: true });
  mockHandlePlay.mockResolvedValue(undefined);
  mockHandlePause.mockResolvedValue(undefined);
  mockUseRoomLightCommands.mockReturnValue({ handleLightToggle: mockHandleLightToggle });
  mockUseSonosCommands.mockReturnValue({ handlePlay: mockHandlePlay, handlePause: mockHandlePause });
});

// --- Light --------------------------------------------------------------

describe('DevicePrimaryControl: light', () => {
  it('a light that is on: switch checked, labelled "Spegni <name>"; a tap turns off that single light', async () => {
    render(<DevicePrimaryControl device={makeDevice({ on: true })} />);
    const toggle = screen.getByRole('switch', { name: 'Spegni Lampada' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await clickAndSettle(toggle);
    expect(mockHandleLightToggle).toHaveBeenCalledTimes(1);
    expect(mockHandleLightToggle).toHaveBeenCalledWith('5', false);
  });

  it('a light that is off: labelled "Accendi <name>"; a tap turns it on', async () => {
    render(<DevicePrimaryControl device={makeDevice({ on: false })} />);
    const toggle = screen.getByRole('switch', { name: 'Accendi Lampada' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await clickAndSettle(toggle);
    expect(mockHandleLightToggle).toHaveBeenCalledWith('5', true);
  });

  it('gives onError to the light commands, so a refused command reaches the card', () => {
    const onError = jest.fn();
    render(<DevicePrimaryControl device={makeDevice()} onError={onError} />);
    expect(mockUseRoomLightCommands).toHaveBeenCalledWith(onError);
  });

  it('a tap does not reach the card around the toggle', async () => {
    const onCardClick = jest.fn();
    render(
      <div onClick={onCardClick}>
        <DevicePrimaryControl device={makeDevice()} />
      </div>,
    );
    await clickAndSettle(screen.getByRole('switch'));
    expect(mockHandleLightToggle).toHaveBeenCalledTimes(1);
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('sends nothing when the device has no light id', async () => {
    render(<DevicePrimaryControl device={makeDevice({ extra: {} })} />);
    await clickAndSettle(screen.getByRole('switch'));
    expect(mockHandleLightToggle).not.toHaveBeenCalled();
    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-busy');
  });

  it('command in progress: busy with a spinner, a second tap is ignored, then it settles', async () => {
    const command = deferred<void>();
    mockHandleLightToggle.mockReturnValue(command.promise);
    const onCardClick = jest.fn();
    render(
      <div onClick={onCardClick}>
        <DevicePrimaryControl device={makeDevice({ on: false })} />
      </div>,
    );
    const toggle = screen.getByRole('switch');
    expect(toggle).not.toHaveAttribute('aria-busy');
    expect(screen.queryByTestId('inline-toggle-spinner')).not.toBeInTheDocument();

    await clickAndSettle(toggle);
    expect(toggle).toHaveAttribute('aria-busy', 'true');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    // Not natively disabled: a disabled button would let the tap reach the card
    expect(toggle).toBeEnabled();
    expect(screen.getByTestId('inline-toggle-spinner')).toBeInTheDocument();

    await clickAndSettle(toggle);
    await clickAndSettle(toggle);
    expect(mockHandleLightToggle).toHaveBeenCalledTimes(1);
    expect(onCardClick).not.toHaveBeenCalled();

    await act(async () => {
      command.resolve();
    });
    expect(toggle).not.toHaveAttribute('aria-busy');
    expect(toggle).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByTestId('inline-toggle-spinner')).not.toBeInTheDocument();

    // Settled: the next tap sends a new command
    await clickAndSettle(toggle);
    expect(mockHandleLightToggle).toHaveBeenCalledTimes(2);
  });
});

// --- Plug ---------------------------------------------------------------

describe('DevicePrimaryControl: plug', () => {
  it('a tap toggles the plug, passing its current state', async () => {
    render(<DevicePrimaryControl device={plug({ on: true })} />);
    await clickAndSettle(screen.getByRole('switch', { name: 'Spegni Presa' }));
    expect(mockTogglePlug).toHaveBeenCalledTimes(1);
    expect(mockTogglePlug).toHaveBeenCalledWith('plug-1', true);
  });

  it('a plug that is off is labelled "Accendi <name>" and passes on=false', async () => {
    render(<DevicePrimaryControl device={plug({ on: false })} />);
    await clickAndSettle(screen.getByRole('switch', { name: 'Accendi Presa' }));
    expect(mockTogglePlug).toHaveBeenCalledWith('plug-1', false);
  });

  it('a confirmed command clears the previous error and reports nothing', async () => {
    const onError = jest.fn();
    render(<DevicePrimaryControl device={plug()} onError={onError} />);
    await clickAndSettle(screen.getByRole('switch'));
    expect(onError.mock.calls).toEqual([[null]]);
  });

  it('reports "La presa non ha confermato il comando" when the command resolves null', async () => {
    mockTogglePlug.mockResolvedValue(null);
    const onError = jest.fn();
    render(<DevicePrimaryControl device={plug()} onError={onError} />);
    await clickAndSettle(screen.getByRole('switch'));
    expect(onError.mock.calls).toEqual([[null], ['La presa non ha confermato il comando']]);
    // The control is usable again after the refusal
    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-busy');
  });

  it('works without an onError callback', async () => {
    mockTogglePlug.mockResolvedValue(null);
    render(<DevicePrimaryControl device={plug()} />);
    await clickAndSettle(screen.getByRole('switch'));
    expect(mockTogglePlug).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when the device has no plug id', async () => {
    const onError = jest.fn();
    render(<DevicePrimaryControl device={plug({ extra: {} })} onError={onError} />);
    await clickAndSettle(screen.getByRole('switch'));
    expect(mockTogglePlug).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('a tap does not reach the card around the toggle', async () => {
    const onCardClick = jest.fn();
    render(
      <div onClick={onCardClick}>
        <DevicePrimaryControl device={plug()} />
      </div>,
    );
    await clickAndSettle(screen.getByRole('switch'));
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('command in progress: busy, a second tap is ignored; the result is reported once it settles', async () => {
    const command = deferred<null>();
    mockTogglePlug.mockReturnValue(command.promise);
    const onError = jest.fn();
    render(<DevicePrimaryControl device={plug()} onError={onError} />);
    const toggle = screen.getByRole('switch');

    await clickAndSettle(toggle);
    expect(toggle).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('inline-toggle-spinner')).toBeInTheDocument();

    await clickAndSettle(toggle);
    expect(mockTogglePlug).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls).toEqual([[null]]);

    await act(async () => {
      command.resolve(null);
    });
    expect(toggle).not.toHaveAttribute('aria-busy');
    expect(screen.queryByTestId('inline-toggle-spinner')).not.toBeInTheDocument();
    expect(onError).toHaveBeenLastCalledWith('La presa non ha confermato il comando');
  });
});

// --- Sonos --------------------------------------------------------------

describe('DevicePrimaryControl: sonos', () => {
  it('a zone that is playing shows "Pausa"; a tap pauses the zone', async () => {
    render(<DevicePrimaryControl device={sonos({ on: true })} />);
    const btn = screen.getByRole('button', { name: 'Pausa' });
    expect(btn.querySelector('svg.lucide-pause')).not.toBeNull();

    await clickAndSettle(btn);
    expect(mockHandlePause).toHaveBeenCalledTimes(1);
    expect(mockHandlePause).toHaveBeenCalledWith('RINCON_A:1');
    expect(mockHandlePlay).not.toHaveBeenCalled();
  });

  it('a paused zone shows "Riproduci"; a tap starts the zone', async () => {
    render(<DevicePrimaryControl device={sonos({ on: false })} />);
    const btn = screen.getByRole('button', { name: 'Riproduci' });
    expect(btn.querySelector('svg.lucide-play')).not.toBeNull();

    await clickAndSettle(btn);
    expect(mockHandlePlay).toHaveBeenCalledWith('RINCON_A:1');
    expect(mockHandlePause).not.toHaveBeenCalled();
  });

  it('wires the commands to the Sonos snapshot and forwards their errors to the card', async () => {
    const onError = jest.fn();
    render(<DevicePrimaryControl device={sonos()} onError={onError} />);

    const params = mockUseSonosCommands.mock.calls[0]![0] as {
      fetchData: unknown;
      applyMutation: unknown;
      setError: (message: string | null) => void;
    };
    expect(params.fetchData).toBe(mockSonosFetchData);
    expect(params.applyMutation).toBe(mockSonosApplyMutation);

    params.setError('Comando fallito: 503');
    expect(onError).toHaveBeenLastCalledWith('Comando fallito: 503');

    await clickAndSettle(screen.getByRole('button', { name: 'Pausa' }));
    expect(onError).toHaveBeenLastCalledWith(null);
  });

  it('sends nothing when the device has no zone id', async () => {
    const onError = jest.fn();
    render(<DevicePrimaryControl device={sonos({ extra: {} })} onError={onError} />);
    await clickAndSettle(screen.getByRole('button', { name: 'Pausa' }));
    expect(mockHandlePause).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('command in progress: busy with a spinner in place of the icon, a second tap is ignored', async () => {
    const command = deferred<void>();
    mockHandlePause.mockReturnValue(command.promise);
    render(<DevicePrimaryControl device={sonos({ on: true })} />);
    const btn = screen.getByRole('button', { name: 'Pausa' });
    expect(btn).not.toHaveAttribute('aria-busy');

    await clickAndSettle(btn);
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('sonos-control-spinner')).toBeInTheDocument();
    expect(btn.querySelector('svg.lucide-pause')).toBeNull();
    // The button keeps its accessible name while the spinner is shown
    expect(btn).toHaveAccessibleName('Pausa');

    await clickAndSettle(btn);
    expect(mockHandlePause).toHaveBeenCalledTimes(1);
    expect(mockHandlePlay).not.toHaveBeenCalled();

    await act(async () => {
      command.resolve();
    });
    expect(btn).not.toHaveAttribute('aria-busy');
    expect(btn).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByTestId('sonos-control-spinner')).not.toBeInTheDocument();
    expect(btn.querySelector('svg.lucide-pause')).not.toBeNull();
  });
});

// --- No control ---------------------------------------------------------

describe('DevicePrimaryControl: no one-tap command', () => {
  it.each<DeviceKind>(['stove', 'thermo', 'valve', 'camera', 'sensor', 'host'])(
    'a %s renders nothing',
    (kind) => {
      const { container } = render(<DevicePrimaryControl device={makeDevice({ kind, extra: {} })} />);
      expect(container).toBeEmptyDOMElement();
    },
  );

  it.each([
    ['light', makeDevice({ unreachable: true, on: false, statusLabel: 'Non risponde' })],
    ['plug', plug({ unreachable: true, on: false, statusLabel: 'Non risponde' })],
    ['sonos', sonos({ unreachable: true, on: false, statusLabel: 'Non risponde' })],
  ])('an unreachable %s renders nothing: no command on a state that is not known', (_kind, device) => {
    const { container } = render(<DevicePrimaryControl device={device} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
