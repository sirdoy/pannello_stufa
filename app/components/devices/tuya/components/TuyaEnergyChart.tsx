'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTuyaHistory } from '../hooks/useTuyaHistory';

const TuyaEnergyChartInner = dynamic(() => import('./TuyaEnergyChartInner'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] rounded-xl bg-slate-700/30 animate-pulse" />
  ),
});

const activeClass =
  'text-xs rounded-md px-3 py-1 bg-amber-500/80 text-white transition-colors';
const inactiveClass =
  'text-xs rounded-md px-3 py-1 bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-500';

interface TuyaEnergyChartProps {
  deviceId: string;
}

export default function TuyaEnergyChart({ deviceId }: TuyaEnergyChartProps) {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const { data, loading, error } = useTuyaHistory(deviceId, period);

  return (
    <div className="mt-3 space-y-3">
      {/* Period selector */}
      <div className="flex gap-1">
        <button
          onClick={() => setPeriod('24h')}
          className={period === '24h' ? activeClass : inactiveClass}
          aria-pressed={period === '24h'}
        >
          24h
        </button>
        <button
          onClick={() => setPeriod('7d')}
          className={period === '7d' ? activeClass : inactiveClass}
          aria-pressed={period === '7d'}
        >
          7g
        </button>
        <button
          onClick={() => setPeriod('30d')}
          className={period === '30d' ? activeClass : inactiveClass}
          aria-pressed={period === '30d'}
        >
          30g
        </button>
      </div>

      {/* Chart area */}
      {loading && (
        <div className="h-[200px] rounded-xl bg-slate-700/30 animate-pulse" />
      )}

      {!loading && error && (
        <p className="text-sm text-slate-400 [html:not(.dark)_&]:text-slate-500">
          {error}
        </p>
      )}

      {!loading && !error && data && (
        <TuyaEnergyChartInner
          items={data.items}
          granularity={data.granularity}
        />
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <p className="text-sm text-slate-400 [html:not(.dark)_&]:text-slate-500">
          Nessun dato disponibile
        </p>
      )}
    </div>
  );
}
