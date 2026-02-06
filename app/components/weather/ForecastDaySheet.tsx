'use client';

/**
 * ForecastDaySheet Component
 *
 * Modal with detailed forecast for a selected day.
 * Shows temperature range, condition, and extended stats (UV, humidity, wind, etc.)
 *
 * @see Modal - Base modal component
 * @see ForecastDayCard - Cards that open this modal on tap
 */

import Modal from '@/app/components/ui/Modal';
import { Text } from '@/app/components/ui';
import { WeatherIcon } from './WeatherIcon';
import { formatTemperature, getUVIndexLabel, formatWindSpeed, getAirQualityLabel, getPressureLabel } from './weatherHelpers';
import { HourlyForecast } from './HourlyForecast';
import { Sunrise, Sunset, Droplets, Wind, Sun, Leaf, Gauge, type LucideIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  condition?: {
    description?: string;
  };
  uvIndex?: number | null;
  humidity?: number;
  windSpeed?: number;
  precipChance?: number;
  airQuality?: number | null;
  sunrise?: string;
  sunset?: string;
}

interface HourlyData {
  times: string[];
  temperatures: number[];
  weatherCodes: number[];
  precipProbabilities: number[];
}

/**
 * Format full day title (e.g., "Lunedi 3 Febbraio")
 * @param dateStr - ISO date string
 * @returns Formatted full date
 */
function formatFullDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const dayName = format(date, 'EEEE', { locale: it });
    const dayNum = format(date, 'd');
    const month = format(date, 'MMMM', { locale: it });
    // Capitalize first letter
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return `${capitalizedDay} ${dayNum} ${capitalizedMonth}`;
  } catch {
    return dateStr;
  }
}

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  subLabel?: string;
}

/**
 * Stat card component for extended stats grid
 */
function StatCard({ icon: Icon, iconColor, label, value, subLabel }: StatCardProps) {
  return (
    <div className="p-4 bg-slate-800/40 rounded-xl [html:not(.dark)_&]:bg-slate-100/80">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <Text variant="tertiary" size="xs">{label}</Text>
      </div>
      <Text size="lg">{value}</Text>
      {subLabel && (
        <Text variant="secondary" size="xs">{subLabel}</Text>
      )}
    </div>
  );
}

export interface ForecastDaySheetProps {
  /** Forecast day data (null when closed) */
  day: ForecastDay | null;
  /** Modal visibility */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Hourly forecast data (only for today) */
  hourly?: HourlyData | null;
  /** Whether this is today's forecast */
  isToday?: boolean;
  /** Current atmospheric pressure in hPa (only for today) */
  pressure?: number | null;
}

/**
 * ForecastDaySheet Component
 *
 * @example
 * <ForecastDaySheet
 *   day={selectedDay}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   hourly={hourlyData}
 *   isToday={true}
 *   pressure={1015}
 * />
 */
export function ForecastDaySheet({ day, isOpen, onClose, hourly = null, isToday = false, pressure = null }: ForecastDaySheetProps) {
  // Don't render anything if no day is selected
  if (!day) {
    return null;
  }

  const title = formatFullDate(day.date);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        <Modal.Close />
      </Modal.Header>
      {/* Temperature range - prominent display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4">
          <div>
            <Text variant="tertiary" size="xs" className="mb-1">Max</Text>
            <Text size="xl" weight="bold" className="text-ember-400 text-3xl">
              {formatTemperature(day.tempMax)}°
            </Text>
          </div>
          <div className="w-px h-12 bg-slate-700/50 [html:not(.dark)_&]:bg-slate-300/50" />
          <div>
            <Text variant="tertiary" size="xs" className="mb-1">Min</Text>
            <Text size="xl" weight="bold" className="text-ocean-400 text-3xl">
              {formatTemperature(day.tempMin)}°
            </Text>
          </div>
        </div>
      </div>

      {/* Condition description with icon */}
      <div className="text-center mb-6">
        <WeatherIcon
          code={day.weatherCode}
          size={48}
          className="mx-auto mb-2 text-ocean-400"
        />
        <Text size="lg">
          {day.condition?.description || 'Condizioni meteo'}
        </Text>
      </div>

      {/* Extended stats grid - 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* UV Index */}
        <StatCard
          icon={Sun}
          iconColor="text-warning-400"
          label="Indice UV"
          value={day.uvIndex ?? 'N/D'}
          subLabel={day.uvIndex ? getUVIndexLabel(day.uvIndex) : undefined}
        />

        {/* Humidity */}
        <StatCard
          icon={Droplets}
          iconColor="text-ocean-400"
          label="Umidita"
          value={day.humidity !== undefined ? `${day.humidity}%` : 'N/D'}
        />

        {/* Wind Speed */}
        <StatCard
          icon={Wind}
          iconColor="text-slate-400"
          label="Vento"
          value={day.windSpeed !== undefined ? formatWindSpeed(day.windSpeed) : 'N/D'}
        />

        {/* Precipitation */}
        <div className="p-4 bg-slate-800/40 rounded-xl [html:not(.dark)_&]:bg-slate-100/80">
          <div className="flex items-center gap-2 mb-1">
            <Droplets
              className="w-4 h-4 text-ocean-400"
              fill="currentColor"
              strokeWidth={0}
            />
            <Text variant="tertiary" size="xs">Precipitazioni</Text>
          </div>
          <Text size="lg">{day.precipChance ?? 0}%</Text>
        </div>

        {/* Air Quality - only show when data is available */}
        {day.airQuality != null && (
          <StatCard
            icon={Leaf}
            iconColor="text-green-400"
            label="Qualita aria"
            value={day.airQuality}
            subLabel={getAirQualityLabel(day.airQuality)}
          />
        )}

        {/* Pressure - only for today */}
        {isToday && pressure !== null && (
          <StatCard
            icon={Gauge}
            iconColor="text-slate-400"
            label="Pressione"
            value={`${Math.round(pressure)} hPa`}
            subLabel={getPressureLabel(pressure)}
          />
        )}
      </div>

      {/* Sunrise/Sunset - only show if data available */}
      {(day.sunrise || day.sunset) && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {day.sunrise && (
            <StatCard
              icon={Sunrise}
              iconColor="text-warning-400"
              label="Alba"
              value={day.sunrise}
            />
          )}
          {day.sunset && (
            <StatCard
              icon={Sunset}
              iconColor="text-ember-400"
              label="Tramonto"
              value={day.sunset}
            />
          )}
        </div>
      )}

      {/* Hourly forecast - only for today */}
      {isToday && hourly && (
        <div className="mt-6 pt-4 border-t border-slate-700/30 [html:not(.dark)_&]:border-slate-200/50">
          <Text variant="secondary" size="sm" weight="medium" className="mb-3">
            Previsioni orarie
          </Text>
          <HourlyForecast hourly={hourly} />
        </div>
      )}
    </Modal>
  );
}

export default ForecastDaySheet;
