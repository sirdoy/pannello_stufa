import { render, screen, fireEvent } from '@testing-library/react';
import FritzboxServiceDiscoveryTab from '../FritzboxServiceDiscoveryTab';
import { useFritzServiceDiscovery, type ServiceEntry } from '@/app/debug/hooks/useFritzServiceDiscovery';

jest.mock('@/app/debug/hooks/useFritzServiceDiscovery', () => ({
  useFritzServiceDiscovery: jest.fn(),
}));

// Mock DataTable to keep tests focused on cell renderers.
jest.mock('@/app/components/ui/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns }: { data: ServiceEntry[]; columns: unknown[] }) => (
    <table role="table">
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {(columns as Array<{ accessorKey: string; cell?: (arg: { row: { original: ServiceEntry } }) => React.ReactNode }>).map((col) => (
              <td key={col.accessorKey}>
                {col.cell
                  ? col.cell({ row: { original: row } })
                  : String(row[col.accessorKey as keyof ServiceEntry] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

// Provide a writable `clipboard` property on navigator for the copy test.
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  writable: true,
  configurable: true,
});

const mockedUseHook = useFritzServiceDiscovery as jest.MockedFunction<typeof useFritzServiceDiscovery>;

describe('FritzboxServiceDiscoveryTab', () => {
  const sample: ServiceEntry[] = [
    { name: 'WANIPConnection', type: 'urn:dslforum-org:service:WANIPConnection:1', url: '/upnp/control/wanipconn1' },
    { name: 'DeviceInfo', type: 'urn:dslforum-org:service:DeviceInfo:1', url: '/upnp/control/deviceinfo' },
  ];

  const refreshMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseHook.mockReturnValue({
      services: sample,
      loading: false,
      error: null,
      refresh: refreshMock,
    });
  });

  it('renders the "Service Discovery" heading', () => {
    render(<FritzboxServiceDiscoveryTab />);
    expect(screen.getByRole('heading', { name: 'Service Discovery', level: 2 })).toBeInTheDocument();
  });

  it('renders each service name in the table', () => {
    render(<FritzboxServiceDiscoveryTab />);
    expect(screen.getByText('WANIPConnection')).toBeInTheDocument();
    expect(screen.getByText('DeviceInfo')).toBeInTheDocument();
  });

  it('renders empty state when services=[], loading=false, error=null', () => {
    mockedUseHook.mockReturnValue({ services: [], loading: false, error: null, refresh: refreshMock });
    render(<FritzboxServiceDiscoveryTab />);
    expect(screen.getByText('Nessun servizio rilevato')).toBeInTheDocument();
  });

  it('renders error Banner when hook returns an error', () => {
    mockedUseHook.mockReturnValue({
      services: [],
      loading: false,
      error: new Error('ECONNREFUSED'),
      refresh: refreshMock,
    });
    render(<FritzboxServiceDiscoveryTab />);
    expect(screen.getByText('Impossibile caricare i servizi')).toBeInTheDocument();
    expect(screen.getByText('ECONNREFUSED')).toBeInTheDocument();
  });

  it('clicking the Aggiorna button calls refresh()', () => {
    render(<FritzboxServiceDiscoveryTab />);
    fireEvent.click(screen.getByRole('button', { name: /Aggiorna/i }));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('renders service name with <script> as literal text (T-171-01 XSS mitigation via JSX escaping)', () => {
    mockedUseHook.mockReturnValue({
      services: [{ name: '<script>alert(1)</script>', type: 'urn:evil', url: '/evil' }],
      loading: false,
      error: null,
      refresh: refreshMock,
    });
    render(<FritzboxServiceDiscoveryTab />);
    // The text appears VERBATIM in the DOM — not executed as markup.
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    // Defence in depth: ensure no <script> element was actually rendered by the tab.
    expect(document.querySelector('script[data-xss]')).toBeNull();
  });

  it('clicking the copy URL button calls navigator.clipboard.writeText with the URL', () => {
    render(<FritzboxServiceDiscoveryTab />);
    const copyButtons = screen.getAllByRole('button', { name: /Copia URL/i });
    fireEvent.click(copyButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/upnp/control/wanipconn1');
  });
});
