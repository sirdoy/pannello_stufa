'use client';

import type { SensorSummaryResponse } from '@/types/dirigeraProxy';

interface DirigeraStatsProps {
  summary: SensorSummaryResponse;
}

export default function DirigeraStats({ summary }: DirigeraStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Sensori totali */}
      <div className="rounded-lg bg-slate-800/50 p-3 [html:not(.dark)_&]:bg-slate-100">
        <div className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Sensori totali</div>
        <div className="text-2xl font-bold text-slate-100 [html:not(.dark)_&]:text-slate-800">
          {summary.total_sensors}
        </div>
      </div>

      {/* Contatti aperti */}
      <div className="rounded-lg bg-slate-800/50 p-3 [html:not(.dark)_&]:bg-slate-100">
        <div className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Contatti aperti</div>
        <div className="text-2xl font-bold text-slate-100 [html:not(.dark)_&]:text-slate-800">
          {summary.open_count}
        </div>
      </div>

      {/* Offline */}
      <div className="rounded-lg bg-slate-800/50 p-3 [html:not(.dark)_&]:bg-slate-100">
        <div className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Offline</div>
        <div className={`text-2xl font-bold ${summary.offline_count > 0 ? 'text-danger-400' : 'text-slate-100 [html:not(.dark)_&]:text-slate-800'}`}>
          {summary.offline_count}
        </div>
      </div>

      {/* Batteria bassa */}
      <div className="rounded-lg bg-slate-800/50 p-3 [html:not(.dark)_&]:bg-slate-100">
        <div className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Batteria bassa</div>
        <div className={`text-2xl font-bold ${summary.low_battery_count > 0 ? 'text-warning-400' : 'text-slate-100 [html:not(.dark)_&]:text-slate-800'}`}>
          {summary.low_battery_count}
        </div>
      </div>
    </div>
  );
}
