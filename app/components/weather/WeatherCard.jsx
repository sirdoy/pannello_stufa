'use client';

/**
 * WeatherCard Component
 *
 * Main container for weather display using SmartHomeCard structure.
 * Handles loading, error, and data states with ocean color theme.
 *
 * @see CONTEXT.md - Apple Weather widget style with current + forecast
 */

import { SmartHomeCard, Badge, Button, Text } from '@/app/components/ui';
import { CloudSun, CloudOff, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import Skeleton from '@/app/components/ui/Skeleton';
import { CurrentConditions } from './CurrentConditions';

/**
 * WeatherCard - Weather display with loading/error/data states
 *
 * @param {Object} props
 * @param {Object|null} props.weatherData - Weather response from API with { current, forecast, cachedAt, stale }
 * @param {number|null} props.indoorTemp - Optional indoor temperature for comparison
 * @param {boolean} props.isLoading - Show skeleton state
 * @param {Error|null} props.error - Error object for error state
 * @param {function} props.onRetry - Callback when retry button clicked
 * @param {function} props.onForecastDayClick - Callback when forecast day is clicked
 * @param {React.ReactNode} props.children - Additional content (e.g., ForecastRow from Plan 03)
 *
 * @example
 * <WeatherCard
 *   weatherData={data}
 *   indoorTemp={20.5}
 *   isLoading={false}
 *   error={null}
 *   onRetry={() => refetch()}
 * >
 *   <ForecastRow forecast={data.forecast} />
 * </WeatherCard>
 */
export function WeatherCard({
  weatherData = null,
  indoorTemp = null,
  isLoading = false,
  error = null,
  onRetry = () => {},
  onForecastDayClick = () => {},
  children,
}) {
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
              leftIcon={<RefreshCw className="w-4 h-4" />}
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
  const { current, cachedAt, stale } = weatherData;

  return (
    <SmartHomeCard
      icon={<CloudSun className="w-6 h-6 sm:w-8 sm:h-8" />}
      title="Meteo"
      colorTheme="ocean"
    >
      <SmartHomeCard.Status>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="ocean" size="sm">
            Aggiornato {formatDistanceToNow(new Date(cachedAt), { addSuffix: true, locale: it })}
          </Badge>
          {stale && (
            <Badge variant="warning" size="sm">
              Aggiornamento in corso...
            </Badge>
          )}
        </div>
      </SmartHomeCard.Status>

      <SmartHomeCard.Controls>
        <CurrentConditions
          current={current}
          indoorTemp={indoorTemp}
        />
        {/* ForecastRow and other children from Plan 03 */}
        {children}
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
}

// Default export for convenience
export default WeatherCard;
