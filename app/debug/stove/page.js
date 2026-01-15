'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Copy, Check } from 'lucide-react';
import { API_KEY } from '@/lib/stoveApi';

export default function StoveDebugPage() {
  // GET responses state
  const [getResponses, setGetResponses] = useState({
    status: null,
    power: null,
    fan: null,
    roomTemp: null,
    settings: null,
    actualWaterTemp: null,
    waterSetTemp: null,
  });

  // POST responses state
  const [postResponses, setPostResponses] = useState({});

  // Input state for POST operations
  const [powerInput, setPowerInput] = useState(3);
  const [fanInput, setFanInput] = useState(3);
  const [waterTempInput, setWaterTempInput] = useState(50);

  // Loading states
  const [loadingGet, setLoadingGet] = useState({});
  const [loadingPost, setLoadingPost] = useState({});

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Copied URL tracking
  const [copiedUrl, setCopiedUrl] = useState(null);

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
  const getExternalUrl = (endpoint) => {
    return thermorossiUrls[endpoint] || endpoint;
  };

  /**
   * Copy external URL to clipboard
   */
  const copyUrlToClipboard = async (endpoint) => {
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
  const cleanApiResponse = (data) => {
    if (!data || typeof data !== 'object') return data;
    const { isSandbox, ...cleanData } = data;
    return cleanData;
  };

  /**
   * Fetch a single GET endpoint
   */
  const fetchGetEndpoint = async (name, url) => {
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
  const fetchAllGetEndpoints = async () => {
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
  const callPostEndpoint = async (name, url, body = null) => {
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
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 [html:not(.dark)_&]:from-slate-50 [html:not(.dark)_&]:to-slate-100 from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 [html:not(.dark)_&]:text-slate-900">
              🔥 Stove Debug Console
            </h1>
            <p className="text-slate-400 [html:not(.dark)_&]:text-slate-600 mt-1">
              Raw API responses from Thermorossi endpoints (no internal fields)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 [html:not(.dark)_&]:text-slate-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (5s)
            </label>
            <Button onClick={fetchAllGetEndpoints}>
              🔄 Refresh All
            </Button>
          </div>
        </div>

        {/* GET Endpoints Section */}
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-100 [html:not(.dark)_&]:text-slate-900 mb-4">
              📥 GET Endpoints
            </h2>
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
            <h2 className="text-2xl font-bold text-slate-100 [html:not(.dark)_&]:text-slate-900 mb-4">
              📤 POST/Control Endpoints
            </h2>
            <div className="space-y-6">
              {/* Ignite */}
              <div className="border-b border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900">
                      Ignite Stove
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/ignite')}
                      </code>
                      <button
                        onClick={() => copyUrlToClipboard('/api/stove/ignite')}
                        className="flex-shrink-0 p-1 hover:bg-slate-200 [html:not(.dark)_&]:hover:bg-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title="Copy external URL"
                      >
                        {copiedUrl === '/api/stove/ignite' ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 [html:not(.dark)_&]:text-slate-500" />
                        )}
                      </button>
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
                    <h3 className="font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900">
                      Shutdown Stove
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/shutdown')}
                      </code>
                      <button
                        onClick={() => copyUrlToClipboard('/api/stove/shutdown')}
                        className="flex-shrink-0 p-1 hover:bg-slate-200 [html:not(.dark)_&]:hover:bg-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title="Copy external URL"
                      >
                        {copiedUrl === '/api/stove/shutdown' ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 [html:not(.dark)_&]:text-slate-500" />
                        )}
                      </button>
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
                    <h3 className="font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900">
                      Set Power Level
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/setPower')}
                      </code>
                      <button
                        onClick={() => copyUrlToClipboard('/api/stove/setPower')}
                        className="flex-shrink-0 p-1 hover:bg-slate-200 [html:not(.dark)_&]:hover:bg-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title="Copy external URL"
                      >
                        {copiedUrl === '/api/stove/setPower' ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 [html:not(.dark)_&]:text-slate-500" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-700">
                        Level (1-5):
                      </label>
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
                    <h3 className="font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900">
                      Set Fan Level
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/setFan')}
                      </code>
                      <button
                        onClick={() => copyUrlToClipboard('/api/stove/setFan')}
                        className="flex-shrink-0 p-1 hover:bg-slate-200 [html:not(.dark)_&]:hover:bg-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title="Copy external URL"
                      >
                        {copiedUrl === '/api/stove/setFan' ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 [html:not(.dark)_&]:text-slate-500" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-700">
                        Level (1-6):
                      </label>
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
                    <h3 className="font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900">
                      Set Water Temperature (Boiler)
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                        {getExternalUrl('/api/stove/setWaterTemperature')}
                      </code>
                      <button
                        onClick={() => copyUrlToClipboard('/api/stove/setWaterTemperature')}
                        className="flex-shrink-0 p-1 hover:bg-slate-200 [html:not(.dark)_&]:hover:bg-slate-200 hover:bg-slate-700 rounded transition-colors"
                        title="Copy external URL"
                      >
                        {copiedUrl === '/api/stove/setWaterTemperature' ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 [html:not(.dark)_&]:text-slate-500" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-700">
                        Temperature (30-80°C):
                      </label>
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
    </div>
  );
}

/**
 * Component to display a GET endpoint with its response
 */
function EndpointDisplay({ title, endpoint, externalUrl, response, loading, onRefresh, onCopyUrl, isCopied }) {
  return (
    <div className="border-b border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700 pb-4 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
              {externalUrl}
            </code>
            <button
              onClick={onCopyUrl}
              className="flex-shrink-0 p-1 hover:bg-slate-200 [html:not(.dark)_&]:hover:bg-slate-200 hover:bg-slate-700 rounded transition-colors"
              title="Copy external URL"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 [html:not(.dark)_&]:text-slate-500" />
              )}
            </button>
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
function JsonDisplay({ data }) {
  return (
    <pre className="mt-2 p-3 bg-slate-900 [html:not(.dark)_&]:bg-slate-900 bg-black text-green-400 rounded-lg text-xs overflow-x-auto font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
