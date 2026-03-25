import React from 'react';
import { render, screen } from '@testing-library/react';
import SonosZoneSection from '@/app/components/devices/sonos/components/SonosZoneSection';
import type {
  SonosZoneResponse,
  SonosPlaybackResponse,
  SonosVolumeResponse,
  SonosEqResponse,
} from '@/types/sonosProxy';
import type { UseSonosCommandsReturn } from '@/app/components/devices/sonos/hooks/useSonosCommands';

// Mock child components to isolate SonosZoneSection
jest.mock('@/app/components/devices/sonos/components/SonosNowPlaying', () => ({
  __esModule: true,
  default: () => <div data-testid="sonos-now-playing">NowPlaying</div>,
}));

jest.mock('@/app/components/devices/sonos/components/SonosTransportControls', () => ({
  __esModule: true,
  default: () => <div data-testid="sonos-transport-controls">TransportControls</div>,
}));

jest.mock('@/app/components/devices/sonos/components/SonosPlayModeControls', () => ({
  __esModule: true,
  default: () => <div data-testid="sonos-play-mode-controls">PlayModeControls</div>,
}));

jest.mock('@/app/components/devices/sonos/components/SonosSleepTimer', () => ({
  __esModule: true,
  default: () => <div data-testid="sonos-sleep-timer">SleepTimer</div>,
}));

jest.mock('@/app/components/devices/sonos/components/SonosQueueViewer', () => ({
  __esModule: true,
  default: () => <div data-testid="sonos-queue-viewer">QueueViewer</div>,
}));

jest.mock('@/app/components/devices/sonos/components/SonosSpeakerVolume', () => ({
  __esModule: true,
  default: ({ speakerName, eqData }: { speakerName: string; eqData: SonosEqResponse | undefined }) => (
    <div data-testid={`sonos-speaker-volume-${speakerName}`}>
      {speakerName}
      {eqData && <span data-testid={`eq-data-${speakerName}`}>EQ:{eqData.uid}</span>}
    </div>
  ),
}));

const mockZone: SonosZoneResponse = {
  group_id: 'RINCON_GROUP_1',
  label: 'Living Room',
  coordinator_uid: 'RINCON_A',
  coordinator_name: 'Speaker A',
  member_count: 2,
  members: [
    { uid: 'RINCON_A', name: 'Speaker A', ip: '192.168.1.10', role: 'speaker' },
    { uid: 'RINCON_B', name: 'Speaker B', ip: '192.168.1.11', role: 'speaker' },
  ],
};

const mockPlayback: SonosPlaybackResponse = {
  group_id: 'RINCON_GROUP_1',
  transport_state: 'PLAYING',
  title: 'Test Track',
  artist: 'Test Artist',
  album: null,
  album_art_url: null,
  source_type: 'streaming',
  current_uri: null,
  position_ms: 0,
  duration_ms: null,
};

const mockVolumes: Record<string, SonosVolumeResponse> = {
  RINCON_A: { uid: 'RINCON_A', volume: 50, mute: false },
  RINCON_B: { uid: 'RINCON_B', volume: 40, mute: false },
};

const mockEqData: Record<string, SonosEqResponse> = {
  RINCON_A: { uid: 'RINCON_A', bass: 2, treble: -1, loudness: false },
};

const mockCommands = {
  handlePlay: jest.fn(),
  handlePause: jest.fn(),
  handleStop: jest.fn(),
  handleNext: jest.fn(),
  handlePrevious: jest.fn(),
  handleSetVolume: jest.fn(),
  handleSetMute: jest.fn(),
  handleSetPlayMode: jest.fn(),
  handleSetSleepTimer: jest.fn(),
  handleSetEq: jest.fn(),
  handleSetHomeTheater: jest.fn(),
  handleSwitchSource: jest.fn(),
  handleJoinGroup: jest.fn(),
  handleUnjoinGroup: jest.fn(),
  sonosTransportCmd: {} as UseSonosCommandsReturn['sonosTransportCmd'],
  sonosVolumeCmd: {} as UseSonosCommandsReturn['sonosVolumeCmd'],
  sonosExtendedCmd: {} as UseSonosCommandsReturn['sonosExtendedCmd'],
} as UseSonosCommandsReturn;

describe('SonosZoneSection', () => {
  const defaultProps = {
    zone: mockZone,
    playback: mockPlayback,
    volumes: mockVolumes,
    playMode: undefined,
    sleepTimer: undefined,
    commands: mockCommands,
    eqData: mockEqData,
    homeTheaterData: {},
    allZones: [mockZone],
  };

  it('renders the zone label', () => {
    render(<SonosZoneSection {...defaultProps} />);
    expect(screen.getByText('Living Room')).toBeInTheDocument();
  });

  it('renders SonosSpeakerVolume for each zone member', () => {
    render(<SonosZoneSection {...defaultProps} />);
    expect(screen.getByTestId('sonos-speaker-volume-Speaker A')).toBeInTheDocument();
    expect(screen.getByTestId('sonos-speaker-volume-Speaker B')).toBeInTheDocument();
  });

  it('passes eqData to the correct speaker volume component', () => {
    render(<SonosZoneSection {...defaultProps} />);
    // Speaker A has eq data, Speaker B does not
    expect(screen.getByTestId('eq-data-Speaker A')).toBeInTheDocument();
    expect(screen.queryByTestId('eq-data-Speaker B')).toBeNull();
  });

  it('renders child sections (NowPlaying, TransportControls, QueueViewer)', () => {
    render(<SonosZoneSection {...defaultProps} />);
    expect(screen.getByTestId('sonos-now-playing')).toBeInTheDocument();
    expect(screen.getByTestId('sonos-transport-controls')).toBeInTheDocument();
    expect(screen.getByTestId('sonos-queue-viewer')).toBeInTheDocument();
  });

  it('renders member count in header', () => {
    render(<SonosZoneSection {...defaultProps} />);
    expect(screen.getByText('2 speaker')).toBeInTheDocument();
  });
});
