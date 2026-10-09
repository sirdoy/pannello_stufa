import { BatteryLow, DoorClosed, DoorOpen, Eye, Radio, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Badge from '@/app/components/ui/Badge';
import Card from '@/app/components/ui/Card';
import Text from '@/app/components/ui/Text';
import type { DirigeraSensor, DirigeraDataFreshness } from '@/types/dirigeraProxy';
import { formatCo2, isAirSensor } from '@/lib/dirigera/airQuality';
import { formatLux, motionLabel } from '@/lib/dirigera/motion';

interface DirigeraSensorRowProps {
  sensor: DirigeraSensor;
  showFreshness: boolean;
}

const FRESHNESS_VARIANTS: Record<DirigeraDataFreshness, 'sage' | 'warning' | 'danger'> = {
  LIVE: 'sage',
  STALE: 'warning',
  UNREACHABLE: 'danger',
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
  let SensorIcon: LucideIcon;
  if (isContact) {
    SensorIcon = sensor.is_open ? DoorOpen : DoorClosed;
  } else if (isMotion) {
    SensorIcon = Eye;
  } else if (isAir) {
    SensorIcon = Wind;
  } else {
    SensorIcon = Radio;
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
        {lux !== null && <span className="text-(--text-1)"> · {lux}</span>}
      </>
    );
  } else if (isAir) {
    stateText = <span className="text-(--text-1)">{formatCo2(sensor.co2)}</span>;
  } else {
    stateText = <span className="text-(--text-2)">—</span>;
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
    <Card variant="subtle" padding={false} className="flex items-center justify-between gap-4 px-4 py-3">
      {/* Left: icon + name + room */}
      <div className="flex min-w-0 items-center gap-3">
        <SensorIcon size={18} className="shrink-0 text-(--text-2)" aria-hidden="true" />
        <div className="min-w-0">
          <Text size="sm" weight="medium" className="truncate">{sensor.custom_name ?? sensor.id}</Text>
          <Text variant="secondary" size="xs" className="truncate">
            {sensor.room ?? 'Nessuna stanza'}
          </Text>
        </div>
      </div>

      {/* Right: state + battery + freshness */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Type-specific state */}
        <Text as="span" size="sm">{stateText}</Text>

        {/* Battery */}
        <Text as="span" variant="secondary" size="xs" className="flex items-center gap-1">
          {showBatteryWarning && (
            <BatteryLow className="size-4 text-warning-400" aria-hidden="true" />
          )}
          {batteryText}
        </Text>

        {/* Freshness badge */}
        {freshness !== null && (
          <Badge variant={FRESHNESS_VARIANTS[freshness]} size="sm">
            {freshness}
          </Badge>
        )}
      </div>
    </Card>
  );
}
