'use client';

import { useEffect, useState } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import DeliveryChart from './components/DeliveryChart';

interface NotificationStats {
  notifications: {
    total: number;
    sent: number;
    failed: number;
    deliveryRate: number;
  };
  devices: {
    active: number;
    total: number;
    stale: number;
  };
  errors: {
    total: number;
    byCode: Record<string, number>;
  };
  alerting?: {
    lastAlertSent?: string;
    lastAlertRate?: number;
  };
}

interface Device {
  id: string;
  displayName: string;
  tokenPrefix: string;
  platform: string;
  lastUsed: string;
  status: 'active' | 'stale' | 'unknown';
  browser?: string;
  os?: string;
  tokenKey?: string;
  token?: string;
}

interface TrendsSummary {
  totalNotifications: number;
  averageDeliveryRate: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface Trends {
  daily: any[];
  summary: TrendsSummary;
}

/**
 * Notifications Dashboard
 *
 * Admin page for monitoring notification delivery, device status, and error tracking.
 *
 * Features:
 * - Delivery rate with color-coded status
 * - Device list with active/stale indicators
 * - Error summary
 * - Manual refresh (no auto-polling per 02-CONTEXT.md)
 */
export default function NotificationsDashboard() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [alertInfo, setAlertInfo] = useState<NotificationStats['alerting'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all dashboard data
   */
  const fetchStats = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, devicesRes, trendsRes] = await Promise.all([
        fetch('/api/notifications/stats'),
        fetch('/api/notifications/devices'),
        fetch('/api/notifications/trends?days=7'),
      ]);

      if (!statsRes.ok || !devicesRes.ok || !trendsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [statsData, devicesData, trendsData] = await Promise.all([
        statsRes.json(),
        devicesRes.json(),
        trendsRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
        setAlertInfo(statsData.stats.alerting);
      }

      if (devicesData.success) {
        setDevices(devicesData.devices);
      }

      if (trendsData.success) {
        setTrends(trendsData.trends);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Get delivery rate color based on percentage
   * >= 85%: Green (sage)
   * 70-84%: Yellow (warning)
   * < 70%: Red (ember)
   */
  const getDeliveryRateColor = (rate: number): 'sage' | 'warning' | 'ember' => {
    if (rate >= 85) return 'sage';
    if (rate >= 70) return 'warning';
    return 'ember';
  };

  /**
   * Get device status badge classes
   */
  const getStatusBadge = (status: string): { bg: string; text: string; label: string } => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      active: {
        bg: 'bg-sage-50 [html:not(.dark)_&]:bg-sage-50',
        text: 'text-sage-600 [html:not(.dark)_&]:text-sage-700',
        label: 'Active',
      },
      stale: {
        bg: 'bg-warning-50 [html:not(.dark)_&]:bg-warning-50',
        text: 'text-warning-600 [html:not(.dark)_&]:text-warning-700',
        label: 'Stale',
      },
      unknown: {
        bg: 'bg-slate-100 [html:not(.dark)_&]:bg-slate-100',
        text: 'text-slate-600 [html:not(.dark)_&]:text-slate-700',
        label: 'Unknown',
      },
    };

    return badges[status] ?? badges.unknown!;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  /**
   * Get trend icon and color
   */
  const getTrendIcon = (trend: string): { icon: string; color: 'sage' | 'ember' | 'secondary' } => {
    if (trend === 'improving') return { icon: '↗', color: 'sage' };
    if (trend === 'declining') return { icon: '↘', color: 'ember' };
    return { icon: '→', color: 'secondary' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <Heading level={1} className="flex items-center gap-3">
              <span>🔔</span>
              Notifications Dashboard
            </Heading>
            <Text variant="tertiary" size="sm" className="mt-1">
              Monitor delivery rate and system health
            </Text>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchStats}
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'} Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-ember-50 [html:not(.dark)_&]:bg-ember-50 border border-ember-200 [html:not(.dark)_&]:border-ember-300">
            <Text variant="ember" size="sm">
              ⚠️ Error loading dashboard: {error}
            </Text>
          </div>
        )}
      </Card>

      {/* Primary Metrics */}
      {stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today's Notifications */}
          <Card className="p-6 bg-ocean-50 [html:not(.dark)_&]:bg-ocean-50 border-2 border-ocean-200 [html:not(.dark)_&]:border-ocean-200">
            <Text variant="tertiary" size="xs" className="mb-2">
              Today's Notifications
            </Text>
            <Text variant="tertiary" className="text-4xl">
              {stats.notifications.total}
            </Text>
            <Text variant="secondary" size="xs" className="mt-2">
              Last 24 hours
            </Text>
          </Card>

          {/* Delivery Rate */}
          <Card className={`p-6 ${
            getDeliveryRateColor(stats.notifications.deliveryRate) === 'sage'
              ? 'bg-sage-50 [html:not(.dark)_&]:bg-sage-50 border-2 border-sage-300 [html:not(.dark)_&]:border-sage-300'
              : getDeliveryRateColor(stats.notifications.deliveryRate) === 'warning'
              ? 'bg-warning-50 [html:not(.dark)_&]:bg-warning-50 border-2 border-warning-300 [html:not(.dark)_&]:border-warning-300'
              : 'bg-ember-50 [html:not(.dark)_&]:bg-ember-50 border-2 border-ember-300 [html:not(.dark)_&]:border-ember-300'
          }`}>
            <Text variant="tertiary" size="xs" className="mb-2">
              Delivery Rate
            </Text>
            <Text
              as="p"
              variant={getDeliveryRateColor(stats.notifications.deliveryRate)}
             
              className="text-4xl"
            >
              {stats.notifications.deliveryRate.toFixed(1)}%
            </Text>
            <Text variant="secondary" size="xs" className="mt-2">
              {stats.notifications.sent} sent / {stats.notifications.failed} failed
            </Text>
          </Card>

          {/* Active Devices */}
          <Card className="p-6 bg-slate-50 [html:not(.dark)_&]:bg-slate-50 border-2 border-slate-200 [html:not(.dark)_&]:border-slate-200">
            <Text variant="tertiary" size="xs" className="mb-2">
              Active Devices
            </Text>
            <Text as="p" className="text-4xl">
              {stats.devices.active}
            </Text>
            <Text variant="secondary" size="xs" className="mt-2">
              {stats.devices.total} total ({stats.devices.stale} stale)
            </Text>
          </Card>
        </div>
      )}

