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
  signal_strength: number;    // quality 0-100 (Fritz!Box scale, not dBm)
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
 * Visual 4-bar signal strength indicator for the backend 0-100 quality scale
 * (WiFiClientModel.signal_strength is NOT dBm).
 * >= 75: 4 bars, >= 50: 3 bars, >= 25: 2 bars, else: 1 bar
 */
function SignalStrengthBars({ quality }: { quality: number }) {
  const bars = quality >= 75 ? 4 : quality >= 50 ? 3 : quality >= 25 ? 2 : 1;
  return (
    <div className="flex items-end gap-0.5" title={`Segnale ${quality}%`} data-bars={bars}>
      {[1, 2, 3, 4].map((b) => (
        <div
          key={b}
          className={`w-1.5 rounded-sm ${b <= bars ? 'bg-sage-400' : 'bg-white/18'}`}
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
 * - Signal strength bars (1-4 bars, 0-100 quality scale)
 * - Band badges (ocean for 5GHz, ember for 2.4GHz)
 * - CopyableIp for IP column
 * - Default sort: strongest signal first (higher quality = stronger)
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
        <Text as="span" variant="secondary" size="xs" mono>{row.original.mac}</Text>
      ),
    },
    {
      accessorKey: 'signal_strength',
      header: 'Segnale',
      enableSorting: true,
      sortingFn: (rowA, rowB) =>
        rowB.original.signal_strength - rowA.original.signal_strength,
      cell: ({ row }) => <SignalStrengthBars quality={row.original.signal_strength} />,
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
    <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2} size="lg">
          Client WiFi ({total})
        </Heading>

        {/* Band filter */}
        <Button.Group>
          {BAND_FILTERS.map(({ value, label }) => (
            <Button
              key={value}
              variant={band === value ? 'ember' : 'subtle'}
              size="sm"
              onClick={() => onBandChange(value)}
            >
              {label}
            </Button>
          ))}
        </Button.Group>
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
          enableFiltering={false}
          initialSorting={[{ id: 'signal_strength', desc: true }]}
          density="compact"
        />
      )}
    </Card>
  );
}
