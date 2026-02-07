'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import { Copy, Check } from 'lucide-react';
import { API_KEY } from '@/lib/stoveApi';

interface StoveApiResponse {
  [key: string]: any;
}

type LoadingState = Record<string, boolean>;

export default function StoveDebugPage() {
  // GET responses state
  const [getResponses, setGetResponses] = useState<Record<string, StoveApiResponse | null>>({
    status: null,
    power: null,
    fan: null,
    roomTemp: null,
    settings: null,
    actualWaterTemp: null,
    waterSetTemp: null,
  });

  // POST responses state
  const [postResponses, setPostResponses] = useState<Record<string, StoveApiResponse>>({});

  // Input state for POST operations
  const [powerInput, setPowerInput] = useState<number>(3);
  const [fanInput, setFanInput] = useState<number>(3);
  const [waterTempInput, setWaterTempInput] = useState<number>(50);

  // Loading states
  const [loadingGet, setLoadingGet] = useState<LoadingState>({});
  const [loadingPost, setLoadingPost] = useState<LoadingState>({});

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Copied URL tracking
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Thermorossi API URLs mapping
  const BASE_URL = 'https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json';

  const thermorossiUrls = {
    '/api/stove/status': `${BASE_URL}/GetStatus/${API_KEY}`,
    '/api/stove/getPower': `${BASE_URL}/GetPower/${API_KEY}`,
    '/api/stove/getFan': `${BASE_URL}/GetFanLevel/${API_KEY}`,
    '/api/stove/getRoomTemperature': `${BASE_URL}/GetRoomControlTemperature/${API_KEY}`,
    '/api/stove/settings': `${BASE_URL}/GetSettings/${API_KEY}`,
    '/api/stove/getActualWaterTemperature': `${BASE_URL}/GetActualWaterTemperature/${API_KEY}`,
    '/api/stove/getWaterSetTemperature': `${BASE_URL}/GetWaterSetTemperature/${API_KEY}`,
    '/api/stove/ignite': `${BASE_URL}/Ignit/${API_KEY}`,
    '/api/stove/shutdown': `${BASE_URL}/Shutdown/${API_KEY}`,
    '/api/stove/setPower': `${BASE_URL}/SetPower/${API_KEY};[level]`,
    '/api/stove/setFan': `${BASE_URL}/SetFanLevel/${API_KEY};[level]`,
    '/api/stove/setWaterTemperature': `${BASE_URL}/SetWaterTemperature/${API_KEY};[temp]`,
  };

  /**
   * Get external Thermorossi URL for an endpoint
   */
  const getExternalUrl = (endpoint: string): string => {
    return (thermorossiUrls as Record<string, string>)[endpoint] || endpoint;
  };

  /**
   * Copy external URL to clipboard
   */
  const copyUrlToClipboard = async (endpoint: string): Promise<void> => {
    const externalUrl = getExternalUrl(endpoint);
    try {
      await navigator.clipboard.writeText(externalUrl);
      setCopiedUrl(endpoint);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  /**
   * Remove internal fields from API response (show only real API data)
   */
  const cleanApiResponse = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    const { isSandbox, ...cleanData } = data;
    return cleanData;
  };

  /**
   * Fetch a single GET endpoint
   */
  const fetchGetEndpoint = async (name: string, url: string): Promise<void> => {
    setLoadingGet((prev) => ({ ...prev, [name]: true }));
    try {
      const res = await fetch(url);
      const data = await res.json();
      // Remove internal fields before displaying
      setGetResponses((prev) => ({ ...prev, [name]: cleanApiResponse(data) }));
    } catch (error) {
      setGetResponses((prev) => ({
        ...prev,
        [name]: { error: error.message },
      }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  };

  /**
   * Fetch all GET endpoints
   */
  const fetchAllGetEndpoints = async (): Promise<void> => {
    await Promise.all([
      fetchGetEndpoint('status', '/api/stove/status'),
      fetchGetEndpoint('power', '/api/stove/getPower'),
      fetchGetEndpoint('fan', '/api/stove/getFan'),
      fetchGetEndpoint('roomTemp', '/api/stove/getRoomTemperature'),
      fetchGetEndpoint('settings', '/api/stove/settings'),
      fetchGetEndpoint('actualWaterTemp', '/api/stove/getActualWaterTemperature'),
      fetchGetEndpoint('waterSetTemp', '/api/stove/getWaterSetTemperature'),
    ]);
  };

  /**
   * Call a POST endpoint
   */
  const callPostEndpoint = async (name: string, url: string, body: any = null): Promise<void> => {
    setLoadingPost((prev) => ({ ...prev, [name]: true }));
    try {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const data = await res.json();
      // Remove internal fields before displaying
      setPostResponses((prev) => ({ ...prev, [name]: cleanApiResponse(data) }));

      // Refresh GET endpoints after successful POST
      if (res.ok) {
        setTimeout(fetchAllGetEndpoints, 1000);
      }
    } catch (error) {
      setPostResponses((prev) => ({
        ...prev,
        [name]: { error: error.message },
      }));
    } finally {
      setLoadingPost((prev) => ({ ...prev, [name]: false }));
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllGetEndpoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllGetEndpoints, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Heading level={1}>
              🔥 Stove Debug Console
            </Heading>
            <Text variant="secondary" className="mt-1">
              Raw API responses from Thermorossi endpoints (no internal fields)
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <Text size="sm" variant="secondary">Auto-refresh (5s)</Text>
            </label>
            <Button onClick={fetchAllGetEndpoints}>
              🔄 Refresh All
            </Button>
          </div>
        </div>

        {/* GET Endpoints Section */}
        <Card>
          <div className="p-6">
            <Heading level={2} className="mb-4">
              📥 GET Endpoints
            </Heading>
            <div className="space-y-4">
              {/* Status */}
              <EndpointDisplay
                title="Status"
                endpoint="/api/stove/status"
                externalUrl={getExternalUrl('/api/stove/status')}
                response={getResponses.status}
                loading={loadingGet.status}
                onRefresh={() => fetchGetEndpoint('status', '/api/stove/status')}
                onCopyUrl={() => copyUrlToClipboard('/api/stove/status')}
                isCopied={copiedUrl === '/api/stove/status'}
              />

              {/* Power */}
              <EndpointDisplay
                title="Power Level"
                endpoint="/api/stove/getPower"
                externalUrl={getExternalUrl('/api/stove/getPower')}
                response={getResponses.power}
                loading={loadingGet.power}
                onRefresh={() => fetchGetEndpoint('power', '/api/stove/getPower')}
                onCopyUrl={() => copyUrlToClipboard('/api/stove/getPower')}
                isCopied={copiedUrl === '/api/stove/getPower'}
              />

              {/* Fan */}
              <EndpointDisplay
                title="Fan Level"
                endpoint="/api/stove/getFan"
                externalUrl={getExternalUrl('/api/stove/getFan')}
                response={getResponses.fan}
                loading={loadingGet.fan}
                onRefresh={() => fetchGetEndpoint('fan', '/api/stove/getFan')}
                onCopyUrl={() => copyUrlToClipboard('/api/stove/getFan')}
                isCopied={copiedUrl === '/api/stove/getFan'}
              />

              {/* Room Temperature */}
              <EndpointDisplay
                title="Room Temperature Setpoint"
                endpoint="/api/stove/getRoomTemperature"
                externalUrl={getExternalUrl('/api/stove/getRoomTemperature')}
                response={getResponses.roomTemp}
                loading={loadingGet.roomTemp}
                onRefresh={() => fetchGetEndpoint('roomTemp', '/api/stove/getRoomTemperature')}
                onCopyUrl={() => copyUrlToClipboard('/api/stove/getRoomTemperature')}
                isCopied={copiedUrl === '/api/stove/getRoomTemperature'}
              />

              {/* Settings */}
              <EndpointDisplay
                title="Settings (Fan/Power Defaults)"
                endpoint="/api/stove/settings"
                externalUrl={getExternalUrl('/api/stove/settings')}
                response={getResponses.settings}
                loading={loadingGet.settings}
                onRefresh={() => fetchGetEndpoint('settings', '/api/stove/settings')}
                onCopyUrl={() => copyUrlToClipboard('/api/stove/settings')}
                isCopied={copiedUrl === '/api/stove/settings'}
              />

              {/* Actual Water Temperature */}
              <EndpointDisplay
                title="Actual Water Temperature (Boiler)"
                endpoint="/api/stove/getActualWaterTemperature"
                externalUrl={getExternalUrl('/api/stove/getActualWaterTemperature')}
                response={getResponses.actualWaterTemp}
                loading={loadingGet.actualWaterTemp}
                onRefresh={() => fetchGetEndpoint('actualWaterTemp', '/api/stove/getActualWaterTemperature')}
                onCopyUrl={() => copyUrlToClipboard('/api/stove/getActualWaterTemperature')}
                isCopied={copiedUrl === '/api/stove/getActualWaterTemperature'}
              />

              {/* Water Set Temperature */}
              <EndpointDisplay
                title="Water Temperature Setpoint (Boiler)"
                endpoint="/api/stove/getWaterSetTemperature"
                externalUrl={getExternalUrl('/api/stove/getWaterSetTemperature')}
                response={getResponses.waterSetTemp}
                loading={loadingGet.waterSetTemp}
                onRefresh={() => fetchGetEndpoint('waterSetTemp', '/api/stove/getWaterSetTemperature')}
                onCopyUrl={() => copyUrlToClipboard('/api/stove/getWaterSetTemperature')}
                isCopied={copiedUrl === '/api/stove/getWaterSetTemperature'}
              />
            </div>
          </div>
        </Card>

        {/* POST Endpoints Section */}
        <Card>
          <div className="p-6">
            <Heading level={2} className="mb-4">
              📤 POST/Control Endpoints
            </Heading>
            <div className="space-y-6">
              {/* Ignite */}
              <div className="border-b border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Heading level={3} size="md" weight="semibold">
                      Ignite Stove
                    </Heading>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/ignite')}
                      </code>
                      <CopyUrlButton
                        onClick={() => copyUrlToClipboard('/api/stove/ignite')}
                        isCopied={copiedUrl === '/api/stove/ignite'}
                        label="Copia URL Ignite"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      callPostEndpoint('ignite', '/api/stove/ignite', {
                        source: 'manual',
                        power: powerInput,
                      })
                    }
                    loading={loadingPost.ignite}
                  >
                    🔥 Ignite
                  </Button>
                </div>
                {postResponses.ignite && (
                  <JsonDisplay data={postResponses.ignite} />
                )}
              </div>

              {/* Shutdown */}
              <div className="border-b border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Heading level={3} size="md" weight="semibold">
                      Shutdown Stove
                    </Heading>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/shutdown')}
                      </code>
                      <CopyUrlButton
                        onClick={() => copyUrlToClipboard('/api/stove/shutdown')}
                        isCopied={copiedUrl === '/api/stove/shutdown'}
                        label="Copia URL Shutdown"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      callPostEndpoint('shutdown', '/api/stove/shutdown', {
                        source: 'manual',
                      })
                    }
                    loading={loadingPost.shutdown}
                  >
                    ⏹️ Shutdown
                  </Button>
                </div>
                {postResponses.shutdown && (
                  <JsonDisplay data={postResponses.shutdown} />
                )}
              </div>

              {/* Set Power */}
              <div className="border-b border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Heading level={3} size="md" weight="semibold">
                      Set Power Level
                    </Heading>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/setPower')}
                      </code>
                      <CopyUrlButton
                        onClick={() => copyUrlToClipboard('/api/stove/setPower')}
                        isCopied={copiedUrl === '/api/stove/setPower'}
                        label="Copia URL Set Power"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Text as="label" size="sm" variant="secondary">
                        Level (1-5):
                      </Text>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={powerInput}
                        onChange={(e) => setPowerInput(parseInt(e.target.value))}
                        className="w-20 px-3 py-1 border border-slate-300 [html:not(.dark)_&]:border-slate-300 border-slate-600 rounded-lg bg-white [html:not(.dark)_&]:bg-white bg-slate-800 text-slate-100 [html:not(.dark)_&]:text-slate-900"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      callPostEndpoint('setPower', '/api/stove/setPower', {
                        level: powerInput,
                        source: 'manual',
                      })
                    }
                    loading={loadingPost.setPower}
                  >
                    Set Power
                  </Button>
                </div>
                {postResponses.setPower && (
                  <JsonDisplay data={postResponses.setPower} />
                )}
              </div>

              {/* Set Fan */}
              <div className="border-b border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Heading level={3} size="md" weight="semibold">
                      Set Fan Level
                    </Heading>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/setFan')}
                      </code>
                      <CopyUrlButton
                        onClick={() => copyUrlToClipboard('/api/stove/setFan')}
                        isCopied={copiedUrl === '/api/stove/setFan'}
                        label="Copia URL Set Fan"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Text as="label" size="sm" variant="secondary">
                        Level (1-6):
                      </Text>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={fanInput}
                        onChange={(e) => setFanInput(parseInt(e.target.value))}
                        className="w-20 px-3 py-1 border border-slate-300 [html:not(.dark)_&]:border-slate-300 border-slate-600 rounded-lg bg-white [html:not(.dark)_&]:bg-white bg-slate-800 text-slate-100 [html:not(.dark)_&]:text-slate-900"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      callPostEndpoint('setFan', '/api/stove/setFan', {
                        level: fanInput,
                        source: 'manual',
                      })
                    }
                    loading={loadingPost.setFan}
                  >
                    Set Fan
                  </Button>
                </div>
                {postResponses.setFan && (
                  <JsonDisplay data={postResponses.setFan} />
                )}
              </div>

              {/* Set Water Temperature */}
              <div className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Heading level={3} size="md" weight="semibold">
                      Set Water Temperature (Boiler)
                    </Heading>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/setWaterTemperature')}
                      </code>
                      <CopyUrlButton
                        onClick={() => copyUrlToClipboard('/api/stove/setWaterTemperature')}
                        isCopied={copiedUrl === '/api/stove/setWaterTemperature'}
                        label="Copia URL Set Water Temperature"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Text as="label" size="sm" variant="secondary">
                        Temperature (30-80°C):
                      </Text>
                      <input
                        type="number"
                        min="30"
                        max="80"
                        value={waterTempInput}
                        onChange={(e) => setWaterTempInput(parseInt(e.target.value))}
                        className="w-20 px-3 py-1 border border-slate-300 [html:not(.dark)_&]:border-slate-300 border-slate-600 rounded-lg bg-white [html:not(.dark)_&]:bg-white bg-slate-800 text-slate-100 [html:not(.dark)_&]:text-slate-900"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      callPostEndpoint('setWaterTemp', '/api/stove/setWaterTemperature', {
                        temperature: waterTempInput,
                      })
                    }
                    loading={loadingPost.setWaterTemp}
                  >
                    Set Water Temp
                  </Button>
                </div>
                {postResponses.setWaterTemp && (
                  <JsonDisplay data={postResponses.setWaterTemp} />
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
}

/**
 * Copy URL button component with proper accessibility
 */
interface CopyUrlButtonProps {
  onClick: () => void;
  isCopied: boolean;
  label?: string;
}

function CopyUrlButton({ onClick, isCopied, label = "Copia URL" }: CopyUrlButtonProps) {
  return (
    <Button.Icon
      icon={isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      onClick={onClick}
      variant="ghost"
      size="sm"
      aria-label={isCopied ? "URL copiato" : label}
      className={isCopied ? "text-green-500" : "text-slate-400 [html:not(.dark)_&]:text-slate-500"}
    />
  );
}

/**
 * Component to display a GET endpoint with its response
 */
interface EndpointDisplayProps {
  title: string;
  endpoint: string;
  externalUrl: string;
  response: any;
  loading: boolean;
  onRefresh: () => void;
  onCopyUrl: () => void;
  isCopied: boolean;
}

function EndpointDisplay({ title, endpoint, externalUrl, response, loading, onRefresh, onCopyUrl, isCopied }: EndpointDisplayProps) {
  return (
    <div className="border-b border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 pb-4 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <Heading level={3} size="md" weight="semibold">{title}</Heading>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
              {externalUrl}
            </code>
            <CopyUrlButton onClick={onCopyUrl} isCopied={isCopied} label={`Copia URL ${title}`} />
          </div>
        </div>
        <Button onClick={onRefresh} loading={loading} size="sm">
          🔄
        </Button>
      </div>
      {response && <JsonDisplay data={response} />}
    </div>
  );
}

/**
 * Component to display JSON data with syntax highlighting
 */
interface JsonDisplayProps {
  data: any;
}

function JsonDisplay({ data }: JsonDisplayProps) {
  return (
    <pre className="mt-2 p-3 bg-slate-900 [html:not(.dark)_&]:bg-slate-900 bg-black text-green-400 rounded-lg text-xs overflow-x-auto font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
