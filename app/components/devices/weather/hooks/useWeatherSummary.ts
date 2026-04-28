'use client';

/**
 * useWeatherSummary — Phase 177 (DASH-06 enabling hook).
 *
 * Read-only summary slice of the weather data already consumed by
 * `app/components/devices/weather/WeatherCardWrapper.tsx`. Subscribes to
 * the app-wide location (Firebase RTDB) and fetches /api/weather/forecast
 * when coords arrive. Returns null fields + loading=false on failure.
 *
 * Phase 178's WeatherCard (and any future WeatherSheet) consumes this hook
 * directly so the card body can stay pure-presentational and trivially
 * testable.
 *
 * Data shape mapped from the existing /api/weather/forecast response (see
 * WeatherCardWrapper.tsx + WeatherCard.tsx WeatherData interface):
 *   - city       ← location.name (from subscribeToLocation, NOT from API)
 *   - temp       ← weatherData.current.temperature
 *   - condition  ← weatherData.current.condition?.description
 *   - high       ← weatherData.forecast[0].tempMax (today's high)
 *   - low        ← weatherData.forecast[0].tempMin (today's low)
 *
 * No memoization hooks (D-28; React Compiler 1.0 auto-memoizes).
 */

import { useEffect, useState } from 'react';
import { subscribeToLocation } from '@/lib/services/locationService';

export interface WeatherSummary {
  city: string | null;
  temp: number | null;
  condition: string | null;
  high: number | null;
  low: number | null;
  loading: boolean;
}

const INITIAL: WeatherSummary = {
  city: null,
  temp: null,
  condition: null,
  high: null,
  low: null,
  loading: true,
};

interface ForecastDayShape {
  tempMax?: number | null;
  tempMin?: number | null;
}

interface ForecastResponseShape {
  current?: {
    temperature?: number | null;
    condition?: { description?: string | null } | null;
  } | null;
  forecast?: ForecastDayShape[] | null;
}

export function useWeatherSummary(): WeatherSummary {
  const [summary, setSummary] = useState<WeatherSummary>(INITIAL);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeToLocation((location) => {
      // Location not configured yet — flip loading off, fields stay null.
      if (!location || location.latitude == null || location.longitude == null) {
        if (!cancelled) {
          setSummary((prev) => ({ ...prev, loading: false }));
        }
        return;
      }

      const { latitude, longitude, name } = location;

      // Fire-and-forget; abort via the cancelled flag set in cleanup.
      void (async () => {
        try {
          const res = await fetch(
            `/api/weather/forecast?lat=${latitude}&lon=${longitude}`,
          );
          if (!res.ok) {
            throw new Error(`Forecast fetch failed: ${res.status}`);
          }
          const json = (await res.json()) as ForecastResponseShape;
          if (cancelled) return;

          const today = json.forecast?.[0] ?? null;
          setSummary({
            city: name ?? null,
            temp: json.current?.temperature ?? null,
            condition: json.current?.condition?.description ?? null,
            high: today?.tempMax ?? null,
            low: today?.tempMin ?? null,
            loading: false,
          });
        } catch {
          if (cancelled) return;
          // Preserve last-known-good fields where possible (currently null).
          setSummary((prev) => ({ ...prev, loading: false }));
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return summary;
}
