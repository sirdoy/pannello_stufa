'use client';

import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
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
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
              <span>🔍</span>
              Debug API Stufa
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Visualizzazione real-time di tutti i parametri API Thermorossi
            </p>
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
          <h2 className="text-xl font-bold text-neutral-900">📊 Status API Response</h2>

          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Error Code */}
              <Card className={`p-4 ${status.Error !== 0 ? 'bg-primary-50 border-2 border-primary-300' : 'bg-success-50 border-2 border-success-300'}`}>
                <p className="text-xs text-neutral-500 mb-1">Error Code</p>
                <p className={`text-3xl font-bold ${status.Error !== 0 ? 'text-primary-600' : 'text-success-600'}`}>
                  {status.Error !== 0 ? `⚠️ ${status.Error}` : '✅ 0'}
                </p>
                {status.Error !== 0 && errorInfo && (
                  <div className="mt-3 pt-3 border-t border-primary-200">
                    <p className="text-sm font-semibold text-primary-800 mb-1">
                      {errorInfo.description}
                    </p>
                    <p className="text-xs text-primary-600">
                      Severity: {errorInfo.severity.toUpperCase()}
                    </p>
                  </div>
                )}
              </Card>

              {/* Error Description */}
              <Card className="p-4 bg-neutral-50 border-2 border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">Error Description</p>
                <p className="text-lg font-bold text-neutral-900">
                  {status.ErrorDescription || '(vuoto)'}
                </p>
              </Card>

              {/* Status Code */}
              <Card className="p-4 bg-info-50 border-2 border-info-200">
                <p className="text-xs text-neutral-500 mb-1">Status Code</p>
                <p className="text-3xl font-bold text-info-600">
                  {status.Status}
                </p>
              </Card>

              {/* Status Description */}
              <Card className="p-4 bg-accent-50 border-2 border-accent-200">
                <p className="text-xs text-neutral-500 mb-1">Status Description</p>
                <p className="text-3xl font-bold text-accent-600">
                  {status.StatusDescription}
                </p>
              </Card>

              {/* Success */}
              <Card className="p-4 bg-neutral-50 border-2 border-neutral-200">
                <p className="text-xs text-neutral-500 mb-1">API Success</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {status.Success ? '✅ true' : '❌ false'}
                </p>
              </Card>
            </div>
          )}

          {/* Fan Level */}
          <h2 className="text-xl font-bold text-neutral-900 mt-8">💨 Fan Level</h2>
          {fanLevel && (
            <Card className="p-4 bg-info-50 border-2 border-info-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Current Level</p>
                  <p className="text-3xl font-bold text-info-600">
                    {fanLevel.Result} / 6
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map(level => (
                    <div
                      key={level}
                      className={`w-3 h-12 rounded ${
                        level <= fanLevel.Result ? 'bg-info-500' : 'bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Power Level */}
          <h2 className="text-xl font-bold text-neutral-900 mt-8">⚡ Power Level</h2>
          {powerLevel && (
            <Card className="p-4 bg-accent-50 border-2 border-accent-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Current Level</p>
                  <p className="text-3xl font-bold text-accent-600">
                    {powerLevel.Result} / 5
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div
                      key={level}
                      className={`w-4 h-14 rounded ${
                        level <= powerLevel.Result ? 'bg-accent-500' : 'bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Raw JSON */}
          <h2 className="text-xl font-bold text-neutral-900 mt-8">📝 Raw JSON Response</h2>
          <Card className="p-4 bg-neutral-900 border-2 border-neutral-700">
            <pre className="text-xs text-success-400 font-mono overflow-auto">
              {JSON.stringify({ status, fanLevel, powerLevel }, null, 2)}
            </pre>
          </Card>

          {/* Info Box */}
          <Card className="p-6 bg-warning-50 border-2 border-warning-200 mt-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💡</span>
              <div>
                <h3 className="text-lg font-bold text-warning-800 mb-2">Come Funziona il Rilevamento Errori</h3>
                <ul className="text-sm text-warning-700 space-y-2 ml-4">
                  <li>• <strong>Polling automatico</strong>: La homepage interroga l&apos;API ogni 5 secondi</li>
                  <li>• <strong>Error Code</strong>: Quando diverso da 0, viene mostrato un banner rosso pulsante</li>
                  <li>• <strong>Suggerimenti</strong>: Database con 23 codici errore comuni e soluzioni</li>
                  <li>• <strong>Logging</strong>: Tutti gli errori vengono salvati su Firebase per storico</li>
                  <li>• <strong>Notifiche</strong>: Browser notification per nuovi errori rilevati</li>
                </ul>
                <div className="mt-4 p-3 bg-warning-100 rounded-lg">
                  <p className="text-sm font-semibold text-warning-800">
                    ⚠️ Nota: Se il display della stufa mostra un errore ma l&apos;API riporta Error: 0,
                    significa che l&apos;errore è locale e non sincronizzato con il cloud Thermorossi.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">🔗 Link Utili</h2>
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
