import Badge from '@/app/components/ui/Badge';
import Card from '@/app/components/ui/Card';
import Text from '@/app/components/ui/Text';
import type { DirigeraSensor } from '@/types/dirigeraProxy';
import {
  AIR_LEVEL_LABELS,
  airLevel,
  co2Level,
  formatCo2,
  formatHumidity,
  formatPm25,
  formatTemperature,
  isAirSensor,
  pm25Level,
} from '@/lib/dirigera/airQuality';
import type { AirLevel } from '@/lib/dirigera/airQuality';

const LEVEL_TEXT: Record<AirLevel, string> = {
  good: 'text-success-400',
  fair: 'text-warning-400',
  poor: 'text-danger-400',
};

const LEVEL_BADGE: Record<AirLevel, 'sage' | 'warning' | 'danger'> = {
  good: 'sage',
  fair: 'warning',
  poor: 'danger',
};

interface DirigeraAirQualityPanelProps {
  sensors: DirigeraSensor[];
}

/**
 * DirigeraAirQualityPanel — readings of the IKEA ALPSTUGA air quality monitors
 * (DIRIGERA `environmentSensor`): temperature, humidity, CO2 and PM2.5, with
 * CO2 / PM2.5 colored by the IKEA bands. Renders nothing without such sensors.
 */
export default function DirigeraAirQualityPanel({ sensors }: DirigeraAirQualityPanelProps) {
  const airSensors = sensors.filter(isAirSensor);
  if (airSensors.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="dirigera-air-quality">
      {airSensors.map((s) => {
        const overall = airLevel(s);
        const co2 = co2Level(s.co2);
        const pm25 = pm25Level(s.pm25);
        return (
          <Card key={s.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Text size="sm" weight="medium" className="truncate">
                  {s.custom_name ?? s.id}
                </Text>
                <Text variant="secondary" size="xs" className="truncate">
                  Qualità dell&apos;aria · {s.room ?? 'Nessuna stanza'}
                </Text>
              </div>
              {!s.is_reachable ? (
                <Badge variant="danger" size="sm">
                  Offline
                </Badge>
              ) : (
                overall && (
                  <Badge variant={LEVEL_BADGE[overall]} size="sm">
                    {AIR_LEVEL_LABELS[overall]}
                  </Badge>
                )
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Reading label="CO₂" value={formatCo2(s.co2)} className={co2 ? LEVEL_TEXT[co2] : ''} />
              <Reading label="PM2.5" value={formatPm25(s.pm25)} className={pm25 ? LEVEL_TEXT[pm25] : ''} />
              <Reading label="Temperatura" value={formatTemperature(s.temperature)} />
              <Reading label="Umidità" value={formatHumidity(s.humidity)} />
            </dl>
          </Card>
        );
      })}
    </div>
  );
}

function Reading({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <Text as="dt" variant="secondary" size="xs">{label}</Text>
      <dd className={`text-lg font-semibold tabular-nums ${className}`}>{value}</dd>
    </div>
  );
}
