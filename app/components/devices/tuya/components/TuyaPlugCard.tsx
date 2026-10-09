'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Text from '@/app/components/ui/Text';
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

const freshnessVariants: Record<TuyaPlug['data_freshness'], 'sage' | 'warning' | 'danger'> = {
  LIVE: 'sage',
  STALE: 'warning',
  UNREACHABLE: 'danger',
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
    <Card className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Text as="span" size="sm" weight="semibold" className="truncate pr-2">
          {displayName}
        </Text>
        <Badge variant={freshnessVariants[plug.data_freshness]} size="sm" className="shrink-0">
          {freshnessLabels[plug.data_freshness]}
        </Badge>
      </div>

      {/* Power and metrics row */}
      <div className="space-y-1">
        <Text variant="warning" weight="bold" className="text-2xl">
          {plug.power_w != null && !isUnreachable
            ? `${plug.power_w.toFixed(1)} W`
            : '-- W'}
        </Text>
        <Text variant="secondary" size="xs">
          {plug.voltage_v?.toFixed(0) ?? '--'} V /{''}
          {plug.current_ma?.toFixed(0) ?? '--'} mA
        </Text>
      </div>

      {/* Toggle button */}
      <Button
        variant={plug.switch_on ? 'ember' : 'subtle'}
        size="sm"
        fullWidth
        onClick={() => onToggle(plug.device_id, plug.switch_on ?? false)}
        disabled={isUnreachable}
        aria-label={plug.switch_on ? 'Spegni' : 'Accendi'}
      >
        {plug.switch_on ? 'Acceso' : 'Spento'}
      </Button>

      {/* Timer section */}
      <div className="border-t border-white/8 pt-3">
        {hasActiveTimer ? (
          <div className="flex items-center justify-between">
            <Text as="span" size="sm" mono>
              {formatCountdown(remaining)}
            </Text>
            <Button variant="danger" size="sm" onClick={() => onCancelTimer(plug.device_id)}>
              Annulla
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Input
              type="number"
              min={1}
              max={MAX_TIMER_MINUTES}
              placeholder="min"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(e.target.value)}
              containerClassName="w-24"
              className="px-3 py-2.5 text-sm"
              aria-label="Minuti timer"
            />
            <Button
              variant="subtle"
              size="sm"
              onClick={handleSetTimer}
              disabled={!timerMinutes || parseInt(timerMinutes, 10) <= 0}
            >
              Imposta
            </Button>
          </div>
        )}
      </div>

      {/* Expand/collapse energy chart */}
      <Button
        variant="ghost"
        size="sm"
        fullWidth
        onClick={() => setExpanded((prev) => !prev)}
        icon={expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      >
        {expanded ? 'Nascondi storico' : 'Storico energia'}
      </Button>

      {expanded && <TuyaEnergyChart deviceId={plug.device_id} />}
    </Card>
  );
}
