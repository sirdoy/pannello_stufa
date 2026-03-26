'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import { DataTable } from '@/app/components/ui';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Skeleton from '@/app/components/ui/Skeleton';
import type { WiFiNetworkModel } from '../hooks/useFritzWifiNetworks';

interface WifiNetworksTableProps {
  networks: WiFiNetworkModel[];
  loading: boolean;
  stale: boolean;
}

/**
 * WifiNetworksTable
 *
 * DataTable of configured WiFi networks with:
 * - SSID column
 * - Band badge (ocean variant)
 * - Channel number
 * - Status badge (sage=Attiva, ember=Disattiva)
 *
 * Shows skeletons while loading, empty state when no networks.
 */
export default function WifiNetworksTable({ networks, loading, stale }: WifiNetworksTableProps) {
  const columns: ColumnDef<WiFiNetworkModel>[] = [
    {
      accessorKey: 'ssid',
      header: 'SSID',
      enableSorting: true,
    },
    {
      accessorKey: 'band',
      header: 'Banda',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant="ocean" size="sm">
          {row.original.band}
        </Badge>
      ),
    },
    {
      accessorKey: 'channel',
      header: 'Canale',
      enableSorting: true,
    },
    {
      accessorKey: 'is_enabled',
      header: 'Stato',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.is_enabled ? (
          <Badge variant="sage" size="sm">
            Attiva
          </Badge>
        ) : (
          <Badge variant="ember" size="sm">
            Disattiva
          </Badge>
        ),
    },
  ];

  if (loading) {
    return (
      <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (networks.length === 0) {
    return (
      <Card variant="elevated" className="p-4 sm:p-6">
        <Text variant="secondary">Nessuna rete WiFi configurata</Text>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Heading level={3}>Reti WiFi</Heading>
        {stale && (
          <Text variant="label" size="xs" className="text-slate-500">
            Dati non aggiornati
          </Text>
        )}
      </div>

      <DataTable
        columns={columns}
        data={networks}
        enableSorting={true}
        enableFiltering={false}
        density="compact"
      />
    </Card>
  );
}
