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

const LEVEL_BADGE: Record<AirLevel, string> = {
  good: 'bg-success-500/20 text-success-400',
  fair: 'bg-warning-500/20 text-warning-400',
  poor: 'bg-danger-500/20 text-danger-400',
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
          <div key={s.id} className="rounded-2xl bg-slate-800/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {s.custom_name ?? s.id}
                </p>
                <p className="truncate text-xs text-slate-400">
                  Qualità dell&apos;aria · {s.room ?? 'Nessuna stanza'}
                </p>
              </div>
              {!s.is_reachable ? (
                <span className="rounded-full bg-danger-500/20 px-2 py-0.5 text-xs text-danger-400">
                  Offline
                </span>
              ) : (
                overall && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${LEVEL_BADGE[overall]}`}>
                    {AIR_LEVEL_LABELS[overall]}
                  </span>
                )
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Reading label="CO₂" value={formatCo2(s.co2)} className={co2 ? LEVEL_TEXT[co2] : ''} />
              <Reading label="PM2.5" value={formatPm25(s.pm25)} className={pm25 ? LEVEL_TEXT[pm25] : ''} />
              <Reading label="Temperatura" value={formatTemperature(s.temperature)} />
              <Reading label="Umidità" value={formatHumidity(s.humidity)} />
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function Reading({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={`text-lg font-semibold tabular-nums ${className}`}>{value}</dd>
    </div>
  );
}
