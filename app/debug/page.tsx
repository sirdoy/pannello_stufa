'use client';

/**
 * Unified Debug Page
 *
 * Consolidates debug tools into tabbed interface:
 * - Stufa: Full API debug for Thermorossi stove (GET/POST endpoints)
 * - Netatmo: Thermostat and valve API testing
 * - Hue: Philips Hue lights and scenes API
 * - Weather: Weather forecast API
 * - Firebase: Database health and config endpoints
 * - Scheduler: Cron and automation endpoints
 * - Notifiche: Notifications dashboard
 * - Network: Fritz!Box Network Monitor API
 *
 * Design System remains at /debug/design-system (documentation)
 */

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Tabs from '@/app/components/ui/Tabs';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import PageLayout from '@/app/components/ui/PageLayout';
import { Flame, Thermometer, Lightbulb, Cloud, Database, Clock, Bell, Palette, RefreshCw, Wifi, Network } from 'lucide-react';

// API Tab Components
import StoveTab from '@/app/debug/components/tabs/StoveTab';
import NetatmoTab from '@/app/debug/components/tabs/NetatmoTab';
import HueTab from '@/app/debug/components/tabs/HueTab';
import WeatherTab from '@/app/debug/components/tabs/WeatherTab';
import FirebaseTab from '@/app/debug/components/tabs/FirebaseTab';
import SchedulerTab from '@/app/debug/components/tabs/SchedulerTab';
import NetworkTab from '@/app/debug/components/tabs/NetworkTab';
import FritzboxServiceDiscoveryTab from '@/app/debug/components/tabs/FritzboxServiceDiscoveryTab';

// ============================================================================
// NOTIFICHE CONTENT - Notifications Dashboard
// ============================================================================
interface NotificationStats {
  notifications: {
    total: number;
    deliveryRate: number;
    sent: number;
    failed: number;
  };
  devices: {
    active: number;
    total: number;
    stale: number;
  };
}

