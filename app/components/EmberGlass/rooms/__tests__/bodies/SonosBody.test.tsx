/**
 * SonosBody — track line, volume and transport of a Sonos zone (ROADMAP M84 + M81).
 *
 * `device.extra.id` is the group id of the zone. The volume is sent 250 ms after the last tap and
 * the slider is always enabled; every control shows its command in progress and the transport
 * buttons are locked while another command runs.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { RoomDevice } from '../../types';

const mockHandlePlay = jest.fn<Promise<void>, [string]>();
const mockHandlePause = jest.fn<Promise<void>, [string]>();
const mockHandleNext = jest.fn<Promise<void>, [string]>();
const mockHandlePrevious = jest.fn<Promise<void>, [string]>();
const mockHandleSetZoneVolume = jest.fn<Promise<void>, [string, number]>();
const mockFetchData = jest.fn().mockResolvedValue(undefined);
const mockApplyMutation = jest.fn().mockReturnValue(true);
const mockUseSonosCommands = jest.fn();

jest.mock('@/app/components/devices/sonos/hooks/useSonosFullData', () => ({
  useSonosFullData: () => ({
    data: null,
    loading: false,
    error: null,
    stale: false,
    fetchData: mockFetchData,
    applyMutation: mockApplyMutation,
  }),
}));

jest.mock('@/app/components/devices/sonos/hooks/useSonosCommands', () => ({
  useSonosCommands: (params: unknown) => mockUseSonosCommands(params),
}));

import { SonosBody } from '../../bodies/SonosBody';

interface CommandsParams {
  fetchData: () => Promise<void>;
  applyMutation: (body: unknown) => boolean;
  setError: (message: string | null) => void;
}

const PREVIOUS = 'Brano precedente';
const NEXT = 'Brano successivo';
const PAUSE = 'Pausa';
const PLAY = 'Riproduci';

function makeDevice(extra: Record<string, unknown> = {}, on = true): RoomDevice {
  return {
    id: 15,
    kind: 'sonos',
    name: 'Sonos Sala',
    on,
    statusLabel: on ? 'In riproduzione' : 'In pausa',
    value: on ? 'Bohemian Rhapsody' : '',
    tone: '#b080ff',
    extra: {
      id: 'group-1',
      volume: 50,
      track: 'Bohemian Rhapsody',
      artist: 'Queen',
      ...extra,
    },
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

/** Taps a button and lets the command it started settle (or stay pending) */
async function tap(name: string) {
  await act(async () => {
    fireEvent.click(button(name));
  });
}

/** Taps the volume track at `percent` of its width (jsdom has no layout: the rect is stubbed) */
function tapTrack(percent: number) {
  const track = screen.getByTestId('slider-row-track');
  Object.defineProperty(track, 'getBoundingClientRect', {
    value: () => ({ left: 0, width: 200, top: 0, bottom: 6, right: 200, height: 6 }),
    configurable: true,
  });
  fireEvent.click(track, { clientX: percent * 2 });
}

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

