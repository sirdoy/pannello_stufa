'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard } from '@/app/debug/components/ApiTab';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Badge from '@/app/components/ui/Badge';

export default function WeatherTab({ autoRefresh, refreshTrigger }) {
  const [getResponses, setGetResponses] = useState({});
  const [loadingGet, setLoadingGet] = useState({});
  const [timings, setTimings] = useState({});
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);

  const copyUrlToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const fetchGetEndpoint = useCallback(async (name, url) => {
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

  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('forecast', '/api/weather/forecast');
  }, [fetchGetEndpoint]);

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
            url="/api/weather/forecast"
            externalUrl="https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto"
            response={getResponses.forecast}
            loading={loadingGet.forecast}
            timing={timings.forecast}
            onRefresh={() => fetchGetEndpoint('forecast', '/api/weather/forecast')}
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
