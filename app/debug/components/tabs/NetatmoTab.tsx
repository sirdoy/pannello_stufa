'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard, PostEndpointCard } from '@/app/debug/components/ApiTab';
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

      // Check connection status from response
      if (name === 'debug' && data.connection) {
        setConnectionStatus(data.connection);
      }
    } catch (error) {
      setGetResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  }, []);

  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('homesdata', '/api/netatmo/homesdata');
    fetchGetEndpoint('homestatus', '/api/netatmo/homestatus');
    fetchGetEndpoint('devices', '/api/netatmo/devices');
    fetchGetEndpoint('devicesTemps', '/api/netatmo/devices-temperatures');
    fetchGetEndpoint('debug', '/api/netatmo/debug');
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
            name="Homes Data"
            url="/api/netatmo/homesdata"
            externalUrl="https://api.netatmo.com/api/homesdata"
            response={getResponses.homesdata}
            loading={loadingGet.homesdata ?? false}
            timing={timings.homesdata}
            onRefresh={() => fetchGetEndpoint('homesdata', '/api/netatmo/homesdata')}
            onCopyUrl={() => copyUrlToClipboard('https://api.netatmo.com/api/homesdata')}
            isCopied={copiedUrl === 'https://api.netatmo.com/api/homesdata'}
          />

          <EndpointCard
            name="Home Status"
            url="/api/netatmo/homestatus"
            externalUrl="https://api.netatmo.com/api/homestatus"
            response={getResponses.homestatus}
            loading={loadingGet.homestatus ?? false}
            timing={timings.homestatus}
            onRefresh={() => fetchGetEndpoint('homestatus', '/api/netatmo/homestatus')}
            onCopyUrl={() => copyUrlToClipboard('https://api.netatmo.com/api/homestatus')}
            isCopied={copiedUrl === 'https://api.netatmo.com/api/homestatus'}
          />

          <EndpointCard
            name="Devices"
            url="/api/netatmo/devices"
            response={getResponses.devices}
            loading={loadingGet.devices ?? false}
            timing={timings.devices}
            onRefresh={() => fetchGetEndpoint('devices', '/api/netatmo/devices')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/devices')}
            isCopied={copiedUrl === '/api/netatmo/devices'}
          />

          <EndpointCard
            name="Devices Temperatures"
            url="/api/netatmo/devices-temperatures"
            response={getResponses.devicesTemps}
            loading={loadingGet.devicesTemps ?? false}
            timing={timings.devicesTemps}
            onRefresh={() => fetchGetEndpoint('devicesTemps', '/api/netatmo/devices-temperatures')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/devices-temperatures')}
            isCopied={copiedUrl === '/api/netatmo/devices-temperatures'}
          />

          <EndpointCard
            name="Debug Info"
            url="/api/netatmo/debug"
            response={getResponses.debug}
            loading={loadingGet.debug ?? false}
            timing={timings.debug}
            onRefresh={() => fetchGetEndpoint('debug', '/api/netatmo/debug')}
            onCopyUrl={() => copyUrlToClipboard('/api/netatmo/debug')}
            isCopied={copiedUrl === '/api/netatmo/debug'}
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
            externalUrl="https://api.netatmo.com/api/setthermmode"
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
            onCopyUrl={() => copyUrlToClipboard('https://api.netatmo.com/api/setthermmode')}
            isCopied={copiedUrl === 'https://api.netatmo.com/api/setthermmode'}
          />

          <PostEndpointCard
            name="Set Room Therm Point"
            url="/api/netatmo/setroomthermpoint"
            externalUrl="https://api.netatmo.com/api/setroomthermpoint"
            params={[
              { name: 'temp', label: 'Temperature (°C)', type: 'number', min: 7, max: 30, defaultValue: '20' },
            ]}
            response={postResponses.setroomthermpoint}
            loading={loadingPost.setroomthermpoint ?? false}
            timing={timings.setroomthermpoint}
            onExecute={(values) => callPostEndpoint('setroomthermpoint', '/api/netatmo/setroomthermpoint', { temp: values.temp })}
            onCopyUrl={() => copyUrlToClipboard('https://api.netatmo.com/api/setroomthermpoint')}
            isCopied={copiedUrl === 'https://api.netatmo.com/api/setroomthermpoint'}
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
