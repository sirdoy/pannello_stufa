'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard, PostEndpointCard } from '@/app/debug/components/ApiTab';
import Heading from '@/app/components/ui/Heading';
import { API_KEY } from '@/lib/stoveApi';

const BASE_URL = 'https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json';

export default function StoveTab({ autoRefresh, refreshTrigger }) {
  const [getResponses, setGetResponses] = useState({});
  const [postResponses, setPostResponses] = useState({});
  const [loadingGet, setLoadingGet] = useState({});
  const [loadingPost, setLoadingPost] = useState({});
  const [timings, setTimings] = useState({});
  const [copiedUrl, setCopiedUrl] = useState(null);

  // External URL mapping
  const getExternalUrl = (endpoint) => {
    const mapping = {
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
    return mapping[endpoint] || endpoint;
  };

  const copyUrlToClipboard = async (endpoint) => {
    try {
      await navigator.clipboard.writeText(getExternalUrl(endpoint));
      setCopiedUrl(endpoint);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const cleanApiResponse = (data) => {
    if (!data || typeof data !== 'object') return data;
    const { isSandbox, ...cleanData } = data;
    return cleanData;
  };

  const fetchGetEndpoint = useCallback(async (name, url) => {
    setLoadingGet((prev) => ({ ...prev, [name]: true }));
    const startTime = Date.now();
    try {
      const res = await fetch(url);
      const data = await res.json();
      const timing = Date.now() - startTime;
      setTimings((prev) => ({ ...prev, [name]: timing }));
      setGetResponses((prev) => ({ ...prev, [name]: cleanApiResponse(data) }));
    } catch (error) {
      setGetResponses((prev) => ({ ...prev, [name]: { error: error.message } }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  }, []);

  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('status', '/api/stove/status');
    fetchGetEndpoint('power', '/api/stove/getPower');
    fetchGetEndpoint('fan', '/api/stove/getFan');
    fetchGetEndpoint('roomTemp', '/api/stove/getRoomTemperature');
    fetchGetEndpoint('settings', '/api/stove/settings');
    fetchGetEndpoint('actualWaterTemp', '/api/stove/getActualWaterTemperature');
    fetchGetEndpoint('waterSetTemp', '/api/stove/getWaterSetTemperature');
  }, [fetchGetEndpoint]);

  const callPostEndpoint = async (name, url, body) => {
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
      setPostResponses((prev) => ({ ...prev, [name]: cleanApiResponse(data) }));

      // Refresh GET endpoints after successful POST
      if (res.ok) {
        setTimeout(fetchAllGetEndpoints, 1000);
      }
    } catch (error) {
      setPostResponses((prev) => ({ ...prev, [name]: { error: error.message } }));
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
      {/* GET Endpoints */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📥 GET Endpoints
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Status"
            url="/api/stove/status"
            externalUrl={getExternalUrl('/api/stove/status')}
            response={getResponses.status}
            loading={loadingGet.status}
            timing={timings.status}
            onRefresh={() => fetchGetEndpoint('status', '/api/stove/status')}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/status')}
            isCopied={copiedUrl === '/api/stove/status'}
          />

          <EndpointCard
            name="Power Level"
            url="/api/stove/getPower"
            externalUrl={getExternalUrl('/api/stove/getPower')}
            response={getResponses.power}
            loading={loadingGet.power}
            timing={timings.power}
            onRefresh={() => fetchGetEndpoint('power', '/api/stove/getPower')}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/getPower')}
            isCopied={copiedUrl === '/api/stove/getPower'}
          />

          <EndpointCard
            name="Fan Level"
            url="/api/stove/getFan"
            externalUrl={getExternalUrl('/api/stove/getFan')}
            response={getResponses.fan}
            loading={loadingGet.fan}
            timing={timings.fan}
            onRefresh={() => fetchGetEndpoint('fan', '/api/stove/getFan')}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/getFan')}
            isCopied={copiedUrl === '/api/stove/getFan'}
          />

          <EndpointCard
            name="Room Temperature Setpoint"
            url="/api/stove/getRoomTemperature"
            externalUrl={getExternalUrl('/api/stove/getRoomTemperature')}
            response={getResponses.roomTemp}
            loading={loadingGet.roomTemp}
            timing={timings.roomTemp}
            onRefresh={() => fetchGetEndpoint('roomTemp', '/api/stove/getRoomTemperature')}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/getRoomTemperature')}
            isCopied={copiedUrl === '/api/stove/getRoomTemperature'}
          />

          <EndpointCard
            name="Settings (Fan/Power Defaults)"
            url="/api/stove/settings"
            externalUrl={getExternalUrl('/api/stove/settings')}
            response={getResponses.settings}
            loading={loadingGet.settings}
            timing={timings.settings}
            onRefresh={() => fetchGetEndpoint('settings', '/api/stove/settings')}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/settings')}
            isCopied={copiedUrl === '/api/stove/settings'}
          />

          <EndpointCard
            name="Actual Water Temperature (Boiler)"
            url="/api/stove/getActualWaterTemperature"
            externalUrl={getExternalUrl('/api/stove/getActualWaterTemperature')}
            response={getResponses.actualWaterTemp}
            loading={loadingGet.actualWaterTemp}
            timing={timings.actualWaterTemp}
            onRefresh={() => fetchGetEndpoint('actualWaterTemp', '/api/stove/getActualWaterTemperature')}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/getActualWaterTemperature')}
            isCopied={copiedUrl === '/api/stove/getActualWaterTemperature'}
          />

          <EndpointCard
            name="Water Temperature Setpoint (Boiler)"
            url="/api/stove/getWaterSetTemperature"
            externalUrl={getExternalUrl('/api/stove/getWaterSetTemperature')}
            response={getResponses.waterSetTemp}
            loading={loadingGet.waterSetTemp}
            timing={timings.waterSetTemp}
            onRefresh={() => fetchGetEndpoint('waterSetTemp', '/api/stove/getWaterSetTemperature')}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/getWaterSetTemperature')}
            isCopied={copiedUrl === '/api/stove/getWaterSetTemperature'}
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
            url="/api/stove/ignite"
            externalUrl={getExternalUrl('/api/stove/ignite')}
            params={[
              { name: 'power', label: 'Power Level (1-5)', type: 'number', min: 1, max: 5, defaultValue: 3 },
            ]}
            response={postResponses.ignite}
            loading={loadingPost.ignite}
            timing={timings.ignite}
            onExecute={(values) => callPostEndpoint('ignite', '/api/stove/ignite', { source: 'manual', power: values.power })}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/ignite')}
            isCopied={copiedUrl === '/api/stove/ignite'}
          />

          <PostEndpointCard
            name="Shutdown Stove"
            url="/api/stove/shutdown"
            externalUrl={getExternalUrl('/api/stove/shutdown')}
            response={postResponses.shutdown}
            loading={loadingPost.shutdown}
            timing={timings.shutdown}
            onExecute={() => callPostEndpoint('shutdown', '/api/stove/shutdown', { source: 'manual' })}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/shutdown')}
            isCopied={copiedUrl === '/api/stove/shutdown'}
          />

          <PostEndpointCard
            name="Set Power Level"
            url="/api/stove/setPower"
            externalUrl={getExternalUrl('/api/stove/setPower')}
            params={[
              { name: 'level', label: 'Level (1-5)', type: 'number', min: 1, max: 5, defaultValue: 3 },
            ]}
            response={postResponses.setPower}
            loading={loadingPost.setPower}
            timing={timings.setPower}
            onExecute={(values) => callPostEndpoint('setPower', '/api/stove/setPower', { level: values.level, source: 'manual' })}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/setPower')}
            isCopied={copiedUrl === '/api/stove/setPower'}
          />

          <PostEndpointCard
            name="Set Fan Level"
            url="/api/stove/setFan"
            externalUrl={getExternalUrl('/api/stove/setFan')}
            params={[
              { name: 'level', label: 'Level (1-6)', type: 'number', min: 1, max: 6, defaultValue: 3 },
            ]}
            response={postResponses.setFan}
            loading={loadingPost.setFan}
            timing={timings.setFan}
            onExecute={(values) => callPostEndpoint('setFan', '/api/stove/setFan', { level: values.level, source: 'manual' })}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/setFan')}
            isCopied={copiedUrl === '/api/stove/setFan'}
          />

          <PostEndpointCard
            name="Set Water Temperature (Boiler)"
            url="/api/stove/setWaterTemperature"
            externalUrl={getExternalUrl('/api/stove/setWaterTemperature')}
            params={[
              { name: 'temperature', label: 'Temperature (30-80°C)', type: 'number', min: 30, max: 80, defaultValue: 50 },
            ]}
            response={postResponses.setWaterTemp}
            loading={loadingPost.setWaterTemp}
            timing={timings.setWaterTemp}
            onExecute={(values) => callPostEndpoint('setWaterTemp', '/api/stove/setWaterTemperature', { temperature: values.temperature })}
            onCopyUrl={() => copyUrlToClipboard('/api/stove/setWaterTemperature')}
            isCopied={copiedUrl === '/api/stove/setWaterTemperature'}
          />
        </div>
      </div>
    </div>
  );
}
