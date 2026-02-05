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
 * - Log: Firebase debug logs
 * - Notifiche: Notifications dashboard
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
import { Flame, Thermometer, Lightbulb, Cloud, Database, Clock, FileText, Bell, Palette, RefreshCw } from 'lucide-react';

// API Tab Components
import StoveTab from '@/app/debug/components/tabs/StoveTab';
import NetatmoTab from '@/app/debug/components/tabs/NetatmoTab';
import HueTab from '@/app/debug/components/tabs/HueTab';
import WeatherTab from '@/app/debug/components/tabs/WeatherTab';
import FirebaseTab from '@/app/debug/components/tabs/FirebaseTab';
import SchedulerTab from '@/app/debug/components/tabs/SchedulerTab';

// ============================================================================
// LOG CONTENT - Debug Logs
// ============================================================================
function LogContent() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [category, setCategory] = useState('notifications');
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/debug/log?category=${category}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, category]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          {['notifications', 'fcm', 'general'].map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'ember' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            {loading ? '...' : '🔄'} Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'success' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '⏸️ Stop' : '▶️ Auto'} (5s)
          </Button>
        </div>
      </div>

      <Text variant="tertiary" size="sm">
        {total} log totali per categoria &quot;{category}&quot;
      </Text>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {logs.length === 0 ? (
          <Card className="p-6 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 text-center">
            <Text variant="tertiary">Nessun log trovato</Text>
          </Card>
        ) : (
          logs.map((log, index) => (
            <Card
              key={log.id || index}
              className={`p-4 ${
                log.message.includes('Errore')
                  ? 'border-l-4 border-l-ember-500 bg-ember-500/10 [html:not(.dark)_&]:bg-ember-50'
                  : log.message.includes('successo')
                  ? 'border-l-4 border-l-sage-500 bg-sage-500/10 [html:not(.dark)_&]:bg-sage-50'
                  : 'bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <Text weight="semibold" size="sm">{log.message}</Text>
                <Text variant="tertiary" size="xs" className="whitespace-nowrap ml-4">
                  {formatTime(log.timestamp)}
                </Text>
              </div>
              {log.data && Object.keys(log.data).length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-ocean-400 hover:text-ocean-300">
                    Mostra dati ({Object.keys(log.data).length} campi)
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-sage-400 font-mono overflow-auto max-h-64">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </details>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// NOTIFICHE CONTENT - Notifications Dashboard
// ============================================================================
function NotificheContent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getDeliveryRateColor = (rate) => {
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
          <Card className="p-6 bg-ocean-50 [html:not(.dark)_&]:bg-ocean-50 border-2 border-ocean-200">
            <Text variant="tertiary" size="xs" className="mb-2">Notifiche Oggi</Text>
            <Text as="p" variant="ocean" weight="bold" className="text-4xl">
              {stats.notifications.total}
            </Text>
          </Card>

          <Card className={`p-6 ${
            getDeliveryRateColor(stats.notifications.deliveryRate) === 'sage'
              ? 'bg-sage-50 [html:not(.dark)_&]:bg-sage-50 border-2 border-sage-300'
              : getDeliveryRateColor(stats.notifications.deliveryRate) === 'warning'
              ? 'bg-warning-50 [html:not(.dark)_&]:bg-warning-50 border-2 border-warning-300'
              : 'bg-ember-50 [html:not(.dark)_&]:bg-ember-50 border-2 border-ember-300'
          }`}>
            <Text variant="tertiary" size="xs" className="mb-2">Delivery Rate</Text>
            <Text
              as="p"
              variant={getDeliveryRateColor(stats.notifications.deliveryRate)}
              weight="bold"
              className="text-4xl"
            >
              {stats.notifications.deliveryRate.toFixed(1)}%
            </Text>
          </Card>

          <Card className="p-6 bg-slate-50 [html:not(.dark)_&]:bg-slate-50 border-2 border-slate-200">
            <Text variant="tertiary" size="xs" className="mb-2">Device Attivi</Text>
            <Text as="p" weight="bold" className="text-4xl">
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
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (value) => {
    router.push(`/debug?tab=${value}`, { scroll: false });
  };

  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tab shortcuts (1-8)
      if (e.key >= '1' && e.key <= '8' && !e.metaKey && !e.ctrlKey) {
        const tabs = ['stufa', 'netatmo', 'hue', 'weather', 'firebase', 'scheduler', 'log', 'notifiche'];
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
    <PageLayout maxWidth="6xl">
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
              onClick={() => window.location.href = '/debug/design-system'}
            >
              <Palette size={18} className="mr-2" />
              Design System
            </Button>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 [html:not(.dark)_&]:text-slate-600">
          <span className="px-2 py-1 bg-slate-800 [html:not(.dark)_&]:bg-slate-100 rounded">1-8: Switch tabs</span>
          <span className="px-2 py-1 bg-slate-800 [html:not(.dark)_&]:bg-slate-100 rounded">Cmd+R: Refresh</span>
          <span className="px-2 py-1 bg-slate-800 [html:not(.dark)_&]:bg-slate-100 rounded">A: Auto-refresh</span>
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
              <Tabs.Trigger value="log" icon={<FileText size={18} />}>Log</Tabs.Trigger>
              <Tabs.Trigger value="notifiche" icon={<Bell size={18} />}>Notifiche</Tabs.Trigger>
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
            <Tabs.Content value="log"><LogContent /></Tabs.Content>
            <Tabs.Content value="notifiche"><NotificheContent /></Tabs.Content>
          </Tabs>
        </Card>
      </div>
    </PageLayout>
  );
}

export default function DebugPage() {
  return (
    <Suspense fallback={
      <PageLayout maxWidth="6xl">
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    }>
      <DebugPageContent />
    </Suspense>
  );
}
