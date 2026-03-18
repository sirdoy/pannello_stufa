'use client';

import { useState, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
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
}

function computeRaspiHealth(d: RaspiData): RaspiHealth {
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
  const dataRef = useRef<RaspiData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

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
    } catch {
      setStale(true);
      if (!dataRef.current) {
        setError('Raspberry Pi non raggiungibile');
      }
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  const health: RaspiHealth = data ? computeRaspiHealth(data) : 'ok';

  return { data, loading, error, stale, health };
}
