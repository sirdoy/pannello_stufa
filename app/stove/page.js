'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Heading, Text, Divider, ModeIndicator, Skeleton } from '@/app/components/ui';
import { getFullSchedulerMode } from '@/lib/schedulerService';
import { getMaintenanceData } from '@/lib/maintenanceService';
import { formatHoursToHHMM } from '@/lib/formatUtils';

/**
 * Stove Introduction Page
 * Overview of the stove system with navigation to configuration pages
 */
export default function StovePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schedulerMode, setSchedulerMode] = useState({ enabled: false, semiManual: false });
  const [maintenanceData, setMaintenanceData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mode, maintenance] = await Promise.all([
          getFullSchedulerMode(),
          getMaintenanceData().catch(() => null),
        ]);
        setSchedulerMode(mode);
        setMaintenanceData(maintenance);
      } catch (error) {
        console.error('Error loading stove data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton.Card className="p-8">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </Skeleton.Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton.Card key={i} className="p-6">
              <Skeleton className="h-12 w-12 mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Skeleton.Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <Card variant="glass" className="p-8 text-center">
        <div className="text-7xl mb-4">🔥</div>
        <Heading level={1} size="3xl" className="mb-2">
          Stufa Thermorossi
        </Heading>
        <Text variant="secondary" size="lg">
          Gestione e configurazione della stufa a pellet
        </Text>

        {/* Current Mode Indicator */}
        <div className="mt-6 flex justify-center">
          <ModeIndicator
            enabled={schedulerMode.enabled}
            semiManual={schedulerMode.semiManual}
            returnToAutoAt={schedulerMode.returnToAutoAt}
            showConfigButton={false}
          />
        </div>

        {/* Back to Home */}
        <div className="mt-6">
          <Button
            variant="subtle"
            icon="🏠"
            onClick={() => router.push('/')}
          >
            Torna alla Home
          </Button>
        </div>
      </Card>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scheduler Card */}
        <Link href="/stove/scheduler" className="block group">
          <Card variant="elevated" className="p-6 h-full transition-all duration-300 hover:shadow-ember-glow hover:scale-[1.02]">
            <div className="text-4xl mb-4">📅</div>
            <Heading level={3} size="lg" className="mb-2 group-hover:text-ember-400 transition-colors">
              Pianificazione
            </Heading>
            <Text variant="tertiary" size="sm">
              Configura gli orari di accensione e spegnimento automatici settimanali
            </Text>
            <div className="mt-4 flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                schedulerMode.enabled
                  ? 'bg-sage-500/20 text-sage-400'
                  : 'bg-slate-500/20 text-slate-400'
              }`}>
                {schedulerMode.enabled ? '⏰ Attivo' : '🔧 Manuale'}
              </span>
            </div>
          </Card>
        </Link>

        {/* Maintenance Card */}
        <Link href="/stove/maintenance" className="block group">
          <Card variant="elevated" className="p-6 h-full transition-all duration-300 hover:shadow-ember-glow hover:scale-[1.02]">
            <div className="text-4xl mb-4">🔧</div>
            <Heading level={3} size="lg" className="mb-2 group-hover:text-ember-400 transition-colors">
              Manutenzione
            </Heading>
            <Text variant="tertiary" size="sm">
              Monitora le ore di utilizzo e configura i promemoria di pulizia
            </Text>
            {maintenanceData && (
              <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  maintenanceData.needsCleaning
                    ? 'bg-warning-500/20 text-warning-400'
                    : 'bg-ocean-500/20 text-ocean-400'
                }`}>
                  {maintenanceData.needsCleaning
                    ? '⚠️ Pulizia richiesta'
                    : `⏱️ ${formatHoursToHHMM(maintenanceData.currentHours || 0)}`
                  }
                </span>
              </div>
            )}
          </Card>
        </Link>

        {/* Errors Card */}
        <Link href="/stove/errors" className="block group">
          <Card variant="elevated" className="p-6 h-full transition-all duration-300 hover:shadow-ember-glow hover:scale-[1.02]">
            <div className="text-4xl mb-4">🚨</div>
            <Heading level={3} size="lg" className="mb-2 group-hover:text-ember-400 transition-colors">
              Storico Allarmi
            </Heading>
            <Text variant="tertiary" size="sm">
              Consulta lo storico degli errori e degli allarmi della stufa
            </Text>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
                📋 Registro completo
              </span>
            </div>
          </Card>
        </Link>
      </div>

      <Divider label="Modalità Operative" variant="gradient" />

      {/* Operating Modes Section */}
      <Card variant="glass" className="p-6">
        <Heading level={2} size="xl" className="mb-6 flex items-center gap-3">
          <span>⚙️</span>
          Modalità Operative
        </Heading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Manual Mode */}
          <div className="bg-slate-800/40 [html:not(.dark)_&]:bg-slate-100/60 rounded-xl p-4 border border-slate-700/30 [html:not(.dark)_&]:border-slate-200/50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔧</span>
              <Heading level={4} size="md">Manuale</Heading>
            </div>
            <Text variant="tertiary" size="sm">
              Controllo diretto della stufa. Tu decidi quando accenderla e spegnerla.
              Lo scheduler è disattivato.
            </Text>
          </div>

          {/* Automatic Mode */}
          <div className="bg-sage-500/10 [html:not(.dark)_&]:bg-sage-100/60 rounded-xl p-4 border border-sage-500/30 [html:not(.dark)_&]:border-sage-300/50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⏰</span>
              <Heading level={4} size="md" variant="sage">Automatico</Heading>
            </div>
            <Text variant="tertiary" size="sm">
              La stufa segue la pianificazione settimanale. Si accende e spegne
              automaticamente agli orari configurati.
            </Text>
          </div>

          {/* Semi-Manual Mode */}
          <div className="bg-warning-500/10 [html:not(.dark)_&]:bg-warning-100/60 rounded-xl p-4 border border-warning-500/30 [html:not(.dark)_&]:border-warning-300/50">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚡</span>
              <Heading level={4} size="md" variant="warning">Semi-Manuale</Heading>
            </div>
            <Text variant="tertiary" size="sm">
              Intervento manuale temporaneo. La stufa tornerà in modalità automatica
              al prossimo cambio di stato programmato.
            </Text>
          </div>
        </div>
      </Card>

      <Divider label="Controlli Disponibili" variant="gradient" />

      {/* Controls Overview Section */}
      <Card variant="glass" className="p-6">
        <Heading level={2} size="xl" className="mb-6 flex items-center gap-3">
          <span>🎛️</span>
          Controlli Disponibili
        </Heading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Power Control */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-flame-500/20 flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <Heading level={4} size="md">Potenza</Heading>
                <Text variant="tertiary" size="sm">Livelli 1-5</Text>
              </div>
            </div>
            <Text variant="secondary" size="sm">
              Regola l&apos;intensità della fiamma e il consumo di pellet.
              Livelli più alti producono più calore ma consumano più combustibile.
            </Text>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className="w-8 h-8 rounded-lg bg-flame-500/20 flex items-center justify-center text-sm font-bold text-flame-400"
                >
                  {level}
                </div>
              ))}
            </div>
          </div>

          {/* Fan Control */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-ocean-500/20 flex items-center justify-center">
                <span className="text-2xl">💨</span>
              </div>
              <div>
                <Heading level={4} size="md">Ventilazione</Heading>
                <Text variant="tertiary" size="sm">Livelli 1-6</Text>
              </div>
            </div>
            <Text variant="secondary" size="sm">
              Controlla la velocità della ventola per la distribuzione del calore.
              Livelli più alti aumentano la circolazione dell&apos;aria calda.
            </Text>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div
                  key={level}
                  className="w-8 h-8 rounded-lg bg-ocean-500/20 flex items-center justify-center text-sm font-bold text-ocean-400"
                >
                  {level}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-slate-700/30 [html:not(.dark)_&]:border-slate-200/50">
          <Heading level={4} size="sm" variant="subtle" className="mb-4">
            Azioni Rapide
          </Heading>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ember"
              icon="🔥"
              onClick={() => router.push('/')}
            >
              Accendi Stufa
            </Button>
            <Button
              variant="ocean"
              icon="❄️"
              onClick={() => router.push('/')}
            >
              Spegni Stufa
            </Button>
            <Button
              variant="subtle"
              icon="📅"
              onClick={() => router.push('/stove/scheduler')}
            >
              Configura Scheduler
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Section */}
      <Card variant="glass" className="p-6 bg-ocean-500/5 border border-ocean-500/20">
        <div className="flex items-start gap-4">
          <span className="text-3xl">ℹ️</span>
          <div>
            <Heading level={3} size="md" variant="ocean" className="mb-2">
              Come Funziona
            </Heading>
            <ul className="space-y-2">
              <li>
                <Text variant="secondary" size="sm">
                  • <strong>Dalla homepage</strong> puoi controllare direttamente la stufa con i pulsanti di accensione/spegnimento
                </Text>
              </li>
              <li>
                <Text variant="secondary" size="sm">
                  • <strong>Le regolazioni</strong> (potenza e ventilazione) appaiono solo quando la stufa è in funzione
                </Text>
              </li>
              <li>
                <Text variant="secondary" size="sm">
                  • <strong>Se lo scheduler è attivo</strong>, un comando manuale attiva la modalità semi-manuale temporanea
                </Text>
              </li>
              <li>
                <Text variant="secondary" size="sm">
                  • <strong>La manutenzione</strong> blocca l&apos;accensione quando le ore target sono raggiunte
                </Text>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
