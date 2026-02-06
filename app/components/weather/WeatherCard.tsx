'use client';

/**
 * WeatherCard Component
 *
 * Main container for weather display using SmartHomeCard structure.
 * Handles loading, error, and data states with ocean color theme.
 *
 * @see CONTEXT.md - Apple Weather widget style with current + forecast
 */

import { useState } from 'react';
import { SmartHomeCard, Badge, Button, Text } from '@/app/components/ui';
import { CloudSun, CloudOff, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';
import Skeleton from '@/app/components/ui/Skeleton';
import { CurrentConditions } from './CurrentConditions';
import { ForecastRow } from './ForecastRow';
import { ForecastDaySheet } from './ForecastDaySheet';

interface WeatherCondition {
  description?: string;
  code?: number;
}

interface CurrentWeather {
  temperature: number;
  feelsLike?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  condition?: WeatherCondition;
  uvIndex?: number | null;
  airQuality?: number | null;
  pressure?: number | null;
  visibility?: number | null;
}

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipChance?: number;
  condition?: {
    description?: string;
  };
  uvIndex?: number | null;
  humidity?: number;
  windSpeed?: number;
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

interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
  hourly?: HourlyData;
  cachedAt?: string;
  stale?: boolean;
}

export interface WeatherCardProps {
  /** Weather response from API with { current, forecast, hourly, cachedAt, stale } */
  weatherData?: WeatherData | null;
  /** Optional location name to display in header (e.g., "Milano") */
  locationName?: string | null;
  /** Optional indoor temperature for comparison */
  indoorTemp?: number | null;
  /** Show skeleton state */
  isLoading?: boolean;
  /** Error object for error state */
  error?: Error | null;
  /** Callback when retry button clicked */
  onRetry?: () => void;
  /** Callback when refresh button clicked */
  onRefresh?: () => void;
  /** Show refresh loading state */
  isRefreshing?: boolean;
}

/**
 * WeatherCard - Weather display with loading/error/data states
 *
 * @example
 * <WeatherCard
 *   weatherData={data}
 *   locationName="Milano"
 *   indoorTemp={20.5}
 *   isLoading={false}
 *   error={null}
 *   onRetry={() => refetch()}
 *   onRefresh={() => handleRefresh()}
 *   isRefreshing={false}
 * />
 */
export function WeatherCard({
  weatherData = null,
  locationName = null,
  indoorTemp = null,
  isLoading = false,
  error = null,
  onRetry = () => {},
  onRefresh = () => {},
  isRefreshing = false,
}: WeatherCardProps) {
  // State for selected forecast day (opens detail sheet)
  const [selectedDay, setSelectedDay] = useState<ForecastDay | null>(null);

  // Loading state - render skeleton
  if (isLoading) {
    return <Skeleton.WeatherCard />;
  }

  // Error state - render error card with retry button
  if (error) {
    return (
      <SmartHomeCard
        icon="☁️"
        title="Meteo"
        colorTheme="ocean"
      >
        <SmartHomeCard.Controls>
          <div className="text-center py-8">
            <Text variant="secondary" className="mb-4">
              {error.message || 'Impossibile caricare il meteo'}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4" />
              Riprova
            </Button>
          </div>
        </SmartHomeCard.Controls>
      </SmartHomeCard>
    );
  }

  // No data state - render empty card
  if (!weatherData) {
    return (
      <SmartHomeCard
        icon="🌤️"
        title="Meteo"
        colorTheme="ocean"
      >
        <SmartHomeCard.Controls>
          <div className="text-center py-8">
            <Text variant="secondary">
              Nessun dato meteo disponibile
            </Text>
          </div>
        </SmartHomeCard.Controls>
      </SmartHomeCard>
    );
  }

  // Data state - render full weather card
  const { current, forecast, hourly, cachedAt, stale } = weatherData;

  // First forecast day is today - used for min/max/UV in current conditions
  const todayForecast = forecast && forecast.length > 0 ? forecast[0] : null;

  return (
    <SmartHomeCard
      icon="🌤️"
      title={locationName ? `Meteo - ${locationName}` : 'Meteo'}
      colorTheme="ocean"
      headerActions={
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Aggiorna meteo"
          className={cn(
            "p-2 rounded-lg hover:bg-slate-800/60 transition-colors",
            isRefreshing && "animate-spin"
          )}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {stale && (
        <SmartHomeCard.Status>
          <Badge variant="warning" size="sm">
            Aggiornamento in corso...
          </Badge>
        </SmartHomeCard.Status>
      )}

      <SmartHomeCard.Controls>
        {/* Current conditions */}
        <CurrentConditions
          current={current}
          todayForecast={todayForecast}
          hourlyTemperatures={hourly?.temperatures}
          indoorTemp={indoorTemp}
        />

        {/* Forecast row */}
        {weatherData.forecast && weatherData.forecast.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-700/30 [html:not(.dark)_&]:border-slate-200/50">
            <ForecastRow
              forecast={weatherData.forecast}
              onDayClick={setSelectedDay}
            />
          </div>
        )}

        {/* Forecast day detail sheet */}
        <ForecastDaySheet
          day={selectedDay}
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          hourly={hourly}
          isToday={selectedDay?.date === todayForecast?.date}
          pressure={current?.pressure}
        />
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
}

// Default export for convenience
export default WeatherCard;
