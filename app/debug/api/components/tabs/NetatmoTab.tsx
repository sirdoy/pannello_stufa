'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard, PostEndpointCard } from '../ApiTab';
import Heading from '@/app/components/ui/Heading';
import Badge from '@/app/components/ui/Badge';

interface NetatmoTabProps {
  autoRefresh: boolean;
  refreshTrigger: number;
}

export default function NetatmoTab({ autoRefresh, refreshTrigger }: NetatmoTabProps) {
  const [getResponses, setGetResponses] = useState<Record<string, any>>({});
  const [postResponses, setPostResponses] = useState<Record<string, any>>({});
  const [loadingGet, setLoadingGet] = useState<Record<string, boolean>>({});
  const [loadingPost, setLoadingPost] = useState<Record<string, boolean>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  const copyUrlToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Wrapped in useCallback so the reference stays stable across renders —
  // otherwise the effects below would fire on every render (infinite loop).
  // The callback only closes over setState setters, which are stable.
  const fetchGetEndpoint = useCallback(async (name: string, url: string) => {
    setLoadingGet((prev) => ({ ...prev, [name]: true }));
    const startTime = Date.now();
    try {
      const res = await fetch(url);
      const data = await res.json();
      const timing = Date.now() - startTime;
      setTimings((prev) => ({ ...prev, [name]: timing }));
      setGetResponses((prev) => ({ ...prev, [name]: data }));

      // Check connection status from health response
      if (name === 'health' && data.provider_status) {
        setConnectionStatus(data.provider_status === 'ok' ? 'connected' : 'disconnected');
      }
    } catch (error) {
      setGetResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  }, []);

  // Wrapped in useCallback so it is safe to list as an effect dependency
  // without causing an infinite re-render loop. fetchGetEndpoint is stable
  // (also wrapped in useCallback above).
  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('health', '/api/v1/netatmo/health');
    fetchGetEndpoint('homesdata', '/api/v1/netatmo/homesdata');
    fetchGetEndpoint('homestatus', '/api/v1/netatmo/homestatus');
    fetchGetEndpoint('valves', '/api/v1/netatmo/valves');
    fetchGetEndpoint('cameraStatus', '/api/v1/netatmo/camera/status');
  }, [fetchGetEndpoint]);

  const callPostEndpoint = async (name: string, url: string, body: any) => {
    setLoadingPost((prev) => ({ ...prev, [name]: true }));
    const startTime = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const timing = Date.now() - startTime;
      setTimings((prev) => ({ ...prev, [name]: timing }));
      setPostResponses((prev) => ({ ...prev, [name]: data }));

      // Refresh GET endpoints after successful POST
      if (res.ok) {
        setTimeout(fetchAllGetEndpoints, 1000);
      }
    } catch (error) {
      setPostResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
    } finally {
      setLoadingPost((prev) => ({ ...prev, [name]: false }));
    }
  };

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
      {/* Connection Status */}
      {connectionStatus && (
        <div className="flex items-center gap-3">
          <Heading level={3} size="md">
            Connection Status:
          </Heading>
          <Badge variant={connectionStatus === 'connected' ? 'sage' : 'danger'}>
            {connectionStatus === 'connected' ? '✓ Connected' : '✗ Disconnected'}
          </Badge>
        </div>
      )}

      {/* GET Endpoints */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📥 GET Endpoints
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Proxy Health"
            url="/api/v1/netatmo/health"
            response={getResponses.health}
            loading={loadingGet.health ?? false}
            timing={timings.health}
            onRefresh={() => fetchGetEndpoint('health', '/api/v1/netatmo/health')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/netatmo/health')}
            isCopied={copiedUrl === '/api/v1/netatmo/health'}
          />

          <EndpointCard
            name="Homes Data"
            url="/api/v1/netatmo/homesdata"
            response={getResponses.homesdata}
            loading={loadingGet.homesdata ?? false}
            timing={timings.homesdata}
            onRefresh={() => fetchGetEndpoint('homesdata', '/api/v1/netatmo/homesdata')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/netatmo/homesdata')}
            isCopied={copiedUrl === '/api/v1/netatmo/homesdata'}
          />

          <EndpointCard
            name="Home Status"
            url="/api/v1/netatmo/homestatus"
            response={getResponses.homestatus}
            loading={loadingGet.homestatus ?? false}
            timing={timings.homestatus}
            onRefresh={() => fetchGetEndpoint('homestatus', '/api/v1/netatmo/homestatus')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/netatmo/homestatus')}
            isCopied={copiedUrl === '/api/v1/netatmo/homestatus'}
          />

          <EndpointCard
            name="Valves"
            url="/api/v1/netatmo/valves"
            response={getResponses.valves}
            loading={loadingGet.valves ?? false}
            timing={timings.valves}
            onRefresh={() => fetchGetEndpoint('valves', '/api/v1/netatmo/valves')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/netatmo/valves')}
            isCopied={copiedUrl === '/api/v1/netatmo/valves'}
          />

          <EndpointCard
            name="Camera Status"
            url="/api/v1/netatmo/camera/status"
            response={getResponses.cameraStatus}
            loading={loadingGet.cameraStatus ?? false}
            timing={timings.cameraStatus}
            onRefresh={() => fetchGetEndpoint('cameraStatus', '/api/v1/netatmo/camera/status')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/netatmo/camera/status')}
            isCopied={copiedUrl === '/api/v1/netatmo/camera/status'}
          />
        </div>
      </div>

      {/* POST Endpoints */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📤 POST Endpoints
        </Heading>
        <div className="space-y-3">
          <PostEndpointCard
            name="Set Therm Mode"
            url="/api/v1/netatmo/setthermmode"
            params={[
              {
                name: 'mode',
                label: 'Mode',
                type: 'select',
                options: ['schedule', 'away', 'hg'],
                defaultValue: 'schedule',
              },
            ]}
            response={postResponses.setthermmode}
            loading={loadingPost.setthermmode ?? false}
            timing={timings.setthermmode}
            onExecute={(values) => callPostEndpoint('setthermmode', '/api/v1/netatmo/setthermmode', { mode: values.mode })}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/netatmo/setthermmode')}
            isCopied={copiedUrl === '/api/v1/netatmo/setthermmode'}
          />

          <PostEndpointCard
            name="Set Room Therm Point"
            url="/api/v1/netatmo/setroomthermpoint"
            params={[
              { name: 'temp', label: 'Temperature (°C)', type: 'number', min: 7, max: 30, defaultValue: '20' },
            ]}
            response={postResponses.setroomthermpoint}
            loading={loadingPost.setroomthermpoint ?? false}
            timing={timings.setroomthermpoint}
            onExecute={(values) => callPostEndpoint('setroomthermpoint', '/api/v1/netatmo/setroomthermpoint', { temp: values.temp })}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/netatmo/setroomthermpoint')}
            isCopied={copiedUrl === '/api/v1/netatmo/setroomthermpoint'}
          />

          <PostEndpointCard
            name="Calibrate Valves"
            url="/api/v1/netatmo/valves/calibrate"
            response={postResponses.calibrate}
            loading={loadingPost.calibrate ?? false}
            timing={timings.calibrate}
            onExecute={() => callPostEndpoint('calibrate', '/api/v1/netatmo/valves/calibrate', {})}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/netatmo/valves/calibrate')}
            isCopied={copiedUrl === '/api/v1/netatmo/valves/calibrate'}
          />
        </div>
      </div>
    </div>
  );
}
