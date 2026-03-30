'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { RaspiData as WsRaspiData } from '@/types/websocket';
import type { CpuResponse, MemoryResponse, DiskResponse, SystemResponse } from '@/types/raspi';

export type RaspiHealth = 'ok' | 'warning' | 'error';

export interface RaspiData {
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  cpuTemperature: number | null;
}

export interface UseRaspiDataReturn {
  data: RaspiData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  health: RaspiHealth;
  lastUpdatedAt: number | null;
}

export function computeRaspiHealth(d: RaspiData): RaspiHealth {
  if (d.diskPercent > 90 || d.memoryPercent > 95) return 'error';
  if (
    d.cpuPercent > 80 ||
    d.memoryPercent > 80 ||
    d.diskPercent > 75 ||
    (d.cpuTemperature !== null && d.cpuTemperature > 70)
  ) {
    return 'warning';
  }
  return 'ok';
}

export function useRaspiData(): UseRaspiDataReturn {
  const [data, setData] = useState<RaspiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const dataRef = useRef<RaspiData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  const fetchData = async () => {
    try {
      setError(null);
      const [cpuRes, memRes, diskRes, sysRes] = await Promise.all([
        fetch('/api/raspi/cpu'),
        fetch('/api/raspi/memory'),
        fetch('/api/raspi/disk'),
        fetch('/api/raspi/system'),
      ]);

      if (!cpuRes.ok || !memRes.ok || !diskRes.ok || !sysRes.ok) {
        throw new Error('One or more Raspberry Pi endpoints failed');
      }

      const [cpu, mem, disk, sys] = await Promise.all([
        cpuRes.json() as Promise<CpuResponse>,
        memRes.json() as Promise<MemoryResponse>,
        diskRes.json() as Promise<DiskResponse>,
        sysRes.json() as Promise<SystemResponse>,
      ]);

      const newData: RaspiData = {
        cpuPercent: cpu.cpu_percent,
        memoryPercent: mem.percent,
        diskPercent: disk.percent,
        cpuTemperature: sys.cpu_temperature,
      };

      dataRef.current = newData;
      setData(newData);
      setStale(false);
      setLastUpdatedAt(Date.now());
    } catch {
      setStale(true);
      if (!dataRef.current) {
        setError('Raspberry Pi non raggiungibile');
      }
    } finally {
      setLoading(false);
    }
  };

  // WS subscription: subscribe to 'raspi' topic when connection is OPEN (Phase 141 pattern)
  useEffect(() => {
    if (!isWsConnected) return; // guard against CLOSED state

    const handleMessage = (raw: unknown) => {
      const wsData = raw as WsRaspiData;

      const newData: RaspiData = {
        cpuPercent: wsData.cpu_percent,
        memoryPercent: (wsData.memory as { percent: number }).percent,
        diskPercent: (wsData.disk as { percent: number }).percent,
        cpuTemperature: (wsData.system as { temperature: number | null }).temperature ?? null,
      };

      dataRef.current = newData;
      setData(newData);
      setStale(false);
      setLoading(false);
      setError(null);
      setLastUpdatedAt(Date.now());
    };

    subscribe('raspi', handleMessage);
    return () => { unsubscribe('raspi', handleMessage); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe]);

  useAdaptivePolling({
    callback: fetchData,
    interval: isWsConnected ? null : interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  const health: RaspiHealth = data ? computeRaspiHealth(data) : 'ok';

  return { data, loading, error, stale, health, lastUpdatedAt };
}
