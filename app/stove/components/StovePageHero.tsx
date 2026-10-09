/**
 * StovePageHero Component
 *
 * Immersive hero section for stove/page.tsx:
 * - Error badges
 * - Large status icon and label
 * - Metrics grid (fan + power gauges)
 * - Primary action buttons (ACCENDI/SPEGNI)
 * - Mode indicator with scheduler controls
 *
 * Props in, JSX out. No state management.
 */

import { AlertTriangle, CalendarDays, Clock, Flame, Settings, Snowflake, Undo2, Wind, Wrench, Zap } from 'lucide-react';
import { Card, Button, Text, Badge } from '@/app/components/ui';
import type { StovePageStatusConfig, StovePageTheme } from '../stovePageTheme';
import type { StoveState } from '@/types/thermorossiProxy';

export interface StovePageHeroProps {
  status: StoveState;
  statusConfig: StovePageStatusConfig;
  theme: StovePageTheme;
  fanLevel: number | null;
  powerLevel: number | null;
  errorCode: number;
  isAccesa: boolean;
  isSpenta: boolean;
  isOnline: boolean;
  needsMaintenance: boolean;
  loading: boolean;
  schedulerEnabled: boolean;
  semiManualMode: boolean;
  returnToAutoAt: number | null;
  nextScheduledAction: { action: string; timestamp: string } | null;
  onIgnite: () => void;
  onShutdown: () => void;
  onClearSemiManual: () => void;
  onNavigateToScheduler: () => void;
}

export default function StovePageHero(props: StovePageHeroProps) {
  const {
    status,
    statusConfig,
    theme,
    fanLevel,
    powerLevel,
    errorCode,
    isAccesa,
    isSpenta,
    needsMaintenance,
    loading,
    schedulerEnabled,
    semiManualMode,
    returnToAutoAt,
    nextScheduledAction,
    onIgnite,
    onShutdown,
    onClearSemiManual,
    onNavigateToScheduler,
  } = props;

  return (
    <Card variant="glass" padding={false} className="relative overflow-hidden">
      {/* Badges */}
      <div className="absolute inset-x-4 top-4 z-20 flex justify-end">
        {errorCode !== 0 && (
          <Badge variant="danger" className="animate-pulse" icon={<AlertTriangle size={12} />}>
            ERR {errorCode}
          </Badge>
        )}
      </div>

      <div className="relative z-10 p-6 sm:p-10">
        {/* Status Display */}
        <div className="mb-8 text-center">
          {/* Large Status Icon */}
          <div className={`relative mb-4 inline-block ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
            <statusConfig.Icon
              className={`size-24 drop-shadow-2xl sm:size-32 ${theme.accent}`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          {/* Status Label - Using div instead of h1 for visual display (page-level h1 is visually hidden) */}
          <div
            className={`font-display text-3xl font-black sm:text-4xl ${theme.accent} mb-2 tracking-tight uppercase`}
            role="status"
            aria-live="polite"
          >
            {statusConfig.label}
          </div>
          {statusConfig.label !== status?.toUpperCase() && (
            <Text variant="tertiary" size="sm" mono>
              {status}
            </Text>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-6">
          {/* Fan Level Gauge */}
          <Card variant="subtle" padding={false} className="p-5 sm:p-6">
            <div className="flex flex-col items-center">
              <Wind size={18} className="mb-2 text-ocean-400" aria-hidden="true" />
              <Text variant="label" className="mb-1">
                Ventola
              </Text>
              <div className="flex items-baseline">
                <Text as="span" variant="ocean" weight="black" className="text-4xl sm:text-5xl">
                  {fanLevel ?? '-'}
                </Text>
                <Text as="span" variant="tertiary" size="lg" weight="bold" className="sm:text-xl">/6</Text>
              </div>
              {/* Mini bar indicator */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ocean-400 transition-all duration-300"
                  style={{ width: fanLevel ? `${(fanLevel / 6) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </Card>

          {/* Power Level Gauge */}
          <Card variant="subtle" padding={false} className="p-5 sm:p-6">
            <div className="flex flex-col items-center">
              <Zap size={18} className="mb-2 text-ember-400" aria-hidden="true" />
              <Text variant="label" className="mb-1">
                Potenza
              </Text>
              <div className="flex items-baseline">
                <Text as="span" variant="ember" weight="black" className="text-4xl sm:text-5xl">
                  {powerLevel ?? '-'}
                </Text>
                <Text as="span" variant="tertiary" size="lg" weight="bold" className="sm:text-xl">/5</Text>
              </div>
              {/* Mini bar indicator */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-ember-400 transition-all duration-300"
                  style={{ width: powerLevel ? `${(powerLevel / 5) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Primary Action Buttons */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Button
            variant="ember"
            size="lg"
            icon={<Flame size={18} />}
            onClick={onIgnite}
            disabled={loading || isAccesa || needsMaintenance}
            className="h-16 text-base font-bold sm:h-20 sm:text-lg"
          >
            ACCENDI
          </Button>
          <Button
            variant="subtle"
            size="lg"
            icon={<Snowflake size={18} />}
            onClick={onShutdown}
            disabled={loading || isSpenta}
            className="h-16 text-base font-bold sm:h-20 sm:text-lg"
          >
            SPEGNI
          </Button>
        </div>

        {/* Mode Indicator */}
        <Card variant="subtle" padding={false} className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl sm:size-14 ${
                schedulerEnabled && semiManualMode
                  ? 'border-2 border-warning-500/50 bg-warning-900/50'
                  : schedulerEnabled
                  ? 'border-2 border-sage-500/50 bg-sage-900/50'
                  : 'border-2 border-ember-500/50 bg-ember-900/50'
              }`}
            >
              {schedulerEnabled && semiManualMode ? (
                <Settings size={18} className="text-warning-400" aria-hidden="true" />
              ) : schedulerEnabled ? (
                <Clock size={18} className="text-sage-400" aria-hidden="true" />
              ) : (
                <Wrench size={18} className="text-ember-400" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Text
                variant={schedulerEnabled && semiManualMode ? 'warning' : schedulerEnabled ? 'sage' : 'ember'}
                className="sm:text-lg"
              >
                {schedulerEnabled && semiManualMode ? 'Semi-manuale' : schedulerEnabled ? 'Automatica' : 'Manuale'}
              </Text>
              <Text variant="tertiary" size="sm" className="truncate">
                {schedulerEnabled && semiManualMode && returnToAutoAt ? (
                  `Ritorno auto: ${new Date(returnToAutoAt).toLocaleString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })}`
                ) : schedulerEnabled && nextScheduledAction ? (
                  `${{ ignite: 'Accensione', shutdown: 'Spegnimento', adjust: 'Regolazione' }[nextScheduledAction.action as string] ?? 'Prossima'} ${new Date(
                    nextScheduledAction.timestamp
                  ).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`
                ) : schedulerEnabled ? (
                  'Automatico attivo'
                ) : (
                  'Controllo manuale'
                )}
              </Text>
            </div>
          </div>

          {/* Mode Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {schedulerEnabled && semiManualMode && (
              <Button variant="subtle" size="sm" icon={<Undo2 size={16} />} onClick={onClearSemiManual}>
                Torna Automatico
              </Button>
            )}
            <Button variant="subtle" size="sm" icon={<CalendarDays size={16} />} onClick={onNavigateToScheduler}>
              Pianificazione
            </Button>
          </div>
        </Card>
      </div>
    </Card>
  );
}
