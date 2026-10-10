/**
 * LightBody — brightness of a single Hue light (ROADMAP M84 + M81).
 *
 * One "Luminosità" slider. The command addresses the light by its own id, 250 ms after the last
 * tap, with the percent as a number. While it runs the slider shows a spinner and ignores taps.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import type { RoomDevice } from '../../types';

const mockHandleLightBrightnessChange = jest.fn<Promise<void>, [string, number]>();
const mockHandleBrightnessChange = jest.fn<Promise<void>, [string, string]>();
const mockDataSetError = jest.fn<void, [string | null]>();
const mockUseLightsCommands = jest.fn();

jest.mock('@/app/components/devices/lights/hooks/useLightsData', () => ({
  useLightsData: () => ({
    setRefreshing: jest.fn(),
    setLoadingMessage: jest.fn(),
    setError: mockDataSetError,
    fetchData: jest.fn().mockResolvedValue(undefined),
    groups: [],
    checkConnection: jest.fn().mockResolvedValue(undefined),
    connected: true,
  }),
}));

jest.mock('@/app/components/devices/lights/hooks/useLightsCommands', () => ({
  useLightsCommands: (params: unknown) => mockUseLightsCommands(params),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), back: jest.fn() }),
}));

import { LightBody } from '../../bodies/LightBody';

interface CommandsParams {
  lightsData: { setError: (message: string | null) => void };
}

function makeDevice(overrides: Partial<RoomDevice> = {}): RoomDevice {
  return {
    id: 12,
    kind: 'light',
    name: 'Lampada divano',
    on: true,
    statusLabel: 'Accesa',
    value: '75%',
    tone: '#f5c84a',
    extra: { lightId: '7', brightness: 75 },
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

/** Taps the track at `percent` of its width (jsdom has no layout: the rect is stubbed) */
function tapTrack(percent: number) {
  const track = screen.getByTestId('slider-row-track');
  Object.defineProperty(track, 'getBoundingClientRect', {
    value: () => ({ left: 0, width: 100, top: 0, bottom: 6, right: 100, height: 6 }),
    configurable: true,
  });
  fireEvent.click(track, { clientX: percent });
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('LightBody', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockHandleLightBrightnessChange.mockResolvedValue(undefined);
    mockUseLightsCommands.mockImplementation(() => ({
      handleLightBrightnessChange: mockHandleLightBrightnessChange,
      handleBrightnessChange: mockHandleBrightnessChange,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders one "Luminosità" slider with the brightness of the light', () => {
    render(<LightBody device={makeDevice()} />);

    expect(screen.getAllByTestId('slider-row')).toHaveLength(1);
    expect(screen.getByText('Luminosità')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '75');
    expect(screen.queryByText('Temperatura')).not.toBeInTheDocument();
  });

  it('shows 0% when the light has no brightness reading', () => {
    render(<LightBody device={makeDevice({ extra: { lightId: '7' } })} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('sends the brightness of the single light 250 ms after the tap, as a number', async () => {
    render(<LightBody device={makeDevice()} />);

    tapTrack(60);
    // The value moves at once, the command waits for the debounce
    expect(screen.getByText('60%')).toBeInTheDocument();

    await advance(249);
    expect(mockHandleLightBrightnessChange).not.toHaveBeenCalled();

    await advance(1);
    expect(mockHandleLightBrightnessChange).toHaveBeenCalledTimes(1);
    expect(mockHandleLightBrightnessChange).toHaveBeenCalledWith('7', 60);
    // The Hue room command is never used: rooms are the ones of the Pi
    expect(mockHandleBrightnessChange).not.toHaveBeenCalled();
  });

  it('sends one command with the last value when taps follow each other', async () => {
    render(<LightBody device={makeDevice()} />);

    tapTrack(20);
    await advance(200);
    tapTrack(40);
    await advance(200);
    tapTrack(90);
    await advance(249);
    expect(mockHandleLightBrightnessChange).not.toHaveBeenCalled();

    await advance(1);
    expect(mockHandleLightBrightnessChange).toHaveBeenCalledTimes(1);
    expect(mockHandleLightBrightnessChange).toHaveBeenCalledWith('7', 90);
  });

  it('sends nothing when the taps end on the starting value', async () => {
    render(<LightBody device={makeDevice()} />);

    tapTrack(30);
    await advance(100);
    tapTrack(75);
    await advance(500);

    expect(mockHandleLightBrightnessChange).not.toHaveBeenCalled();
  });

  it('shows the command in progress and ignores taps until it settles', async () => {
    const command = deferred();
    mockHandleLightBrightnessChange.mockReturnValueOnce(command.promise);
    render(<LightBody device={makeDevice()} />);

    tapTrack(60);
    await advance(250);
    expect(mockHandleLightBrightnessChange).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('slider-row-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('slider-row-track')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();

    // A tap while the command runs changes nothing and sends nothing
    tapTrack(10);
    expect(screen.getByText('60%')).toBeInTheDocument();
    await advance(1000);
    expect(mockHandleLightBrightnessChange).toHaveBeenCalledTimes(1);

    await act(async () => {
      command.resolve();
    });

    expect(screen.queryByTestId('slider-row-spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('slider-row-track')).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '60');

    // Back to normal: the next tap sends again
    tapTrack(80);
    await advance(250);
    expect(mockHandleLightBrightnessChange).toHaveBeenCalledTimes(2);
    expect(mockHandleLightBrightnessChange).toHaveBeenLastCalledWith('7', 80);
  });

  it('is disabled while the light is off: a tap sends nothing', async () => {
    render(<LightBody device={makeDevice({ on: false, statusLabel: 'Spenta', value: '' })} />);

    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.getByTestId('slider-row-track')).toHaveAttribute('aria-disabled', 'true');

    tapTrack(50);
    await advance(1000);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(mockHandleLightBrightnessChange).not.toHaveBeenCalled();
  });

  it('sends nothing for a device without a light id', async () => {
    render(<LightBody device={makeDevice({ extra: { brightness: 75 } })} />);

    tapTrack(50);
    await advance(1000);

    expect(mockHandleLightBrightnessChange).not.toHaveBeenCalled();
  });

  it('reports a refused command to the card through onError', () => {
    const onError = jest.fn();
    render(<LightBody device={makeDevice()} onError={onError} />);

    const params = mockUseLightsCommands.mock.calls[0]![0] as CommandsParams;
    params.lightsData.setError('Luce non raggiungibile');

    expect(onError).toHaveBeenCalledWith('Luce non raggiungibile');
    expect(mockDataSetError).toHaveBeenCalledWith('Luce non raggiungibile');

    // The commands hook clears the error before every command
    params.lightsData.setError(null);
    expect(onError).toHaveBeenLastCalledWith(null);
  });

  it('works without onError', () => {
    render(<LightBody device={makeDevice()} />);

    const params = mockUseLightsCommands.mock.calls[0]![0] as CommandsParams;
    expect(() => params.lightsData.setError('Comando fallito: 500')).not.toThrow();
    expect(mockDataSetError).toHaveBeenCalledWith('Comando fallito: 500');
  });
});
