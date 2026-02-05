'use client';

import { useState, useEffect, useCallback } from 'react';
import { EndpointCard, PostEndpointCard } from '../ApiTab';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';

export default function SchedulerTab({ autoRefresh, refreshTrigger }) {
  const [getResponses, setGetResponses] = useState({});
  const [postResponses, setPostResponses] = useState({});
  const [loadingGet, setLoadingGet] = useState({});
  const [loadingPost, setLoadingPost] = useState({});
  const [timings, setTimings] = useState({});
  const [copiedUrl, setCopiedUrl] = useState(null);

  const copyUrlToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const fetchGetEndpoint = useCallback(async (name, url) => {
    setLoadingGet((prev) => ({ ...prev, [name]: true }));
    const startTime = Date.now();
    try {
      const res = await fetch(url);
      const data = await res.json();
      const timing = Date.now() - startTime;
      setTimings((prev) => ({ ...prev, [name]: timing }));
      setGetResponses((prev) => ({ ...prev, [name]: data }));
    } catch (error) {
      setGetResponses((prev) => ({ ...prev, [name]: { error: error.message } }));
    } finally {
      setLoadingGet((prev) => ({ ...prev, [name]: false }));
    }
  }, []);

  const fetchAllGetEndpoints = useCallback(() => {
    fetchGetEndpoint('notificationStats', '/api/notifications/stats');
    fetchGetEndpoint('healthMonitoringStats', '/api/health-monitoring/stats');
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
      setPostResponses((prev) => ({ ...prev, [name]: data }));

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
      {/* Scheduler Info */}
      <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
        <Text variant="secondary" size="sm">
          The scheduler cron endpoint (<code className="text-xs">/api/scheduler/check</code>) is called every minute by
          an external cron service (e.g., cron-job.org). It handles all automated tasks: stove scheduling, Netatmo
          calibration, weather refresh, token cleanup, and health monitoring.
        </Text>
      </div>

      {/* POST Endpoints */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📤 POST Endpoints
        </Heading>
        <div className="space-y-3">
          <PostEndpointCard
            name="Scheduler Check (Cron Endpoint)"
            url="/api/scheduler/check"
            params={[
              { name: 'secret', label: 'CRON_SECRET', type: 'text', defaultValue: '' },
            ]}
            response={postResponses.schedulerCheck}
            loading={loadingPost.schedulerCheck}
            timing={timings.schedulerCheck}
            onExecute={(values) => callPostEndpoint('schedulerCheck', `/api/scheduler/check?secret=${values.secret}`, {})}
            onCopyUrl={() => copyUrlToClipboard('/api/scheduler/check?secret=<CRON_SECRET>')}
            isCopied={copiedUrl === '/api/scheduler/check?secret=<CRON_SECRET>'}
          />

          <PostEndpointCard
            name="Update Scheduler"
            url="/api/scheduler/update"
            response={postResponses.schedulerUpdate}
            loading={loadingPost.schedulerUpdate}
            timing={timings.schedulerUpdate}
            onExecute={() => callPostEndpoint('schedulerUpdate', '/api/scheduler/update', {})}
            onCopyUrl={() => copyUrlToClipboard('/api/scheduler/update')}
            isCopied={copiedUrl === '/api/scheduler/update'}
          />
        </div>
      </div>

      {/* GET Endpoints */}
      <div>
        <Heading level={2} size="lg" className="mb-4">
          📥 GET Endpoints (Stats)
        </Heading>
        <div className="space-y-3">
          <EndpointCard
            name="Notification Stats"
            url="/api/notifications/stats"
            response={getResponses.notificationStats}
            loading={loadingGet.notificationStats}
            timing={timings.notificationStats}
            onRefresh={() => fetchGetEndpoint('notificationStats', '/api/notifications/stats')}
            onCopyUrl={() => copyUrlToClipboard('/api/notifications/stats')}
            isCopied={copiedUrl === '/api/notifications/stats'}
          />

          <EndpointCard
            name="Health Monitoring Stats"
            url="/api/health-monitoring/stats"
            response={getResponses.healthMonitoringStats}
            loading={loadingGet.healthMonitoringStats}
            timing={timings.healthMonitoringStats}
            onRefresh={() => fetchGetEndpoint('healthMonitoringStats', '/api/health-monitoring/stats')}
            onCopyUrl={() => copyUrlToClipboard('/api/health-monitoring/stats')}
            isCopied={copiedUrl === '/api/health-monitoring/stats'}
          />
        </div>
      </div>

      {/* Scheduler Jobs Reference */}
      <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
        <Heading level={3} size="sm" className="mb-3">
          ⏰ Automated Jobs
        </Heading>
        <div className="space-y-2">
          <Text variant="secondary" size="sm">
            <strong>Stove Scheduler:</strong> Every minute (checks active schedule)
            <br />
            <strong>Netatmo Calibration:</strong> Every 12 hours (valve maintenance)
            <br />
            <strong>Netatmo Sync:</strong> Every minute (temperature updates)
            <br />
            <strong>Maintenance Tracking:</strong> Every minute (H24 hours counter)
            <br />
            <strong>Weather Refresh:</strong> Every 30 minutes (Open-Meteo API)
            <br />
            <strong>FCM Token Cleanup:</strong> Every 7 days (remove stale tokens)
            <br />
            <strong>Hue Token Refresh:</strong> Proactive (24h before expiry)
            <br />
            <strong>Notifications:</strong> Event-driven (triggered by state changes)
          </Text>
        </div>
      </div>

      {/* Cron Health */}
      <div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
        <Heading level={3} size="sm" className="mb-3">
          💚 Cron Health
        </Heading>
        <Text variant="secondary" size="sm">
          Each execution saves timestamp to <code className="text-xs">cronHealth/lastCall</code> in Firebase. Health
          monitoring checks this timestamp and alerts if no execution for &gt; 2 minutes (indicates cron service failure).
        </Text>
      </div>
    </div>
  );
}
