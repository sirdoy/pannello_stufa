import { render, screen, fireEvent } from '@testing-library/react';
import WifiClientsTable from '../WifiClientsTable';
import type { WiFiClient } from '../WifiClientsTable';

// Mock CopyableIp to keep tests simple
jest.mock('../CopyableIp', () => ({
  __esModule: true,
  default: ({ ip }: { ip: string }) => <span data-testid="copyable-ip">{ip}</span>,
}));

// Mock DataTable to avoid TanStack Table complexity in tests
jest.mock('@/app/components/ui', () => ({
  DataTable: ({ data, columns }: { data: WiFiClient[]; columns: unknown[] }) => (
    <table>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {(columns as Array<{ accessorKey: string; cell?: (arg: { row: { original: WiFiClient } }) => React.ReactNode }>).map((col) => (
              <td key={col.accessorKey}>
                {col.cell
                  ? col.cell({ row: { original: row } })
                  : String(row[col.accessorKey as keyof WiFiClient] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe('WifiClientsTable', () => {
  const mockClients: WiFiClient[] = [
    {
      hostname: 'laptop',
      mac: 'AA:BB:CC:DD:EE:FF',
      ip: '192.168.1.100',
      band: '5GHz',
      ssid: 'HomeWifi',
      signal_strength: -45,
      link_speed_mbps: 300,
      is_active: true,
    },
    {
      hostname: 'phone',
      mac: 'FF:EE:DD:CC:BB:AA',
      ip: '192.168.1.101',
      band: '2.4GHz',
      ssid: 'HomeWifi',
      signal_strength: -75,
      link_speed_mbps: 54,
      is_active: true,
    },
  ];

  const defaultProps = {
    clients: mockClients,
    loading: false,
    band: 'all' as const,
    onBandChange: jest.fn(),
    total: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading with total count', () => {
    render(<WifiClientsTable {...defaultProps} />);
    expect(screen.getByText(/Client WiFi/)).toBeInTheDocument();
    expect(screen.getByText(/Client WiFi \(2\)/)).toBeInTheDocument();
  });

  it('renders client hostnames in the table', () => {
    render(<WifiClientsTable {...defaultProps} />);
    expect(screen.getByText('laptop')).toBeInTheDocument();
    expect(screen.getByText('phone')).toBeInTheDocument();
  });

  it('renders band filter buttons', () => {
    render(<WifiClientsTable {...defaultProps} />);
    expect(screen.getByText('Tutti')).toBeInTheDocument();
    expect(screen.getByText('2.4 GHz')).toBeInTheDocument();
    expect(screen.getByText('5 GHz')).toBeInTheDocument();
  });

  it('calls onBandChange when filter button clicked', () => {
    const onBandChange = jest.fn();
    render(<WifiClientsTable {...defaultProps} onBandChange={onBandChange} />);

    fireEvent.click(screen.getByText('5 GHz'));
    expect(onBandChange).toHaveBeenCalledWith('5GHz');

    fireEvent.click(screen.getByText('2.4 GHz'));
    expect(onBandChange).toHaveBeenCalledWith('2.4GHz');

    fireEvent.click(screen.getByText('Tutti'));
    expect(onBandChange).toHaveBeenCalledWith('all');
  });

  it('renders SignalStrengthBars — 4 bars for strong signal (> -50)', () => {
    render(<WifiClientsTable {...defaultProps} />);
    // laptop has signal_strength -45 (> -50), should get 4 bars (all filled)
    // We look for bar elements with the title showing the dBm value
    const bars = document.querySelectorAll('[title="-45 dBm"]');
    expect(bars.length).toBe(1); // The container div
    // Check the bars inside: 4 divs, all with bg-sage-400
    const container = bars[0];
    const barDivs = container?.querySelectorAll('.w-1\\.5');
    expect(barDivs?.length).toBe(4);
    barDivs?.forEach((bar) => {
      expect(bar).toHaveClass('bg-sage-400');
    });
  });

  it('renders SignalStrengthBars — 1 bar for weak signal (< -70)', () => {
    render(<WifiClientsTable {...defaultProps} />);
    // phone has signal_strength -75 (< -70), should get 1 bar
    const bars = document.querySelectorAll('[title="-75 dBm"]');
    expect(bars.length).toBe(1);
    const container = bars[0];
    const barDivs = container?.querySelectorAll('.w-1\\.5');
    expect(barDivs?.length).toBe(4); // Always 4 bars, but only 1 filled
    // First bar should be sage, rest should be slate
    expect(barDivs?.[0]).toHaveClass('bg-sage-400');
    expect(barDivs?.[1]).toHaveClass('bg-slate-600');
    expect(barDivs?.[2]).toHaveClass('bg-slate-600');
    expect(barDivs?.[3]).toHaveClass('bg-slate-600');
  });

  it('renders ocean badge for 5GHz band', () => {
    render(<WifiClientsTable {...defaultProps} />);
    // The 5GHz badge should have ocean variant class
    const badges = screen.getAllByText('5GHz');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders ember badge for 2.4GHz band', () => {
    render(<WifiClientsTable {...defaultProps} />);
    const badges = screen.getAllByText('2.4GHz');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('shows skeleton when loading', () => {
    render(<WifiClientsTable {...defaultProps} loading={true} />);
    // Skeletons are rendered instead of DataTable
    const table = document.querySelector('table');
    expect(table).not.toBeInTheDocument();
  });
});
