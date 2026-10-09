'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import DataTable from '@/app/components/ui/DataTable';
import Heading from '@/app/components/ui/Heading';
import InlineSelect from '@/app/components/ui/InlineSelect';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { useSonosHistory } from '../hooks/useSonosHistory';
import type { SonosZoneResponse } from '@/types/sonosProxy';
import type { SonosPlaybackHistoryItem, SonosVolumeHistoryItem } from '@/types/sonosProxy';

const SonosVolumeChart = dynamic(() => import('./SonosVolumeChart'), { ssr: false });

const PLAYBACK_COLUMNS: ColumnDef<SonosPlaybackHistoryItem>[] = [
  {
    id: 'timestamp',
    header: 'Ora',
    enableSorting: false,
    cell: ({ row }) => (
      <Text as="span" variant="secondary" size="xs" className="whitespace-nowrap">
        {format(row.original.timestamp * 1000, 'dd/MM HH:mm')}
      </Text>
    ),
  },
  {
    id: 'title',
    header: 'Brano',
    enableSorting: false,
    cell: ({ row }) => <span className="block max-w-40 truncate">{row.original.title || '—'}</span>,
  },
  {
    id: 'artist',
    header: 'Artista',
    enableSorting: false,
    cell: ({ row }) => (
      <Text as="span" variant="secondary" size="sm" className="block max-w-30 truncate">
        {row.original.artist || '—'}
      </Text>
    ),
  },
  {
    id: 'source',
    header: 'Sorgente',
    enableSorting: false,
    cell: ({ row }) => (
      <Text as="span" variant="secondary" size="xs">{row.original.source_type || '—'}</Text>
    ),
  },
];

interface SonosHistoryChartProps {
  zones: SonosZoneResponse[];
  speakers: Array<{ uid: string; name: string }>;
}

export default function SonosHistoryChart({ zones, speakers }: SonosHistoryChartProps) {
  const {
    data,
    loading,
    error,
    historyType,
    setHistoryType,
    timeRange,
    setTimeRange,
    speakerFilter,
    setSpeakerFilter,
    zoneFilter,
    setZoneFilter,
    fetchHistory,
  } = useSonosHistory();

  // Fetch on mount and when controls change
  useEffect(() => {
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyType, timeRange, speakerFilter, zoneFilter]);

  const volumeItems = (data?.items ?? []) as SonosVolumeHistoryItem[];
  const playbackItems = (data?.items ?? []) as SonosPlaybackHistoryItem[];

  return (
    <Card>
      <Heading level={2} size="md" className="mb-4">
        Cronologia
      </Heading>

      {/* Controls row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Type selector */}
        <div className="flex gap-1">
          <Button
            variant={historyType === 'volume' ? 'ember' : 'subtle'}
            size="sm"
            onClick={() => setHistoryType('volume')}
            aria-pressed={historyType === 'volume'}
          >
            Volume
          </Button>
          <Button
            variant={historyType === 'playback' ? 'ember' : 'subtle'}
            size="sm"
            onClick={() => setHistoryType('playback')}
            aria-pressed={historyType === 'playback'}
          >
            Riproduzione
          </Button>
        </div>

        {/* Time range picker */}
        <div className="flex gap-1">
          <Button
            variant={timeRange === '24h' ? 'ember' : 'subtle'}
            size="sm"
            onClick={() => setTimeRange('24h')}
            aria-pressed={timeRange === '24h'}
          >
            24h
          </Button>
          <Button
            variant={timeRange === '7d' ? 'ember' : 'subtle'}
            size="sm"
            onClick={() => setTimeRange('7d')}
            aria-pressed={timeRange === '7d'}
          >
            7g
          </Button>
          <Button
            variant={timeRange === '30d' ? 'ember' : 'subtle'}
            size="sm"
            onClick={() => setTimeRange('30d')}
            aria-pressed={timeRange === '30d'}
          >
            30g
          </Button>
        </div>

        {/* Filter dropdowns */}
        {historyType === 'volume' && speakers.length > 0 && (
          <InlineSelect
            size="md"
            value={speakerFilter ?? ''}
            onChange={e => setSpeakerFilter(e.target.value || null)}
            aria-label="Filtra per altoparlante"
          >
            <option value="">Tutti</option>
            {speakers.map(s => (
              <option key={s.uid} value={s.uid}>
                {s.name}
              </option>
            ))}
          </InlineSelect>
        )}

        {historyType === 'playback' && zones.length > 0 && (
          <InlineSelect
            size="md"
            value={zoneFilter ?? ''}
            onChange={e => setZoneFilter(e.target.value || null)}
            aria-label="Filtra per zona"
          >
            <option value="">Tutte le zone</option>
            {zones.map(z => (
              <option key={z.group_id} value={z.group_id}>
                {z.label}
              </option>
            ))}
          </InlineSelect>
        )}
      </div>

      {/* Chart area */}
      {loading && (
        <Skeleton className="h-50" data-testid="sonos-history-loading" />
      )}

      {!loading && error && (
        <Text variant="secondary" size="sm">{error}</Text>
      )}

      {!loading && !error && historyType === 'volume' && (
        <>
          {volumeItems.length > 0 ? (
            <SonosVolumeChart items={volumeItems} timeRange={timeRange} />
          ) : (
            <Text variant="secondary" size="sm">
              Nessun dato disponibile
            </Text>
          )}
        </>
      )}

      {!loading && !error && historyType === 'playback' && (
        <>
          {playbackItems.length > 0 ? (
            <DataTable data={playbackItems} columns={PLAYBACK_COLUMNS} density="compact" striped />
          ) : (
            <Text variant="secondary" size="sm">
              Nessun evento di riproduzione
            </Text>
          )}
        </>
      )}
    </Card>
  );
}
