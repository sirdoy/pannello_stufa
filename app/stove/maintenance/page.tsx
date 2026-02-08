'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import Input from '@/app/components/ui/Input';
import { getMaintenanceData, updateTargetHours, confirmCleaning } from '@/lib/maintenanceService';
import { formatHoursToHHMM } from '@/lib/formatUtils';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';

export const dynamic = 'force-dynamic';

interface MaintenanceData {
  currentHours: number;
  targetHours: number;
  lastCleanedAt?: number;
}

interface SaveMessage {
  type: 'success' | 'error';
  text: string;
}

export default function MaintenancePage() {
  const { user, isLoading } = useUser();
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const [targetHours, setTargetHours] = useState<number>(50);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadMaintenanceData();
    }
  }, [user, isLoading]);

  const loadMaintenanceData = async (): Promise<void> => {
    try {
      const data: any = await getMaintenanceData();
      setMaintenanceData(data);
      setTargetHours(data.targetHours);
      setLoading(false);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
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

  const handleResetRequest = (): void => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async (): Promise<void> => {
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

  const handleCancelReset = (): void => {
    setShowResetConfirm(false);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text variant="tertiary">Caricamento...</Text>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card variant="glass" className="p-8 text-center">
          <Text variant="tertiary" className="mb-4">Accesso non autorizzato</Text>
          <Link href="/auth/login">
            <Button variant="ember">Accedi</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Heading level={1} size="3xl" className="mb-2">🔧 Manutenzione</Heading>
          <Text variant="tertiary">Configura gli intervalli di pulizia della stufa</Text>
        </div>

        {/* Current Status Card */}
        <Card variant="glass" className="p-6 sm:p-8">
          <Heading level={2} size="xl" className="mb-4">📊 Stato Attuale</Heading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.05] [html:not(.dark)_&]:bg-white/[0.08] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-white/[0.08] [html:not(.dark)_&]:ring-white/[0.15] ring-inset rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.08] [html:not(.dark)_&]:before:from-white/[0.12] before:to-transparent before:pointer-events-none">
              <Text variant="tertiary" size="sm" className="mb-1 relative z-10">Ore di Utilizzo</Text>
              <Heading level={3} size="2xl" className="relative z-10">
                {formatHoursToHHMM(maintenanceData?.currentHours || 0)}
              </Heading>
            </div>

            <div className="bg-ember-500/[0.15] [html:not(.dark)_&]:bg-ember-500/[0.08] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-ember-500/30 [html:not(.dark)_&]:ring-ember-500/20 ring-inset rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-ember-500/[0.20] [html:not(.dark)_&]:before:from-ember-500/[0.12] before:to-transparent before:pointer-events-none">
              <Text variant="tertiary" size="sm" className="mb-1 relative z-10">Ore Target</Text>
              <Heading level={3} size="2xl" variant="ember" className="relative z-10">
                {formatHoursToHHMM(maintenanceData?.targetHours || 50)}
              </Heading>
            </div>

            <div className="bg-sage-500/[0.15] [html:not(.dark)_&]:bg-sage-500/[0.08] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-sage-500/30 [html:not(.dark)_&]:ring-sage-500/20 ring-inset rounded-lg p-4 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-sage-500/[0.20] [html:not(.dark)_&]:before:from-sage-500/[0.12] before:to-transparent before:pointer-events-none">
              <Text variant="tertiary" size="sm" className="mb-1 relative z-10">Ore Rimanenti</Text>
              <Heading level={3} size="2xl" variant="sage" className="relative z-10">
                {formatHoursToHHMM(Math.max(0, (maintenanceData?.targetHours || 50) - (maintenanceData?.currentHours || 0)))}
              </Heading>
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-4 pt-4 border-t border-slate-700 [html:not(.dark)_&]:border-slate-200">
            <Button
              variant="danger"
              onClick={handleResetRequest}
              disabled={isResetting || (maintenanceData?.currentHours || 0) === 0}
              className="w-full"
            >
              🔄 Azzera Contatore Manutenzione
            </Button>
          </div>

          {maintenanceData?.lastCleanedAt && (
            <div className="mt-4 pt-4 border-t border-slate-700 [html:not(.dark)_&]:border-slate-200">
              <Text variant="tertiary" size="sm">
                Ultima pulizia: {new Date(maintenanceData.lastCleanedAt).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </div>
          )}
        </Card>

        {/* Configuration Card */}
        <Card variant="glass" className="p-6 sm:p-8">
          <Heading level={2} size="xl" className="mb-4">⚙️ Configurazione</Heading>

          <div className="space-y-4">
            <div>
              <Input
                id="targetHours"
                type="number"
                label="Ore di utilizzo prima della pulizia"
                icon="⏱️"
                variant="default"
                min="1"
                max="1000"
                step="1"
                value={targetHours}
                onChange={(e) => setTargetHours(parseFloat(e.target.value) || 0)}
                disabled={isSaving}
              />
              <Text variant="tertiary" size="sm" className="mt-1">
                Default consigliato: 50 ore. Range: 1-1000 ore.
              </Text>
            </div>

            {/* Quick presets */}
            <div>
              <Text variant="secondary" size="sm" className="mb-2">Preselezioni rapide:</Text>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 75, 100, 150, 200].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setTargetHours(hours)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      targetHours === hours
                        ? 'bg-ember-600 text-white shadow-liquid-sm'
                        : 'bg-white/[0.08] [html:not(.dark)_&]:bg-white/[0.08] bg-white/[0.05] backdrop-blur-2xl text-slate-300 [html:not(.dark)_&]:text-slate-700 hover:bg-white/[0.12] [html:not(.dark)_&]:hover:bg-white/[0.12] hover:bg-white/[0.08] shadow-liquid-sm ring-1 ring-white/[0.15] [html:not(.dark)_&]:ring-white/[0.15] ring-white/[0.08] ring-inset'
                    }`}
                    disabled={isSaving}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="ember"
              onClick={handleSave}
              disabled={isSaving || targetHours === maintenanceData?.targetHours}
              className="w-full"
            >
              {isSaving ? '💾 Salvataggio...' : '💾 Salva Configurazione'}
            </Button>

            {saveMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                saveMessage.type === 'success'
                  ? 'bg-sage-100 [html:not(.dark)_&]:bg-sage-100 bg-sage-900/30 text-sage-400 [html:not(.dark)_&]:text-sage-800'
                  : 'bg-ember-100 [html:not(.dark)_&]:bg-ember-100 bg-ember-900/30 text-ember-400 [html:not(.dark)_&]:text-ember-800'
              }`}>
                {saveMessage.text}
              </div>
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card variant="glass" className="p-6 sm:p-8 bg-ocean-50/50 [html:not(.dark)_&]:bg-ocean-50/50 bg-ocean-900/10 border border-ocean-200 [html:not(.dark)_&]:border-ocean-200 border-ocean-800">
          <Heading level={3} variant="subtle" className="mb-2">ℹ️ Come Funziona</Heading>
          <ul className="space-y-1">
            <Text variant="tertiary" size="sm">• Il contatore aumenta automaticamente ogni minuto quando la stufa è in funzione (status WORK)</Text>
            <Text variant="tertiary" size="sm">• Al raggiungimento delle ore impostate, apparirà un banner di richiesta pulizia</Text>
            <Text variant="tertiary" size="sm">• La stufa non potrà essere accesa (né manualmente né automaticamente) finché non confermi la pulizia</Text>
            <Text variant="tertiary" size="sm">• Dopo la conferma, il contatore si azzererà automaticamente</Text>
          </ul>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        icon="🔄"
        title="Conferma Reset"
        message="Sei sicuro di voler azzerare il contatore di manutenzione? Questa operazione azzererà il contatore a 0.0 ore, registrerà la data e ora della pulizia, sbloccherà l'accensione della stufa se era bloccata e creerà un log dell'operazione."
        confirmText={isResetting ? '⏳ Attendere...' : '✓ Conferma Reset'}
        cancelText="✕ Annulla"
        confirmVariant="danger"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </>
  );
}
