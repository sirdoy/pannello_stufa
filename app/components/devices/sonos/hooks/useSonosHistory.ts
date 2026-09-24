'use client';

import { useState, useCallback } from 'react';
import type { SonosHistoryResponse } from '@/types/sonosProxy';

export type SonosHistoryType = 'volume' | 'playback';
export type SonosHistoryTimeRange = '24h' | '7d' | '30d';

export interface UseSonosHistoryReturn {
  data: SonosHistoryResponse | null;
  loading: boolean;
  error: string | null;
  historyType: SonosHistoryType;
  setHistoryType: (type: SonosHistoryType) => void;
  timeRange: SonosHistoryTimeRange;
  setTimeRange: (range: SonosHistoryTimeRange) => void;
  speakerFilter: string | null;
  setSpeakerFilter: (uid: string | null) => void;
  zoneFilter: string | null;
  setZoneFilter: (groupId: string | null) => void;
  fetchHistory: () => Promise<void>;
}

const TIME_RANGE_MS: Record<SonosHistoryTimeRange, number> = {
  '24h': 86400000,
  '7d': 7 * 86400000,
  '30d': 30 * 86400000,
};

export function useSonosHistory(): UseSonosHistoryReturn {
  const [data, setData] = useState<SonosHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyType, setHistoryType] = useState<SonosHistoryType>('volume');
  const [timeRange, setTimeRange] = useState<SonosHistoryTimeRange>('24h');
  const [speakerFilter, setSpeakerFilter] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend expects Unix epoch seconds (start/end: int), not ISO strings.
      const nowS = Math.floor(Date.now() / 1000);
      const params = new URLSearchParams({
        type: historyType,
        start: String(nowS - Math.floor(TIME_RANGE_MS[timeRange] / 1000)),
        end: String(nowS),
        limit: '200',
      });
      if (speakerFilter) params.set('speaker_uid', speakerFilter);
      if (zoneFilter) params.set('group_id', zoneFilter);

      const res = await fetch(`/api/v1/sonos/history?${params.toString()}`);
      if (!res.ok) throw new Error('History failed');
      const json = (await res.json()) as SonosHistoryResponse;
      setData(json);
    } catch {
      setError('Cronologia non disponibile');
    } finally {
      setLoading(false);
    }
  }, [historyType, timeRange, speakerFilter, zoneFilter]);

  return {
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
  };
}
