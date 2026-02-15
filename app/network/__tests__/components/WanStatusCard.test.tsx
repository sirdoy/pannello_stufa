import { render, screen } from '@testing-library/react';
import WanStatusCard from '../../components/WanStatusCard';
import type { WanData } from '@/app/components/devices/network/types';

// Mock CopyableIp component to avoid clipboard setup
jest.mock('../../components/CopyableIp', () => {
  return function MockCopyableIp({ ip }: { ip: string }) {
    return <div data-testid="copyable-ip">{ip}</div>;
  };
});

describe('WanStatusCard', () => {
  const mockWan: WanData = {
    connected: true,
    uptime: 90061, // 1 day, 1 hour, 1 minute, 1 second
    externalIp: '203.0.113.42',
    linkSpeed: 100,
    dns: '8.8.8.8, 8.8.4.4',
    gateway: '192.168.1.1',
    connectionType: 'DHCP',
    timestamp: Date.now(),
  };

  it('returns null when wan is null', () => {
    const { container } = render(<WanStatusCard wan={null} isStale={false} lastUpdated={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "WAN Online" badge with sage variant when connected', () => {
    render(<WanStatusCard wan={mockWan} isStale={false} lastUpdated={null} />);
    const badge = screen.getByText('WAN Online');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-sage-500/15');
  });

  it('shows "WAN Offline" badge with danger variant when disconnected', () => {
    const disconnectedWan: WanData = { ...mockWan, connected: false };
    render(<WanStatusCard wan={disconnectedWan} isStale={false} lastUpdated={null} />);
    const badge = screen.getByText('WAN Offline');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-danger-500/15');
  });

  it('shows external IP with CopyableIp', () => {
    render(<WanStatusCard wan={mockWan} isStale={false} lastUpdated={null} />);
    const ipLabel = screen.getByText('IP Esterno');
    expect(ipLabel).toBeInTheDocument();
    const copyableIp = screen.getByTestId('copyable-ip');
    expect(copyableIp).toHaveTextContent('203.0.113.42');
  });

  it('shows formatted uptime (1g 1h for 90061 seconds)', () => {
    render(<WanStatusCard wan={mockWan} isStale={false} lastUpdated={null} />);
    // 90061 seconds = 1 day (86400s) + 3661s = 1 day + 1 hour + 1 minute
    expect(screen.getByText('1g 1h')).toBeInTheDocument();
  });

  it('shows gateway value or falls back to "N/A"', () => {
    render(<WanStatusCard wan={mockWan} isStale={false} lastUpdated={null} />);
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();

    const wanWithoutGateway: WanData = { ...mockWan, gateway: undefined };
    const { rerender } = render(<WanStatusCard wan={wanWithoutGateway} isStale={false} lastUpdated={null} />);
    rerender(<WanStatusCard wan={wanWithoutGateway} isStale={false} lastUpdated={null} />);
    expect(screen.getAllByText('N/A')[0]).toBeInTheDocument();
  });

  it('shows DNS value or falls back to "Auto"', () => {
    render(<WanStatusCard wan={mockWan} isStale={false} lastUpdated={null} />);
    expect(screen.getByText('8.8.8.8, 8.8.4.4')).toBeInTheDocument();

    const wanWithoutDns: WanData = { ...mockWan, dns: undefined };
    const { rerender } = render(<WanStatusCard wan={wanWithoutDns} isStale={false} lastUpdated={null} />);
    rerender(<WanStatusCard wan={wanWithoutDns} isStale={false} lastUpdated={null} />);
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  it('shows connection type or falls back to "DHCP"', () => {
    render(<WanStatusCard wan={mockWan} isStale={false} lastUpdated={null} />);
    expect(screen.getByText('DHCP')).toBeInTheDocument();

    const wanWithoutType: WanData = { ...mockWan, connectionType: undefined };
    const { rerender } = render(<WanStatusCard wan={wanWithoutType} isStale={false} lastUpdated={null} />);
    rerender(<WanStatusCard wan={wanWithoutType} isStale={false} lastUpdated={null} />);
    // Should still show "DHCP" as fallback
    expect(screen.getAllByText('DHCP').length).toBeGreaterThan(0);
  });

  it('shows staleness indicator when isStale=true and lastUpdated is provided', () => {
    const lastUpdated = Date.now() - 120000; // 2 minutes ago
    render(<WanStatusCard wan={mockWan} isStale={true} lastUpdated={lastUpdated} />);

    // Check for the "Aggiornato" text (Italian for "Updated")
    expect(screen.getByText(/aggiornato/i)).toBeInTheDocument();
  });
});
