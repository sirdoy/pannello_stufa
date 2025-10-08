'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getMaintenanceData, updateTargetHours } from '@/lib/maintenanceService';

export const dynamic = 'force-dynamic';

export default function MaintenancePage() {
  const { user, isLoading } = useUser();
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [targetHours, setTargetHours] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && user) {
      loadMaintenanceData();
    }
  }, [user, isLoading]);

  const loadMaintenanceData = async () => {
    try {
      const data = await getMaintenanceData();
      setMaintenanceData(data);
      setTargetHours(data.targetHours);
      setLoading(false);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (targetHours < 1 || targetHours > 1000) {
      setSaveMessage({ type: 'error', text: 'Inserisci un valore tra 1 e 1000 ore' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateTargetHours(targetHours);
      setSaveMessage({ type: 'success', text: 'Configurazione salvata con successo' });
      await loadMaintenanceData(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving target hours:', error);
      setSaveMessage({ type: 'error', text: 'Errore nel salvataggio' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-orange-100">
        <div className="text-gray-600">Caricamento...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-orange-100">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">Accesso non autorizzato</p>
          <Button href="/api/auth/login" variant="primary">Accedi</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🔧 Manutenzione</h1>
          <p className="text-gray-600">Configura gli intervalli di pulizia della stufa</p>
        </div>

        {/* Current Status Card */}
        <Card glass className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Stato Attuale</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Ore di Utilizzo</div>
              <div className="text-2xl font-bold text-gray-800">
                {maintenanceData?.currentHours?.toFixed(1) || '0.0'}h
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Ore Target</div>
              <div className="text-2xl font-bold text-primary-600">
                {maintenanceData?.targetHours || '50'}h
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Ore Rimanenti</div>
              <div className="text-2xl font-bold text-success-600">
                {Math.max(0, (maintenanceData?.targetHours || 50) - (maintenanceData?.currentHours || 0)).toFixed(1)}h
              </div>
            </div>
          </div>

          {maintenanceData?.lastCleanedAt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Ultima pulizia: {new Date(maintenanceData.lastCleanedAt).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Configuration Card */}
        <Card glass className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚙️ Configurazione</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="targetHours" className="block text-sm font-medium text-gray-700 mb-2">
                Ore di utilizzo prima della pulizia
              </label>
              <input
                id="targetHours"
                type="number"
                min="1"
                max="1000"
                step="1"
                value={targetHours}
                onChange={(e) => setTargetHours(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500 mt-1">
                Default consigliato: 50 ore. Range: 1-1000 ore.
              </p>
            </div>

            {/* Quick presets */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Preselezioni rapide:</div>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 75, 100, 150, 200].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setTargetHours(hours)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      targetHours === hours
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/70 text-gray-700 hover:bg-white'
                    }`}
                    disabled={isSaving}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || targetHours === maintenanceData?.targetHours}
              className="w-full"
            >
              {isSaving ? '💾 Salvataggio...' : '💾 Salva Configurazione'}
            </Button>

            {saveMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                saveMessage.type === 'success'
                  ? 'bg-success-100 text-success-800'
                  : 'bg-danger-100 text-danger-800'
              }`}>
                {saveMessage.text}
              </div>
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Come Funziona</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Il contatore aumenta automaticamente ogni minuto quando la stufa è in funzione (status WORK)</li>
            <li>• Al raggiungimento delle ore impostate, apparirà un banner di richiesta pulizia</li>
            <li>• La stufa non potrà essere accesa (né manualmente né automaticamente) finché non confermi la pulizia</li>
            <li>• Dopo la conferma, il contatore si azzererà automaticamente</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
