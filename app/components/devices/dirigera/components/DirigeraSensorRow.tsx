import { BatteryLow } from 'lucide-react';
import type { DirigeraSensor, DirigeraDataFreshness } from '@/types/dirigeraProxy';

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
 * Shows sensor icon, name, room, type-specific state (open/closed or light level),
 * battery percentage with low-battery warning icon, and optional freshness badge.
 */
export default function DirigeraSensorRow({ sensor, showFreshness }: DirigeraSensorRowProps) {
  const isContact = sensor.type === 'openCloseSensor';
  const isMotion = sensor.type === 'occupancySensor';

  // Type-specific icon
  let sensorIcon: string;
  if (isContact) {
    sensorIcon = sensor.is_open ? '🚪' : '🔒';
  } else if (isMotion) {
    sensorIcon = '👁️';
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
    const lightLevel =
      'light_level' in sensor &&
      (sensor as { light_level: number | null }).light_level !== null
        ? `${(sensor as { light_level: number | null }).light_level} lux`
        : '—';
    stateText = <span className="text-slate-300">{lightLevel}</span>;
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
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl flex-shrink-0" aria-hidden="true">
          {sensorIcon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{sensor.custom_name}</p>
          <p className="text-xs text-slate-400 truncate">
            {sensor.room ?? 'Nessuna stanza'}
          </p>
        </div>
      </div>

      {/* Right: state + battery + freshness */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Type-specific state */}
        <span className="text-sm">{stateText}</span>

        {/* Battery */}
        <span className="flex items-center gap-1 text-xs text-slate-400">
          {showBatteryWarning && (
            <BatteryLow className="h-4 w-4 text-warning-400" aria-hidden="true" />
          )}
          {batteryText}
        </span>

        {/* Freshness badge */}
        {freshness !== null && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${FRESHNESS_COLORS[freshness]}`}
          >
            {freshness}
          </span>
        )}
      </div>
    </div>
  );
}
