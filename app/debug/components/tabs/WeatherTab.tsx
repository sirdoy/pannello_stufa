'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard } from '@/app/debug/components/ApiTab';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Badge from '@/app/components/ui/Badge';
import { subscribeToLocation, Location } from '@/lib/services/locationService';

interface WeatherTabProps {
  autoRefresh: boolean;
  refreshTrigger: number;
}

export default function WeatherTab({ autoRefresh, refreshTrigger }: WeatherTabProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [getResponses, setGetResponses] = useState<Record<string, any>>({});
  const [loadingGet, setLoadingGet] = useState<Record<string, boolean>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<any>(null);

  const copyUrlToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const fetchGetEndpoint = useCallback(async (name: string, url: string) => {
    setLoadingGet((prev) => ({ ...prev, [name]: true }));
    const startTime = Date.now();
    try {
      const res = await fetch(url);
      const data = await res.json();
      const timing = Date.now() - startTime;
      setTimings((prev) => ({ ...prev, [name]: timing }));
      setGetResponses((prev) => ({ ...prev, [name]: data }));

      // Check cache status
      if (name === 'forecast' && data.cached !== undefined) {
        setCacheStatus(data.cached ? 'cached' : 'fresh');
      }
    } catch (error) {
      setGetResponses((prev) => ({ ...prev, [name]: { error: error.message } }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  }, []);

  // Subscribe to location updates
  useEffect(() => {
    const unsubscribe = subscribeToLocation((loc) => setLocation(loc));
    return () => unsubscribe();
  }, []);

  const forecastUrl = location
    ? `/api/weather/forecast?lat=${location.latitude}&lon=${location.longitude}`
    : null;

  const fetchAllGetEndpoints = useCallback(() => {
    if (!forecastUrl) return;
    fetchGetEndpoint('forecast', forecastUrl);
  }, [fetchGetEndpoint, forecastUrl]);

  // Initial fetch
  useEffect(() => {
    fetchAllGetEndpoints();
  }, [fetchAllGetEndpoints]);

  // Handle refresh trigger
  useEffect(() => {
    if (refreshTrigger) {
      fetchAllGetEndpoints();
    }
  }, [refreshTrigger, fetchAllGetEndpoints]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllGetEndpoints, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchAllGetEndpoints]);

  return (
    <div className="space-y-6">
      {/* Location waiting state */}
      {!location && (
        <div className="bg-amber-900/20 [html:not(.dark)_&]:bg-amber-50 border border-amber-700/50 [html:not(.dark)_&]:border-amber-300 rounded-lg p-4">
          <Text variant="secondary" size="sm">
            Waiting for location data from Firebase config...
          </Text>
        </div>
      )}

      {/* Cache Status */}
      {cacheStatus && (
        <div className="flex items-center gap-3">
          <Heading level={3} size="md">
            Data Status:
          </Heading>
          <Badge variant={cacheStatus === 'cached' ? 'ocean' : 'sage'}>
            {cacheStatus === 'cached' ? '📦 Cached' : '✨ Fresh'}
          </Badge>
        </div>
      )}

      {/* Weather Info */}
      <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
        <Text variant="secondary" size="sm">
          Weather data is fetched from Open-Meteo API and cached for 30 minutes. The scheduler automatically refreshes
          weather data every 30 minutes via the cron endpoint.
        </Text>
      </div>

      {/* GET Endpoints */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📥 GET Endpoints
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Weather Forecast"
            url={forecastUrl || '/api/weather/forecast'}
            externalUrl="https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto"
            response={getResponses.forecast}
            loading={loadingGet.forecast}
            timing={timings.forecast}
            onRefresh={() => forecastUrl && fetchGetEndpoint('forecast', forecastUrl)}
            onCopyUrl={() =>
              copyUrlToClipboard(
                'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto'
              )
            }
            isCopied={
              copiedUrl ===
              'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto'
            }
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
        <Heading level={3} size="sm" className="mb-2">
          📍 Cache Configuration
        </Heading>
        <Text variant="secondary" size="sm">
          <strong>Firebase Path:</strong> <code className="text-xs">cron/lastWeatherRefresh</code>
          <br />
          <strong>Refresh Interval:</strong> 30 minutes
          <br />
          <strong>Auto-refresh via:</strong> /api/scheduler/check (cron job)
        </Text>
      </div>
    </div>
  );
}
