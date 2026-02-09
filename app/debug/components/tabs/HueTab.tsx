'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard, PostEndpointCard } from '@/app/debug/components/ApiTab';
import Heading from '@/app/components/ui/Heading';
import Badge from '@/app/components/ui/Badge';

interface HueTabProps {
  autoRefresh: boolean;
  refreshTrigger: number;
}

export default function HueTab({ autoRefresh, refreshTrigger }: HueTabProps) {
  const [getResponses, setGetResponses] = useState<Record<string, any>>({});
  const [postResponses, setPostResponses] = useState<Record<string, any>>({});
  const [loadingGet, setLoadingGet] = useState<Record<string, boolean>>({});
  const [loadingPost, setLoadingPost] = useState<Record<string, boolean>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<any>(null);

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

      // Check bridge status
      if (name === 'status' && data.bridgeConnected !== undefined) {
        setBridgeStatus(data.bridgeConnected ? 'connected' : 'disconnected');
      }
    } catch (error) {
      setGetResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  }, []);

  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('status', '/api/hue/status');
    fetchGetEndpoint('lights', '/api/hue/lights');
    fetchGetEndpoint('rooms', '/api/hue/rooms');
    fetchGetEndpoint('scenes', '/api/hue/scenes');
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
      {/* Bridge Status */}
      {bridgeStatus && (
        <div className="flex items-center gap-3">
          <Heading level={3} size="md">
            Bridge Status:
          </Heading>
          <Badge variant={bridgeStatus === 'connected' ? 'sage' : 'danger'}>
            {bridgeStatus === 'connected' ? '✓ Connected' : '✗ Disconnected'}
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
            name="Bridge Status"
            url="/api/hue/status"
            externalUrl="https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource"
            response={getResponses.status}
            loading={loadingGet.status ?? false}
            timing={timings.status}
            onRefresh={() => fetchGetEndpoint('status', '/api/hue/status')}
            onCopyUrl={() => copyUrlToClipboard('https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource')}
            isCopied={copiedUrl === 'https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource'}
          />

          <EndpointCard
            name="Lights"
            url="/api/hue/lights"
            externalUrl="https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/light"
            response={getResponses.lights}
            loading={loadingGet.lights ?? false}
            timing={timings.lights}
            onRefresh={() => fetchGetEndpoint('lights', '/api/hue/lights')}
            onCopyUrl={() => copyUrlToClipboard('https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/light')}
            isCopied={copiedUrl === 'https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/light'}
          />

          <EndpointCard
            name="Rooms"
            url="/api/hue/rooms"
            externalUrl="https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/room"
            response={getResponses.rooms}
            loading={loadingGet.rooms ?? false}
            timing={timings.rooms}
            onRefresh={() => fetchGetEndpoint('rooms', '/api/hue/rooms')}
            onCopyUrl={() => copyUrlToClipboard('https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/room')}
            isCopied={copiedUrl === 'https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/room'}
          />

          <EndpointCard
            name="Scenes"
            url="/api/hue/scenes"
            externalUrl="https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/scene"
            response={getResponses.scenes}
            loading={loadingGet.scenes ?? false}
            timing={timings.scenes}
            onRefresh={() => fetchGetEndpoint('scenes', '/api/hue/scenes')}
            onCopyUrl={() => copyUrlToClipboard('https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/scene')}
            isCopied={copiedUrl === 'https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/scene'}
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
            name="Control Light"
            url="/api/hue/lights/[id]"
            externalUrl="https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/light/{id}"
            params={[
              { name: 'lightId', label: 'Light ID', type: 'text', defaultValue: '' },
              { name: 'on', label: 'On/Off', type: 'select', options: ['true', 'false'], defaultValue: 'true' },
              { name: 'brightness', label: 'Brightness (0-100)', type: 'number', min: 0, max: 100, defaultValue: '50' },
            ]}
            response={postResponses.controlLight}
            loading={loadingPost.controlLight ?? false}
            timing={timings.controlLight}
            onExecute={(values) =>
              callPostEndpoint('controlLight', `/api/hue/lights/${values.lightId}`, {
                on: values.on === 'true',
                brightness: values.brightness,
              })
            }
            onCopyUrl={() => copyUrlToClipboard('https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/light/{id}')}
            isCopied={copiedUrl === 'https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/light/{id}'}
          />

          <PostEndpointCard
            name="Control Room"
            url="/api/hue/rooms/[id]"
            externalUrl="https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/grouped_light/{id}"
            params={[
              { name: 'roomId', label: 'Room ID', type: 'text', defaultValue: '' },
              { name: 'on', label: 'On/Off', type: 'select', options: ['true', 'false'], defaultValue: 'true' },
              { name: 'brightness', label: 'Brightness (0-100)', type: 'number', min: 0, max: 100, defaultValue: '50' },
            ]}
            response={postResponses.controlRoom}
            loading={loadingPost.controlRoom ?? false}
            timing={timings.controlRoom}
            onExecute={(values) =>
              callPostEndpoint('controlRoom', `/api/hue/rooms/${values.roomId}`, {
                on: values.on === 'true',
                brightness: values.brightness,
              })
            }
            onCopyUrl={() => copyUrlToClipboard('https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/grouped_light/{id}')}
            isCopied={copiedUrl === 'https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/grouped_light/{id}'}
          />

          <PostEndpointCard
            name="Activate Scene"
            url="/api/hue/scenes/[id]/activate"
            externalUrl="https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/scene/{id}"
            params={[{ name: 'sceneId', label: 'Scene ID', type: 'text', defaultValue: '' }]}
            response={postResponses.activateScene}
            loading={loadingPost.activateScene ?? false}
            timing={timings.activateScene}
            onExecute={(values) => callPostEndpoint('activateScene', `/api/hue/scenes/${values.sceneId}/activate`, {})}
            onCopyUrl={() => copyUrlToClipboard('https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/scene/{id}')}
            isCopied={copiedUrl === 'https://api.meethue.com/bridge/{bridgeId}/clip/v2/resource/scene/{id}'}
          />
        </div>
      </div>
    </div>
  );
}
