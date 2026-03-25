import { render, screen, fireEvent } from '@testing-library/react';
import NetworkServicesCard from '../NetworkServicesCard';
import type {
  DhcpReservation,
  PortForwardingRule,
  UpnpStatus,
  MeshTopology,
} from '../../hooks/useFritzNetworkServices';

// Mock CopyableIp
jest.mock('../CopyableIp', () => ({
  __esModule: true,
  default: ({ ip }: { ip: string }) => <span data-testid="copyable-ip">{ip}</span>,
}));

// Mock DataTable to render data simply
jest.mock('@/app/components/ui', () => ({
  DataTable: ({ data, columns }: { data: unknown[]; columns: Array<{ accessorKey: string; header: string; cell?: (arg: { row: { original: unknown } }) => React.ReactNode }> }) => (
    <table data-testid="datatable">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.accessorKey}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.accessorKey}>
                {col.cell
                  ? col.cell({ row: { original: row } })
                  : String((row as Record<string, unknown>)[col.accessorKey] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe('NetworkServicesCard', () => {
  const mockDhcp: { items: DhcpReservation[]; total: number } = {
    items: [
      { ip: '192.168.1.10', name: 'server', mac: 'AA:BB:CC:DD:EE:01', interface_type: 'LAN', address_source: 'Static' },
    ],
    total: 1,
  };

  const mockPortForwarding: { items: PortForwardingRule[]; total: number } = {
    items: [
      { external_port: 80, internal_port: 8080, protocol: 'TCP', internal_client: '192.168.1.10', enabled: true, description: 'Web', lease_duration: 0 },
      { external_port: 443, internal_port: 443, protocol: 'TCP', internal_client: '192.168.1.10', enabled: false, description: 'HTTPS', lease_duration: 0 },
    ],
    total: 2,
  };

  const mockUpnp: UpnpStatus = {
    enabled: true,
    upnp_ports: [],
    is_stale: false,
    fetched_at: null,
  };

  const mockMesh: MeshTopology = {
    schema_version: null,
    node_count: 2,
    link_count: 1,
    nodes: [
      { uid: 'n1', name: 'FRITZ!Box 7590', model: '7590', mac: 'AA:BB:CC:DD:EE:FF', vendor: 'AVM', is_meshed: false, device_category: 'router' },
      { uid: 'n2', name: 'FRITZ!Repeater 1200', model: '1200', mac: 'FF:EE:DD:CC:BB:AA', vendor: 'AVM', is_meshed: true, device_category: 'repeater' },
    ],
    links: [
      { source_uid: 'n1', source_name: 'FRITZ!Box 7590', target_uid: 'n2', target_name: 'FRITZ!Repeater 1200', type: 'WLAN', state: 'CONNECTED', cur_rx_kbps: 100000, cur_tx_kbps: 50000, max_rx_kbps: 200000, max_tx_kbps: 100000 },
    ],
    is_stale: false,
    fetched_at: null,
  };

  const defaultProps = {
    dhcp: mockDhcp,
    portForwarding: mockPortForwarding,
    upnp: mockUpnp,
    mesh: mockMesh,
    loading: false,
    stale: false,
  };

  it('renders 4 collapsible section headers', () => {
    render(<NetworkServicesCard {...defaultProps} />);
    expect(screen.getByText(/Riserve DHCP/)).toBeInTheDocument();
    expect(screen.getByText(/Port Forwarding/)).toBeInTheDocument();
    expect(screen.getByText(/UPnP/)).toBeInTheDocument();
    expect(screen.getByText(/Topologia Mesh/)).toBeInTheDocument();
  });

  it('shows item counts in section headers', () => {
    render(<NetworkServicesCard {...defaultProps} />);
    // DHCP count: 1
    expect(screen.getByText(/Riserve DHCP/).parentElement).toHaveTextContent('(1)');
    // Port forwarding count: 2
    expect(screen.getByText(/Port Forwarding/).parentElement).toHaveTextContent('(2)');
    // Mesh node count: 2
    expect(screen.getByText(/Topologia Mesh/).parentElement).toHaveTextContent('(2)');
  });

  it('sections are collapsed by default — content not visible', () => {
    render(<NetworkServicesCard {...defaultProps} />);
    // DataTable is not rendered when sections are closed
    expect(screen.queryByTestId('datatable')).not.toBeInTheDocument();
  });

  it('clicking DHCP section header opens it and shows table', () => {
    render(<NetworkServicesCard {...defaultProps} />);

    const dhcpBtn = screen.getByText(/Riserve DHCP/).closest('button');
    expect(dhcpBtn).toBeInTheDocument();
    fireEvent.click(dhcpBtn!);

    // DataTable should now be visible
    expect(screen.getByTestId('datatable')).toBeInTheDocument();
  });

  it('DHCP table shows correct columns', () => {
    render(<NetworkServicesCard {...defaultProps} />);
    fireEvent.click(screen.getByText(/Riserve DHCP/).closest('button')!);

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('IP')).toBeInTheDocument();
    expect(screen.getByText('MAC')).toBeInTheDocument();
    expect(screen.getByText('Tipo interfaccia')).toBeInTheDocument();
  });

  it('Port forwarding enabled badge shows "Attivo" for enabled rules', () => {
    render(<NetworkServicesCard {...defaultProps} />);
    fireEvent.click(screen.getByText(/Port Forwarding/).closest('button')!);

    expect(screen.getByText('Attivo')).toBeInTheDocument();
    expect(screen.getByText('Disattivo')).toBeInTheDocument();
  });

  it('UPnP section shows enabled status', () => {
    render(<NetworkServicesCard {...defaultProps} />);
    fireEvent.click(screen.getByText(/UPnP/).closest('button')!);

    // upnp.enabled is true
    expect(screen.getByText('Attivo')).toBeInTheDocument();
  });

  it('Mesh section shows node names and meshed badges', () => {
    render(<NetworkServicesCard {...defaultProps} />);
    fireEvent.click(screen.getByText(/Topologia Mesh/).closest('button')!);

    expect(screen.getAllByText('FRITZ!Box 7590').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FRITZ!Repeater 1200').length).toBeGreaterThan(0);
    expect(screen.getByText('Standalone')).toBeInTheDocument(); // is_meshed: false
    expect(screen.getByText('Mesh')).toBeInTheDocument(); // is_meshed: true
  });

  it('shows skeleton when loading', () => {
    render(<NetworkServicesCard {...defaultProps} loading={true} />);
    // No collapsible sections when loading
    expect(screen.queryByText(/Riserve DHCP/)).not.toBeInTheDocument();
  });

  it('closing section hides content again', () => {
    render(<NetworkServicesCard {...defaultProps} />);
    const dhcpBtn = screen.getByText(/Riserve DHCP/).closest('button')!;

    // Open
    fireEvent.click(dhcpBtn);
    expect(screen.getByTestId('datatable')).toBeInTheDocument();

    // Close
    fireEvent.click(dhcpBtn);
    expect(screen.queryByTestId('datatable')).not.toBeInTheDocument();
  });
});
