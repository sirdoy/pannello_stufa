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
      signal_strength: 85, // backend: quality 0-100, not dBm
      link_speed_mbps: 300,
      is_active: true,
    },
    {
      hostname: 'phone',
      mac: 'FF:EE:DD:CC:BB:AA',
      ip: '192.168.1.101',
      band: '2.4GHz',
      ssid: 'HomeWifi',
      signal_strength: 20,
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

  const filledBars = (title: string) => {
    const containers = document.querySelectorAll(`[title="${title}"]`);
    expect(containers.length).toBe(1);
    const barDivs = containers[0]!.querySelectorAll('.w-1\\.5');
    expect(barDivs.length).toBe(4); // Always 4 bars
    return Array.from(barDivs).filter((b) => b.classList.contains('bg-sage-400')).length;
  };

  it('renders SignalStrengthBars on the 0-100 quality scale — 4 bars for 85%', () => {
    render(<WifiClientsTable {...defaultProps} />);
    expect(filledBars('Segnale 85%')).toBe(4);
  });

  it('renders SignalStrengthBars — 1 bar for weak quality (20%)', () => {
    render(<WifiClientsTable {...defaultProps} />);
    expect(filledBars('Segnale 20%')).toBe(1);
  });

  it.each([
    [100, 4], [75, 4], [74, 3], [50, 3], [49, 2], [25, 2], [24, 1], [0, 1],
  ])('quality %i%% → %i bars', (quality, expected) => {
    const client = { ...mockClients[0]!, signal_strength: quality };
    render(<WifiClientsTable {...defaultProps} clients={[client]} total={1} />);
    expect(filledBars(`Segnale ${quality}%`)).toBe(expected);
  });

  it('never shows a dBm unit', () => {
    render(<WifiClientsTable {...defaultProps} />);
    expect(document.querySelector('[title*="dBm"]')).toBeNull();
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
