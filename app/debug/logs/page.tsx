'use client';

import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Heading from '../../components/ui/Heading';
import Text from '../../components/ui/Text';
import PageLayout from '../../components/ui/PageLayout';
import Banner from '../../components/ui/Banner';

interface LogEntry {
  id?: string;
  message: string;
  timestamp: number;
  data?: Record<string, any>;
  userAgent?: string;
}

type LogCategory = 'notifications' | 'fcm' | 'general';

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [category, setCategory] = useState<LogCategory>('notifications');
  const [total, setTotal] = useState<number>(0);

  const fetchLogs = async (): Promise<void> => {
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

  const clearLogs = async (): Promise<void> => {
    if (!confirm('Vuoi davvero cancellare tutti i log di questa categoria?')) return;
    // Per ora non implementiamo il clear, solo refresh
    alert('Clear logs non ancora implementato. Cancella manualmente da Firebase Console.');
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

  const formatTime = (timestamp: number): string => {
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
    <PageLayout maxWidth="4xl">
      <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level={1} className="flex items-center gap-3">
              <span>📋</span>
              Debug Logs
            </Heading>
            <Text variant="tertiary" size="sm" className="mt-1">
              Log di debug salvati su Firebase ({total} totali)
            </Text>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
            >
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

        {/* Category Selector */}
        <div className="flex gap-2 mb-6">
          {(['notifications', 'fcm', 'general'] as LogCategory[]).map((cat) => (
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

        {/* Logs List */}
        <div className="space-y-3">
          {logs.length === 0 ? (
            <Card className="p-6 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 text-center">
              <Text variant="tertiary">
                Nessun log trovato per la categoria &quot;{category}&quot;
              </Text>
              <Text variant="tertiary" size="sm" className="mt-2">
                Prova ad attivare le notifiche da mobile per generare log
              </Text>
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
                  <Text size="sm">
                    {log.message}
                  </Text>
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

                {log.userAgent && (
                  <Text variant="tertiary" size="xs" className="mt-2 truncate" title={log.userAgent}>
                    UA: {log.userAgent.substring(0, 80)}...
                  </Text>
                )}
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Info */}
      <Banner
        variant="info"
        icon="💡"
        title="Come Usare il Debug"
      >
        <ul className="space-y-2 ml-4 mt-2">
          <li><Text size="sm" className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700">• <strong>Notifiche</strong>: Quando attivi notifiche da mobile, vedrai i log qui</Text></li>
          <li><Text size="sm" className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700">• <strong>VAPID_KEY</strong>: Verifica che il campo &quot;VAPID_KEY_exists&quot; sia true</Text></li>
          <li><Text size="sm" className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700">• <strong>Auto-refresh</strong>: Attiva mentre testi da mobile</Text></li>
          <li><Text size="sm" className="text-ocean-300 [html:not(.dark)_&]:text-ocean-700">• <strong>Errori</strong>: Evidenziati in rosso con dettagli completi</Text></li>
        </ul>
      </Banner>

      {/* Back Links */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            🏠 Home
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/debug'}>
            🔍 Debug API
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/settings'}>
            ⚙️ Settings
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/log'}>
            📝 Action Log
          </Button>
        </div>
      </Card>
      </div>
    </PageLayout>
  );
}
