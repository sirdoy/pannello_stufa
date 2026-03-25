import { render, screen } from '@testing-library/react';
import SystemInfoCard from '../SystemInfoCard';

describe('SystemInfoCard', () => {
  const mockData = {
    model: 'FRITZ!Box 7590',
    firmware_version: '7.57',
    update_available: '',
    device_uptime_seconds: 90061, // 1d 1h 1m
  };

  it('renders model name', () => {
    render(<SystemInfoCard data={mockData} loading={false} stale={false} />);
    expect(screen.getByText('FRITZ!Box 7590')).toBeInTheDocument();
  });

  it('renders firmware version', () => {
    render(<SystemInfoCard data={mockData} loading={false} stale={false} />);
    expect(screen.getByText('7.57')).toBeInTheDocument();
  });

  it('renders formatted uptime', () => {
    // 90061s = 1d 1h 1m -> formatted as "1g 1h"
    render(<SystemInfoCard data={mockData} loading={false} stale={false} />);
    expect(screen.getByText('1g 1h')).toBeInTheDocument();
  });

  it('renders update badge when update_available is non-empty', () => {
    render(
      <SystemInfoCard
        data={{ ...mockData, update_available: '7.58' }}
        loading={false}
        stale={false}
      />,
    );
    expect(screen.getByText('Aggiornamento disponibile')).toBeInTheDocument();
  });

  it('does not render update badge when update_available is empty string', () => {
    render(<SystemInfoCard data={mockData} loading={false} stale={false} />);
    expect(screen.queryByText('Aggiornamento disponibile')).not.toBeInTheDocument();
  });

  it('returns null when data is null and not loading', () => {
    const { container } = render(<SystemInfoCard data={null} loading={false} stale={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders skeleton rows when loading', () => {
    render(<SystemInfoCard data={null} loading={true} stale={false} />);
    // Skeletons are rendered (card with skeleton children)
    const card = document.querySelector('[class*="rounded-2xl"]');
    expect(card).toBeInTheDocument();
  });

  it('shows stale indicator when stale is true', () => {
    render(<SystemInfoCard data={mockData} loading={false} stale={true} />);
    expect(screen.getByText('Dati non aggiornati')).toBeInTheDocument();
  });
});
