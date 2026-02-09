'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard } from '../ApiTab';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';

interface FirebaseTabProps {
  autoRefresh: boolean;
  refreshTrigger: number;
}

export default function FirebaseTab({ autoRefresh, refreshTrigger }: FirebaseTabProps) {
  const [getResponses, setGetResponses] = useState<Record<string, any>>({});
  const [loadingGet, setLoadingGet] = useState<Record<string, boolean>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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
    } catch (error) {
      setGetResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  }, []);

  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('health', '/api/health');
    fetchGetEndpoint('schedules', '/api/schedules');
    fetchGetEndpoint('schedulesActive', '/api/schedules/active');
    fetchGetEndpoint('locationConfig', '/api/config/location');
    fetchGetEndpoint('dashboardConfig', '/api/config/dashboard');
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
      {/* Firebase Info */}
      <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
        <Text variant="secondary" size="sm">
          Firebase Realtime Database stores all application state including schedules, device preferences, maintenance
          tracking, and cron health data. The /api/health endpoint verifies Firebase connectivity.
        </Text>
      </div>

      {/* GET Endpoints */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📥 GET Endpoints
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Health Check (Firebase Connection)"
            url="/api/health"
            response={getResponses.health}
            loading={loadingGet.health ?? false}
            timing={timings.health}
            onRefresh={() => fetchGetEndpoint('health', '/api/health')}
            onCopyUrl={() => copyUrlToClipboard('/api/health')}
            isCopied={copiedUrl === '/api/health'}
          />

          <EndpointCard
            name="Schedules List"
            url="/api/schedules"
            response={getResponses.schedules}
            loading={loadingGet.schedules ?? false}
            timing={timings.schedules}
            onRefresh={() => fetchGetEndpoint('schedules', '/api/schedules')}
            onCopyUrl={() => copyUrlToClipboard('/api/schedules')}
            isCopied={copiedUrl === '/api/schedules'}
          />

          <EndpointCard
            name="Active Schedule"
            url="/api/schedules/active"
            response={getResponses.schedulesActive}
            loading={loadingGet.schedulesActive ?? false}
            timing={timings.schedulesActive}
            onRefresh={() => fetchGetEndpoint('schedulesActive', '/api/schedules/active')}
            onCopyUrl={() => copyUrlToClipboard('/api/schedules/active')}
            isCopied={copiedUrl === '/api/schedules/active'}
          />

          <EndpointCard
            name="Location Config"
            url="/api/config/location"
            response={getResponses.locationConfig}
            loading={loadingGet.locationConfig ?? false}
            timing={timings.locationConfig}
            onRefresh={() => fetchGetEndpoint('locationConfig', '/api/config/location')}
            onCopyUrl={() => copyUrlToClipboard('/api/config/location')}
            isCopied={copiedUrl === '/api/config/location'}
          />

          <EndpointCard
            name="Dashboard Config"
            url="/api/config/dashboard"
            response={getResponses.dashboardConfig}
            loading={loadingGet.dashboardConfig ?? false}
            timing={timings.dashboardConfig}
            onRefresh={() => fetchGetEndpoint('dashboardConfig', '/api/config/dashboard')}
            onCopyUrl={() => copyUrlToClipboard('/api/config/dashboard')}
            isCopied={copiedUrl === '/api/config/dashboard'}
          />
        </div>
      </div>

      {/* Firebase Paths Reference */}
      <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
        <Heading level={3} size="sm" className="mb-3">
          📂 Key Firebase Paths
        </Heading>
        <div className="space-y-2">
          <Text variant="secondary" size="sm">
            <code className="text-xs">schedules-v2/</code> - Multi-schedule storage
            <br />
            <code className="text-xs">maintenance/</code> - H24 tracking data
            <br />
            <code className="text-xs">cronHealth/lastCall</code> - Scheduler last execution
            <br />
            <code className="text-xs">cron/lastWeatherRefresh</code> - Weather cache timestamp
            <br />
            <code className="text-xs">cron/lastTokenCleanup</code> - FCM token cleanup timestamp
            <br />
            <code className="text-xs">netatmo/lastAutoCalibration</code> - Valve calibration timestamp
            <br />
            <code className="text-xs">hue/tokens/</code> - Hue OAuth tokens
            <br />
            <code className="text-xs">config/location</code> - Latitude/longitude for weather
            <br />
            <code className="text-xs">config/dashboard</code> - Dashboard preferences
          </Text>
        </div>
      </div>
    </div>
  );
}