function NotificheContent() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getDeliveryRateColor = (rate: number): 'sage' | 'warning' | 'ember' => {
    if (rate >= 85) return 'sage';
    if (rate >= 70) return 'warning';
    return 'ember';
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <Text variant="tertiary" size="sm">
          Monitor delivery rate e system health
        </Text>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          {loading ? '⏳' : '🔄'} Refresh
        </Button>
      </div>

      {error && (
        <Banner variant="error" title={`Errore: ${error}`} />
      )}

      {stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-ocean-50 border-2 border-ocean-200">
            <Text variant="tertiary" size="xs" className="mb-2">Notifiche Oggi</Text>
            <Text variant="tertiary" className="text-4xl">
              {stats.notifications.total}
            </Text>
          </Card>

          <Card className={`p-6 ${
            getDeliveryRateColor(stats.notifications.deliveryRate) === 'sage'
              ? 'bg-sage-50 border-2 border-sage-300'
              : getDeliveryRateColor(stats.notifications.deliveryRate) === 'warning'
              ? 'bg-warning-50 border-2 border-warning-300'
              : 'bg-ember-50 border-2 border-ember-300'
          }`}>
            <Text variant="tertiary" size="xs" className="mb-2">Delivery Rate</Text>
            <Text
              as="p"
              variant={getDeliveryRateColor(stats.notifications.deliveryRate)}
             
              className="text-4xl"
            >
              {stats.notifications.deliveryRate.toFixed(1)}%
            </Text>
          </Card>

          <Card className="p-6 bg-slate-50 border-2 border-slate-200">
            <Text variant="tertiary" size="xs" className="mb-2">Device Attivi</Text>
            <Text as="p" className="text-4xl">
              {stats.devices.active}
            </Text>
            <Text variant="secondary" size="xs" className="mt-2">
              {stats.devices.total} totali
            </Text>
          </Card>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ember" onClick={() => window.location.href = '/debug/notifications'}>
          📊 Dashboard Completa
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/debug/notifications/test'}>
          📤 Invia Test
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
function DebugPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = searchParams.get('tab') || 'stufa';
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleTabChange = (value: string): void => {
    router.push(`/debug?tab=${value}`, { scroll: false });
  };

  const handleManualRefresh = (): void => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Tab shortcuts (1-9)
      if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey) {
        const tabs = ['stufa', 'netatmo', 'hue', 'weather', 'firebase', 'scheduler', 'notifiche', 'network'];
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          e.preventDefault();
          handleTabChange(tabs[index]);
        }
      }
      // Refresh shortcut (Cmd+R or Ctrl+R)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleManualRefresh();
      }
      // Auto-refresh toggle (A)
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setAutoRefresh(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <PageLayout maxWidth="7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Heading level={1} className="flex items-center gap-3">
              <span>🐛</span>
              API Debug Console
            </Heading>
            <Text variant="tertiary" size="sm" className="mt-1">
              Debug e test di tutti gli endpoint API
            </Text>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              title="Cmd+R"
            >
              <RefreshCw size={18} className="mr-2" />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? 'success' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title="Press A"
            >
              {autoRefresh ? '⏸️ Stop' : '▶️ Auto'} (5s)
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/debug/design-system-v2'}
            >
              <Palette size={18} className="mr-2" />
              Design System
            </Button>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded">1-9: Switch tabs</span>
          <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded">Cmd+R: Refresh</span>
          <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded">A: Auto-refresh</span>
        </div>

        <Card variant="glass" className="p-6">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <Tabs.List overflow="scroll">
              <Tabs.Trigger value="stufa" icon={<Flame size={18} />}>Stufa</Tabs.Trigger>
              <Tabs.Trigger value="netatmo" icon={<Thermometer size={18} />}>Netatmo</Tabs.Trigger>
              <Tabs.Trigger value="hue" icon={<Lightbulb size={18} />}>Hue</Tabs.Trigger>
              <Tabs.Trigger value="weather" icon={<Cloud size={18} />}>Weather</Tabs.Trigger>
              <Tabs.Trigger value="firebase" icon={<Database size={18} />}>Firebase</Tabs.Trigger>
              <Tabs.Trigger value="scheduler" icon={<Clock size={18} />}>Scheduler</Tabs.Trigger>
              <Tabs.Trigger value="notifiche" icon={<Bell size={18} />}>Notifiche</Tabs.Trigger>
              <Tabs.Trigger value="network" icon={<Wifi size={18} />}>Network</Tabs.Trigger>
              <Tabs.Trigger value="service-discovery" icon={<Network size={18} />}>Service Discovery</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="stufa">
              <div className="mt-6">
                <StoveTab autoRefresh={autoRefresh} refreshTrigger={refreshTrigger} />
              </div>
            </Tabs.Content>
            <Tabs.Content value="netatmo">
              <div className="mt-6">
                <NetatmoTab autoRefresh={autoRefresh} refreshTrigger={refreshTrigger} />
              </div>
            </Tabs.Content>
            <Tabs.Content value="hue">
              <div className="mt-6">
                <HueTab autoRefresh={autoRefresh} refreshTrigger={refreshTrigger} />
              </div>
            </Tabs.Content>
            <Tabs.Content value="weather">
              <div className="mt-6">
                <WeatherTab autoRefresh={autoRefresh} refreshTrigger={refreshTrigger} />
              </div>
            </Tabs.Content>
            <Tabs.Content value="firebase">
              <div className="mt-6">
                <FirebaseTab autoRefresh={autoRefresh} refreshTrigger={refreshTrigger} />
              </div>
            </Tabs.Content>
            <Tabs.Content value="scheduler">
              <div className="mt-6">
                <SchedulerTab autoRefresh={autoRefresh} refreshTrigger={refreshTrigger} />
              </div>
            </Tabs.Content>
            <Tabs.Content value="notifiche"><NotificheContent /></Tabs.Content>
            <Tabs.Content value="network">
              <div className="mt-6">
                <NetworkTab autoRefresh={autoRefresh} refreshTrigger={refreshTrigger} />
              </div>
            </Tabs.Content>
            <Tabs.Content value="service-discovery">
              <div className="mt-6">
                <FritzboxServiceDiscoveryTab />
              </div>
            </Tabs.Content>
          </Tabs>
        </Card>
      </div>
    </PageLayout>
  );
}

export default function DebugPage() {
  return (
    <Suspense fallback={
      <PageLayout maxWidth="7xl">
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    }>
      <DebugPageContent />
    </Suspense>
  );
}
