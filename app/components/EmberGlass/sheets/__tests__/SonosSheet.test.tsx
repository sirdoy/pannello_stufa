/**
 * SonosSheet tests (SHEET-05 / CONTEXT D-08 / Plan 178-07).
 *
 * Verifies:
 *  - 2-zone render: group rows + volume strip + master action.
 *  - Group-row selection updates volume eyebrow + readout.
 *  - Per-row play/pause uses e.stopPropagation() and selects the row.
 *  - Volume slider write is debounced 250ms before handleSetZoneVolume.
 *  - Master button uses Promise.allSettled (tolerates partial failures).
 *  - Loading skeleton when loading && data === null.
 *  - Empty state hides volume strip when zones is empty.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SonosSheet } from '../SonosSheet';

const mockHandlePlay = jest.fn().mockResolvedValue(undefined);
const mockHandlePause = jest.fn().mockResolvedValue(undefined);
const mockHandleSetZoneVolume = jest.fn().mockResolvedValue(undefined);
const mockHandleSetVolume = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/sonos/hooks/useSonosCommands', () => ({
  useSonosCommands: () => ({
    handlePlay: mockHandlePlay,
    handlePause: mockHandlePause,
    handleSetZoneVolume: mockHandleSetZoneVolume,
    handleSetVolume: mockHandleSetVolume,
  }),
}));

const baseData = {
  data: {
    zones: [
      { group_id: 'z1', label: 'Z1', coordinator_name: 'Salotto', coordinator_uid: 'uid-1' },
      { group_id: 'z2', label: 'Z2', coordinator_name: 'Camera', coordinator_uid: 'uid-2' },
    ],
    playback: {
      z1: { transport_state: 'PLAYING', title: 'Track', artist: 'Artist' },
      z2: { transport_state: 'PAUSED_PLAYBACK' },
    },
    volumes: {
      'uid-1': { volume: 30 },
      'uid-2': { volume: 60 },
    },
  } as unknown as Record<string, unknown>,
  loading: false,
  error: null as string | null,
  stale: false,
  fetchData: jest.fn().mockResolvedValue(undefined),
};

let dataOverride: Partial<typeof baseData> = {};

jest.mock('@/app/components/devices/sonos/hooks/useSonosFullData', () => ({
  useSonosFullData: () => ({ ...baseData, ...dataOverride }),
}));

jest.mock('../../PlayingBars', () => ({
  PlayingBars: () => <div data-testid="playing-bars-mock" />,
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  dataOverride = {};
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SonosSheet (SHEET-05 / CONTEXT D-08)', () => {
  it('renders root + 2 group rows + volume strip + master action', () => {
    render(<SonosSheet />);
    expect(screen.getByTestId('sonos-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('sonos-sheet-group-0')).toHaveTextContent('Salotto');
    expect(screen.getByTestId('sonos-sheet-group-0')).toHaveTextContent('Track · Artist');
    expect(screen.getByTestId('sonos-sheet-group-1')).toHaveTextContent('Camera');
    expect(screen.getByTestId('sonos-sheet-group-1')).toHaveTextContent('Non in riproduzione');
    expect(screen.getByTestId('sonos-sheet-volume-slider')).toBeInTheDocument();
    expect(screen.getByTestId('sonos-sheet-volume-readout')).toHaveTextContent('30');
    expect(screen.getByTestId('sonos-sheet-master-action')).toHaveTextContent('Pausa ovunque');
  });

  it('renders Volume eyebrow with selected zone name', () => {
    render(<SonosSheet />);
    expect(screen.getByText(/Volume · Salotto/)).toBeInTheDocument();
  });

  it('selecting group 1 updates volume eyebrow + readout', () => {
    render(<SonosSheet />);
    fireEvent.click(screen.getByTestId('sonos-sheet-group-1'));
    expect(screen.getByText(/Volume · Camera/)).toBeInTheDocument();
    expect(screen.getByTestId('sonos-sheet-volume-readout')).toHaveTextContent('60');
  });

  it('clicking play/pause on group 0 (playing) invokes handlePause and stops propagation', () => {
    render(<SonosSheet />);
    const btn = screen.getByTestId('sonos-sheet-group-0-play-pause');
    fireEvent.click(btn);
    expect(mockHandlePause).toHaveBeenCalledWith('z1');
    expect(mockHandlePlay).not.toHaveBeenCalled();
  });

  it('clicking play/pause on group 1 (idle) invokes handlePlay', () => {
    render(<SonosSheet />);
    const btn = screen.getByTestId('sonos-sheet-group-1-play-pause');
    fireEvent.click(btn);
    expect(mockHandlePlay).toHaveBeenCalledWith('z2');
    expect(mockHandlePause).not.toHaveBeenCalled();
  });

  it('volume slider write debounced 250ms before handleSetZoneVolume', () => {
    render(<SonosSheet />);
    const slider = screen.getByTestId('sonos-sheet-volume-slider');
    fireEvent.change(slider, { target: { value: '50' } });
    expect(mockHandleSetZoneVolume).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(mockHandleSetZoneVolume).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(160);
    });
    expect(mockHandleSetZoneVolume).toHaveBeenCalledWith('z1', 50);
  });

  it('debounce coalesces multiple rapid volume changes into one write', () => {
    render(<SonosSheet />);
    const slider = screen.getByTestId('sonos-sheet-volume-slider');
    fireEvent.change(slider, { target: { value: '40' } });
    fireEvent.change(slider, { target: { value: '50' } });
    fireEvent.change(slider, { target: { value: '60' } });
    act(() => {
      jest.advanceTimersByTime(260);
    });
    expect(mockHandleSetZoneVolume).toHaveBeenCalledTimes(1);
    expect(mockHandleSetZoneVolume).toHaveBeenCalledWith('z1', 60);
  });

  it('master action when any playing → Pausa ovunque + iterates handlePause for both groups', async () => {
    render(<SonosSheet />);
    expect(screen.getByTestId('sonos-sheet-master-action')).toHaveTextContent('Pausa ovunque');
    await act(async () => {
      fireEvent.click(screen.getByTestId('sonos-sheet-master-action'));
      // Drain microtasks
      await Promise.resolve();
    });
    expect(mockHandlePause).toHaveBeenCalledWith('z1');
    expect(mockHandlePause).toHaveBeenCalledWith('z2');
    expect(mockHandlePlay).not.toHaveBeenCalled();
  });

  it('master action when none playing → Riproduci ovunque + iterates handlePlay', async () => {
    dataOverride = {
      data: {
        ...baseData.data,
        playback: {
          z1: { transport_state: 'PAUSED_PLAYBACK' },
          z2: { transport_state: 'PAUSED_PLAYBACK' },
        },
      } as unknown as Record<string, unknown>,
    };
    render(<SonosSheet />);
    expect(screen.getByTestId('sonos-sheet-master-action')).toHaveTextContent('Riproduci ovunque');
    await act(async () => {
      fireEvent.click(screen.getByTestId('sonos-sheet-master-action'));
      await Promise.resolve();
    });
    expect(mockHandlePlay).toHaveBeenCalledWith('z1');
    expect(mockHandlePlay).toHaveBeenCalledWith('z2');
    expect(mockHandlePause).not.toHaveBeenCalled();
  });

  it('master action allSettled tolerates partial failure (one rejection does not abort the rest)', async () => {
    mockHandlePause.mockRejectedValueOnce(new Error('network'));
    render(<SonosSheet />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('sonos-sheet-master-action'));
      await Promise.resolve();
    });
    expect(mockHandlePause).toHaveBeenCalledWith('z1');
    expect(mockHandlePause).toHaveBeenCalledWith('z2');
  });

  it('renders skeleton when loading and no data', () => {
    dataOverride = { data: null as unknown as Record<string, unknown>, loading: true };
    render(<SonosSheet />);
    expect(screen.getByTestId('sonos-sheet-skeleton')).toBeInTheDocument();
  });

  it('hides volume strip when zones is empty', () => {
    dataOverride = {
      data: { zones: [], playback: {}, volumes: {} } as unknown as Record<string, unknown>,
    };
    render(<SonosSheet />);
    expect(screen.queryByTestId('sonos-sheet-volume-slider')).not.toBeInTheDocument();
    expect(screen.getByTestId('sonos-sheet-master-action')).toHaveTextContent('Riproduci ovunque');
  });
});
