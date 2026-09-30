'use client';

import { useState, useEffect, useRef } from 'react';
import type { TuyaPlug } from '@/types/tuyaProxy';
import { useSyncedState } from '@/lib/hooks/useSyncedState';
import TuyaEnergyChart from './TuyaEnergyChart';

/** Backend POST /tuya/plugs/{id}/timer: seconds le=86400. */
const MAX_TIMER_MINUTES = 1440;

interface TuyaPlugCardProps {
  plug: TuyaPlug;
  onToggle: (deviceId: string, currentState: boolean) => void;
  onSetTimer: (deviceId: string, seconds: number) => void;
  onCancelTimer: (deviceId: string) => void;
}

function formatCountdown(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

const freshnessColors: Record<TuyaPlug['data_freshness'], string> = {
  LIVE: 'bg-emerald-500',
  STALE: 'bg-amber-500',
  UNREACHABLE: 'bg-red-500',
};

const freshnessLabels: Record<TuyaPlug['data_freshness'], string> = {
  LIVE: 'LIVE',
  STALE: 'STALE',
  UNREACHABLE: 'OFFLINE',
};

export function TuyaPlugCard({
  plug,
  onToggle,
  onSetTimer,
  onCancelTimer,
}: TuyaPlugCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState('');
  // Re-synced when plug.countdown_s changes (e.g. from WS push)
  const [remaining, setRemaining] = useSyncedState<number>(plug.countdown_s ?? 0);

  // Client-side countdown tick
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remaining, setRemaining]);

  const isUnreachable = plug.data_freshness === 'UNREACHABLE';
  const displayName = plug.custom_name ?? plug.device_id;
  const hasActiveTimer = remaining > 0;

  const handleSetTimer = () => {
    const minutes = parseInt(timerMinutes, 10);
    // Backend accepts seconds 0..86400 (24 h): out-of-range values would get a silent 422.
    if (!isNaN(minutes) && minutes > 0 && minutes <= MAX_TIMER_MINUTES) {
      onSetTimer(plug.device_id, minutes * 60);
      setTimerMinutes('');
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="truncate pr-2 text-sm font-semibold text-slate-100">
          {displayName}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`size-2 rounded-full ${freshnessColors[plug.data_freshness]}`}
          />
          <span className="text-xs text-slate-400">
            {freshnessLabels[plug.data_freshness]}
          </span>
        </div>
      </div>

      {/* Power and metrics row */}
      <div className="space-y-1">
        <p className="text-2xl font-bold text-amber-400">
          {plug.power_w != null && !isUnreachable
            ? `${plug.power_w.toFixed(1)} W`
            : '-- W'}
        </p>
        <p className="text-xs text-slate-400">
          {plug.voltage_v?.toFixed(0) ?? '--'} V /{''}
          {plug.current_ma?.toFixed(0) ?? '--'} mA
        </p>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => onToggle(plug.device_id, plug.switch_on ?? false)}
        disabled={isUnreachable}
        className={`w-full rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          plug.switch_on
            ? 'bg-amber-500/80 text-white hover:bg-amber-500 disabled:opacity-50'
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-50'
        }`}
        aria-label={plug.switch_on ? 'Spegni' : 'Accendi'}
      >
        {plug.switch_on ? 'Acceso' : 'Spento'}
      </button>

      {/* Timer section */}
      <div className="border-t border-slate-700/50 pt-3">
        {hasActiveTimer ? (
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-slate-300">
              {formatCountdown(remaining)}
            </span>
            <button
              onClick={() => onCancelTimer(plug.device_id)}
              className="rounded-md bg-red-500/20 px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/30"
            >
              Annulla
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={MAX_TIMER_MINUTES}
              placeholder="min"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(e.target.value)}
              className="w-16 rounded-md border border-slate-600 bg-slate-700/50 px-2 py-1 text-xs text-slate-200"
              aria-label="Minuti timer"
            />
            <button
              onClick={handleSetTimer}
              disabled={!timerMinutes || parseInt(timerMinutes, 10) <= 0}
              className="rounded-md bg-slate-700/50 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              Imposta
            </button>
          </div>
        )}
      </div>

      {/* Expand/collapse energy chart */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left text-xs text-slate-400 transition-colors hover:text-slate-300"
      >
        {expanded ? '▲ Nascondi storico' : '▼ Storico energia'}
      </button>

      {expanded && <TuyaEnergyChart deviceId={plug.device_id} />}
    </div>
  );
}
