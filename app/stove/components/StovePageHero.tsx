/**
 * StovePageHero Component
 *
 * Immersive hero section for stove/page.tsx:
 * - Decorative background pattern
 * - Error badges
 * - Large status icon and label
 * - Metrics grid (fan + power gauges)
 * - Primary action buttons (ACCENDI/SPEGNI)
 * - Mode indicator with scheduler controls
 *
 * Props in, JSX out. No state management.
 */

import { Card, Button, Text } from '@/app/components/ui';
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
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, ${
              statusConfig.theme === 'ember' ? 'rgba(237,111,16,0.3)' : 'rgba(100,100,100,0.2)'
            } 0%, transparent 50%),
                                  radial-gradient(circle at 70% 80%, ${
              statusConfig.theme === 'ember' ? 'rgba(254,86,16,0.2)' : 'rgba(100,100,100,0.1)'
            } 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Badges */}
      <div className="absolute inset-x-4 top-4 z-20 flex justify-end">
        {errorCode !== 0 && (
          <div className="animate-pulse rounded-full bg-danger-500/90 px-3 py-1.5 text-white shadow-lg backdrop-blur-sm">
            <span className="text-xs font-bold">⚠️ ERR {errorCode}</span>
          </div>
        )}
      </div>

      <div className="relative z-10 p-6 sm:p-10">
        {/* Status Display */}
        <div className="mb-8 text-center">
          {/* Large Status Icon */}
          <div className={`relative mb-4 inline-block ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
            <div className={`absolute inset-0 rounded-full blur-3xl ${theme.accentBg} scale-150`} />
            <span className="relative text-8xl drop-shadow-2xl sm:text-9xl" style={{ lineHeight: 1 }}>
              {statusConfig.icon}
            </span>
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
            <Text size="sm" className="font-mono text-slate-500">
              {status}
            </Text>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-6">
          {/* Fan Level Gauge */}
          <div
            className={`relative overflow-hidden rounded-2xl border  bg-slate-900/60 backdrop-blur-xl ${theme.border} p-5 sm:p-6`}
          >
            <div className="flex flex-col items-center">
              <span className="mb-2 text-3xl sm:text-4xl">💨</span>
              <Text size="xs" className="mb-1 tracking-wider text-slate-400 uppercase">
                Ventola
              </Text>
              <div className="flex items-baseline">
                <span className="text-4xl font-black text-ocean-400 sm:text-5xl">
                  {fanLevel ?? '-'}
                </span>
                <span className="text-lg font-bold text-slate-600 sm:text-xl">/6</span>
              </div>
              {/* Mini bar indicator */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-linear-to-r from-ocean-500 to-ocean-400 transition-all duration-300"
                  style={{ width: fanLevel ? `${(fanLevel / 6) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Power Level Gauge */}
          <div
            className={`relative overflow-hidden rounded-2xl border  bg-slate-900/60 backdrop-blur-xl ${theme.border} p-5 sm:p-6`}
          >
            <div className="flex flex-col items-center">
              <span className="mb-2 text-3xl sm:text-4xl">⚡</span>
              <Text size="xs" className="mb-1 tracking-wider text-slate-400 uppercase">
                Potenza
              </Text>
              <div className="flex items-baseline">
                <span className="text-4xl font-black text-ember-400 sm:text-5xl">
                  {powerLevel ?? '-'}
                </span>
                <span className="text-lg font-bold text-slate-600 sm:text-xl">/5</span>
              </div>
              {/* Mini bar indicator */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-linear-to-r from-ember-500 to-flame-400 transition-all duration-300"
                  style={{ width: powerLevel ? `${(powerLevel / 5) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Button
            variant="ember"
            size="lg"
            icon="🔥"
            onClick={onIgnite}
            disabled={loading || isAccesa || needsMaintenance}
            className="h-16 text-base font-bold sm:h-20 sm:text-lg"
          >
            ACCENDI
          </Button>
          <Button
            variant="subtle"
            size="lg"
            icon="❄️"
            onClick={onShutdown}
            disabled={loading || isSpenta}
            className="h-16 text-base font-bold sm:h-20 sm:text-lg"
          >
            SPEGNI
          </Button>
        </div>

        {/* Mode Indicator */}
        <div
          className={`rounded-2xl border  bg-slate-900/50 backdrop-blur-xl ${theme.border} p-4 sm:p-5`}
        >
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
              <span className="text-2xl sm:text-3xl">
                {schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <Text
                className={`text-base sm:text-lg ${
                  schedulerEnabled && semiManualMode
                    ? 'text-warning-400'
                    : schedulerEnabled
                    ? 'text-sage-400'
                    : 'text-ember-400'
                }`}
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
                  `${{ ignite: '🔥', shutdown: '❄️', adjust: '🔁' }[nextScheduledAction.action as string] ?? '⏱️'} ${new Date(
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
              <Button variant="outline" size="sm" onClick={onClearSemiManual}>
                ↩️ Torna Automatico
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onNavigateToScheduler}>
              📅 Pianificazione
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
