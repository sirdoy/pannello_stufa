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

import { Suspense, useState, useEffect, useCallback } from 'react';
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
// NOTIFICHE CONTENT - Web Push sent by the Pi (ROADMAP M48)
// ============================================================================
interface PushStats {
  devices: number;
  failingDevices: number;
  sent90d: number;
}

function NotificheContent() {
  const [stats, setStats] = useState<PushStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, historyRes] = await Promise.all([
        fetch('/api/v1/notifications/subscriptions'),
        fetch('/api/v1/notifications/history?limit=1'),
      ]);
      if (!subsRes.ok || !historyRes.ok) throw new Error('Failed to fetch push stats');
      const subs = (await subsRes.json()) as { items: Array<{ failure_count: number }> };
      const history = (await historyRes.json()) as { total_count: number };
      setStats({
        devices: subs.items.length,
        failingDevices: subs.items.filter((d) => d.failure_count > 0).length,
        sent90d: history.total_count,
      });
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

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <Text variant="tertiary" size="sm">
          Web Push inviate dal Pi
        </Text>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          {loading ? '⏳' : '🔄'} Refresh
        </Button>
      </div>

      {error && (
        <Banner variant="error" title={`Errore: ${error}`} />
      )}

      {stats && !loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-2 border-ocean-200 bg-ocean-50 p-6">
            <Text variant="tertiary" size="xs" className="mb-2">Notifiche (90 giorni)</Text>
            <Text variant="tertiary" className="text-4xl">
              {stats.sent90d}
            </Text>
          </Card>

          <Card className="border-2 border-slate-200 bg-slate-50 p-6">
            <Text variant="tertiary" size="xs" className="mb-2">Dispositivi registrati</Text>
            <Text as="p" className="text-4xl">
              {stats.devices}
            </Text>
          </Card>

          <Card className="border-2 border-slate-200 bg-slate-50 p-6">
            <Text variant="tertiary" size="xs" className="mb-2">Dispositivi con errori</Text>
            <Text as="p" variant={stats.failingDevices > 0 ? 'ember' : 'sage'} className="text-4xl">
              {stats.failingDevices}
            </Text>
          </Card>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="ember" onClick={() => window.location.href = '/settings/notifications'}>
          🔔 Impostazioni notifiche
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

  const handleTabChange = useCallback((value: string): void => {
    router.push(`/debug?tab=${value}`, { scroll: false });
  }, [router]);

  const handleManualRefresh = useCallback((): void => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

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
  }, [handleTabChange, handleManualRefresh]);

  return (
    <PageLayout maxWidth="7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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
          <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">1-9: Switch tabs</span>
          <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">Cmd+R: Refresh</span>
          <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">A: Auto-refresh</span>
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
