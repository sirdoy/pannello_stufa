'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { useSonosHistory } from '../hooks/useSonosHistory';
import type { SonosZoneResponse } from '@/types/sonosProxy';
import type { SonosPlaybackHistoryItem, SonosVolumeHistoryItem } from '@/types/sonosProxy';

const SonosVolumeChart = dynamic(() => import('./SonosVolumeChart'), { ssr: false });

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

        {/* Filter dropdowns: native selects (ui/Select has no aria-label and no empty value) */}
        {historyType === 'volume' && speakers.length > 0 && (
          <select
            value={speakerFilter ?? ''}
            onChange={e => setSpeakerFilter(e.target.value || null)}
            className="h-11 rounded-xl border-[0.5px] border-white/14 bg-white/6 px-3 text-[13px] text-(--text-1)"
            aria-label="Filtra per altoparlante"
          >
            <option value="">Tutti</option>
            {speakers.map(s => (
              <option key={s.uid} value={s.uid}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {historyType === 'playback' && zones.length > 0 && (
          <select
            value={zoneFilter ?? ''}
            onChange={e => setZoneFilter(e.target.value || null)}
            className="h-11 rounded-xl border-[0.5px] border-white/14 bg-white/6 px-3 text-[13px] text-(--text-1)"
            aria-label="Filtra per zona"
          >
            <option value="">Tutte le zone</option>
            {zones.map(z => (
              <option key={z.group_id} value={z.group_id}>
                {z.label}
              </option>
            ))}
          </select>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-xs text-(--text-2)">
                    <th className="pr-3 pb-2 text-left">Ora</th>
                    <th className="pr-3 pb-2 text-left">Brano</th>
                    <th className="pr-3 pb-2 text-left">Artista</th>
                    <th className="pb-2 text-left">Sorgente</th>
                  </tr>
                </thead>
                <tbody>
                  {playbackItems.map((item, idx) => (
                    <tr
                      key={`${item.timestamp}-${idx}`}
                      className={`text-(--text-1) ${
                        idx % 2 === 0 ? '' : 'bg-white/4'
                      }`}
                    >
                      <td className="py-1.5 pr-3 text-xs whitespace-nowrap text-(--text-2)">
                        {format(item.timestamp * 1000, 'dd/MM HH:mm')}
                      </td>
                      <td className="max-w-40 truncate py-1.5 pr-3">{item.title || '—'}</td>
                      <td className="max-w-30 truncate py-1.5 pr-3 text-(--text-2)">
                        {item.artist || '—'}
                      </td>
                      <td className="py-1.5 text-xs text-(--text-2)">{item.source_type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