      {/* 7-Day Delivery Trends */}
      {trends && !loading && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level={2} size="xl">
              📈 7-Day Delivery Trends
            </Heading>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Text variant="tertiary" size="xs">Total:</Text>
                <Text size="sm">
                  {trends.summary.totalNotifications}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Text variant="tertiary" size="xs">Avg Rate:</Text>
                <Text size="sm">
                  {trends.summary.averageDeliveryRate}%
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Text
                  variant={getTrendIcon(trends.summary.trend).color}
                 
                  size="sm"
                >
                  {getTrendIcon(trends.summary.trend).icon} {trends.summary.trend}
                </Text>
              </div>
            </div>
          </div>
          <DeliveryChart data={trends.daily} loading={loading} />
        </Card>
      )}

      {/* Rate Alerting Status */}
      {stats && !loading && (
        <Card className={`p-6 ${
          stats.notifications.deliveryRate < 85
            ? 'bg-warning-50 [html:not(.dark)_&]:bg-warning-50 border-2 border-warning-200 [html:not(.dark)_&]:border-warning-300'
            : 'bg-slate-50 [html:not(.dark)_&]:bg-slate-50 border border-slate-200 [html:not(.dark)_&]:border-slate-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔔</span>
            <Heading level={2} size="xl">
              Rate Alerting
            </Heading>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <Text variant="tertiary" size="xs" className="mb-2">
                Current Delivery Rate
              </Text>
              <Text
                size="xl"
               
                variant={getDeliveryRateColor(stats.notifications.deliveryRate)}
              >
                {stats.notifications.deliveryRate.toFixed(1)}%
              </Text>
              <Text variant="tertiary" size="xs" className="mt-1">
                {stats.notifications.deliveryRate >= 85 ? 'Above threshold ✓' : 'Below threshold ⚠️'}
              </Text>
            </div>

            <div>
              <Text variant="tertiary" size="xs" className="mb-2">
                Last Alert Sent
              </Text>
              <Text size="lg">
                {alertInfo?.lastAlertSent
                  ? formatDate(alertInfo.lastAlertSent)
                  : 'Never'}
              </Text>
              {alertInfo?.lastAlertRate && (
                <Text variant="tertiary" size="xs" className="mt-1">
                  Alert rate: {alertInfo.lastAlertRate}%
                </Text>
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/[0.04] [html:not(.dark)_&]:bg-black/[0.04] border border-white/[0.06] [html:not(.dark)_&]:border-black/[0.06]">
            <Text variant="tertiary" size="sm" className="mb-2">
              ℹ️ About Rate Alerting
            </Text>
            <Text variant="secondary" size="xs">
              Automatic alerts are sent when delivery rate drops below 85%. Alerts are rate-limited to max 1 per hour to prevent alert fatigue.
            </Text>
            <div className="mt-3 pt-3 border-t border-white/[0.06] [html:not(.dark)_&]:border-black/[0.06]">
              <Text variant="tertiary" size="xs">
                <strong>Endpoint:</strong> POST /api/notifications/check-rate
              </Text>
              <Text variant="tertiary" size="xs" className="mt-1">
                <strong>Setup:</strong> Schedule with cron-job.org for automated monitoring
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Error Summary */}
      {stats && !loading && stats.errors.total > 0 && (
        <Card className="p-6">
          <Heading level={2} size="xl" className="mb-4">
            📊 Recent Errors (Last 24h)
          </Heading>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text variant="secondary" size="sm">
                Total Errors
              </Text>
              <Text size="lg" variant="ember">
                {stats.errors.total}
              </Text>
            </div>

            {Object.keys(stats.errors.byCode).length > 0 && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <Text variant="tertiary" size="xs" className="mb-2">
                  Error Breakdown
                </Text>
                <div className="space-y-2">
                  {Object.entries(stats.errors.byCode)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([code, count]) => (
                      <div
                        key={code}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 [html:not(.dark)_&]:bg-slate-100"
                      >
                        <Text size="sm" className="font-mono">
                          {code}
                        </Text>
                        <Text size="sm" variant="ember">
                          {count}
                        </Text>
                      </div>
                    ))}
                </div>
              </>
            )}

            <div className="mt-4">
              <Button variant="outline" fullWidth>
                View All Errors →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Device List */}
      {devices.length > 0 && !loading && (
        <Card className="p-6">
          <Heading level={2} size="xl" className="mb-4">
            📱 Registered Devices ({devices.length})
          </Heading>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] [html:not(.dark)_&]:border-black/[0.06]">
                  <th className="text-left py-3 px-4">
                    <Text variant="tertiary" size="xs" uppercase>
                      Device
                    </Text>
                  </th>
                  <th className="text-left py-3 px-4">
                    <Text variant="tertiary" size="xs" uppercase>
                      Platform
                    </Text>
                  </th>
                  <th className="text-left py-3 px-4">
                    <Text variant="tertiary" size="xs" uppercase>
                      Last Used
                    </Text>
                  </th>
                  <th className="text-left py-3 px-4">
                    <Text variant="tertiary" size="xs" uppercase>
                      Status
                    </Text>
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.slice(0, 10).map((device) => {
                  const statusBadge = getStatusBadge(device.status);
                  return (
                    <tr
                      key={device.id}
                      className="border-b border-white/[0.04] [html:not(.dark)_&]:border-black/[0.04] hover:bg-white/[0.02] [html:not(.dark)_&]:hover:bg-black/[0.02]"
                    >
                      <td className="py-3 px-4">
                        <Text size="sm">
                          {device.displayName}
                        </Text>
                        <Text variant="tertiary" size="xs" className="font-mono mt-1">
                          {device.tokenPrefix}...
                        </Text>
                      </td>
                      <td className="py-3 px-4">
                        <Text size="sm">{device.platform}</Text>
                      </td>
                      <td className="py-3 px-4">
                        <Text size="sm">{formatDate(device.lastUsed)}</Text>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full ${statusBadge.bg}`}
                        >
                          <Text
                            size="xs"
                           
                            className={statusBadge.text}
                          >
                            {statusBadge.label}
                          </Text>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {devices.length > 10 && (
            <div className="mt-4">
              <Text variant="tertiary" size="sm" className="text-center">
                Showing 10 of {devices.length} devices
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <Heading level={2} size="xl" className="mb-4">
          🔗 Quick Actions
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="ember" onClick={() => (window.location.href = '/debug/notifications/test')}>
            📤 Send Test Notification
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/debug')}>
            🏠 Back to Debug Home
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && !stats && (
        <Card className="p-12 text-center">
          <Text variant="secondary" size="lg">
            ⏳ Loading dashboard...
          </Text>
        </Card>
      )}
    </div>
  );
}
