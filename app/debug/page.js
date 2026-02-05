'use client';

/**
 * Unified Debug Page
 *
 * Consolidates debug tools into tabbed interface:
 * - Stufa: API debug for Thermorossi stove
 * - Transizioni: Page transitions demo
 * - Log: Firebase debug logs
 * - Notifiche: Notifications dashboard
 * - Meteo: Weather card test
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
import { Flame, Sparkles, FileText, Bell, Cloud, Palette } from 'lucide-react';
import { getErrorInfo } from '@/lib/errorMonitor';

// ============================================================================
// STUFA CONTENT - Debug API Thermorossi
// ============================================================================
function StufaContent() {
  const [status, setStatus] = useState(null);
  const [fanLevel, setFanLevel] = useState(null);
  const [powerLevel, setPowerLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statusRes, fanRes, powerRes] = await Promise.all([
        fetch('/api/stove/status'),
        fetch('/api/stove/getFan'),
        fetch('/api/stove/getPower'),
      ]);

      const [statusData, fanData, powerData] = await Promise.all([
        statusRes.json(),
        fanRes.json(),
        powerRes.json(),
      ]);

      setStatus(statusData);
      setFanLevel(fanData);
      setPowerLevel(powerData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const errorInfo = status?.Error ? getErrorInfo(status.Error) : null;

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <Text variant="tertiary" size="sm">
          Visualizzazione real-time di tutti i parametri API Thermorossi
        </Text>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAllData} disabled={loading}>
            {loading ? '⏳' : '🔄'} Aggiorna
          </Button>
          <Button
            variant={autoRefresh ? 'success' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '⏸️ Stop' : '▶️ Auto'} (3s)
          </Button>
        </div>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Error Code */}
          <Card className={`p-4 ${status.Error !== 0 ? 'bg-ember-500/10 [html:not(.dark)_&]:bg-ember-50 border-2 border-ember-500/30' : 'bg-sage-500/10 [html:not(.dark)_&]:bg-sage-50 border-2 border-sage-500/30'}`}>
            <Text variant="tertiary" size="xs" className="mb-1">Error Code</Text>
            <Text as="p" size="base" weight="bold" variant={status.Error !== 0 ? 'ember' : 'sage'} className="text-3xl">
              {status.Error !== 0 ? `⚠️ ${status.Error}` : '✅ 0'}
            </Text>
            {status.Error !== 0 && errorInfo && (
              <div className="mt-3 pt-3 border-t border-ember-500/30">
                <Text size="sm" weight="semibold" variant="ember" className="mb-1">
                  {errorInfo.description}
                </Text>
                <Text size="xs" variant="ember">
                  Severity: {errorInfo.severity.toUpperCase()}
                </Text>
              </div>
            )}
          </Card>

          {/* Status Code */}
          <Card className="p-4 bg-ocean-500/10 [html:not(.dark)_&]:bg-ocean-50 border-2 border-ocean-500/30">
            <Text variant="tertiary" size="xs" className="mb-1">Status</Text>
            <Text as="p" variant="ocean" weight="bold" className="text-3xl">
              {status.Status} - {status.StatusDescription}
            </Text>
          </Card>
        </div>
      )}

      {/* Fan & Power Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fanLevel && (
          <Card className="p-4 bg-ocean-500/10 [html:not(.dark)_&]:bg-ocean-50 border-2 border-ocean-500/30">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="tertiary" size="xs" className="mb-1">💨 Fan Level</Text>
                <Text as="p" variant="ocean" weight="bold" className="text-3xl">
                  {fanLevel.Result} / 6
                </Text>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map(level => (
                  <div
                    key={level}
                    className={`w-3 h-12 rounded ${level <= fanLevel.Result ? 'bg-ocean-500' : 'bg-slate-700 [html:not(.dark)_&]:bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {powerLevel && (
          <Card className="p-4 bg-flame-500/10 [html:not(.dark)_&]:bg-flame-50 border-2 border-flame-500/30">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="tertiary" size="xs" className="mb-1">⚡ Power Level</Text>
                <Text as="p" weight="bold" className="text-3xl text-flame-400 [html:not(.dark)_&]:text-flame-600">
                  {powerLevel.Result} / 5
                </Text>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <div
                    key={level}
                    className={`w-4 h-14 rounded ${level <= powerLevel.Result ? 'bg-flame-500' : 'bg-slate-700 [html:not(.dark)_&]:bg-slate-200'}`}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Raw JSON */}
      <Card className="p-4 bg-slate-950 [html:not(.dark)_&]:bg-slate-900 border-2 border-slate-700">
        <Text variant="tertiary" size="xs" className="mb-2">📝 Raw JSON Response</Text>
        <pre className="text-xs text-sage-400 font-mono overflow-auto max-h-64">
          {JSON.stringify({ status, fanLevel, powerLevel }, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

// ============================================================================
// TRANSIZIONI CONTENT - Page Transitions Demo
// ============================================================================
function TransizioniContent() {
  return (
    <div className="space-y-6 mt-6">
      <Banner variant="info" icon="✨" title="Demo Transizioni">
        <Text size="sm" className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700 mt-2">
          Per testare le transizioni cinematografiche, visita la pagina dedicata con esempi interattivi.
        </Text>
      </Banner>
      <Button
        variant="ember"
        onClick={() => window.location.href = '/debug/transitions'}
      >
        🎬 Apri Demo Transizioni
      </Button>
    </div>
  );
}

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
// METEO CONTENT - Weather Test
// ============================================================================
function MeteoContent() {
  return (
    <div className="space-y-6 mt-6">
      <Banner variant="info" icon="🌤️" title="Test Meteo">
        <Text size="sm" className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700 mt-2">
          Testa il componente WeatherCard con diversi stati (loading, error, data).
        </Text>
      </Banner>
      <Button
        variant="ember"
        onClick={() => window.location.href = '/debug/weather-test'}
      >
        ☀️ Apri Test Meteo
      </Button>
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

  const handleTabChange = (value) => {
    router.push(`/debug?tab=${value}`, { scroll: false });
  };

  return (
    <PageLayout maxWidth="4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading level={1} className="flex items-center gap-3">
              <span>🐛</span>
              Debug Tools
            </Heading>
            <Text variant="tertiary" size="sm" className="mt-1">
              Strumenti di debug e testing per la smart home
            </Text>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/debug/design-system'}
          >
            <Palette size={18} className="mr-2" />
            Design System
          </Button>
        </div>

        <Card variant="glass" className="p-6">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <Tabs.List overflow="scroll">
              <Tabs.Trigger value="stufa" icon={<Flame size={18} />}>Stufa</Tabs.Trigger>
              <Tabs.Trigger value="transizioni" icon={<Sparkles size={18} />}>Transizioni</Tabs.Trigger>
              <Tabs.Trigger value="log" icon={<FileText size={18} />}>Log</Tabs.Trigger>
              <Tabs.Trigger value="notifiche" icon={<Bell size={18} />}>Notifiche</Tabs.Trigger>
              <Tabs.Trigger value="meteo" icon={<Cloud size={18} />}>Meteo</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="stufa"><StufaContent /></Tabs.Content>
            <Tabs.Content value="transizioni"><TransizioniContent /></Tabs.Content>
            <Tabs.Content value="log"><LogContent /></Tabs.Content>
            <Tabs.Content value="notifiche"><NotificheContent /></Tabs.Content>
            <Tabs.Content value="meteo"><MeteoContent /></Tabs.Content>
          </Tabs>
        </Card>
      </div>
    </PageLayout>
  );
}

export default function DebugPage() {
  return (
    <Suspense fallback={
      <PageLayout maxWidth="4xl">
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    }>
      <DebugPageContent />
    </Suspense>
  );
}
