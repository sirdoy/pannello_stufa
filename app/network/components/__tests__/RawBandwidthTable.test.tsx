import { render, screen, fireEvent } from '@testing-library/react';
import RawBandwidthTable from '../RawBandwidthTable';
import type { BandwidthRawRecord } from '../../hooks/useFritzBandwidthHistoryRaw';

// Mock DataTable to keep tests focused on cell renderers and render logic.
jest.mock('@/app/components/ui/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns }: { data: BandwidthRawRecord[]; columns: unknown[] }) => (
    <table role="table">
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {(columns as Array<{ accessorKey: string; cell?: (arg: { row: { original: BandwidthRawRecord } }) => React.ReactNode }>).map((col) => (
              <td key={col.accessorKey}>
                {col.cell
                  ? col.cell({ row: { original: row } })
                  : String(row[col.accessorKey as keyof BandwidthRawRecord] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe('RawBandwidthTable', () => {
  const sample: BandwidthRawRecord = {
    timestamp: 1713700000, // 2024-04-21
    bytes_sent: 2 * 1024 * 1024, // 2 MB
    bytes_received: 4 * 1024 * 1024, // 4 MB
    upstream_rate: 1_500_000, // 1.5 Mbps
    downstream_rate: 8_000_000, // 8 Mbps
    latency_ms: 12,
    connection_uptime: 86400,
    external_ip: '203.0.113.5',
    connection_type: 'PPPoE',
  };

  const defaultProps = {
    items: [sample],
    loading: false,
    stale: false,
    totalCount: 1,
    page: 0,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading "Bandwidth grezzo"', () => {
    render(<RawBandwidthTable {...defaultProps} />);
    expect(screen.getByText('Bandwidth grezzo')).toBeInTheDocument();
  });

  it('formats bytes with units (MB) and bandwidth with units (Mbps)', () => {
    render(<RawBandwidthTable {...defaultProps} />);
    // 2 * 1024 * 1024 = 2.0 MB; 8_000_000 bps = 8.0 Mbps
    expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
    expect(screen.getByText(/8\.0 Mbps/)).toBeInTheDocument();
  });

  it('renders timestamp as a 2024 date (Pitfall 6: seconds × 1000)', () => {
    render(<RawBandwidthTable {...defaultProps} />);
    // 1713700000 * 1000 → April 21, 2024 in UTC → date-fns format "dd MMM HH:mm:ss" in `it`
    // Must render a plausible "apr 2024" style date (not 1970).
    // We assert that the word "apr" (Italian April abbreviation) appears somewhere in the table.
    expect(screen.getByRole('table').textContent).toMatch(/apr/i);
  });

  it('renders EmptyState when items=[] and totalCount=0', () => {
    render(<RawBandwidthTable {...defaultProps} items={[]} totalCount={0} />);
    expect(screen.getByText('Nessun record di bandwidth')).toBeInTheDocument();
  });

  it('Prev button disabled on page 0; Next enabled when more pages exist', () => {
    render(<RawBandwidthTable {...defaultProps} totalCount={200} />);
    const prev = screen.getByRole('button', { name: 'Pagina precedente' });
    const next = screen.getByRole('button', { name: 'Pagina successiva' });
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();
  });

  it('calls onPageChange(1) when Next clicked with more pages available', () => {
    const onPageChange = jest.fn();
    render(<RawBandwidthTable {...defaultProps} totalCount={200} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pagina successiva' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
