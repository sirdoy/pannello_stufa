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
  const [getResponses, setGetResponses] = useState<Record<string, unknown>>({});
  const [loadingGet, setLoadingGet] = useState<Record<string, boolean>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'cached' | 'fresh' | null>(null);

  const copyUrlToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Stable callbacks: the effects below depend on them (a new function per render
  // re-ran the fetch effect after every response, polling in a loop)
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
      setGetResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
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
  }, [forecastUrl, fetchGetEndpoint]);

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
        <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 p-4">
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
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <Text variant="secondary" size="sm">
          Weather data is fetched from Open-Meteo API by <code className="text-xs">/api/weather/forecast</code> and
          cached in memory for 15 minutes (stale-while-revalidate: stale data is served while a refresh runs). No cron
          refresh since ROADMAP V10.
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
            loading={loadingGet.forecast ?? false}
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
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <Heading level={3} size="sm" className="mb-2">
          📍 Cache Configuration
        </Heading>
        <Text variant="secondary" size="sm">
          <strong>Cache:</strong> in memory per server instance, key = coordinates (4 decimals)
          <br />
          <strong>TTL:</strong> 15 minutes, refreshed on read
        </Text>
      </div>
    </div>
  );
}
