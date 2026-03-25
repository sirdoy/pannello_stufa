import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock useSonosHistory before importing the component
jest.mock('../../hooks/useSonosHistory');

// Mock next/dynamic to render the component synchronously
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFn: () => Promise<{ default: React.ComponentType }>) => {
    // Return a simple placeholder for dynamic components in tests
    const MockDynamic = () => <div data-testid="volume-chart-mock" />;
    MockDynamic.displayName = 'MockDynamic';
    return MockDynamic;
  },
}));

import { useSonosHistory } from '../../hooks/useSonosHistory';
import SonosHistoryChart from '../SonosHistoryChart';

const mockUseSonosHistory = useSonosHistory as jest.MockedFunction<typeof useSonosHistory>;

function makeMockHistory(overrides: Partial<ReturnType<typeof useSonosHistory>> = {}): ReturnType<typeof useSonosHistory> {
  return {
    data: null,
    loading: false,
    error: null,
    historyType: 'volume',
    setHistoryType: jest.fn(),
    timeRange: '24h',
    setTimeRange: jest.fn(),
    speakerFilter: null,
    setSpeakerFilter: jest.fn(),
    zoneFilter: null,
    setZoneFilter: jest.fn(),
    fetchHistory: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const mockZones = [
  { group_id: 'RINCON_A', label: 'Salotto', coordinator_uid: 'RINCON_A', coordinator_name: 'Salotto', member_count: 1, members: [] },
];
const mockSpeakers = [
  { uid: 'RINCON_A', name: 'Salotto' },
];

describe('SonosHistoryChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSonosHistory.mockReturnValue(makeMockHistory());
  });

  it('renders Cronologia heading', () => {
    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    expect(screen.getByText('Cronologia')).toBeInTheDocument();
  });

  it('renders Volume and Riproduzione type selector buttons', () => {
    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('Riproduzione')).toBeInTheDocument();
  });

  it('renders time range buttons 24h, 7g, 30g', () => {
    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('7g')).toBeInTheDocument();
    expect(screen.getByText('30g')).toBeInTheDocument();
  });

  it('calls setHistoryType when Riproduzione is clicked', () => {
    const mockSetHistoryType = jest.fn();
    mockUseSonosHistory.mockReturnValue(makeMockHistory({ setHistoryType: mockSetHistoryType }));

    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    fireEvent.click(screen.getByText('Riproduzione'));
    expect(mockSetHistoryType).toHaveBeenCalledWith('playback');
  });

  it('calls setTimeRange when 7g is clicked', () => {
    const mockSetTimeRange = jest.fn();
    mockUseSonosHistory.mockReturnValue(makeMockHistory({ setTimeRange: mockSetTimeRange }));

    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    fireEvent.click(screen.getByText('7g'));
    expect(mockSetTimeRange).toHaveBeenCalledWith('7d');
  });

  it('renders loading state as skeleton when loading is true', () => {
    mockUseSonosHistory.mockReturnValue(makeMockHistory({ loading: true }));
    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    // Loading skeleton is a div with animate-pulse class
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders error message when error is set', () => {
    mockUseSonosHistory.mockReturnValue(makeMockHistory({ error: 'Cronologia non disponibile' }));
    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    expect(screen.getByText('Cronologia non disponibile')).toBeInTheDocument();
  });

  it('renders speaker filter dropdown for volume historyType', () => {
    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    expect(screen.getByLabelText('Filtra per altoparlante')).toBeInTheDocument();
  });

  it('renders empty playback message when historyType is playback and no data', () => {
    mockUseSonosHistory.mockReturnValue(
      makeMockHistory({ historyType: 'playback', data: { items: [], total: 0, granularity: 'raw', limit: 200, offset: 0 } })
    );
    render(<SonosHistoryChart zones={mockZones} speakers={mockSpeakers} />);
    expect(screen.getByText('Nessun evento di riproduzione')).toBeInTheDocument();
  });
});
