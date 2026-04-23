import { render, screen, fireEvent } from '@testing-library/react';
import RawDeviceEventsTable from '../RawDeviceEventsTable';
import type { DeviceEventRawRecord } from '../../hooks/useFritzDeviceEventsRaw';

jest.mock('@/app/components/ui/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns }: { data: DeviceEventRawRecord[]; columns: unknown[] }) => (
    <table role="table">
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {(columns as Array<{ accessorKey: string; cell?: (arg: { row: { original: DeviceEventRawRecord } }) => React.ReactNode }>).map((col) => (
              <td key={col.accessorKey}>
                {col.cell
                  ? col.cell({ row: { original: row } })
                  : String(row[col.accessorKey as keyof DeviceEventRawRecord] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe('RawDeviceEventsTable', () => {
  const sample: DeviceEventRawRecord[] = [
    { timestamp: 1713700000, mac: 'AA:BB:CC:DD:EE:FF', name: 'laptop', ip: '192.168.1.100', event_type: 'connected' },
    { timestamp: 1713700060, mac: 'FF:EE:DD:CC:BB:AA', name: 'phone', ip: '192.168.1.101', event_type: 'disconnected' },
  ];

  const defaultProps = {
    items: sample,
    loading: false,
    stale: false,
    totalCount: 2,
    page: 0,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Connesso" and "Disconnesso" badges for known event types', () => {
    render(<RawDeviceEventsTable {...defaultProps} />);
    expect(screen.getByText('Connesso')).toBeInTheDocument();
    expect(screen.getByText('Disconnesso')).toBeInTheDocument();
  });

  it('renders unknown event_type as fallback neutral badge without throwing', () => {
    const itemsWithUnknown: DeviceEventRawRecord[] = [
      { timestamp: 1713700000, mac: 'AA:BB:CC:DD:EE:FF', name: 'unknown-dev', ip: '192.168.1.99', event_type: 'mystery' as unknown as 'connected' },
    ];
    expect(() =>
      render(<RawDeviceEventsTable {...defaultProps} items={itemsWithUnknown} totalCount={1} />)
    ).not.toThrow();
    expect(screen.getByText('mystery')).toBeInTheDocument();
  });

  it('renders EmptyState when items=[]', () => {
    render(<RawDeviceEventsTable {...defaultProps} items={[]} totalCount={0} />);
    expect(screen.getByText('Nessun evento dispositivo')).toBeInTheDocument();
  });

  it('Prev disabled on page 0; Next calls onPageChange when more pages exist', () => {
    const onPageChange = jest.fn();
    render(<RawDeviceEventsTable {...defaultProps} totalCount={200} onPageChange={onPageChange} />);
    const prev = screen.getByRole('button', { name: 'Pagina precedente' });
    const next = screen.getByRole('button', { name: 'Pagina successiva' });
    expect(prev).toBeDisabled();
    fireEvent.click(next);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
