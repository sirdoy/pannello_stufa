'use client';

import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Heading from '../components/ui/Heading';
import Text from '../components/ui/Text';
import { getErrorInfo } from '@/lib/errorMonitor';

export default function DebugPage() {
  const [status, setStatus] = useState(null);
  const [fanLevel, setFanLevel] = useState(null);
  const [powerLevel, setPowerLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all endpoints
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level={1} className="flex items-center gap-3">
              <span>🔍</span>
              Debug API Stufa
            </Heading>
            <Text variant="tertiary" size="sm" className="mt-1">
              Visualizzazione real-time di tutti i parametri API Thermorossi
            </Text>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchAllData}
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'} Aggiorna
            </Button>
            <Button
              variant={autoRefresh ? 'success' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? '⏸️ Stop' : '▶️ Auto'} Refresh (3s)
            </Button>
          </div>
        </div>

        {/* Status Response */}
        <div className="space-y-4">
          <Heading level={2} size="xl">📊 Status API Response</Heading>

          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Error Code */}
              <Card className={`p-4 ${status.Error !== 0 ? 'bg-ember-50 [html:not(.dark)_&]:bg-ember-50 border-2 border-ember-300 [html:not(.dark)_&]:border-ember-300' : 'bg-sage-50 [html:not(.dark)_&]:bg-sage-50 border-2 border-sage-300 [html:not(.dark)_&]:border-sage-300'}`}>
                <Text variant="tertiary" size="xs" className="mb-1">Error Code</Text>
                <Text as="p" size="base" weight="bold" variant={status.Error !== 0 ? 'ember' : 'sage'} className="text-3xl">
                  {status.Error !== 0 ? `⚠️ ${status.Error}` : '✅ 0'}
                </Text>
                {status.Error !== 0 && errorInfo && (
                  <div className="mt-3 pt-3 border-t border-ember-200 [html:not(.dark)_&]:border-ember-200">
                    <Text size="sm" weight="semibold" variant="ember" className="mb-1">
                      {errorInfo.description}
                    </Text>
                    <Text size="xs" variant="ember">
                      Severity: {errorInfo.severity.toUpperCase()}
                    </Text>
                  </div>
                )}
              </Card>

              {/* Error Description */}
              <Card className="p-4 bg-slate-50 [html:not(.dark)_&]:bg-slate-50 border-2 border-slate-200 [html:not(.dark)_&]:border-slate-200">
                <Text variant="tertiary" size="xs" className="mb-1">Error Description</Text>
                <Text size="lg" weight="bold">
                  {status.ErrorDescription || '(vuoto)'}
                </Text>
              </Card>

              {/* Status Code */}
              <Card className="p-4 bg-ocean-50 [html:not(.dark)_&]:bg-ocean-50 border-2 border-ocean-200 [html:not(.dark)_&]:border-ocean-200">
                <Text variant="tertiary" size="xs" className="mb-1">Status Code</Text>
                <Text as="p" variant="ocean" weight="bold" className="text-3xl">
                  {status.Status}
                </Text>
              </Card>

              {/* Status Description */}
              <Card className="p-4 bg-flame-50 [html:not(.dark)_&]:bg-flame-50 border-2 border-flame-200 [html:not(.dark)_&]:border-flame-200">
                <Text variant="tertiary" size="xs" className="mb-1">Status Description</Text>
                <Text as="p" className="text-3xl font-bold text-flame-400 [html:not(.dark)_&]:text-flame-600">
                  {status.StatusDescription}
                </Text>
              </Card>

              {/* Success */}
              <Card className="p-4 bg-slate-50 [html:not(.dark)_&]:bg-slate-50 border-2 border-slate-200 [html:not(.dark)_&]:border-slate-200">
                <Text variant="tertiary" size="xs" className="mb-1">API Success</Text>
                <Text as="p" weight="bold" className="text-2xl">
                  {status.Success ? '✅ true' : '❌ false'}
                </Text>
              </Card>
            </div>
          )}

          {/* Fan Level */}
          <Heading level={2} size="xl" className="mt-8">💨 Fan Level</Heading>
          {fanLevel && (
            <Card className="p-4 bg-ocean-50 [html:not(.dark)_&]:bg-ocean-50 border-2 border-ocean-200 [html:not(.dark)_&]:border-ocean-200">
              <div className="flex items-center justify-between">
                <div>
                  <Text variant="tertiary" size="xs" className="mb-1">Current Level</Text>
                  <Text as="p" variant="ocean" weight="bold" className="text-3xl">
                    {fanLevel.Result} / 6
                  </Text>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map(level => (
                    <div
                      key={level}
                      className={`w-3 h-12 rounded ${
                        level <= fanLevel.Result ? 'bg-ocean-500' : 'bg-slate-200 [html:not(.dark)_&]:bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Power Level */}
          <Heading level={2} size="xl" className="mt-8">⚡ Power Level</Heading>
          {powerLevel && (
            <Card className="p-4 bg-flame-50 [html:not(.dark)_&]:bg-flame-50 border-2 border-flame-200 [html:not(.dark)_&]:border-flame-200">
              <div className="flex items-center justify-between">
                <div>
                  <Text variant="tertiary" size="xs" className="mb-1">Current Level</Text>
                  <Text as="p" weight="bold" className="text-3xl text-flame-400 [html:not(.dark)_&]:text-flame-600">
                    {powerLevel.Result} / 5
                  </Text>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      className={`w-4 h-14 rounded ${
                        level <= powerLevel.Result ? 'bg-flame-500' : 'bg-slate-200 [html:not(.dark)_&]:bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Raw JSON */}
          <Heading level={2} size="xl" className="mt-8">📝 Raw JSON Response</Heading>
          <Card className="p-4 bg-slate-900 [html:not(.dark)_&]:bg-slate-900 border-2 border-slate-700 [html:not(.dark)_&]:border-slate-700">
            <pre className="text-xs text-sage-400 font-mono overflow-auto">
              {JSON.stringify({ status, fanLevel, powerLevel }, null, 2)}
            </pre>
          </Card>

          {/* Info Box */}
          <Card className="p-6 bg-warning-50 [html:not(.dark)_&]:bg-warning-50 border-2 border-warning-200 [html:not(.dark)_&]:border-warning-200 mt-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💡</span>
              <div>
                <Heading level={3} size="lg" variant="warning" className="mb-2">Come Funziona il Rilevamento Errori</Heading>
                <ul className="space-y-2 ml-4">
                  <li><Text size="sm" variant="warning">• <strong>Polling automatico</strong>: La homepage interroga l&apos;API ogni 5 secondi</Text></li>
                  <li><Text size="sm" variant="warning">• <strong>Error Code</strong>: Quando diverso da 0, viene mostrato un banner rosso pulsante</Text></li>
                  <li><Text size="sm" variant="warning">• <strong>Suggerimenti</strong>: Database con 23 codici errore comuni e soluzioni</Text></li>
                  <li><Text size="sm" variant="warning">• <strong>Logging</strong>: Tutti gli errori vengono salvati su Firebase per storico</Text></li>
                  <li><Text size="sm" variant="warning">• <strong>Notifiche</strong>: Browser notification per nuovi errori rilevati</Text></li>
                </ul>
                <div className="mt-4 p-3 bg-warning-100 [html:not(.dark)_&]:bg-warning-100 rounded-lg">
                  <Text size="sm" weight="semibold" variant="warning">
                    ⚠️ Nota: Se il display della stufa mostra un errore ma l&apos;API riporta Error: 0,
                    significa che l&apos;errore è locale e non sincronizzato con il cloud Thermorossi.
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <Heading level={2} size="xl" className="mb-4">🔗 Link Utili</Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            🏠 Homepage
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/errors'}>
            📋 Storico Errori
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/log'}>
            📝 Log Azioni
          </Button>
        </div>
      </Card>
    </div>
  );
}
