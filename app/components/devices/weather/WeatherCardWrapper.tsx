'use client';

import { useState, useEffect } from 'react';
import { WeatherCard } from '@/app/components/weather';
import type { WeatherData } from '@/app/components/weather/WeatherCard';
import { subscribeToLocation } from '@/lib/services/locationService';

interface Location {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * WeatherCardWrapper - Client component that wraps WeatherCard with data fetching
 *
 * Responsibilities:
 * - Subscribes to app-wide location changes (Firebase RTDB)
 * - Fetches weather forecast from /api/weather/forecast when location changes
 * - Handles loading, error, and retry states
 * - Passes data to WeatherCard for rendering
 *
 * Data flow:
 * 1. subscribeToLocation() → real-time location updates
 * 2. When location has coordinates → fetch weather from API
 * 3. Pass weatherData to WeatherCard
 * 4. WeatherCard handles all UI rendering
 */
export default function WeatherCardWrapper() {
  const [location, setLocation] = useState<Location | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Weather fetch function
  const fetchWeather = async (lat: number, lon: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        throw new Error('Impossibile caricare i dati meteo');
      }
      const data = await res.json();
      setWeatherData(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to location changes on mount
  useEffect(() => {
    let weatherTimeout: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeToLocation((loc) => {
      setLocation(loc);

      // If location has coordinates, fetch weather
      if (loc?.latitude && loc?.longitude) {
        // Stagger initial weather fetch (250ms after mount) to avoid thundering herd
        if (weatherTimeout) clearTimeout(weatherTimeout);
        weatherTimeout = setTimeout(() => fetchWeather(loc.latitude!, loc.longitude!), 250);
      } else {
        // No location configured - show empty state
        setIsLoading(false);
        setWeatherData(null);
      }
    });

    // Cleanup subscription and pending timeout on unmount
    return () => {
      unsubscribe();
      if (weatherTimeout) clearTimeout(weatherTimeout);
    };
  }, [fetchWeather]);

  // Retry handler - refetch weather with current location
  const handleRetry = () => {
    if (location?.latitude && location?.longitude) {
      fetchWeather(location.latitude, location.longitude);
    }
  };

  // Refresh handler - manual refresh with loading state
  const handleRefresh = async () => {
    if (location?.latitude && location?.longitude) {
      setIsRefreshing(true);
      try {
        await fetchWeather(location.latitude, location.longitude);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <WeatherCard
      weatherData={weatherData}
      locationName={location?.name || null}
      isLoading={isLoading}
      error={error}
      onRetry={handleRetry}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
