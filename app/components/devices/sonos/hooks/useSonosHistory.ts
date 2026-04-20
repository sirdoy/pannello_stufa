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
      const now = Date.now();
      const start = new Date(now - TIME_RANGE_MS[timeRange]).toISOString();
      const end = new Date(now).toISOString();

      let url = `/api/v1/sonos/history?type=${historyType}&start=${start}&end=${end}&limit=200`;
      if (speakerFilter) {
        url += `&speaker_uid=${speakerFilter}`;
      }
      if (zoneFilter) {
        url += `&group_id=${zoneFilter}`;
      }

      const res = await fetch(url);
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
