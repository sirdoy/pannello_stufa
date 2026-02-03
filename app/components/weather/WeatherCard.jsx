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

/**
 * WeatherCard - Weather display with loading/error/data states
 *
 * @param {Object} props
 * @param {Object|null} props.weatherData - Weather response from API with { current, forecast, hourly, cachedAt, stale }
 * @param {string|null} props.locationName - Optional location name to display in header (e.g., "Milano")
 * @param {number|null} props.indoorTemp - Optional indoor temperature for comparison
 * @param {boolean} props.isLoading - Show skeleton state
 * @param {Error|null} props.error - Error object for error state
 * @param {function} props.onRetry - Callback when retry button clicked
 * @param {function} props.onRefresh - Callback when refresh button clicked
 * @param {boolean} props.isRefreshing - Show refresh loading state
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
}) {
  // State for selected forecast day (opens detail sheet)
  const [selectedDay, setSelectedDay] = useState(null);

  // Loading state - render skeleton
  if (isLoading) {
    return <Skeleton.WeatherCard />;
  }

  // Error state - render error card with retry button
  if (error) {
    return (
      <SmartHomeCard
        icon={<CloudOff className="w-6 h-6 sm:w-8 sm:h-8" />}
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
              icon={<RefreshCw className="w-4 h-4" />}
            >
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
        icon={<CloudSun className="w-6 h-6 sm:w-8 sm:h-8" />}
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
      icon={<CloudSun className="w-6 h-6 sm:w-8 sm:h-8" />}
      title={locationName ? `Meteo - ${locationName}` : 'Meteo'}
      colorTheme="ocean"
      headerActions={
        <Button.Icon
          icon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Aggiorna meteo"
        />
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
        />
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
}

// Default export for convenience
export default WeatherCard;
