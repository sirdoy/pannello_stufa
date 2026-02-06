'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherCard } from '@/app/components/weather';
import { subscribeToLocation } from '@/lib/services/locationService';

interface Location {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  };
  daily: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
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

  // Memoized weather fetch function
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
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
  }, []);

  // Subscribe to location changes on mount
  useEffect(() => {
    const unsubscribe = subscribeToLocation((loc) => {
      setLocation(loc);

      // If location has coordinates, fetch weather
      if (loc?.latitude && loc?.longitude) {
        fetchWeather(loc.latitude, loc.longitude);
      } else {
        // No location configured - show empty state
        setIsLoading(false);
        setWeatherData(null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
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
