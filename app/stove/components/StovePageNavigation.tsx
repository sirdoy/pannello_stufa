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
import { Activity, AlertTriangle, CalendarDays, Check, Clock, Home, Siren, Timer, Wrench, Zap } from 'lucide-react';
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
          <Zap size={18} className="text-(--text-2)" aria-hidden="true" />
          <Heading level={2} size="xl">
            Accesso Rapido
          </Heading>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Scheduler Card */}
          <Link href="/stove/scheduler" className="group block">
            <Card
              variant="glass"
              hover
              className="h-full"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-sage-500/30 bg-sage-900/50 transition-colors group-hover:border-sage-500/60">
                  <CalendarDays size={22} className="text-sage-400" aria-hidden="true" />
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
                    <Badge
                      variant={schedulerEnabled ? 'sage' : 'neutral'}
                      size="sm"
                      icon={schedulerEnabled ? <Clock size={12} /> : <Wrench size={12} />}
                    >
                      {schedulerEnabled ? 'Attivo' : 'Manuale'}
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
              hover
              className="h-full"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-ocean-500/30 bg-ocean-900/50 transition-colors group-hover:border-ocean-500/60">
                  <Wrench size={22} className="text-ocean-400" aria-hidden="true" />
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
                      <Badge
                        variant={maintenanceStatus.needsCleaning ? 'warning' : 'ocean'}
                        size="sm"
                        icon={maintenanceStatus.needsCleaning ? <AlertTriangle size={12} /> : <Timer size={12} />}
                      >
                        {maintenanceStatus.needsCleaning
                          ? 'Pulizia richiesta'
                          : formatHoursToHHMM(maintenanceStatus.currentHours || 0)}
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
              hover
              className="h-full"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-ember-500/30 bg-ember-900/50 transition-colors group-hover:border-ember-500/60">
                  <Siren size={22} className="text-ember-400" aria-hidden="true" />
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
                    <Badge
                      variant={errorCode !== 0 ? 'danger' : 'neutral'}
                      size="sm"
                      icon={errorCode !== 0 ? <AlertTriangle size={12} /> : <Check size={12} />}
                    >
                      {errorCode !== 0 ? `Errore ${errorCode}` : 'Nessun errore'}
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
            <Activity size={18} className="text-(--text-2)" aria-hidden="true" />
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
        <Button variant="ghost" icon={<Home size={18} />} onClick={() => router.push('/')}>
          Torna alla Home
        </Button>
      </div>
    </>
  );
}
