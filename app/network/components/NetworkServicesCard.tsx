'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import { DataTable } from '@/app/components/ui';
import Heading from '@/app/components/ui/Heading';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { cn } from '@/lib/utils/cn';
import CopyableIp from './CopyableIp';
import type {
  DhcpReservation,
  PortForwardingRule,
  UpnpStatus,
  MeshTopology,
} from '../hooks/useFritzNetworkServices';

interface NetworkServicesCardProps {
  dhcp: { items: DhcpReservation[]; total: number } | null;
  portForwarding: { items: PortForwardingRule[]; total: number } | null;
  upnp: UpnpStatus | null;
  mesh: MeshTopology | null;
  loading: boolean;
  stale: boolean;
}

/**
 * CollapsibleSection
 *
 * Accordion section with chevron indicator and item count display.
 */
function CollapsibleSection({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-b border-white/6 last:border-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-1 py-3 text-left"
      >
        <span className="text-sm font-medium">
          {title}{''}
          <Text as="span" variant="secondary" size="sm">({count})</Text>
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-(--text-2) transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

/**
 * NetworkServicesCard
 *
 * Four collapsible sections displaying:
 * 1. DHCP reservations
 * 2. Port forwarding rules
 * 3. UPnP status and ports
 * 4. Mesh topology nodes and links
 */
export default function NetworkServicesCard({
  dhcp,
  portForwarding,
  upnp,
  mesh,
  loading,
  stale,
}: NetworkServicesCardProps) {
  // DHCP columns
  const dhcpColumns: ColumnDef<DhcpReservation>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      enableSorting: true,
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      enableSorting: false,
      cell: ({ row }) => <CopyableIp ip={row.original.ip} />,
    },
    {
      accessorKey: 'mac',
      header: 'MAC',
      enableSorting: false,
      cell: ({ row }) => (
        <Text as="span" variant="secondary" size="xs" mono>{row.original.mac}</Text>
      ),
    },
    {
      accessorKey: 'interface_type',
      header: 'Tipo interfaccia',
      enableSorting: false,
    },
  ];

  // Port forwarding columns
  const portFwdColumns: ColumnDef<PortForwardingRule>[] = [
    {
      accessorKey: 'external_port',
      header: 'Porta est.',
      enableSorting: true,
    },
    {
      accessorKey: 'internal_port',
      header: 'Porta int.',
      enableSorting: false,
    },
    {
      accessorKey: 'protocol',
      header: 'Protocollo',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.protocol}</span>
      ),
    },
    {
      accessorKey: 'internal_client',
      header: 'Destinazione',
      enableSorting: false,
    },
    {
      accessorKey: 'enabled',
      header: 'Stato',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? 'sage' : 'danger'} size="sm">
          {row.original.enabled ? 'Attivo' : 'Disattivo'}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Heading level={2} size="lg">
          Servizi di rete
        </Heading>
        {stale && (
          <Text variant="label" size="xs">
            Dati non aggiornati
          </Text>
        )}
      </div>

      {/* Collapsible sections */}
      <div>
        {/* DHCP Reservations */}
        <CollapsibleSection
          title="Riserve DHCP"
          count={dhcp?.total ?? dhcp?.items.length ?? 0}
          defaultOpen={false}
        >
          {dhcp && dhcp.items.length > 0 ? (
            <DataTable
              columns={dhcpColumns}
              data={dhcp.items}
              enableFiltering={false}
              density="compact"
            />
          ) : (
            <Text variant="secondary" size="sm" className="px-1">
              Nessuna riserva DHCP configurata
            </Text>
          )}
        </CollapsibleSection>

        {/* Port Forwarding */}
        <CollapsibleSection
          title="Port Forwarding"
          count={portForwarding?.total ?? portForwarding?.items.length ?? 0}
          defaultOpen={false}
        >
          {portForwarding && portForwarding.items.length > 0 ? (
            <DataTable
              columns={portFwdColumns}
              data={portForwarding.items}
              enableFiltering={false}
              density="compact"
            />
          ) : (
            <Text variant="secondary" size="sm" className="px-1">
              Nessuna regola di port forwarding configurata
            </Text>
          )}
        </CollapsibleSection>

        {/* UPnP */}
        <CollapsibleSection
          title="UPnP"
          count={upnp?.upnp_ports.length ?? 0}
          defaultOpen={false}
        >
          {upnp ? (
            <div className="space-y-3 px-1">
              <div className="flex items-center gap-2">
                <Text variant="secondary" size="sm">
                  Stato:
                </Text>
                <Badge variant={upnp.enabled ? 'sage' : 'neutral'} size="sm">
                  {upnp.enabled ? 'Attivo' : 'Disattivo'}
                </Badge>
              </div>
              {upnp.upnp_ports.length > 0 && (
                <div className="space-y-1">
                  <Text variant="secondary" size="sm" weight="medium">
                    Porte UPnP attive:
                  </Text>
                  {upnp.upnp_ports.map((port, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Text as="span" variant="secondary" size="sm" mono>{port.external_port}</Text>
                      <Text as="span" variant="tertiary" size="sm">→</Text>
                      <Text as="span" variant="secondary" size="sm" mono>{port.internal_client}:{port.internal_port}</Text>
                      <Text as="span" variant="tertiary" size="sm">{port.protocol}</Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Text variant="secondary" size="sm" className="px-1">
              Dati UPnP non disponibili
            </Text>
          )}
        </CollapsibleSection>

        {/* Mesh Topology */}
        <CollapsibleSection
          title="Topologia Mesh"
          count={mesh?.node_count ?? 0}
          defaultOpen={false}
        >
          {mesh ? (
            <div className="space-y-4 px-1">
              {/* Nodes */}
              {mesh.nodes.length > 0 && (
                <div className="space-y-2">
                  <Text variant="secondary" size="sm" weight="medium">
                    Nodi ({mesh.node_count}):
                  </Text>
                  {mesh.nodes.map((node) => (
                    <div
                      key={node.uid}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Text as="span" size="sm" weight="medium">
                        {node.name}
                      </Text>
                      <Text as="span" variant="tertiary" size="xs">{node.model}</Text>
                      <Badge
                        variant={node.is_meshed ? 'ocean' : 'neutral'}
                        size="sm"
                      >
                        {node.is_meshed ? 'Mesh' : 'Standalone'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Links */}
              {mesh.links.length > 0 && (
                <div className="space-y-2">
                  <Text variant="secondary" size="sm" weight="medium">
                    Connessioni ({mesh.link_count}):
                  </Text>
                  {mesh.links.map((link, idx) => (
                    <Text key={idx} as="div" variant="secondary" size="sm">
                      <span className="font-medium">{link.source_name}</span>
                      <span> → </span>
                      <span className="font-medium">{link.target_name}</span>
                      {link.cur_rx_kbps !== null && (
                        <span className="ml-2">
                          ↓{Math.round(link.cur_rx_kbps / 1000)} Mbps ↑{Math.round((link.cur_tx_kbps ?? 0) / 1000)} Mbps
                        </span>
                      )}
                    </Text>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Text variant="secondary" size="sm" className="px-1">
              Dati topologia mesh non disponibili
            </Text>
          )}
        </CollapsibleSection>
      </div>
    </Card>
  );
}
