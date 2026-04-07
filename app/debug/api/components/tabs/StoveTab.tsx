'use client';

import { useState, useEffect } from 'react';
import { EndpointCard, PostEndpointCard } from '../ApiTab';
import Heading from '@/app/components/ui/Heading';
import Badge from '@/app/components/ui/Badge';

interface StoveTabProps {
  autoRefresh: boolean;
  refreshTrigger: number;
}

export default function StoveTab({ autoRefresh, refreshTrigger }: StoveTabProps) {
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

  const fetchGetEndpoint = async (name: string, url: string) => {
    setLoadingGet((prev) => ({ ...prev, [name]: true }));
    const startTime = Date.now();
    try {
      const res = await fetch(url);
      const data = await res.json();
      const timing = Date.now() - startTime;
      setTimings((prev) => ({ ...prev, [name]: timing }));
      setGetResponses((prev) => ({ ...prev, [name]: data }));

      // Check connection status from health response
      if (name === 'health' && data.status) {
        setConnectionStatus(data.status === 'ok' ? 'connected' : 'disconnected');
      }
    } catch (error) {
      setGetResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  };

  const fetchAllGetEndpoints = () => {
    fetchGetEndpoint('health', '/api/v1/thermorossi/health');
    fetchGetEndpoint('status', '/api/v1/thermorossi/status');
    fetchGetEndpoint('power', '/api/v1/thermorossi/power');
    fetchGetEndpoint('fan', '/api/v1/thermorossi/fan-level');
    fetchGetEndpoint('history', '/api/v1/thermorossi/history');
  };

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
            url="/api/v1/thermorossi/health"
            response={getResponses.health}
            loading={loadingGet.health ?? false}
            timing={timings.health}
            onRefresh={() => fetchGetEndpoint('health', '/api/v1/thermorossi/health')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/health')}
            isCopied={copiedUrl === '/api/v1/thermorossi/health'}
          />

          <EndpointCard
            name="Status"
            url="/api/v1/thermorossi/status"
            response={getResponses.status}
            loading={loadingGet.status ?? false}
            timing={timings.status}
            onRefresh={() => fetchGetEndpoint('status', '/api/v1/thermorossi/status')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/status')}
            isCopied={copiedUrl === '/api/v1/thermorossi/status'}
          />

          <EndpointCard
            name="Power Level"
            url="/api/v1/thermorossi/power"
            response={getResponses.power}
            loading={loadingGet.power ?? false}
            timing={timings.power}
            onRefresh={() => fetchGetEndpoint('power', '/api/v1/thermorossi/power')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/power')}
            isCopied={copiedUrl === '/api/v1/thermorossi/power'}
          />

          <EndpointCard
            name="Fan Level"
            url="/api/v1/thermorossi/fan-level"
            response={getResponses.fan}
            loading={loadingGet.fan ?? false}
            timing={timings.fan}
            onRefresh={() => fetchGetEndpoint('fan', '/api/v1/thermorossi/fan-level')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/fan-level')}
            isCopied={copiedUrl === '/api/v1/thermorossi/fan-level'}
          />

          <EndpointCard
            name="History"
            url="/api/v1/thermorossi/history"
            response={getResponses.history}
            loading={loadingGet.history ?? false}
            timing={timings.history}
            onRefresh={() => fetchGetEndpoint('history', '/api/v1/thermorossi/history')}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/history')}
            isCopied={copiedUrl === '/api/v1/thermorossi/history'}
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
            name="Ignite Stove"
            url="/api/v1/thermorossi/commands/ignit"
            response={postResponses.ignite}
            loading={loadingPost.ignite ?? false}
            timing={timings.ignite}
            onExecute={() => callPostEndpoint('ignite', '/api/v1/thermorossi/commands/ignit', {})}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/commands/ignit')}
            isCopied={copiedUrl === '/api/v1/thermorossi/commands/ignit'}
          />

          <PostEndpointCard
            name="Shutdown Stove"
            url="/api/v1/thermorossi/commands/shutdown"
            response={postResponses.shutdown}
            loading={loadingPost.shutdown ?? false}
            timing={timings.shutdown}
            onExecute={() => callPostEndpoint('shutdown', '/api/v1/thermorossi/commands/shutdown', {})}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/commands/shutdown')}
            isCopied={copiedUrl === '/api/v1/thermorossi/commands/shutdown'}
          />

          <PostEndpointCard
            name="Set Power Level"
            url="/api/v1/thermorossi/settings/power"
            params={[
              { name: 'value', label: 'Power Level (1-5)', type: 'number', min: 1, max: 5, defaultValue: '3' },
            ]}
            response={postResponses.setPower}
            loading={loadingPost.setPower ?? false}
            timing={timings.setPower}
            onExecute={(values) => callPostEndpoint('setPower', '/api/v1/thermorossi/settings/power', { value: Number(values.value) })}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/settings/power')}
            isCopied={copiedUrl === '/api/v1/thermorossi/settings/power'}
          />

          <PostEndpointCard
            name="Set Fan Level"
            url="/api/v1/thermorossi/settings/fan-level"
            params={[
              { name: 'value', label: 'Fan Level (1-6)', type: 'number', min: 1, max: 6, defaultValue: '3' },
            ]}
            response={postResponses.setFan}
            loading={loadingPost.setFan ?? false}
            timing={timings.setFan}
            onExecute={(values) => callPostEndpoint('setFan', '/api/v1/thermorossi/settings/fan-level', { value: Number(values.value) })}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/settings/fan-level')}
            isCopied={copiedUrl === '/api/v1/thermorossi/settings/fan-level'}
          />

          <PostEndpointCard
            name="Set Water Temperature"
            url="/api/v1/thermorossi/settings/temperature/water"
            params={[
              { name: 'value', label: 'Temperature (40-80C)', type: 'number', min: 40, max: 80, defaultValue: '50' },
            ]}
            response={postResponses.setWaterTemp}
            loading={loadingPost.setWaterTemp ?? false}
            timing={timings.setWaterTemp}
            onExecute={(values) => callPostEndpoint('setWaterTemp', '/api/v1/thermorossi/settings/temperature/water', { value: Number(values.value) })}
            onCopyUrl={() => copyUrlToClipboard('/api/v1/thermorossi/settings/temperature/water')}
            isCopied={copiedUrl === '/api/v1/thermorossi/settings/temperature/water'}
          />
        </div>
      </div>
    </div>
  );
}
