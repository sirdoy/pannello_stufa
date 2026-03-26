import { render, screen } from '@testing-library/react';
import WifiNetworksTable from '../WifiNetworksTable';
import type { WiFiNetworkModel } from '../../hooks/useFritzWifiNetworks';

// Mock DataTable to avoid TanStack Table complexity in tests
jest.mock('@/app/components/ui', () => ({
  DataTable: ({
    data,
    columns,
  }: {
    data: WiFiNetworkModel[];
    columns: Array<{
      accessorKey: string;
      cell?: (arg: { row: { original: WiFiNetworkModel } }) => React.ReactNode;
    }>;
  }) => (
    <table>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.accessorKey}>
                {col.cell
                  ? col.cell({ row: { original: row } })
                  : String(row[col.accessorKey as keyof WiFiNetworkModel] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

const mockNetworks: WiFiNetworkModel[] = [
  {
    service: 1,
    band: '2.4GHz',
    ssid: 'HomeNetwork',
    channel: 6,
    possible_channels: '1-13',
    is_enabled: true,
    beacon_type: 'WPA2',
  },
  {
    service: 2,
    band: '5GHz',
    ssid: 'HomeNetwork_5G',
    channel: 36,
    possible_channels: '36-48',
    is_enabled: false,
    beacon_type: 'WPA3',
  },
];

describe('WifiNetworksTable', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(
      <WifiNetworksTable networks={[]} loading={true} stale={false} />,
    );
    // Table should NOT be in the document
    expect(container.querySelector('table')).not.toBeInTheDocument();
    // Skeletons should be rendered
    expect(container.querySelector('[class*="animate"]')).toBeInTheDocument();
  });

  it('shows empty state when no networks', () => {
    render(<WifiNetworksTable networks={[]} loading={false} stale={false} />);
    expect(screen.getByText('Nessuna rete WiFi configurata')).toBeInTheDocument();
  });

  it('renders SSIDs for each network', () => {
    render(<WifiNetworksTable networks={mockNetworks} loading={false} stale={false} />);
    expect(screen.getByText('HomeNetwork')).toBeInTheDocument();
    expect(screen.getByText('HomeNetwork_5G')).toBeInTheDocument();
  });

  it('renders band badges for each network', () => {
    render(<WifiNetworksTable networks={mockNetworks} loading={false} stale={false} />);
    expect(screen.getByText('2.4GHz')).toBeInTheDocument();
    expect(screen.getByText('5GHz')).toBeInTheDocument();
  });

  it('renders "Attiva" badge for enabled network', () => {
    render(<WifiNetworksTable networks={mockNetworks} loading={false} stale={false} />);
    expect(screen.getByText('Attiva')).toBeInTheDocument();
  });

  it('renders "Disattiva" badge for disabled network', () => {
    render(<WifiNetworksTable networks={mockNetworks} loading={false} stale={false} />);
    expect(screen.getByText('Disattiva')).toBeInTheDocument();
  });

  it('renders heading "Reti WiFi"', () => {
    render(<WifiNetworksTable networks={mockNetworks} loading={false} stale={false} />);
    expect(screen.getByText('Reti WiFi')).toBeInTheDocument();
  });

  it('shows stale indicator when stale=true', () => {
    render(<WifiNetworksTable networks={mockNetworks} loading={false} stale={true} />);
    expect(screen.getByText('Dati non aggiornati')).toBeInTheDocument();
  });

  it('does not show stale indicator when stale=false', () => {
    render(<WifiNetworksTable networks={mockNetworks} loading={false} stale={false} />);
    expect(screen.queryByText('Dati non aggiornati')).not.toBeInTheDocument();
  });
});
