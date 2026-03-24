import { render, screen, fireEvent } from '@testing-library/react';
import SonosCard from '../SonosCard';
import { useSonosData } from '../hooks/useSonosData';
import type { UseSonosDataReturn, SonosData } from '../hooks/useSonosData';

jest.mock('../hooks/useSonosData');

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseSonosData = jest.mocked(useSonosData);

// Mock SmartHomeCard and Banner as pass-through
jest.mock('../../../ui', () => ({
  SmartHomeCard: Object.assign(
    ({ children, title }: { children?: React.ReactNode; title?: string }) => (
      <div data-testid="smart-home-card" data-title={title}>
        {children}
      </div>
    ),
    {
      Controls: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    }
  ),
  Banner: ({ title, children }: { title?: string; children?: React.ReactNode }) => (
    <div data-testid="banner" data-title={title}>
      {title}
      {children}
    </div>
  ),
}));

jest.mock('../../../ui/Skeleton', () => {
  const Skeleton = () => null;
  Skeleton.SonosCard = () => <div data-testid="skeleton-sonos" />;
  Skeleton.Card = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { __esModule: true, default: Skeleton };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="icon-play" />,
  Pause: () => <span data-testid="icon-pause" />,
  Square: () => <span data-testid="icon-square" />,
}));

const baseData: SonosData = {
  health: {
    connected: true,
    data_freshness: 'LIVE',
    device_count: 3,
    last_poll_at: '2026-03-24T10:00:00Z',
    last_success_at: '2026-03-24T10:00:00Z',
  },
  zones: [
    {
      group_id: 'RINCON_A',
      label: 'Salotto',
      coordinator_uid: 'RINCON_A',
      coordinator_name: 'Beam',
      member_count: 2,
      members: [],
    },
  ],
  nowPlaying: {
    group_id: 'RINCON_A',
    transport_state: 'PLAYING',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    album_art_url: null,
    position: '0:01:30',
    duration: '0:05:54',
    source_type: 'streaming',
  },
  speakerCount: 3,
  zoneCount: 1,
};

const baseReturn: UseSonosDataReturn = {
  data: baseData,
  loading: false,
  error: null,
  stale: false,
};

describe('SonosCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSonosData.mockReturnValue(baseReturn);
  });

  it('a. renders skeleton when loading=true and data=null', () => {
    mockUseSonosData.mockReturnValue({ ...baseReturn, data: null, loading: true });
    render(<SonosCard />);
    expect(screen.getByTestId('skeleton-sonos')).toBeInTheDocument();
  });

  it('b. renders error banner when error set and data=null', () => {
    mockUseSonosData.mockReturnValue({
      ...baseReturn,
      data: null,
      error: 'Sonos non raggiungibile',
    });
    render(<SonosCard />);
    expect(screen.getAllByText(/Non raggiungibile/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Sonos non raggiungibile')).toBeInTheDocument();
  });

  it('c. renders now-playing data when data present', () => {
    render(<SonosCard />);
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  it('d. navigates to /sonos on click', () => {
    render(<SonosCard />);
    const link = screen.getByRole('link');
    fireEvent.click(link);
    expect(mockPush).toHaveBeenCalledWith('/sonos');
  });

  it('e. renders stale banner when stale=true and data present', () => {
    mockUseSonosData.mockReturnValue({ ...baseReturn, stale: true });
    render(<SonosCard />);
    expect(screen.getByTestId('banner')).toBeInTheDocument();
    // Data still shown
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
  });

  it('f. shows "Nessuna riproduzione" when nowPlaying is null', () => {
    mockUseSonosData.mockReturnValue({
      ...baseReturn,
      data: { ...baseData, nowPlaying: null },
    });
    render(<SonosCard />);
    expect(screen.getByText('Nessuna riproduzione')).toBeInTheDocument();
  });
});
