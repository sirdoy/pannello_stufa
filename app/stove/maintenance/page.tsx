'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Info, RotateCcw, Save, Settings } from 'lucide-react';
import { useUser } from '@/lib/auth/useUser';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import Input from '@/app/components/ui/Input';
import {
  getMaintenanceData,
  updateTargetHours,
  confirmCleaning,
  type MaintenanceData,
} from '@/lib/maintenance/maintenanceService';
import { formatHoursToHHMM } from '@/lib/formatUtils';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Banner from '@/app/components/ui/Banner';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';

export const dynamic = 'force-dynamic';

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
      const data = await getMaintenanceData();
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

  const pageHeader = (
    <PageHeader
      title="Manutenzione"
      description="Configura gli intervalli di pulizia della stufa"
      backHref="/stove"
    />
  );

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl">
        {pageHeader}
        <div className="flex items-center justify-center py-20">
          <Text variant="tertiary">Caricamento...</Text>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        {pageHeader}
        <div className="flex items-center justify-center py-20">
          <Card variant="glass" className="p-8 text-center">
            <Text variant="tertiary" className="mb-4">Accesso non autorizzato</Text>
            <Link href="/auth/login">
              <Button variant="ember">Accedi</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-6">
        {pageHeader}

        {/* Current Status Card */}
        <Card variant="glass" className="p-6 sm:p-8">
          <Heading level={2} size="xl" className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-(--text-2)" aria-hidden="true" />
            Stato Attuale
          </Heading>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card variant="subtle">
              <Text variant="tertiary" size="sm" className="mb-1">Ore di Utilizzo</Text>
              <Heading level={3} size="2xl">
                {formatHoursToHHMM(maintenanceData?.currentHours || 0)}
              </Heading>
            </Card>

            <Card variant="subtle">
              <Text variant="tertiary" size="sm" className="mb-1">Ore Target</Text>
              <Heading level={3} size="2xl" variant="ember">
                {formatHoursToHHMM(maintenanceData?.targetHours || 50)}
              </Heading>
            </Card>

            <Card variant="subtle">
              <Text variant="tertiary" size="sm" className="mb-1">Ore Rimanenti</Text>
              <Heading level={3} size="2xl" variant="sage">
                {formatHoursToHHMM(Math.max(0, (maintenanceData?.targetHours || 50) - (maintenanceData?.currentHours || 0)))}
              </Heading>
            </Card>
          </div>

          {/* Reset Button */}
          <div className="mt-4 border-t border-white/8 pt-4">
            <Button
              variant="danger"
              onClick={handleResetRequest}
              disabled={isResetting || (maintenanceData?.currentHours || 0) === 0}
              className="w-full"
              icon={<RotateCcw size={16} />}
            >
              Azzera Contatore Manutenzione
            </Button>
          </div>

          {maintenanceData?.lastCleanedAt && (
            <div className="mt-4 border-t border-white/8 pt-4">
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
          <Heading level={2} size="xl" className="mb-4 flex items-center gap-2">
            <Settings size={18} className="text-(--text-2)" aria-hidden="true" />
            Configurazione
          </Heading>

          <div className="space-y-4">
            <div>
              <Input
                id="targetHours"
                type="number"
                label="Ore di utilizzo prima della pulizia"
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
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100, 150, 200].map((hours) => (
                  <Button
                    key={hours}
                    variant={targetHours === hours ? 'ember' : 'subtle'}
                    size="sm"
                    onClick={() => setTargetHours(hours)}
                    disabled={isSaving}
                  >
                    {hours}h
                  </Button>
                ))}
              </div>
            </div>

            <Button
              variant="ember"
              onClick={handleSave}
              disabled={isSaving || targetHours === maintenanceData?.targetHours}
              className="w-full"
              icon={<Save size={16} />}
            >
              {isSaving ? 'Salvataggio...' : 'Salva Configurazione'}
            </Button>

            {saveMessage && (
              <Banner
                variant={saveMessage.type === 'success' ? 'success' : 'error'}
                description={saveMessage.text}
                compact
              />
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card variant="glass" className="p-6 sm:p-8">
          <Heading level={3} variant="subtle" className="mb-2 flex items-center gap-2">
            <Info size={18} aria-hidden="true" />
            Come Funziona
          </Heading>
          <ul className="list-inside list-disc space-y-1">
            <li><Text variant="tertiary" size="sm" as="span">Il contatore aumenta automaticamente ogni minuto quando la stufa è in funzione (status WORK)</Text></li>
            <li><Text variant="tertiary" size="sm" as="span">Al raggiungimento delle ore impostate, apparirà un banner di richiesta pulizia</Text></li>
            <li><Text variant="tertiary" size="sm" as="span">La stufa non potrà essere accesa (né manualmente né automaticamente) finché non confermi la pulizia</Text></li>
            <li><Text variant="tertiary" size="sm" as="span">Dopo la conferma, il contatore si azzererà automaticamente</Text></li>
          </ul>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        icon={<RotateCcw size={40} />}
        title="Conferma Reset"
        message="Sei sicuro di voler azzerare il contatore di manutenzione? Questa operazione azzererà il contatore a 0.0 ore, registrerà la data e ora della pulizia, sbloccherà l'accensione della stufa se era bloccata e creerà un log dell'operazione."
        confirmText={isResetting ? 'Attendere...' : 'Conferma Reset'}
        cancelText="Annulla"
        confirmVariant="danger"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </>
  );
}
