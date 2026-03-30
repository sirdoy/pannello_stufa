'use client';

import type { TuyaPlug } from '@/types/tuyaProxy';

interface TuyaSummaryProps {
  plugs: TuyaPlug[];
}

export function TuyaSummary({ plugs }: TuyaSummaryProps) {
  const activeCount = plugs.filter(p => p.switch_on === true).length;
  const inactiveCount = plugs.length - activeCount;
  const totalPowerW = plugs.reduce((sum, p) => sum + (p.power_w ?? 0), 0);
  const highestConsumer = plugs.reduce<TuyaPlug | null>((max, p) =>
    (p.power_w ?? 0) > ((max?.power_w) ?? 0) ? p : max, null);
  const gaugePercent = Math.min((totalPowerW / 3500) * 100, 100);

  return (
    <div className="space-y-3">
      {/* Top row: plug count and active/inactive breakdown */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {plugs.length} {plugs.length === 1 ? 'presa' : 'prese'}
        </span>
        <span className="text-sm text-slate-300">
          {activeCount} attive / {inactiveCount} spente
        </span>
      </div>

      {/* Total power display */}
      <div className="text-2xl font-bold text-warning-400 [html:not(.dark)_&]:text-warning-600">
        {totalPowerW.toFixed(0)} W
      </div>

      {/* Power gauge bar */}
      <div className="h-2 w-full rounded-full bg-slate-700/30 [html:not(.dark)_&]:bg-slate-200">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-warning-400 to-warning-600 transition-all duration-500"
          style={{ width: `${gaugePercent}%` }}
        />
      </div>

      {/* Highest consumer */}
      {highestConsumer && (highestConsumer.power_w ?? 0) > 0 && (
        <p className="text-xs text-slate-400">
          Consumo max: {highestConsumer.custom_name ?? highestConsumer.device_id}{' '}
          ({highestConsumer.power_w?.toFixed(0)} W)
        </p>
      )}
    </div>
  );
}
