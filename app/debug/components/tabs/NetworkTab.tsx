'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard, PostEndpointCard } from '@/app/debug/components/ApiTab';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';

const EXTERNAL_BASE = 'https://pdupun8zpr7exw43.myfritz.net';

interface NetworkTabProps {
  autoRefresh: boolean;
  refreshTrigger: number;
}

export default function NetworkTab({ autoRefresh, refreshTrigger }: NetworkTabProps) {
  const [getResponses, setGetResponses] = useState<Record<string, any>>({});
  const [postResponses, setPostResponses] = useState<Record<string, any>>({});
  const [loadingGet, setLoadingGet] = useState<Record<string, boolean>>({});
  const [loadingPost, setLoadingPost] = useState<Record<string, boolean>>({});
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
    } catch (error) {
      setPostResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
    } finally {
      setLoadingPost((prev) => ({ ...prev, [name]: false }));
    }
  };

  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('health', '/api/fritzbox/health');
    fetchGetEndpoint('devices', '/api/fritzbox/devices');
    fetchGetEndpoint('bandwidth', '/api/fritzbox/bandwidth');
    fetchGetEndpoint('wan', '/api/fritzbox/wan');
    fetchGetEndpoint('deviceHistory', '/api/fritzbox/history?range=24h');
    fetchGetEndpoint('vendorLookup', '/api/fritzbox/vendor-lookup?mac=AA:BB:CC:DD:EE:FF');
    fetchGetEndpoint('categoryOverride', '/api/fritzbox/category-override');
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
      {/* Info box */}
      <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
        <Text variant="secondary" size="sm">
          Network API endpoints proxy to the Fritz!Box Home Network API at{' '}
          <code className="text-xs">{EXTERNAL_BASE}</code>. All proxy routes require Auth0 authentication.
          Devices endpoint is rate limited to 10 req/min with 60s cache.
        </Text>
      </div>

      {/* Health Section */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          💚 Health
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Health Check"
            url="/api/fritzbox/health"
            externalUrl={`${EXTERNAL_BASE}/health`}
            response={getResponses.health}
            loading={loadingGet.health ?? false}
            timing={timings.health}
            onRefresh={() => fetchGetEndpoint('health', '/api/fritzbox/health')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/health`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/health`}
          />
        </div>
      </div>

      {/* Devices Section */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📱 Devices
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Devices (Proxy)"
            url="/api/fritzbox/devices"
            externalUrl={`${EXTERNAL_BASE}/api/v1/devices`}
            response={getResponses.devices}
            loading={loadingGet.devices ?? false}
            timing={timings.devices}
            onRefresh={() => fetchGetEndpoint('devices', '/api/fritzbox/devices')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/devices`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/devices`}
          />
          <EndpointCard
            name="Fritz!Box Devices"
            url="/api/fritzbox/devices"
            externalUrl={`${EXTERNAL_BASE}/api/v1/fritzbox/devices`}
            response={getResponses.devices}
            loading={loadingGet.devices ?? false}
            timing={timings.devices}
            onRefresh={() => fetchGetEndpoint('devices', '/api/fritzbox/devices')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/fritzbox/devices`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/fritzbox/devices`}
          />
        </div>
      </div>

      {/* Bandwidth Section */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📊 Bandwidth
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Bandwidth (Deprecated)"
            url="/api/fritzbox/bandwidth"
            externalUrl={`${EXTERNAL_BASE}/api/v1/bandwidth`}
            response={getResponses.bandwidth}
            loading={loadingGet.bandwidth ?? false}
            timing={timings.bandwidth}
            onRefresh={() => fetchGetEndpoint('bandwidth', '/api/fritzbox/bandwidth')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/bandwidth`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/bandwidth`}
          />
          <EndpointCard
            name="Fritz!Box Bandwidth"
            url="/api/fritzbox/bandwidth"
            externalUrl={`${EXTERNAL_BASE}/api/v1/fritzbox/bandwidth`}
            response={getResponses.bandwidth}
            loading={loadingGet.bandwidth ?? false}
            timing={timings.bandwidth}
            onRefresh={() => fetchGetEndpoint('bandwidth', '/api/fritzbox/bandwidth')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/fritzbox/bandwidth`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/fritzbox/bandwidth`}
          />
        </div>
      </div>

      {/* WAN Status Section */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          🌐 WAN Status
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="WAN Status (Deprecated)"
            url="/api/fritzbox/wan"
            externalUrl={`${EXTERNAL_BASE}/api/v1/wan`}
            response={getResponses.wan}
            loading={loadingGet.wan ?? false}
            timing={timings.wan}
            onRefresh={() => fetchGetEndpoint('wan', '/api/fritzbox/wan')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/wan`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/wan`}
          />
          <EndpointCard
            name="Fritz!Box WAN"
            url="/api/fritzbox/wan"
            externalUrl={`${EXTERNAL_BASE}/api/v1/fritzbox/wan`}
            response={getResponses.wan}
            loading={loadingGet.wan ?? false}
            timing={timings.wan}
            onRefresh={() => fetchGetEndpoint('wan', '/api/fritzbox/wan')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/fritzbox/wan`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/fritzbox/wan`}
          />
        </div>
      </div>

      {/* Bandwidth History Section */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📈 Bandwidth History
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Bandwidth History (1h)"
            url="/api/fritzbox/bandwidth-history?range=1h"
            externalUrl={`${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=1`}
            response={getResponses.bwHistory1h}
            loading={loadingGet.bwHistory1h ?? false}
            timing={timings.bwHistory1h}
            onRefresh={() => fetchGetEndpoint('bwHistory1h', '/api/fritzbox/bandwidth-history?range=1h')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=1`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=1`}
          />
          <EndpointCard
            name="Bandwidth History (24h)"
            url="/api/fritzbox/bandwidth-history?range=24h"
            externalUrl={`${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=24`}
            response={getResponses.bwHistory24h}
            loading={loadingGet.bwHistory24h ?? false}
            timing={timings.bwHistory24h}
            onRefresh={() => fetchGetEndpoint('bwHistory24h', '/api/fritzbox/bandwidth-history?range=24h')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=24`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=24`}
          />
          <EndpointCard
            name="Bandwidth History (7d)"
            url="/api/fritzbox/bandwidth-history?range=7d"
            externalUrl={`${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=168`}
            response={getResponses.bwHistory7d}
            loading={loadingGet.bwHistory7d ?? false}
            timing={timings.bwHistory7d}
            onRefresh={() => fetchGetEndpoint('bwHistory7d', '/api/fritzbox/bandwidth-history?range=7d')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=168`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=168`}
          />
        </div>
      </div>

      {/* Device History Section */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📜 Device History
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Device History (24h)"
            url="/api/fritzbox/history?range=24h"
            externalUrl={`${EXTERNAL_BASE}/api/v1/history/devices?hours=24&limit=100&offset=0`}
            response={getResponses.deviceHistory}
            loading={loadingGet.deviceHistory ?? false}
            timing={timings.deviceHistory}
            onRefresh={() => fetchGetEndpoint('deviceHistory', '/api/fritzbox/history?range=24h')}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/api/v1/history/devices?hours=24&limit=100&offset=0`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/api/v1/history/devices?hours=24&limit=100&offset=0`}
          />
        </div>
      </div>

      {/* Vendor & Categories Section */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          🏷️ Vendor &amp; Categories
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Vendor Lookup"
            url="/api/fritzbox/vendor-lookup?mac=AA:BB:CC:DD:EE:FF"
            response={getResponses.vendorLookup}
            loading={loadingGet.vendorLookup ?? false}
            timing={timings.vendorLookup}
            onRefresh={() => fetchGetEndpoint('vendorLookup', '/api/fritzbox/vendor-lookup?mac=AA:BB:CC:DD:EE:FF')}
            onCopyUrl={() => copyUrlToClipboard('/api/fritzbox/vendor-lookup?mac=AA:BB:CC:DD:EE:FF')}
            isCopied={copiedUrl === '/api/fritzbox/vendor-lookup?mac=AA:BB:CC:DD:EE:FF'}
          />
          <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
            <Text variant="secondary" size="sm">
              Change the <code className="text-xs">mac</code> parameter to look up different MAC addresses.
            </Text>
          </div>
          <EndpointCard
            name="Category Override"
            url="/api/fritzbox/category-override"
            response={getResponses.categoryOverride}
            loading={loadingGet.categoryOverride ?? false}
            timing={timings.categoryOverride}
            onRefresh={() => fetchGetEndpoint('categoryOverride', '/api/fritzbox/category-override')}
            onCopyUrl={() => copyUrlToClipboard('/api/fritzbox/category-override')}
            isCopied={copiedUrl === '/api/fritzbox/category-override'}
          />
        </div>
      </div>

      {/* Auth Section */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          🔐 Auth (External Only)
        </Heading>
        <div className="bg-amber-900/20 [html:not(.dark)_&]:bg-amber-50 border border-amber-700/50 [html:not(.dark)_&]:border-amber-300 rounded-lg p-4 mb-3">
          <Text variant="secondary" size="sm">
            Auth endpoints hit the external API directly. These may fail due to CORS restrictions — use them as URL references.
          </Text>
        </div>
        <div className="space-y-3">
          <PostEndpointCard
            name="Auth Login"
            url={`${EXTERNAL_BASE}/auth/login`}
            externalUrl={`${EXTERNAL_BASE}/auth/login`}
            params={[
              { name: 'username', label: 'Username', type: 'text', defaultValue: '' },
              { name: 'password', label: 'Password', type: 'password', defaultValue: '' },
            ]}
            response={postResponses.login}
            loading={loadingPost.login ?? false}
            timing={timings.login}
            onExecute={(values) => callPostEndpoint('login', `${EXTERNAL_BASE}/auth/login`, values)}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/auth/login`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/auth/login`}
          />
          <EndpointCard
            name="List API Keys"
            url={`${EXTERNAL_BASE}/auth/api-keys`}
            externalUrl={`${EXTERNAL_BASE}/auth/api-keys`}
            response={getResponses.apiKeys}
            loading={loadingGet.apiKeys ?? false}
            timing={timings.apiKeys}
            onRefresh={() => fetchGetEndpoint('apiKeys', `${EXTERNAL_BASE}/auth/api-keys`)}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/auth/api-keys`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/auth/api-keys`}
          />
          <PostEndpointCard
            name="Create API Key"
            url={`${EXTERNAL_BASE}/auth/api-keys`}
            externalUrl={`${EXTERNAL_BASE}/auth/api-keys`}
            params={[
              { name: 'name', label: 'Key Name', type: 'text', defaultValue: '' },
            ]}
            response={postResponses.createApiKey}
            loading={loadingPost.createApiKey ?? false}
            timing={timings.createApiKey}
            onExecute={(values) => callPostEndpoint('createApiKey', `${EXTERNAL_BASE}/auth/api-keys`, values)}
            onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/auth/api-keys`)}
            isCopied={copiedUrl === `${EXTERNAL_BASE}/auth/api-keys`}
          />
        </div>
      </div>
    </div>
  );
}
