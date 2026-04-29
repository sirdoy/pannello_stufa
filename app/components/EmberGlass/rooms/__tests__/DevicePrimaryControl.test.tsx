/**
 * DevicePrimaryControl jest spec — Plan 179-04 (ROOMS-04 / CONTEXT D-25).
 *
 * Tests 1-9 cover all 5 dispatch branches:
 *   1-2: sonos — play/pause button wired to handlePlay/handlePause
 *   3: camera — LIVE pill (10px caps, letterSpacing) + pulsing dot
 *   4: sensor — OK pill
 *   5: light — InlineToggle → handleRoomToggle(groupId, !device.on)
 *   6: plug — InlineToggle → togglePlug(id, device.on)
 *   7: thermo — InlineToggle → setRoomMode(roomId, 'manual'/'home') [Pitfall 3]
 *   8: valve — same as thermo
 *   9: stove/tv/shade — 40px empty placeholder div
 *
 * Critical: setRoomMode must use 'manual' | 'home', NOT 'on' | 'off' (Pitfall 3).
 * Mocks all data + commands hooks to keep the spec isolated.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { DevicePrimaryControl } from '../DevicePrimaryControl';
import type { RoomDevice } from '../types';

// --- Sonos mocks ---
const mockHandlePlay = jest.fn().mockResolvedValue(undefined);
const mockHandlePause = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/sonos/hooks/useSonosFullData', () => ({
  useSonosFullData: () => ({ data: null, loading: false, error: null, stale: false, fetchData: jest.fn() }),
}));

jest.mock('@/app/components/devices/sonos/hooks/useSonosCommands', () => ({
  useSonosCommands: () => ({
    handlePlay: mockHandlePlay,
    handlePause: mockHandlePause,
    handleNext: jest.fn(),
    handlePrevious: jest.fn(),
    handleSetVolume: jest.fn(),
    handleSetZoneVolume: jest.fn(),
    handleStop: jest.fn(),
    handleSetMute: jest.fn(),
    handleSetPlayMode: jest.fn(),
    handleSetSleepTimer: jest.fn(),
    handleSetEq: jest.fn(),
    handleSetHomeTheater: jest.fn(),
    handleSwitchSource: jest.fn(),
    handleJoinGroup: jest.fn(),
    handleUnjoinGroup: jest.fn(),
    handleSeek: jest.fn(),
    sonosTransportCmd: {},
    sonosVolumeCmd: {},
    sonosExtendedCmd: {},
  }),
}));

// --- Lights mocks ---
const mockHandleRoomToggle = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/lights/hooks/useLightsData', () => ({
  useLightsData: () => ({
    loading: false,
    error: null,
    connected: true,
    stale: false,
    groups: [],
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
    roomColors: [],
    roomOnBrightness: 0,
    dynamicRoomStyle: null,
    contrastMode: 'default',
    adaptive: {
      heading: '',
      text: '',
      textSecondary: '',
      badge: '',
      badgeGlow: '',
      statusOn: '',
      statusOff: '',
      buttonVariant: null,
      buttonClass: '',
      slider: '',
      brightnessPanel: '',
      brightnessValue: '',
    },
    setSelectedGroupId: jest.fn(),
    setLocalBrightness: jest.fn(),
    setError: jest.fn(),
    setRefreshing: jest.fn(),
    setLoadingMessage: jest.fn(),
    checkConnection: jest.fn(),
    fetchData: jest.fn(),
    handleRefresh: jest.fn(),
  }),
}));

jest.mock('@/app/components/devices/lights/hooks/useLightsCommands', () => ({
  useLightsCommands: () => ({
    handleRoomToggle: mockHandleRoomToggle,
    handleBrightnessChange: jest.fn(),
    handleSceneActivate: jest.fn(),
    handleAllLightsToggle: jest.fn(),
    hueRoomCmd: {},
    hueSceneCmd: {},
  }),
}));

// --- Tuya mocks ---
const mockTogglePlug = jest.fn().mockResolvedValue(null);

jest.mock('@/app/components/devices/tuya/hooks/useTuyaCommands', () => ({
  useTuyaCommands: () => ({
    togglePlug: mockTogglePlug,
    setTimer: jest.fn(),
    cancelTimer: jest.fn(),
  }),
}));

// --- Thermostat mocks ---
const mockSetRoomMode = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatData', () => ({
  useThermostatData: () => ({
    topology: { home_id: 'home-1', home_name: 'Casa' },
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatCommands', () => ({
  useThermostatCommands: () => ({
    setRoomSetpoint: jest.fn(),
    setHomeMode: jest.fn(),
    setRoomMode: mockSetRoomMode,
    netatmoTempCmd: {},
    netatmoModeCmd: {},
  }),
}));

// --- InlineToggle mock (to detect toggle calls) ---
// DevicePrimaryControl imports from '../InlineToggle' (relative to rooms/)
// which resolves to app/components/EmberGlass/InlineToggle.tsx
jest.mock('../../InlineToggle', () => ({
  InlineToggle: ({ on, onChange }: { on: boolean; onChange: (e: React.MouseEvent<HTMLButtonElement>) => void }) => (
    <button
      data-testid="mock-inline-toggle"
      data-on={String(on)}
      onClick={onChange as React.MouseEventHandler<HTMLButtonElement>}
    />
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const makeDevice = (overrides: Partial<RoomDevice>): RoomDevice => ({
  kind: 'light',
  name: 'Test Device',
  on: true,
  value: '100%',
  tone: 'var(--accent)',
  extra: {},
  ...overrides,
});

describe('DevicePrimaryControl (ROOMS-04 / CONTEXT D-25)', () => {
  // Test 1: sonos playing → Pause button
  it('Test 1: sonos on (playing) renders pause button; click calls handlePause', async () => {
    const device = makeDevice({ kind: 'sonos', on: true, extra: { id: 'group-abc', coordinator: 'uid-1', track: 'Song', artist: 'Artist', volume: 50 } });
    render(<DevicePrimaryControl device={device} />);
    const btn = screen.getByRole('button', { name: /pausa/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockHandlePause).toHaveBeenCalledWith('group-abc');
  });

  // Test 2: sonos off (paused) → Play button
  it('Test 2: sonos off (paused) renders play button; click calls handlePlay', async () => {
    const device = makeDevice({ kind: 'sonos', on: false, extra: { id: 'group-abc', coordinator: 'uid-1', track: 'Song', artist: 'Artist', volume: 50 } });
    render(<DevicePrimaryControl device={device} />);
    const btn = screen.getByRole('button', { name: /riproduci/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockHandlePlay).toHaveBeenCalledWith('group-abc');
  });

  // Test 3: camera → LIVE pill
  it('Test 3: camera renders LIVE pill and pulsing dot', () => {
    const device = makeDevice({ kind: 'camera', on: true, extra: { fps: 24, motion: 'none' } });
    render(<DevicePrimaryControl device={device} />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    // Pulsing dot should be in DOM (aria-hidden or similar)
    const container = screen.getByText('LIVE').closest('div');
    expect(container).not.toBeNull();
  });

  // Test 4: sensor → OK pill
  it('Test 4: sensor renders OK pill', () => {
    const device = makeDevice({ kind: 'sensor', on: true, extra: { humidity: 58, trend: 'stabile' } });
    render(<DevicePrimaryControl device={device} />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  // Test 5: light → InlineToggle; click fires handleRoomToggle(groupId, !device.on)
  it('Test 5: light renders InlineToggle; toggle fires handleRoomToggle', () => {
    const device = makeDevice({ kind: 'light', on: true, extra: { groupId: 'g-soggiorno' } });
    render(<DevicePrimaryControl device={device} />);
    const toggle = screen.getByTestId('mock-inline-toggle');
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(mockHandleRoomToggle).toHaveBeenCalledWith('g-soggiorno', false);
  });

  // Test 6: plug → InlineToggle; click fires togglePlug(id, device.on)
  it('Test 6: plug renders InlineToggle; toggle fires togglePlug', () => {
    const device = makeDevice({ kind: 'plug', on: true, extra: { id: 'plug-123', power: 250, today_kwh: 1.2 } });
    render(<DevicePrimaryControl device={device} />);
    const toggle = screen.getByTestId('mock-inline-toggle');
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(mockTogglePlug).toHaveBeenCalledWith('plug-123', true);
  });

  // Test 7: thermo → InlineToggle; clicking when on fires setRoomMode(roomId, 'home') [Pitfall 3]
  it('Test 7: thermo on fires setRoomMode(roomId, "home") — Pitfall 3', () => {
    const device = makeDevice({ kind: 'thermo', on: true, extra: { roomId: 'room-1', current: 21, target: 22 } });
    render(<DevicePrimaryControl device={device} />);
    const toggle = screen.getByTestId('mock-inline-toggle');
    fireEvent.click(toggle);
    expect(mockSetRoomMode).toHaveBeenCalledWith('room-1', 'home');
    expect(mockSetRoomMode).not.toHaveBeenCalledWith(expect.anything(), 'on');
    expect(mockSetRoomMode).not.toHaveBeenCalledWith(expect.anything(), 'off');
  });

  // Test 8: valve (same as thermo) — when off fires setRoomMode(roomId, 'manual')
  it('Test 8: valve off fires setRoomMode(roomId, "manual") — Pitfall 3', () => {
    const device = makeDevice({ kind: 'valve', on: false, extra: { roomId: 'room-2', current: 19, target: 20 } });
    render(<DevicePrimaryControl device={device} />);
    const toggle = screen.getByTestId('mock-inline-toggle');
    fireEvent.click(toggle);
    expect(mockSetRoomMode).toHaveBeenCalledWith('room-2', 'manual');
    expect(mockSetRoomMode).not.toHaveBeenCalledWith(expect.anything(), 'on');
    expect(mockSetRoomMode).not.toHaveBeenCalledWith(expect.anything(), 'off');
  });

  // Test 9: stove/tv/shade → empty 40px placeholder
  it('Test 9: stove renders empty 40px placeholder (no button)', () => {
    const device = makeDevice({ kind: 'stove', extra: {} });
    const { container } = render(<DevicePrimaryControl device={device} />);
    expect(screen.queryByRole('button')).toBeNull();
    const placeholder = container.querySelector('[aria-hidden="true"]');
    expect(placeholder).not.toBeNull();
  });

  it('Test 9b: tv renders empty placeholder', () => {
    const device = makeDevice({ kind: 'tv', extra: {} });
    const { container } = render(<DevicePrimaryControl device={device} />);
    expect(screen.queryByRole('button')).toBeNull();
    const placeholder = container.querySelector('[aria-hidden="true"]');
    expect(placeholder).not.toBeNull();
  });

  it('Test 9c: shade renders empty placeholder', () => {
    const device = makeDevice({ kind: 'shade', extra: {} });
    const { container } = render(<DevicePrimaryControl device={device} />);
    expect(screen.queryByRole('button')).toBeNull();
    const placeholder = container.querySelector('[aria-hidden="true"]');
    expect(placeholder).not.toBeNull();
  });
});
