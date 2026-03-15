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

  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('health', '/api/netatmo/health');
    fetchGetEndpoint('homesdata', '/api/netatmo/homesdata');
    fetchGetEndpoint('homestatus', '/api/netatmo/homestatus');
    fetchGetEndpoint('valves', '/api/netatmo/valves');
    fetchGetEndpoint('cameraStatus', '/api/netatmo/camera/status');
    fetchGetEndpoint('schedules', '/api/netatmo/schedules');
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
            url="/api/netatmo/health"
            response={getResponses.health}
            loading={loadingGet.health ?? false}
            timing={timings.health}
            onRefresh={() => fetchGetEndpoint('health', '/api/netatmo/health')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/health')}
            isCopied={copiedUrl === '/api/netatmo/health'}
          />

          <EndpointCard
            name="Homes Data"
            url="/api/netatmo/homesdata"
            response={getResponses.homesdata}
            loading={loadingGet.homesdata ?? false}
            timing={timings.homesdata}
            onRefresh={() => fetchGetEndpoint('homesdata', '/api/netatmo/homesdata')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/homesdata')}
            isCopied={copiedUrl === '/api/netatmo/homesdata'}
          />

          <EndpointCard
            name="Home Status"
            url="/api/netatmo/homestatus"
            response={getResponses.homestatus}
            loading={loadingGet.homestatus ?? false}
            timing={timings.homestatus}
            onRefresh={() => fetchGetEndpoint('homestatus', '/api/netatmo/homestatus')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/homestatus')}
            isCopied={copiedUrl === '/api/netatmo/homestatus'}
          />

          <EndpointCard
            name="Valves"
            url="/api/netatmo/valves"
            response={getResponses.valves}
            loading={loadingGet.valves ?? false}
            timing={timings.valves}
            onRefresh={() => fetchGetEndpoint('valves', '/api/netatmo/valves')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/valves')}
            isCopied={copiedUrl === '/api/netatmo/valves'}
          />

          <EndpointCard
            name="Camera Status"
            url="/api/netatmo/camera/status"
            response={getResponses.cameraStatus}
            loading={loadingGet.cameraStatus ?? false}
            timing={timings.cameraStatus}
            onRefresh={() => fetchGetEndpoint('cameraStatus', '/api/netatmo/camera/status')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/camera/status')}
            isCopied={copiedUrl === '/api/netatmo/camera/status'}
          />

          <EndpointCard
            name="Schedules"
            url="/api/netatmo/schedules"
            response={getResponses.schedules}
            loading={loadingGet.schedules ?? false}
            timing={timings.schedules}
            onRefresh={() => fetchGetEndpoint('schedules', '/api/netatmo/schedules')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/schedules')}
            isCopied={copiedUrl === '/api/netatmo/schedules'}
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
            url="/api/netatmo/setthermmode"
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
            onExecute={(values) => callPostEndpoint('setthermmode', '/api/netatmo/setthermmode', { mode: values.mode })}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/setthermmode')}
            isCopied={copiedUrl === '/api/netatmo/setthermmode'}
          />

          <PostEndpointCard
            name="Set Room Therm Point"
            url="/api/netatmo/setroomthermpoint"
            params={[
              { name: 'temp', label: 'Temperature (°C)', type: 'number', min: 7, max: 30, defaultValue: '20' },
            ]}
            response={postResponses.setroomthermpoint}
            loading={loadingPost.setroomthermpoint ?? false}
            timing={timings.setroomthermpoint}
            onExecute={(values) => callPostEndpoint('setroomthermpoint', '/api/netatmo/setroomthermpoint', { temp: values.temp })}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/setroomthermpoint')}
            isCopied={copiedUrl === '/api/netatmo/setroomthermpoint'}
          />

          <PostEndpointCard
            name="Calibrate Valves"
            url="/api/netatmo/calibrate"
            response={postResponses.calibrate}
            loading={loadingPost.calibrate ?? false}
            timing={timings.calibrate}
            onExecute={() => callPostEndpoint('calibrate', '/api/netatmo/calibrate', {})}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/calibrate')}
            isCopied={copiedUrl === '/api/netatmo/calibrate'}
          />
        </div>
      </div>
    </div>
  );
}
