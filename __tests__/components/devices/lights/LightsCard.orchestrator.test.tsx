import React from 'react';
import { render, screen } from '@testing-library/react';
import LightsCard from '@/app/components/devices/lights/LightsCard';
import fs from 'fs';
import path from 'path';

// Mock all hooks and components
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock custom hooks
jest.mock('@/app/components/devices/lights/hooks/useLightsData', () => ({
  useLightsData: jest.fn(),
}));

jest.mock('@/app/components/devices/lights/hooks/useLightsCommands', () => ({
  useLightsCommands: jest.fn(),
}));

// Mock banner builder utility
jest.mock('@/app/components/devices/lights/components/LightsBanners', () => ({
  buildLightsBanners: jest.fn(() => []),
}));

// Mock sub-components
jest.mock('@/app/components/devices/lights/components/LightsHouseControl', () => ({
  __esModule: true,
  default: () => <div data-testid="lights-house-control">LightsHouseControl</div>,
}));

jest.mock('@/app/components/devices/lights/components/LightsRoomControl', () => ({
  __esModule: true,
  default: () => <div data-testid="lights-room-control">LightsRoomControl</div>,
}));

jest.mock('@/app/components/devices/lights/components/LightsScenes', () => ({
  __esModule: true,
  default: () => <div data-testid="lights-scenes">LightsScenes</div>,
}));

// Import after mocking
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';

const mockUseLightsData = useLightsData as jest.MockedFunction<typeof useLightsData>;
const mockUseLightsCommands = useLightsCommands as jest.MockedFunction<typeof useLightsCommands>;