describe('SonosBody', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    for (const command of [mockHandlePlay, mockHandlePause, mockHandleNext, mockHandlePrevious]) {
      command.mockResolvedValue(undefined);
    }
    mockHandleSetZoneVolume.mockResolvedValue(undefined);
    mockUseSonosCommands.mockImplementation(() => ({
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleNext: mockHandleNext,
      handlePrevious: mockHandlePrevious,
      handleSetZoneVolume: mockHandleSetZoneVolume,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('track line', () => {
    it('shows "track · artist"', () => {
      const { container } = render(<SonosBody device={makeDevice()} />);
      expect(container).toHaveTextContent('Bohemian Rhapsody · Queen');
    });

    it.each([['an empty artist', ''], ['the dash placeholder', '—']])(
      'shows only the track with %s',
      (_label, artist) => {
        const { container } = render(<SonosBody device={makeDevice({ artist })} />);

        expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
        expect(container).not.toHaveTextContent('·');
        expect(container).not.toHaveTextContent('—');
      },
    );

    it('is not rendered when nothing is playing', () => {
      const { container } = render(<SonosBody device={makeDevice({ track: '', artist: '' }, false)} />);

      // Only the slider and the transport row are left
      expect(container.firstElementChild!.children).toHaveLength(2);
    });
  });

  describe('volume', () => {
    it('shows the volume of the zone', () => {
      render(<SonosBody device={makeDevice({ volume: 32 })} />);

      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('32%')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '32');
    });

    it('stays enabled while the zone is paused', async () => {
      render(<SonosBody device={makeDevice({}, false)} />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByTestId('slider-row-track')).not.toHaveAttribute('aria-disabled');

      tapTrack(20);
      await advance(250);
      expect(mockHandleSetZoneVolume).toHaveBeenCalledWith('group-1', 20);
    });

    it('is sent to the zone 250 ms after the tap', async () => {
      render(<SonosBody device={makeDevice()} />);

      tapTrack(70);
      expect(screen.getByText('70%')).toBeInTheDocument();

      await advance(249);
      expect(mockHandleSetZoneVolume).not.toHaveBeenCalled();

      await advance(1);
      expect(mockHandleSetZoneVolume).toHaveBeenCalledTimes(1);
      expect(mockHandleSetZoneVolume).toHaveBeenCalledWith('group-1', 70);
    });

    it('sends one command with the last value when taps follow each other', async () => {
      render(<SonosBody device={makeDevice()} />);

      tapTrack(10);
      await advance(200);
      tapTrack(25);
      await advance(200);
      tapTrack(40);
      await advance(250);

      expect(mockHandleSetZoneVolume).toHaveBeenCalledTimes(1);
      expect(mockHandleSetZoneVolume).toHaveBeenCalledWith('group-1', 40);
    });

    it('sends nothing when the taps end on the starting volume', async () => {
      render(<SonosBody device={makeDevice()} />);

      tapTrack(80);
      await advance(100);
      tapTrack(50);
      await advance(1000);

      expect(mockHandleSetZoneVolume).not.toHaveBeenCalled();
    });

    it('shows the command in progress, ignores taps and locks the transport until it settles', async () => {
      const command = deferred();
      mockHandleSetZoneVolume.mockReturnValueOnce(command.promise);
      render(<SonosBody device={makeDevice()} />);

      tapTrack(70);
      await advance(250);

      expect(screen.getByTestId('slider-row-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('slider-row-track')).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByRole('slider')).not.toBeInTheDocument();
      expect(button(PREVIOUS)).toBeDisabled();
      expect(button(PAUSE)).toBeDisabled();
      expect(button(NEXT)).toBeDisabled();

      tapTrack(10);
      await tap(PREVIOUS);
      await tap(PAUSE);
      await tap(NEXT);
      await advance(1000);
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(mockHandleSetZoneVolume).toHaveBeenCalledTimes(1);
      expect(mockHandlePrevious).not.toHaveBeenCalled();
      expect(mockHandlePause).not.toHaveBeenCalled();
      expect(mockHandleNext).not.toHaveBeenCalled();

      await act(async () => {
        command.resolve();
      });

      expect(screen.queryByTestId('slider-row-spinner')).not.toBeInTheDocument();
      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '70');
      expectIdle(PREVIOUS);
      expectIdle(PAUSE);
      expectIdle(NEXT);

      // Back to normal: the next tap sends again
      tapTrack(30);
      await advance(250);
      expect(mockHandleSetZoneVolume).toHaveBeenCalledTimes(2);
      expect(mockHandleSetZoneVolume).toHaveBeenLastCalledWith('group-1', 30);
    });
  });

  describe('transport', () => {
    it('has previous, pause and next while playing', () => {
      render(<SonosBody device={makeDevice()} />);

      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        PREVIOUS,
        PAUSE,
        NEXT,
      ]);
    });

    it('has play in place of pause while paused', () => {
      render(<SonosBody device={makeDevice({}, false)} />);

      expect(button(PLAY)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: PAUSE })).not.toBeInTheDocument();
    });

    it('previous goes to the previous track of the zone', async () => {
      render(<SonosBody device={makeDevice()} />);
      await tap(PREVIOUS);

      expect(mockHandlePrevious).toHaveBeenCalledTimes(1);
      expect(mockHandlePrevious).toHaveBeenCalledWith('group-1');
    });

    it('next goes to the next track of the zone', async () => {
      render(<SonosBody device={makeDevice()} />);
      await tap(NEXT);

      expect(mockHandleNext).toHaveBeenCalledTimes(1);
      expect(mockHandleNext).toHaveBeenCalledWith('group-1');
    });

    it('pause pauses a zone that is playing', async () => {
      render(<SonosBody device={makeDevice()} />);
      await tap(PAUSE);

      expect(mockHandlePause).toHaveBeenCalledTimes(1);
      expect(mockHandlePause).toHaveBeenCalledWith('group-1');
      expect(mockHandlePlay).not.toHaveBeenCalled();
    });

    it('play starts a zone that is paused', async () => {
      render(<SonosBody device={makeDevice({}, false)} />);
      await tap(PLAY);

      expect(mockHandlePlay).toHaveBeenCalledTimes(1);
      expect(mockHandlePlay).toHaveBeenCalledWith('group-1');
      expect(mockHandlePause).not.toHaveBeenCalled();
    });

    it.each([
      ['previous', PREVIOUS, mockHandlePrevious, [PAUSE, NEXT]],
      ['pause', PAUSE, mockHandlePause, [PREVIOUS, NEXT]],
      ['next', NEXT, mockHandleNext, [PREVIOUS, PAUSE]],
    ] as const)(
      '%s: spinner, one command per tap, the other two locked until it settles',
      async (_label, name, command, siblings) => {
        const running = deferred();
        command.mockReturnValueOnce(running.promise);
        render(<SonosBody device={makeDevice()} />);

        await tap(name);

        expectSpinner(name);
        expect(button(name)).toBeEnabled();
        for (const sibling of siblings) {
          expect(button(sibling)).toBeDisabled();
          expect(within(button(sibling)).queryByTestId('mini-button-spinner')).not.toBeInTheDocument();
        }

        await tap(name);
        for (const sibling of siblings) await tap(sibling);
        expect(command).toHaveBeenCalledTimes(1);
        expect(
          mockHandlePrevious.mock.calls.length + mockHandlePause.mock.calls.length + mockHandleNext.mock.calls.length,
        ).toBe(1);

        await act(async () => {
          running.resolve();
        });

        expectIdle(PREVIOUS);
        expectIdle(PAUSE);
        expectIdle(NEXT);

        // Back to normal: the next tap sends again
        await tap(name);
        expect(command).toHaveBeenCalledTimes(2);
      },
    );
  });

  describe('zone without a group id', () => {
    it('sends no command', async () => {
      render(<SonosBody device={makeDevice({ id: '' })} />);

      await tap(PREVIOUS);
      await tap(PAUSE);
      await tap(NEXT);
      tapTrack(90);
      await advance(1000);

      expect(mockHandlePrevious).not.toHaveBeenCalled();
      expect(mockHandlePause).not.toHaveBeenCalled();
      expect(mockHandlePlay).not.toHaveBeenCalled();
      expect(mockHandleNext).not.toHaveBeenCalled();
      expect(mockHandleSetZoneVolume).not.toHaveBeenCalled();
      expect(screen.queryByTestId('mini-button-spinner')).not.toBeInTheDocument();
    });
  });

  describe('errors', () => {
    it('gives the commands hook the data functions of the zone', () => {
      render(<SonosBody device={makeDevice()} />);

      const params = mockUseSonosCommands.mock.calls[0]![0] as CommandsParams;
      expect(params.fetchData).toBe(mockFetchData);
      expect(params.applyMutation).toBe(mockApplyMutation);
    });

    it('reports a refused command to the card through onError', () => {
      const onError = jest.fn();
      render(<SonosBody device={makeDevice()} onError={onError} />);

      const params = mockUseSonosCommands.mock.calls[0]![0] as CommandsParams;
      params.setError('Comando fallito: 503');
      expect(onError).toHaveBeenLastCalledWith('Comando fallito: 503');

      // The commands hook clears the error before every command
      params.setError(null);
      expect(onError).toHaveBeenLastCalledWith(null);
    });

    it('works without onError', () => {
      render(<SonosBody device={makeDevice()} />);

      const params = mockUseSonosCommands.mock.calls[0]![0] as CommandsParams;
      expect(() => params.setError('Comando fallito: 503')).not.toThrow();
    });
  });
});
