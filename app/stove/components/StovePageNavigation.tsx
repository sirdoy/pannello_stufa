/**
 * StovePageNavigation Component
 *
 * Quick navigation cards (Scheduler, Maintenance, Errors)
 * + System Status section (MaintenanceBar + SchedulerEngineBanner)
 * + Back to Home button
 *
 * Props in, JSX out. No state management.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Heading, Text, Badge, Button } from '@/app/components/ui';
import MaintenanceBar from '@/app/components/MaintenanceBar';
import SchedulerEngineBanner from '@/app/components/SchedulerEngineBanner';
import { formatHoursToHHMM } from '@/lib/formatUtils';
import type { MaintenanceStatus } from '@/lib/maintenance/maintenanceService';

export interface StovePageNavigationProps {
  schedulerEnabled: boolean;
  maintenanceStatus: MaintenanceStatus | null;
  errorCode: number;
}

export default function StovePageNavigation(props: StovePageNavigationProps) {
  const { schedulerEnabled, maintenanceStatus, errorCode } = props;
  const router = useRouter();

  return (
    <>
      {/* Quick Navigation */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <span className="text-2xl">⚡</span>
          <Heading level={2} size="xl">
            Accesso Rapido
          </Heading>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Scheduler Card */}
          <Link href="/stove/scheduler" className="group block">
            <Card
              variant="glass"
              className="hover:shadow-sage-glow h-full transition-all duration-300 hover:scale-102 hover:border-sage-500/40"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-sage-500/30 bg-sage-900/50 transition-colors group-hover:border-sage-500/60">
                  <span className="text-3xl">📅</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Heading
                    level={3}
                    size="md"
                    className="mb-1 transition-colors group-hover:text-sage-400"
                  >
                    Pianificazione
                  </Heading>
                  <Text variant="tertiary" size="sm">
                    Orari accensione automatica
                  </Text>
                  <div className="mt-3">
                    <Badge variant={schedulerEnabled ? 'sage' : 'neutral'} size="sm">
                      {schedulerEnabled ? '⏰ Attivo' : '🔧 Manuale'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          {/* Maintenance Card */}
          <Link href="/stove/maintenance" className="group block">
            <Card
              variant="glass"
              className="hover:shadow-ocean-glow h-full transition-all duration-300 hover:scale-102 hover:border-ocean-500/40"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-ocean-500/30 bg-ocean-900/50 transition-colors group-hover:border-ocean-500/60">
                  <span className="text-3xl">🔧</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Heading
                    level={3}
                    size="md"
                    className="mb-1 transition-colors group-hover:text-ocean-400"
                  >
                    Manutenzione
                  </Heading>
                  <Text variant="tertiary" size="sm">
                    Ore utilizzo e pulizia
                  </Text>
                  {maintenanceStatus && (
                    <div className="mt-3">
                      <Badge variant={maintenanceStatus.needsCleaning ? 'warning' : 'ocean'} size="sm">
                        {maintenanceStatus.needsCleaning
                          ? '⚠️ Pulizia richiesta'
                          : `⏱️ ${formatHoursToHHMM(maintenanceStatus.currentHours || 0)}`}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>

          {/* Errors Card */}
          <Link href="/stove/errors" className="group block">
            <Card
              variant="glass"
              className="h-full transition-all duration-300 hover:scale-102 hover:border-ember-500/40 hover:shadow-ember-glow"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-ember-500/30 bg-ember-900/50 transition-colors group-hover:border-ember-500/60">
                  <span className="text-3xl">🚨</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Heading
                    level={3}
                    size="md"
                    className="mb-1 transition-colors group-hover:text-ember-400"
                  >
                    Storico Allarmi
                  </Heading>
                  <Text variant="tertiary" size="sm">
                    Errori e diagnostica
                  </Text>
                  <div className="mt-3">
                    <Badge variant={errorCode !== 0 ? 'danger' : 'neutral'} size="sm">
                      {errorCode !== 0 ? `⚠️ Errore ${errorCode}` : '✓ Nessun errore'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* System Status */}
      {maintenanceStatus && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <span className="text-2xl">📊</span>
            <Heading level={2} size="xl">
              Stato Sistema
            </Heading>
          </div>

          <Card variant="glass">
            <MaintenanceBar maintenanceStatus={maintenanceStatus} />
          </Card>

          <SchedulerEngineBanner variant="inline" />
        </div>
      )}

      {/* Back Navigation */}
      <div className="flex justify-center pt-4 pb-8">
        <Button variant="ghost" icon="🏠" onClick={() => router.push('/')}>
          Torna alla Home
        </Button>
      </div>
    </>
  );
}
