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
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 px-1 text-left"
      >
        <span className="font-medium text-sm">
          {title}{''}
          <span className="text-slate-400">({count})</span>
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform text-slate-400',
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
        <span className="font-mono text-xs text-slate-400">{row.original.mac}</span>
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
      <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
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
      <div className="flex items-center justify-between mb-4">
        <Heading level={2} size="lg">
          Servizi di rete
        </Heading>
        {stale && (
          <Text variant="label" size="xs" className="text-slate-500">
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
              enableSorting={true}
              enableFiltering={false}
              density="compact"
            />
          ) : (
            <Text size="sm" className="text-slate-500 px-1">
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
              enableSorting={true}
              enableFiltering={false}
              density="compact"
            />
          ) : (
            <Text size="sm" className="text-slate-500 px-1">
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
                <Text size="sm" className="text-slate-400">
                  Stato:
                </Text>
                <Badge variant={upnp.enabled ? 'sage' : 'neutral'} size="sm">
                  {upnp.enabled ? 'Attivo' : 'Disattivo'}
                </Badge>
              </div>
              {upnp.upnp_ports.length > 0 && (
                <div className="space-y-1">
                  <Text size="sm" className="text-slate-400 font-medium">
                    Porte UPnP attive:
                  </Text>
                  {upnp.upnp_ports.map((port, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-slate-300">{port.external_port}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-mono text-slate-300">{port.internal_client}:{port.internal_port}</span>
                      <span className="text-slate-500">{port.protocol}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Text size="sm" className="text-slate-500 px-1">
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
                  <Text size="sm" className="text-slate-400 font-medium">
                    Nodi ({mesh.node_count}):
                  </Text>
                  {mesh.nodes.map((node) => (
                    <div
                      key={node.uid}
                      className="flex items-center gap-2 flex-wrap"
                    >
                      <span className="font-medium text-sm text-slate-200">
                        {node.name}
                      </span>
                      <span className="text-xs text-slate-500">{node.model}</span>
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
                  <Text size="sm" className="text-slate-400 font-medium">
                    Connessioni ({mesh.link_count}):
                  </Text>
                  {mesh.links.map((link, idx) => (
                    <div key={idx} className="text-sm text-slate-300">
                      <span className="font-medium">{link.source_name}</span>
                      <span className="text-slate-500"> → </span>
                      <span className="font-medium">{link.target_name}</span>
                      {link.cur_rx_kbps !== null && (
                        <span className="text-slate-500 ml-2">
                          ↓{Math.round(link.cur_rx_kbps / 1000)} Mbps ↑{Math.round((link.cur_tx_kbps ?? 0) / 1000)} Mbps
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Text size="sm" className="text-slate-500 px-1">
              Dati topologia mesh non disponibili
            </Text>
          )}
        </CollapsibleSection>
      </div>
    </Card>
  );
}
