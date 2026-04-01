'use client';

import { Timer, X } from 'lucide-react';

interface SonosSleepTimerProps {
  remainingSeconds: number | null; // null = no active timer
  onSetTimer: (durationSeconds: number) => void; // 0 = cancel
}

const PRESETS = [
  { label: '15', seconds: 900 },
  { label: '30', seconds: 1800 },
  { label: '45', seconds: 2700 },
  { label: '60', seconds: 3600 },
  { label: '90', seconds: 5400 },
];

function formatRemainingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const presetButtonClass =
  'text-xs px-2 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-slate-300 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:hover:bg-slate-300 [html:not(.dark)_&]:text-slate-700';

export default function SonosSleepTimer({ remainingSeconds, onSetTimer }: SonosSleepTimerProps) {
  const hasActiveTimer = remainingSeconds !== null && remainingSeconds > 0;

  return (
    <div className="flex flex-col gap-2">
      {hasActiveTimer && (
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-ember-400" />
          <span className="text-sm font-mono text-ember-400">
            {formatRemainingTime(remainingSeconds!)}
          </span>
          <button
            onClick={() => onSetTimer(0)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Annulla timer"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1">
        {PRESETS.map(preset => (
          <button
            key={preset.seconds}
            onClick={() => onSetTimer(preset.seconds)}
            className={presetButtonClass}
          >
            {preset.label} min
          </button>
        ))}
      </div>
    </div>
  );
}