describe('LightsCard Orchestrator', () => {
  const defaultLightsData = {
    loading: false,
    error: null,
    connected: true,
    connectionMode: 'local' as const,
    remoteConnected: false,
    rooms: [
      { id: 'room-1', metadata: { name: 'Living Room' } },
      { id: 'room-2', metadata: { name: 'Bedroom' } },
    ],
    lights: [
      { id: 'light-1', on: { on: true } },
      { id: 'light-2', on: { on: false } },
    ],
    scenes: [{ id: 'scene-1', metadata: { name: 'Relax' } }],
    selectedRoomId: 'room-1',
    refreshing: false,
    loadingMessage: '',
    localBrightness: null,
    pairing: false,
    pairingStep: null,
    discoveredBridges: [],
    selectedBridge: null,
    pairingCountdown: 30,
    pairingError: null,
    selectedRoom: { id: 'room-1', metadata: { name: 'Living Room' } },
    selectedRoomGroupedLightId: 'group-1',
    roomLights: [{ id: 'light-1', on: { on: true } }],
    roomScenes: [{ id: 'scene-1', metadata: { name: 'Relax' } }],
    effectiveLights: [{ id: 'light-1', on: { on: true } }],
    hasColorLights: true,
    lightsOnCount: 1,
    lightsOffCount: 0,
    allLightsOn: true,
    allLightsOff: false,
    isRoomOn: true,
    totalLightsOn: 1,
    totalLightsOff: 1,
    allHouseLightsOn: false,
    allHouseLightsOff: false,
    hasAnyLights: true,
    avgBrightness: 75,
    roomColors: ['#FFE4B5'],
    roomOnBrightness: 75,
    dynamicRoomStyle: null,
    contrastMode: 'default' as const,
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
    setSelectedRoomId: jest.fn(),
    setError: jest.fn(),
    setRefreshing: jest.fn(),
    setLoadingMessage: jest.fn(),
    setLocalBrightness: jest.fn(),
    setPairing: jest.fn(),
    setPairingStep: jest.fn(),
    setDiscoveredBridges: jest.fn(),
    setSelectedBridge: jest.fn(),
    setPairingCountdown: jest.fn(),
    setPairingError: jest.fn(),
    pairingTimerRef: { current: null },
    checkConnection: jest.fn(),
    fetchData: jest.fn(),
  };

  const defaultCommands = {
    handleRoomToggle: jest.fn(),
    handleBrightnessChange: jest.fn(),
    handleSceneActivate: jest.fn(),
    handleAllLightsToggle: jest.fn(),
    handleStartPairing: jest.fn(),
    handleRemoteAuth: jest.fn(),
    handleCancelPairing: jest.fn(),
    handleConfirmButtonPressed: jest.fn(),
    handleSelectBridge: jest.fn(),
    handleRetryPairing: jest.fn(),
    hueRoomCmd: { isExecuting: false, lastError: null, retry: jest.fn() },
    hueSceneCmd: { isExecuting: false, lastError: null, retry: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLightsData.mockReturnValue(defaultLightsData as any);
    mockUseLightsCommands.mockReturnValue(defaultCommands as any);
  });

  it('renders Skeleton.LightsCard when loading=true', () => {
    mockUseLightsData.mockReturnValue({
      ...defaultLightsData,
      loading: true,
    } as any);

    const { container } = render(<LightsCard />);
    // Skeleton renders divs with specific animation classes
    const skeletonElements = container.querySelectorAll('.animate-shimmer');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders DeviceCard with correct title when connected', () => {
    render(<LightsCard />);
    expect(screen.getByText('Luci')).toBeInTheDocument();
  });

  it('renders LightsHouseControl component', () => {
    render(<LightsCard />);
    expect(screen.getByTestId('lights-house-control')).toBeInTheDocument();
  });

  it('renders RoomSelector with room names', () => {
    render(<LightsCard />);
    // RoomSelector renders a select element
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('renders LightsRoomControl when selectedRoom exists', () => {
    render(<LightsCard />);
    expect(screen.getByTestId('lights-room-control')).toBeInTheDocument();
  });

  it('renders LightsScenes when selectedRoom exists', () => {
    render(<LightsCard />);
    expect(screen.getByTestId('lights-scenes')).toBeInTheDocument();
  });

  it('renders EmptyState when no selectedRoom', () => {
    mockUseLightsData.mockReturnValue({
      ...defaultLightsData,
      selectedRoom: null,
    } as any);

    render(<LightsCard />);
    expect(screen.getByText('Nessuna stanza disponibile')).toBeInTheDocument();
  });

  it('does NOT render LightsRoomControl when no selectedRoom', () => {
    mockUseLightsData.mockReturnValue({
      ...defaultLightsData,
      selectedRoom: null,
    } as any);

    render(<LightsCard />);
    expect(screen.queryByTestId('lights-room-control')).not.toBeInTheDocument();
  });

  it('does NOT render LightsScenes when no selectedRoom', () => {
    mockUseLightsData.mockReturnValue({
      ...defaultLightsData,
      selectedRoom: null,
    } as any);

    render(<LightsCard />);
    expect(screen.queryByTestId('lights-scenes')).not.toBeInTheDocument();
  });

  it('LightsCard.tsx line count is <= 200 lines (enforcement test)', () => {
    const filePath = path.join(process.cwd(), 'app/components/devices/lights/LightsCard.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lineCount = fileContent.split('\n').length;

    expect(lineCount).toBeLessThanOrEqual(200);
  });

  it('orchestrator uses hooks for state management (no inline useState)', () => {
    const filePath = path.join(process.cwd(), 'app/components/devices/lights/LightsCard.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Should use custom hooks, not inline useState
    expect(fileContent).toContain('useLightsData');
    expect(fileContent).toContain('useLightsCommands');

    // Should NOT have inline useState calls
    const useStateMatches = fileContent.match(/useState\(/g);
    expect(useStateMatches).toBeNull();
  });

  it('orchestrator composes 4 sub-components', () => {
    const filePath = path.join(process.cwd(), 'app/components/devices/lights/LightsCard.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    expect(fileContent).toContain('LightsHouseControl');
    expect(fileContent).toContain('LightsRoomControl');
    expect(fileContent).toContain('LightsScenes');
    expect(fileContent).toContain('buildLightsBanners');
  });
});
