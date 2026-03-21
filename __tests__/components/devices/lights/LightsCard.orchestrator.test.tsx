import React from 'react';
import { render, screen } from '@testing-library/react';
import LightsCard from '@/app/components/devices/lights/LightsCard';
import fs from 'fs';
import path from 'path';
import type { HueGroup, HueLight, HueScene } from '@/types/hueProxy';

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
import { buildLightsBanners } from '@/app/components/devices/lights/components/LightsBanners';

const mockUseLightsData = useLightsData as jest.MockedFunction<typeof useLightsData>;
const mockUseLightsCommands = useLightsCommands as jest.MockedFunction<typeof useLightsCommands>;
const mockBuildLightsBanners = buildLightsBanners as jest.MockedFunction<typeof buildLightsBanners>;

const mockGroup: HueGroup = {
  group_id: '1',
  name: 'Soggiorno',
  type: 'Room',
  group_class: 'Living room',
  lights: ['1'],
  any_on: true,
  all_on: false,
  brightness: 200,
  color_temp: null,
  colormode: null,
};

const mockGroup2: HueGroup = {
  group_id: '2',
  name: 'Camera',
  type: 'Room',
  group_class: 'Bedroom',
  lights: ['2'],
  any_on: false,
  all_on: false,
  brightness: null,
  color_temp: null,
  colormode: null,
};

const mockLight: HueLight = {
  light_id: '1',
  name: 'Lampada',
  on: true,
  brightness: 200,
  ct_mirek: null,
  ct_kelvin: null,
  hue: null,
  saturation: null,
  colormode: null,
  reachable: true,
  capability_tier: 'ambiance',
  room_id: '1',
  room_name: 'Soggiorno',
  model_id: null,
  light_type: null,
};

const mockScene: HueScene = {
  scene_id: 'abc',
  name: 'Relax',
  group_id: '1',
  group_name: 'Soggiorno',
  lights: ['1'],
  type: 'GroupScene',
};

describe('LightsCard Orchestrator', () => {
  const defaultLightsData = {
    loading: false,
    error: null,
    connected: true,
    stale: false,
    groups: [mockGroup, mockGroup2],
    lights: [mockLight],
    scenes: [mockScene],
    selectedGroupId: '1',
    refreshing: false,
    loadingMessage: '',
    localBrightness: null,
    selectedGroup: mockGroup,
    selectedGroupId_action: '1',
    roomLights: [mockLight],
    roomScenes: [mockScene],
    effectiveLights: [mockLight],
    hasColorLights: true,
    lightsOnCount: 1,
    lightsOffCount: 0,
    allLightsOn: true,
    allLightsOff: false,
    isRoomOn: true,
    totalLightsOn: 1,
    totalLightsOff: 0,
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
    setSelectedGroupId: jest.fn(),
    setError: jest.fn(),
    setRefreshing: jest.fn(),
    setLoadingMessage: jest.fn(),
    setLocalBrightness: jest.fn(),
    checkConnection: jest.fn(),
    fetchData: jest.fn(),
    handleRefresh: jest.fn(),
  };

  const defaultCommands = {
    handleRoomToggle: jest.fn(),
    handleBrightnessChange: jest.fn(),
    handleSceneActivate: jest.fn(),
    handleAllLightsToggle: jest.fn(),
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

  it('renders RoomSelector with group names', () => {
    render(<LightsCard />);
    // RoomSelector renders when multiple groups are present
    // Camera appears once; Soggiorno may appear multiple times in Radix select
    expect(screen.getAllByText('Soggiorno').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Camera').length).toBeGreaterThan(0);
  });

  it('passes groups mapped as { id: group_id, name: group.name } to RoomSelector', () => {
    const filePath = path.join(process.cwd(), 'app/components/devices/lights/LightsCard.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Verify the mapping in source uses proxy field names
    expect(fileContent).toContain('group.group_id');
    expect(fileContent).toContain('group.name');
  });

  it('renders LightsRoomControl when selectedGroup exists', () => {
    render(<LightsCard />);
    expect(screen.getByTestId('lights-room-control')).toBeInTheDocument();
  });

  it('renders LightsScenes when selectedGroup exists', () => {
    render(<LightsCard />);
    expect(screen.getByTestId('lights-scenes')).toBeInTheDocument();
  });

  it('renders EmptyState when no selectedGroup', () => {
    mockUseLightsData.mockReturnValue({
      ...defaultLightsData,
      selectedGroup: undefined,
    } as any);

    render(<LightsCard />);
    expect(screen.getByText('Nessuna stanza disponibile')).toBeInTheDocument();
  });

  it('does NOT render LightsRoomControl when no selectedGroup', () => {
    mockUseLightsData.mockReturnValue({
      ...defaultLightsData,
      selectedGroup: undefined,
    } as any);

    render(<LightsCard />);
    expect(screen.queryByTestId('lights-room-control')).not.toBeInTheDocument();
  });

  it('does NOT render LightsScenes when no selectedGroup', () => {
    mockUseLightsData.mockReturnValue({
      ...defaultLightsData,
      selectedGroup: undefined,
    } as any);

    render(<LightsCard />);
    expect(screen.queryByTestId('lights-scenes')).not.toBeInTheDocument();
  });

  it('does NOT render "Connetti Bridge Hue" button', () => {
    render(<LightsCard />);
    expect(screen.queryByText('Connetti Bridge Hue')).not.toBeInTheDocument();
  });

  it('passes stale=true to buildLightsBanners when stale', () => {
    mockUseLightsData.mockReturnValue({
      ...defaultLightsData,
      stale: true,
    } as any);

    render(<LightsCard />);
    expect(mockBuildLightsBanners).toHaveBeenCalledWith(
      expect.objectContaining({ stale: true })
    );
  });

  it('passes stale=false to buildLightsBanners when not stale', () => {
    render(<LightsCard />);
    expect(mockBuildLightsBanners).toHaveBeenCalledWith(
      expect.objectContaining({ stale: false })
    );
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

  it('orchestrator uses proxy field names (no CLIP v2 fields)', () => {
    const filePath = path.join(process.cwd(), 'app/components/devices/lights/LightsCard.tsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    expect(fileContent).toContain('lightsData.groups');
    expect(fileContent).toContain('lightsData.selectedGroup');
    expect(fileContent).toContain('lightsData.selectedGroupId');
    expect(fileContent).toContain('lightsData.stale');
    expect(fileContent).toContain('group.group_id');
    expect(fileContent).toContain('group.name');

    expect(fileContent).not.toContain('room.metadata?.name');
    expect(fileContent).not.toContain('room.id');
    expect(fileContent).not.toContain('connectionMode');
    expect(fileContent).not.toContain('setPairing');
    expect(fileContent).not.toContain('handleStartPairing');
  });
});
