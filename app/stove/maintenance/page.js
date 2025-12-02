'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { getMaintenanceData, updateTargetHours, confirmCleaning } from '@/lib/maintenanceService';
import { formatHoursToHHMM } from '@/lib/formatUtils';

export const dynamic = 'force-dynamic';

export default function MaintenancePage() {
  const { user, isLoading } = useUser();
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [targetHours, setTargetHours] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadMaintenanceData();
    }
  }, [user, isLoading]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showResetConfirm) {
        setShowResetConfirm(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showResetConfirm]);

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

  const handleResetRequest = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await confirmCleaning(user);
      setSaveMessage({ type: 'success', text: 'Contatore azzerato con successo' });
      await loadMaintenanceData();
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Error resetting maintenance:', error);
      setSaveMessage({ type: 'error', text: 'Errore durante il reset' });
    } finally {
      setIsResetting(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-600">Caricamento...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card liquid className="p-8 text-center">
          <p className="text-neutral-600 mb-4">Accesso non autorizzato</p>
          <Button liquid href="/auth/login" variant="primary">Accedi</Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white mb-2">🔧 Manutenzione</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Configura gli intervalli di pulizia della stufa</p>
        </div>

        {/* Current Status Card */}
        <Card liquidPro className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-4">📊 Stato Attuale</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-white/[0.15] dark:ring-white/[0.08] ring-inset rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.12] dark:before:from-white/[0.08] before:to-transparent before:pointer-events-none">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 relative z-10">Ore di Utilizzo</div>
              <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 relative z-10">
                {formatHoursToHHMM(maintenanceData?.currentHours || 0)}
              </div>
            </div>

            <div className="bg-primary-500/[0.08] dark:bg-primary-500/[0.15] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-primary-500/20 dark:ring-primary-500/30 ring-inset rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-500/[0.12] dark:before:from-primary-500/[0.20] before:to-transparent before:pointer-events-none">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 relative z-10">Ore Target</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 relative z-10">
                {formatHoursToHHMM(maintenanceData?.targetHours || 50)}
              </div>
            </div>

            <div className="bg-success-500/[0.08] dark:bg-success-500/[0.15] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-success-500/20 dark:ring-success-500/30 ring-inset rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-success-500/[0.12] dark:before:from-success-500/[0.20] before:to-transparent before:pointer-events-none">
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1 relative z-10">Ore Rimanenti</div>
              <div className="text-2xl font-bold text-success-600 dark:text-success-400 relative z-10">
                {formatHoursToHHMM(Math.max(0, (maintenanceData?.targetHours || 50) - (maintenanceData?.currentHours || 0)))}
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button liquid
              variant="danger"
              onClick={handleResetRequest}
              disabled={isResetting || (maintenanceData?.currentHours || 0) === 0}
              className="w-full"
            >
              🔄 Azzera Contatore Manutenzione
            </Button>
          </div>

          {maintenanceData?.lastCleanedAt && (
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
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
        <Card liquidPro className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-4">⚙️ Configurazione</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="targetHours" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
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
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSaving}
              />
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Default consigliato: 50 ore. Range: 1-1000 ore.
              </p>
            </div>

            {/* Quick presets */}
            <div>
              <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Preselezioni rapide:</div>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 75, 100, 150, 200].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setTargetHours(hours)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      targetHours === hours
                        ? 'bg-primary-600 text-white shadow-liquid-sm'
                        : 'bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl text-neutral-700 dark:text-neutral-300 hover:bg-white/[0.12] dark:hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/[0.15] dark:ring-white/[0.08] ring-inset'
                    }`}
                    disabled={isSaving}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            <Button liquid
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
                  ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-400'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400'
              }`}>
                {saveMessage.text}
              </div>
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card liquidPro className="p-6 sm:p-8 bg-info-50/50 dark:bg-info-900/10 border border-info-200 dark:border-info-800">
          <h3 className="font-semibold text-info-900 dark:text-info-300 mb-2">ℹ️ Come Funziona</h3>
          <ul className="text-sm text-info-800 dark:text-info-400 space-y-1">
            <li>• Il contatore aumenta automaticamente ogni minuto quando la stufa è in funzione (status WORK)</li>
            <li>• Al raggiungimento delle ore impostate, apparirà un banner di richiesta pulizia</li>
            <li>• La stufa non potrà essere accesa (né manualmente né automaticamente) finché non confermi la pulizia</li>
            <li>• Dopo la conferma, il contatore si azzererà automaticamente</li>
          </ul>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <Card liquidPro className="max-w-md w-full p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">🔄 Conferma Reset</h2>
            <p className="text-neutral-700 dark:text-neutral-300 mb-6">
              Sei sicuro di voler azzerare il contatore di manutenzione?
            </p>
            <div className="space-y-2 mb-6 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
              <p className="text-sm text-warning-800 dark:text-warning-400">
                ⚠️ Questa operazione:
              </p>
              <ul className="text-sm text-warning-700 dark:text-warning-400 space-y-1 ml-4">
                <li>• Azzererà il contatore a 0.0 ore</li>
                <li>• Registrerà la data e ora della pulizia</li>
                <li>• Sbloccherà l&apos;accensione della stufa se era bloccata</li>
                <li>• Creerà un log dell&apos;operazione</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button liquid
                variant="outline"
                onClick={handleCancelReset}
                disabled={isResetting}
                className="flex-1"
              >
                ✕ Annulla
              </Button>
              <Button liquid
                variant="danger"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="flex-1"
              >
                {isResetting ? '⏳ Attendere...' : '✓ Conferma Reset'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
