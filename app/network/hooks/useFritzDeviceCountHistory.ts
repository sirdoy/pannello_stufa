'use client';

import { useState, useEffect } from 'react';

interface DeviceDailyRecord {
  day_timestamp: number;    // Unix seconds (day boundary)
  hour_bucket: number;      // 0-23 — 24 records per day
  online_count: number;
  offline_count: number;
  total_devices: number;
}

export interface DeviceCountPoint {
  date: number;     // Unix ms (day_timestamp * 1000)
  online: number;   // peak online count for the day
  offline: number;  // peak offline count for the day
  total: number;    // peak total devices for the day
}

function aggregateToDailyTotals(items: DeviceDailyRecord[]): DeviceCountPoint[] {
  const byDay = new Map<number, DeviceDailyRecord[]>();
  items.forEach((r) => {
    const arr = byDay.get(r.day_timestamp) ?? [];
    arr.push(r);
    byDay.set(r.day_timestamp, arr);
  });
  return Array.from(byDay.entries())
    .map(([ts, records]) => ({
      date: ts * 1000,
      online: Math.max(...records.map((r) => r.online_count)),
      offline: Math.max(...records.map((r) => r.offline_count)),
      total: Math.max(...records.map((r) => r.total_devices)),
    }))
    .sort((a, b) => a.date - b.date);
}

/**
 * useFritzDeviceCountHistory
 *
 * On-demand fetch for device count history with daily aggregation.
 * Fetches /api/v1/fritzbox/history/devices/daily?days=N on mount and when days changes.
 * Aggregates 24 hourly records per day into daily peak totals.
 *
 * @returns { days, setDays, chartData, loading }
 */
export function useFritzDeviceCountHistory(): {
  days: number;
  setDays: (d: number) => void;
  chartData: DeviceCountPoint[];
  loading: boolean;
} {
  const [days, setDays] = useState(30);
  const [chartData, setChartData] = useState<DeviceCountPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/fritzbox/history/devices/daily?days=${days}`)
      .then((res) => res.json())
      .then((json: unknown) => {
        const body = json as { deviceCounts: { items: DeviceDailyRecord[]; total: number } };
        const items = body.deviceCounts?.items ?? [];
        setChartData(aggregateToDailyTotals(items));
      })
      .catch(() => {
        setChartData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [days]);

  return { days, setDays, chartData, loading };
}
