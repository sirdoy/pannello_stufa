'use client';

import { useState, useEffect, useRef } from 'react';
import type { TuyaPlug } from '@/types/tuyaProxy';
import TuyaEnergyChart from './TuyaEnergyChart';

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
  const [remaining, setRemaining] = useState<number>(plug.countdown_s ?? 0);

  // Sync remaining when plug.countdown_s changes (e.g. from WS push)
  useEffect(() => {
    setRemaining(plug.countdown_s ?? 0);
  }, [plug.countdown_s]);

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
  }, [remaining]);

  const isUnreachable = plug.data_freshness === 'UNREACHABLE';
  const displayName = plug.custom_name ?? plug.device_id;
  const hasActiveTimer = remaining > 0;

  const handleSetTimer = () => {
    const minutes = parseInt(timerMinutes, 10);
    if (!isNaN(minutes) && minutes > 0) {
      onSetTimer(plug.device_id, minutes * 60);
      setTimerMinutes('');
    }
  };

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-slate-200 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-800 truncate pr-2">
          {displayName}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`h-2 w-2 rounded-full ${freshnessColors[plug.data_freshness]}`}
          />
          <span className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500">
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
        <p className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500">
          {plug.voltage_v?.toFixed(0) ?? '--'} V /{' '}
          {plug.current_ma?.toFixed(0) ?? '--'} mA
        </p>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => onToggle(plug.device_id, plug.switch_on ?? false)}
        disabled={isUnreachable}
        className={`w-full py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
          plug.switch_on
            ? 'bg-amber-500/80 text-white hover:bg-amber-500 disabled:opacity-50'
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-50'
        }`}
        aria-label={plug.switch_on ? 'Spegni' : 'Accendi'}
      >
        {plug.switch_on ? 'Acceso' : 'Spento'}
      </button>

      {/* Timer section */}
      <div className="border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200 pt-3">
        {hasActiveTimer ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-600 font-mono">
              {formatCountdown(remaining)}
            </span>
            <button
              onClick={() => onCancelTimer(plug.device_id)}
              className="text-xs px-2 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Annulla
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={1440}
              placeholder="min"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(e.target.value)}
              className="w-16 px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-200 border border-slate-600 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-700 [html:not(.dark)_&]:border-slate-300"
              aria-label="Minuti timer"
            />
            <button
              onClick={handleSetTimer}
              disabled={!timerMinutes || parseInt(timerMinutes, 10) <= 0}
              className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Imposta
            </button>
          </div>
        )}
      </div>

      {/* Expand/collapse energy chart */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-xs text-slate-400 hover:text-slate-300 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700 transition-colors text-left"
      >
        {expanded ? '▲ Nascondi storico' : '▼ Storico energia'}
      </button>

      {expanded && <TuyaEnergyChart deviceId={plug.device_id} />}
    </div>
  );
}
