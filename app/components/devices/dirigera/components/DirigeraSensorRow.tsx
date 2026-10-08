import { BatteryLow } from 'lucide-react';
import type { DirigeraSensor, DirigeraDataFreshness } from '@/types/dirigeraProxy';
import { formatCo2, isAirSensor } from '@/lib/dirigera/airQuality';
import { formatLux, motionLabel } from '@/lib/dirigera/motion';

interface DirigeraSensorRowProps {
  sensor: DirigeraSensor;
  showFreshness: boolean;
}

const FRESHNESS_COLORS: Record<DirigeraDataFreshness, string> = {
  LIVE: 'bg-success-500/20 text-success-400',
  STALE: 'bg-warning-500/20 text-warning-400',
  UNREACHABLE: 'bg-danger-500/20 text-danger-400',
};

/**
 * DirigeraSensorRow — Individual sensor row for the /dirigera sensor list.
 *
 * Shows sensor icon, name, room, type-specific state (open/closed, or motion plus
 * light level in lux for motion sensors),
 * battery percentage with low-battery warning icon, and optional freshness badge.
 */
export default function DirigeraSensorRow({ sensor, showFreshness }: DirigeraSensorRowProps) {
  const isContact = sensor.type === 'openCloseSensor';
  const isMotion = sensor.type === 'occupancySensor';
  const isAir = isAirSensor(sensor);

  // Type-specific icon
  let sensorIcon: string;
  if (isContact) {
    sensorIcon = sensor.is_open ? '🚪' : '🔒';
  } else if (isMotion) {
    sensorIcon = '👁️';
  } else if (isAir) {
    sensorIcon = '🌬️';
  } else {
    sensorIcon = '📡';
  }

  // Type-specific state text
  let stateText: React.ReactNode;
  if (isContact) {
    stateText = sensor.is_open ? (
      <span className="text-warning-400">Aperto</span>
    ) : (
      <span className="text-success-400">Chiuso</span>
    );
  } else if (isMotion) {
    const lux = formatLux(sensor.light_level);
    stateText = (
      <>
        <span className={sensor.is_detected ? 'text-warning-400' : 'text-success-400'}>
          {motionLabel(sensor)}
        </span>
        {lux !== null && <span className="text-slate-300"> · {lux}</span>}
      </>
    );
  } else if (isAir) {
    stateText = <span className="text-slate-300">{formatCo2(sensor.co2)}</span>;
  } else {
    stateText = <span className="text-slate-400">—</span>;
  }

  // Battery
  const batteryText =
    sensor.battery_percentage !== null ? `${sensor.battery_percentage}%` : '—';
  const showBatteryWarning =
    sensor.battery_percentage !== null && sensor.battery_percentage <= 20;

  // Data freshness badge
  const freshness =
    showFreshness && 'data_freshness' in sensor
      ? (sensor as { data_freshness: DirigeraDataFreshness }).data_freshness
      : null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-800/50 px-4 py-3">
      {/* Left: icon + name + room */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-xl" aria-hidden="true">
          {sensorIcon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{sensor.custom_name ?? sensor.id}</p>
          <p className="truncate text-xs text-slate-400">
            {sensor.room ?? 'Nessuna stanza'}
          </p>
        </div>
      </div>

      {/* Right: state + battery + freshness */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Type-specific state */}
        <span className="text-sm">{stateText}</span>

        {/* Battery */}
        <span className="flex items-center gap-1 text-xs text-slate-400">
          {showBatteryWarning && (
            <BatteryLow className="size-4 text-warning-400" aria-hidden="true" />
          )}
          {batteryText}
        </span>

        {/* Freshness badge */}
        {freshness !== null && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${FRESHNESS_COLORS[freshness]}`}
          >
            {freshness}
          </span>
        )}
      </div>
    </div>
  );
}
