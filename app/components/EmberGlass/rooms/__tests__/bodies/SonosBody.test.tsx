/**
 * Phase 179 Plan 07 — SonosBody spec
 * TDD RED: tests written before component exists.
 *
 * Covers 9 behavior cases:
 *   1. Renders track-line "{track} · {artist}" when artist is non-empty and not '—'
 *   2. Renders only track when artist === '—' or empty
 *   3. SliderRow "Volume" with value, unit %, disabled when off
 *   4. ControlRow with 3 MiniButtons (SkipBack, Play/Pause, SkipForward)
 *   5. Volume debounce: tap at 70% → after 250ms → handleSetZoneVolume(group_id, 70)
 *   6. SkipBack calls handlePrevious(device.extra.id)
 *   7. Play/Pause: on → handlePause; off → handlePlay
 *   8. SkipForward calls handleNext(device.extra.id)
 *   9. Defensive: empty group_id → no command fires
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { RoomDevice } from '../../types';

// Note: test lives at rooms/__tests__/bodies/ → '../../bodies/' is rooms/bodies/

// --- Mocks ---

const mockHandlePlay = jest.fn();
const mockHandlePause = jest.fn();
const mockHandleNext = jest.fn();
const mockHandlePrevious = jest.fn();
const mockHandleSetZoneVolume = jest.fn();
const mockFetchData = jest.fn().mockResolvedValue(undefined);

jest.mock(
  '@/app/components/devices/sonos/hooks/useSonosFullData',
  () => ({
    useSonosFullData: () => ({
      data: null,
      loading: false,
      error: null,
      stale: false,
      fetchData: mockFetchData,
    }),
  }),
);

jest.mock(
  '@/app/components/devices/sonos/hooks/useSonosCommands',
  () => ({
    useSonosCommands: () => ({
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleNext: mockHandleNext,
      handlePrevious: mockHandlePrevious,
      handleSetZoneVolume: mockHandleSetZoneVolume,
    }),
  }),
);

// Import after mocks are registered
// rooms/__tests__/bodies/ → ../../bodies/ resolves to rooms/bodies/
import { SonosBody } from '../../bodies/SonosBody';

// --- Test fixtures ---

function makeDevice(overrides: Partial<RoomDevice['extra']> = {}, on = true): RoomDevice {
  return {
    kind: 'sonos',
    name: 'Soggiorno',
    on,
    value: '',
    tone: 'var(--accent)',
    extra: {
      id: 'group-1',
      coordinator: 'coordinator-uid',
      volume: 50,
      track: 'Bohemian Rhapsody',
      artist: 'Queen',
      ...overrides,
    },
  };
}

// --- Spec ---

describe('SonosBody', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Test 1: track-line with artist
  test('renders track-line "{track} · {artist}" when artist is non-empty and not "—"', () => {
    render(<SonosBody device={makeDevice()} />);
    expect(screen.getByText(/Bohemian Rhapsody/)).toBeInTheDocument();
    expect(screen.getByText(/Queen/)).toBeInTheDocument();
    // Middle-dot separator present
    expect(screen.getByText(/·/)).toBeInTheDocument();
  });

  // Test 2: omit artist when '—'
  test('renders track only when artist is "—" (em dash placeholder)', () => {
    render(<SonosBody device={makeDevice({ artist: '—' })} />);
    expect(screen.getByText(/Bohemian Rhapsody/)).toBeInTheDocument();
    // '—' (em dash) itself should not appear as the artist
    const content = screen.queryByText(/·/);
    expect(content).toBeNull();
  });

  // Test 2b: omit artist when empty string
  test('renders track only when artist is empty', () => {
    render(<SonosBody device={makeDevice({ artist: '' })} />);
    const separator = screen.queryByText(/·/);
    expect(separator).toBeNull();
  });

  // Test 3: SliderRow "Volume" with value, unit %, disabled when off
  test('renders SliderRow with label "Volume", value from device.extra.volume, disabled when device.off', () => {
    render(<SonosBody device={makeDevice({}, false)} />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
    // slider-row has opacity 0.45 when disabled
    const sliderRow = screen.getByTestId('slider-row');
    const style = sliderRow.getAttribute('style') ?? '';
    expect(style).toContain('0.45');
  });

  test('SliderRow is NOT disabled when device is on', () => {
    render(<SonosBody device={makeDevice({}, true)} />);
    const sliderRow = screen.getByTestId('slider-row');
    const style = sliderRow.getAttribute('style') ?? '';
    expect(style).not.toContain('0.45');
  });

  // Test 4: ControlRow with 3 MiniButtons
  test('renders ControlRow with 3 MiniButtons: SkipBack, Play/Pause, SkipForward', () => {
    render(<SonosBody device={makeDevice()} />);
    expect(screen.getByTestId('control-row')).toBeInTheDocument();
    // All 3 buttons
    expect(screen.getByRole('button', { name: 'Brano precedente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pausa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Brano successivo' })).toBeInTheDocument();
  });

  test('Play button aria-label is "Riproduci" when device is off', () => {
    render(<SonosBody device={makeDevice({}, false)} />);
    expect(screen.getByRole('button', { name: 'Riproduci' })).toBeInTheDocument();
  });

  // Test 5: volume debounce 250ms → handleSetZoneVolume
  test('slider click at 70% → after 250ms debounce → calls handleSetZoneVolume(group_id, 70)', async () => {
    render(<SonosBody device={makeDevice({ volume: 50 })} />);
    const track = screen.getByTestId('slider-row-track');

    // Mock getBoundingClientRect to simulate 200px-wide track
    jest.spyOn(track, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 200,
      width: 200,
      top: 0,
      bottom: 10,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect);

    // Click at x=140 → 70% of 200 → value 70
    fireEvent.click(track, { clientX: 140 });

    // Before debounce fires: should NOT have called yet
    expect(mockHandleSetZoneVolume).not.toHaveBeenCalled();

    // Advance timers past 250ms debounce
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(mockHandleSetZoneVolume).toHaveBeenCalledWith('group-1', 70);
  });

  // Test 6: SkipBack calls handlePrevious(group_id)
  test('clicking SkipBack calls handlePrevious(device.extra.id)', () => {
    render(<SonosBody device={makeDevice()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Brano precedente' }));
    expect(mockHandlePrevious).toHaveBeenCalledWith('group-1');
  });

  // Test 7: Play/Pause toggle
  test('clicking Play/Pause when device.on calls handlePause(group_id)', () => {
    render(<SonosBody device={makeDevice({}, true)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pausa' }));
    expect(mockHandlePause).toHaveBeenCalledWith('group-1');
    expect(mockHandlePlay).not.toHaveBeenCalled();
  });

  test('clicking Play/Pause when device.off calls handlePlay(group_id)', () => {
    render(<SonosBody device={makeDevice({}, false)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Riproduci' }));
    expect(mockHandlePlay).toHaveBeenCalledWith('group-1');
    expect(mockHandlePause).not.toHaveBeenCalled();
  });

  // Test 8: SkipForward calls handleNext(group_id)
  test('clicking SkipForward calls handleNext(device.extra.id)', () => {
    render(<SonosBody device={makeDevice()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Brano successivo' }));
    expect(mockHandleNext).toHaveBeenCalledWith('group-1');
  });

  // Test 9: Defensive — empty group_id → no command fires
  test('empty extra.id: SkipBack does NOT call handlePrevious', () => {
    render(<SonosBody device={makeDevice({ id: '' })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Brano precedente' }));
    expect(mockHandlePrevious).not.toHaveBeenCalled();
  });

  test('empty extra.id: SkipForward does NOT call handleNext', () => {
    render(<SonosBody device={makeDevice({ id: '' })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Brano successivo' }));
    expect(mockHandleNext).not.toHaveBeenCalled();
  });

  test('empty extra.id: Play/Pause does NOT call handlePlay or handlePause', () => {
    render(<SonosBody device={makeDevice({ id: '' }, false)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Riproduci' }));
    expect(mockHandlePlay).not.toHaveBeenCalled();
    expect(mockHandlePause).not.toHaveBeenCalled();
  });
});
