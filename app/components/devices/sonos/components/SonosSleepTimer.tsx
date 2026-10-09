'use client';

import { Timer, X } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Text from '@/app/components/ui/Text';

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

export default function SonosSleepTimer({ remainingSeconds, onSetTimer }: SonosSleepTimerProps) {
  const hasActiveTimer = remainingSeconds !== null && remainingSeconds > 0;

  return (
    <div className="flex flex-col gap-2">
      {hasActiveTimer && (
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-ember-400" />
          <Text as="span" variant="ember" size="sm" mono>
            {formatRemainingTime(remainingSeconds!)}
          </Text>
          <Button.Icon
            variant="ghost"
            size="sm"
            onClick={() => onSetTimer(0)}
            aria-label="Annulla timer"
            icon={<X size={14} />}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1">
        {PRESETS.map(preset => (
          <Button
            key={preset.seconds}
            variant="subtle"
            size="sm"
            onClick={() => onSetTimer(preset.seconds)}
          >
            {preset.label} min
          </Button>
        ))}
      </div>
    </div>
  );
}
