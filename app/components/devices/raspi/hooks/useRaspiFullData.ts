'use client';

import { useState, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type { CpuResponse, MemoryResponse, DiskResponse, SystemResponse } from '@/types/raspi';

export interface RaspiFullData {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  diskPercent: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  cpuTemperature: number | null;
  uptimeSeconds: number;
  loadAvg1: number;
  loadAvg5: number;
  loadAvg15: number;
  processCount: number;
  networkBytesSent: number;
  networkBytesRecv: number;
  networkInterface: string;
}

export interface UseRaspiFullDataReturn {
  data: RaspiFullData | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
}

export function useRaspiFullData(): UseRaspiFullDataReturn {
  const [data, setData] = useState<RaspiFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<RaspiFullData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 30000 : 300000;

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

      const newData: RaspiFullData = {
        cpuPercent: cpu.cpu_percent,
        memoryPercent: mem.percent,
        memoryUsedBytes: mem.used_bytes,
        memoryTotalBytes: mem.total_bytes,
        diskPercent: disk.percent,
        diskUsedBytes: disk.used_bytes,
        diskTotalBytes: disk.total_bytes,
        cpuTemperature: sys.cpu_temperature,
        uptimeSeconds: sys.uptime_seconds,
        loadAvg1: sys.load_avg_1,
        loadAvg5: sys.load_avg_5,
        loadAvg15: sys.load_avg_15,
        processCount: sys.process_count,
        networkBytesSent: sys.network.bytes_sent,
        networkBytesRecv: sys.network.bytes_recv,
        networkInterface: sys.network.interface,
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

  return { data, loading, stale, error };
}
