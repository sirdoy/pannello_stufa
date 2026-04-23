import { render, screen } from '@testing-library/react';
import DevicePresenceTable from '../DevicePresenceTable';
import type { DevicePresenceRecord } from '../../hooks/useFritzDevicePresenceHistory';

jest.mock('@/app/components/ui/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns }: { data: DevicePresenceRecord[]; columns: unknown[] }) => (
    <table role="table">
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {(columns as Array<{ accessorKey: string; cell?: (arg: { row: { original: DevicePresenceRecord } }) => React.ReactNode }>).map((col) => (
              <td key={col.accessorKey}>
                {col.cell
                  ? col.cell({ row: { original: row } })
                  : String(row[col.accessorKey as keyof DevicePresenceRecord] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe('DevicePresenceTable', () => {
  const sample: DevicePresenceRecord[] = [
    { timestamp: 1713700000, mac: 'AA:BB:CC:DD:EE:FF', name: 'laptop', ip: '192.168.1.100', is_online: true },
    { timestamp: 1713700060, mac: 'FF:EE:DD:CC:BB:AA', name: 'phone', ip: '192.168.1.101', is_online: false },
  ];

  const defaultProps = {
    items: sample,
    loading: false,
    stale: false,
    notFound: false,
    totalCount: 2,
    page: 0,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading "Presenza dispositivi"', () => {
    render(<DevicePresenceTable {...defaultProps} />);
    expect(screen.getByText('Presenza dispositivi')).toBeInTheDocument();
  });

  it('renders 2 rows with Online and Offline badges', () => {
    render(<DevicePresenceTable {...defaultProps} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
    // Names rendered as-is
    expect(screen.getByText('laptop')).toBeInTheDocument();
    expect(screen.getByText('phone')).toBeInTheDocument();
  });

  it('404-graceful state: renders "Endpoint non disponibile sul proxy", does NOT render DataTable, does NOT throw', () => {
    expect(() =>
      render(<DevicePresenceTable {...defaultProps} notFound={true} items={[]} totalCount={0} />)
    ).not.toThrow();

    expect(screen.getByText('Endpoint non disponibile sul proxy')).toBeInTheDocument();
    // DataTable mock renders a `<table role="table">`; in notFound mode no table should exist.
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('renders EmptyState when notFound=false and items=[]', () => {
    render(<DevicePresenceTable {...defaultProps} items={[]} totalCount={0} />);
    expect(screen.getByText('Nessun record di presenza')).toBeInTheDocument();
  });
});
