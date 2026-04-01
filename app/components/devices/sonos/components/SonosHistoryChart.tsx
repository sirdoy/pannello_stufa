'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { useSonosHistory } from '../hooks/useSonosHistory';
import type { SonosZoneResponse } from '@/types/sonosProxy';
import type { SonosPlaybackHistoryItem, SonosVolumeHistoryItem } from '@/types/sonosProxy';

const SonosVolumeChart = dynamic(() => import('./SonosVolumeChart'), { ssr: false });

interface SonosHistoryChartProps {
  zones: SonosZoneResponse[];
  speakers: Array<{ uid: string; name: string }>;
}

const activeClass = 'text-xs rounded-md px-3 py-1 bg-amber-500/80 text-white transition-colors';
const inactiveClass = 'text-xs rounded-md px-3 py-1 bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors';

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
    <div className="rounded-2xl bg-slate-800/50 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-100 mb-4">
        Cronologia
      </h2>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        {/* Type selector */}
        <div className="flex gap-1">
          <button
            onClick={() => setHistoryType('volume')}
            className={historyType === 'volume' ? activeClass : inactiveClass}
            aria-pressed={historyType === 'volume'}
          >
            Volume
          </button>
          <button
            onClick={() => setHistoryType('playback')}
            className={historyType === 'playback' ? activeClass : inactiveClass}
            aria-pressed={historyType === 'playback'}
          >
            Riproduzione
          </button>
        </div>

        {/* Time range picker */}
        <div className="flex gap-1">
          <button
            onClick={() => setTimeRange('24h')}
            className={timeRange === '24h' ? activeClass : inactiveClass}
            aria-pressed={timeRange === '24h'}
          >
            24h
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={timeRange === '7d' ? activeClass : inactiveClass}
            aria-pressed={timeRange === '7d'}
          >
            7g
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={timeRange === '30d' ? activeClass : inactiveClass}
            aria-pressed={timeRange === '30d'}
          >
            30g
          </button>
        </div>

        {/* Filter dropdown */}
        {historyType === 'volume' && speakers.length > 0 && (
          <select
            value={speakerFilter ?? ''}
            onChange={e => setSpeakerFilter(e.target.value || null)}
            className="text-xs bg-slate-700/50 text-slate-300 rounded-md border-0 px-2 py-1"
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
            className="text-xs bg-slate-700/50 text-slate-300 rounded-md border-0 px-2 py-1"
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
        <div className="h-[200px] rounded-xl bg-slate-700/30 animate-pulse" />
      )}

      {!loading && error && (
        <p className="text-sm text-slate-400">{error}</p>
      )}

      {!loading && !error && historyType === 'volume' && (
        <>
          {volumeItems.length > 0 ? (
            <SonosVolumeChart items={volumeItems} timeRange={timeRange} />
          ) : (
            <p className="text-sm text-slate-400">
              Nessun dato disponibile
            </p>
          )}
        </>
      )}

      {!loading && !error && historyType === 'playback' && (
        <>
          {playbackItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                    <th className="text-left pb-2 pr-3">Ora</th>
                    <th className="text-left pb-2 pr-3">Brano</th>
                    <th className="text-left pb-2 pr-3">Artista</th>
                    <th className="text-left pb-2">Sorgente</th>
                  </tr>
                </thead>
                <tbody>
                  {playbackItems.map((item, idx) => (
                    <tr
                      key={`${item.timestamp}-${idx}`}
                      className={`text-slate-300  ${
                        idx % 2 === 0 ? '' : 'bg-slate-700/20'
                      }`}
                    >
                      <td className="py-1.5 pr-3 text-xs text-slate-400 whitespace-nowrap">
                        {format(item.timestamp * 1000, 'dd/MM HH:mm')}
                      </td>
                      <td className="py-1.5 pr-3 max-w-[160px] truncate">{item.title || '—'}</td>
                      <td className="py-1.5 pr-3 text-slate-400 truncate max-w-[120px]">
                        {item.artist || '—'}
                      </td>
                      <td className="py-1.5 text-xs text-slate-500">{item.source_type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Nessun evento di riproduzione
            </p>
          )}
        </>
      )}
    </div>
  );
}
