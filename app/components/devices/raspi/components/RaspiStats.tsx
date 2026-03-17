'use client';

import type { RaspiData } from '../hooks/useRaspiData';

interface RaspiStatsProps {
  data: RaspiData;
}

export default function RaspiStats({ data }: RaspiStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* CPU */}
      <div className="rounded-lg bg-slate-800/50 p-3 [html:not(.dark)_&]:bg-slate-100">
        <div className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">CPU</div>
        <div className="text-xl font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-800">
          {data.cpuPercent.toFixed(1)}%
        </div>
      </div>

      {/* RAM */}
      <div className="rounded-lg bg-slate-800/50 p-3 [html:not(.dark)_&]:bg-slate-100">
        <div className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">RAM</div>
        <div className="text-xl font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-800">
          {data.memoryPercent.toFixed(1)}%
        </div>
      </div>

      {/* Disco */}
      <div className="rounded-lg bg-slate-800/50 p-3 [html:not(.dark)_&]:bg-slate-100">
        <div className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Disco</div>
        <div className="text-xl font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-800">
          {data.diskPercent.toFixed(1)}%
        </div>
      </div>

      {/* Temperatura */}
      <div className="rounded-lg bg-slate-800/50 p-3 [html:not(.dark)_&]:bg-slate-100">
        <div className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Temp</div>
        <div className="text-xl font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-800">
          {data.cpuTemperature !== null ? `${data.cpuTemperature.toFixed(1)}°C` : '—'}
        </div>
      </div>
    </div>
  );
}
