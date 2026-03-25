'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import { DataTable } from '@/app/components/ui';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Skeleton from '@/app/components/ui/Skeleton';
import CopyableIp from './CopyableIp';

export interface WiFiClient {
  hostname: string;
  mac: string;
  ip: string;
  band: string;
  ssid: string;
  signal_strength: number;    // dBm (negative integer)
  link_speed_mbps: number;
  is_active: boolean;
}

export type WifiBandFilter = 'all' | '2.4GHz' | '5GHz';

interface WifiClientsTableProps {
  clients: WiFiClient[];
  loading: boolean;
  band: WifiBandFilter;
  onBandChange: (band: WifiBandFilter) => void;
  total: number;
}

/**
 * SignalStrengthBars
 *
 * Visual 4-bar signal strength indicator based on dBm value.
 * > -50: 4 bars, > -60: 3 bars, > -70: 2 bars, else: 1 bar
 */
function SignalStrengthBars({ dbm }: { dbm: number }) {
  const bars = dbm > -50 ? 4 : dbm > -60 ? 3 : dbm > -70 ? 2 : 1;
  return (
    <div className="flex items-end gap-0.5" title={`${dbm} dBm`}>
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          className={`w-1.5 rounded-sm ${b <= bars ? 'bg-sage-400' : 'bg-slate-600'}`}
          style={{ height: `${b * 4}px` }}
        />
      ))}
    </div>
  );
}

const BAND_FILTERS: { value: WifiBandFilter; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: '2.4GHz', label: '2.4 GHz' },
  { value: '5GHz', label: '5 GHz' },
];

/**
 * WifiClientsTable
 *
 * DataTable of WiFi clients with:
 * - Band filter toggle (All / 2.4 GHz / 5 GHz)
 * - Signal strength bars (1-4 bars based on dBm)
 * - Band badges (ocean for 5GHz, ember for 2.4GHz)
 * - CopyableIp for IP column
 * - Default sort: strongest signal first (less negative = stronger)
 */
export default function WifiClientsTable({
  clients,
  loading,
  band,
  onBandChange,
  total,
}: WifiClientsTableProps) {
  const columns: ColumnDef<WiFiClient>[] = [
    {
      accessorKey: 'hostname',
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
      accessorKey: 'signal_strength',
      header: 'Segnale',
      enableSorting: true,
      sortingFn: (rowA, rowB) =>
        rowB.original.signal_strength - rowA.original.signal_strength,
      cell: ({ row }) => <SignalStrengthBars dbm={row.original.signal_strength} />,
    },
    {
      accessorKey: 'band',
      header: 'Banda',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge
          variant={row.original.band === '5GHz' ? 'ocean' : 'ember'}
          size="sm"
        >
          {row.original.band}
        </Badge>
      ),
    },
    {
      accessorKey: 'link_speed_mbps',
      header: 'Velocita',
      enableSorting: true,
      cell: ({ row }) => (
        <Text size="sm">{row.original.link_speed_mbps} Mbps</Text>
      ),
    },
  ];

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Heading level={2} size="lg">
          Client WiFi ({total})
        </Heading>

        {/* Band filter */}
        <div className="flex gap-1">
          {BAND_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onBandChange(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                band === value
                  ? 'bg-ember-500/20 border border-ember-400/30 text-ember-300'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={clients}
          enableSorting={true}
          enableFiltering={false}
          initialSorting={[{ id: 'signal_strength', desc: true }]}
          density="compact"
        />
      )}
    </Card>
  );
}
