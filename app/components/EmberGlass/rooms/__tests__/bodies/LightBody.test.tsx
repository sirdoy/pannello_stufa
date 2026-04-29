/**
 * LightBody jest spec — Plan 179-06 (ROOMS-05 / CONTEXT D-29 / D-54).
 *
 * TDD RED → GREEN.
 *
 * Covers:
 *   Test 1: Renders SliderRow "Luminosità" with value=brightness, unit="%",
 *            disabled=!device.on, onChange supplied (interactive)
 *   Test 2: Renders SliderRow "Temperatura" with min=2200 max=6500 unit="K",
 *            disabled={true} always (no API)
 *   Test 3: Tapping brightness track fires pending update; after 250ms debounce,
 *            calls handleBrightnessChange(groupId, "60")
 *   Test 4: Tapping temperature track does NOT call any command (always disabled)
 *   Test 5: When device.on === false, brightness slider is disabled —
 *            onChange does NOT fire
 *   Test 6: handleBrightnessChange called with brightness as a STRING (Pitfall 5)
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import type { RoomDevice } from '../../types';

const mockHandleBrightnessChange = jest.fn().mockResolvedValue(undefined);
const mockHandleRoomToggle = jest.fn().mockResolvedValue(undefined);

jest.mock(
  '@/app/components/devices/lights/hooks/useLightsData',
  () => ({
    useLightsData: () => ({
      setRefreshing: jest.fn(),
      setLoadingMessage: jest.fn(),
      setError: jest.fn(),
      fetchData: jest.fn().mockResolvedValue(undefined),
      groups: [],
      checkConnection: jest.fn().mockResolvedValue(undefined),
      connected: true,
      loading: false,
      error: null,
      lights: [],
      scenes: [],
      selectedGroupId: null,
      refreshing: false,
      loadingMessage: '',
      localBrightness: null,
      selectedGroup: undefined,
      selectedGroupId_action: null,
      roomLights: [],
      roomScenes: [],
      effectiveLights: [],
      hasColorLights: false,
      lightsOnCount: 0,
      lightsOffCount: 0,
      allLightsOn: false,
      allLightsOff: true,
      isRoomOn: false,
      totalLightsOn: 0,
      totalLightsOff: 0,
      allHouseLightsOn: false,
      allHouseLightsOff: true,
      hasAnyLights: false,
      avgBrightness: 0,
      lastUpdatedAt: null,
      stale: false,
      roomColors: [],
      roomOnBrightness: 0,
      dynamicRoomStyle: null,
      contrastMode: 'default',
      adaptive: {},
      setSelectedGroupId: jest.fn(),
      setLocalBrightness: jest.fn(),
      handleRefresh: jest.fn().mockResolvedValue(undefined),
    }),
  }),
);

jest.mock(
  '@/app/components/devices/lights/hooks/useLightsCommands',
  () => ({
    useLightsCommands: () => ({
      handleRoomToggle: mockHandleRoomToggle,
      handleBrightnessChange: mockHandleBrightnessChange,
      handleSceneActivate: jest.fn().mockResolvedValue(undefined),
      handleAllLightsToggle: jest.fn().mockResolvedValue(undefined),
      hueRoomCmd: {},
      hueSceneCmd: {},
    }),
  }),
);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
}));

import { LightBody } from '../../bodies/LightBody';

const onDevice: RoomDevice = {
  kind: 'light',
  name: 'Soggiorno',
  on: true,
  value: '75%',
  tone: 'var(--accent)',
  extra: {
    brightness: 75,
    groupId: 'group-1',
  },
};

const offDevice: RoomDevice = {
  ...onDevice,
  on: false,
  extra: { brightness: 75, groupId: 'group-1' },
};

describe('LightBody', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockHandleBrightnessChange.mockClear();
    mockHandleRoomToggle.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Test 1: renders SliderRow "Luminosità" with brightness value, % unit, interactive (onChange supplied)', () => {
    render(<LightBody device={onDevice} />);
    const sliders = screen.getAllByTestId('slider-row');
    expect(sliders.length).toBeGreaterThanOrEqual(2);

    // First slider: Luminosità — should be interactive (role=slider) when device is on
    expect(screen.getByText('Luminosità')).toBeInTheDocument();
    // Value = 75
    expect(screen.getByText('75%')).toBeInTheDocument();
    // Interactive slider has role=slider
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('Test 2: renders SliderRow "Temperatura" with min=2200 max=6500 K unit, always disabled', () => {
    render(<LightBody device={onDevice} />);
    expect(screen.getByText('Temperatura')).toBeInTheDocument();
    // K unit shown
    expect(screen.getByText(/K$/)).toBeInTheDocument();
    // Temperature slider is disabled — no role=slider for it
    // (SliderRow only sets role=slider when interactive)
    const sliderRoles = screen.queryAllByRole('slider');
    // There should be exactly 1 interactive slider (Luminosità), not 2
    expect(sliderRoles).toHaveLength(1);
  });

  it('Test 3: clicking brightness track updates pending; after 250ms calls handleBrightnessChange(groupId, "60")', async () => {
    render(<LightBody device={onDevice} />);

    const track = screen.getByRole('slider');

    // Simulate click at 60% of track width
    Object.defineProperty(track, 'getBoundingClientRect', {
      value: () => ({ left: 0, width: 100, top: 0, bottom: 0, right: 100, height: 6 }),
      configurable: true,
    });

    fireEvent.click(track, { clientX: 60 });

    // Not called yet — 250ms debounce pending
    expect(mockHandleBrightnessChange).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(mockHandleBrightnessChange).toHaveBeenCalledTimes(1);
    // Pitfall 5: brightness passed as STRING, not number
    expect(mockHandleBrightnessChange).toHaveBeenCalledWith('group-1', '60');
  });

  it('Test 4: tapping temperature track does NOT call any command (always disabled)', async () => {
    render(<LightBody device={onDevice} />);

    // Temperature track should have aria-disabled
    const tracks = screen.getAllByTestId('slider-row-track');
    // 2nd track is temperature (always disabled)
    const tempTrack = tracks[1];
    fireEvent.click(tempTrack, { clientX: 50 });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockHandleBrightnessChange).not.toHaveBeenCalled();
  });

  it('Test 5: when device.on === false, brightness slider is disabled, onChange does not fire', async () => {
    render(<LightBody device={offDevice} />);

    // When device is off, luminosità slider should be disabled — no role=slider
    const sliderRoles = screen.queryAllByRole('slider');
    expect(sliderRoles).toHaveLength(0);

    // Click brightness track — should not fire
    const tracks = screen.getAllByTestId('slider-row-track');
    fireEvent.click(tracks[0], { clientX: 50 });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockHandleBrightnessChange).not.toHaveBeenCalled();
  });

  it('Test 6: handleBrightnessChange called with brightness as STRING (Pitfall 5)', async () => {
    render(<LightBody device={onDevice} />);

    const track = screen.getByRole('slider');
    Object.defineProperty(track, 'getBoundingClientRect', {
      value: () => ({ left: 0, width: 100, top: 0, bottom: 0, right: 100, height: 6 }),
      configurable: true,
    });

    fireEvent.click(track, { clientX: 80 });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(mockHandleBrightnessChange).toHaveBeenCalledTimes(1);
    // Second argument MUST be a string
    const [, brightnessArg] = mockHandleBrightnessChange.mock.calls[0] as [string, string];
    expect(typeof brightnessArg).toBe('string');
    expect(brightnessArg).toBe('80');
  });
});
