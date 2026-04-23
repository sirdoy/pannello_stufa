'use client';

import type { RaspiData } from '../hooks/useRaspiData';

interface RaspiStatsProps {
  data: RaspiData;
}

function formatPercent(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)}%` : '—';
}

function formatTemp(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)}°C` : '—';
}

export default function RaspiStats({ data }: RaspiStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* CPU */}
      <div className="rounded-lg bg-slate-800/50 p-3">
        <div className="text-xs text-slate-400 mb-1">CPU</div>
        <div className="text-xl font-semibold text-slate-100">
          {formatPercent(data.cpuPercent)}
        </div>
      </div>

      {/* RAM */}
      <div className="rounded-lg bg-slate-800/50 p-3">
        <div className="text-xs text-slate-400 mb-1">RAM</div>
        <div className="text-xl font-semibold text-slate-100">
          {formatPercent(data.memoryPercent)}
        </div>
      </div>

      {/* Disco */}
      <div className="rounded-lg bg-slate-800/50 p-3">
        <div className="text-xs text-slate-400 mb-1">Disco</div>
        <div className="text-xl font-semibold text-slate-100">
          {formatPercent(data.diskPercent)}
        </div>
      </div>

      {/* Temperatura */}
      <div className="rounded-lg bg-slate-800/50 p-3">
        <div className="text-xs text-slate-400 mb-1">Temp</div>
        <div className="text-xl font-semibold text-slate-100">
          {formatTemp(data.cpuTemperature)}
        </div>
      </div>
    </div>
  );
}
