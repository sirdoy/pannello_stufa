/**
 * StovePageHero Component
 *
 * Immersive hero section for stove/page.tsx:
 * - Decorative background pattern
 * - Sandbox/error badges
 * - Large status icon and label
 * - Metrics grid (fan + power gauges)
 * - Primary action buttons (ACCENDI/SPEGNI)
 * - Mode indicator with scheduler controls
 *
 * Props in, JSX out. No state management.
 */

import { Card, Button, Text } from '@/app/components/ui';
import type { StovePageStatusConfig, StovePageTheme } from '../stovePageTheme';

export interface StovePageHeroProps {
  status: string;
  statusConfig: StovePageStatusConfig;
  theme: StovePageTheme;
  fanLevel: number | null;
  powerLevel: number | null;
  errorCode: number;
  sandboxMode: boolean;
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
    sandboxMode,
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
    <Card variant="glass" padding={false} className="overflow-hidden relative">
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
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
        {sandboxMode && (
          <div className="bg-ocean-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg">
            <span className="text-xs font-bold">🧪 SANDBOX</span>
          </div>
        )}
        {errorCode !== 0 && (
          <div className="bg-danger-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg ml-auto animate-pulse">
            <span className="text-xs font-bold">⚠️ ERR {errorCode}</span>
          </div>
        )}
      </div>

      <div className="relative z-10 p-6 sm:p-10">
        {/* Status Display */}
        <div className="text-center mb-8">
          {/* Large Status Icon */}
          <div className={`relative inline-block mb-4 ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
            <div className={`absolute inset-0 blur-3xl rounded-full ${theme.accentBg} scale-150`} />
            <span className="relative text-8xl sm:text-9xl drop-shadow-2xl" style={{ lineHeight: 1 }}>
              {statusConfig.icon}
            </span>
          </div>

          {/* Status Label - Using div instead of h1 for visual display (page-level h1 is visually hidden) */}
          <div
            className={`text-3xl sm:text-4xl font-black font-display ${theme.accent} tracking-tight uppercase mb-2`}
            role="status"
            aria-live="polite"
          >
            {statusConfig.label}
          </div>
          {statusConfig.label !== status?.toUpperCase() && (
            <Text size="sm" className="text-slate-500 font-mono">
              {status}
            </Text>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Fan Level Gauge */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-slate-900/60 [html:not(.dark)_&]:bg-white/70 backdrop-blur-xl border ${theme.border} p-5 sm:p-6`}
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl mb-2">💨</span>
              <Text size="xs" className="text-slate-400 [html:not(.dark)_&]:text-slate-500 uppercase tracking-wider mb-1">
                Ventola
              </Text>
              <div className="flex items-baseline">
                <span className="text-4xl sm:text-5xl font-black text-ocean-400 [html:not(.dark)_&]:text-ocean-600">
                  {fanLevel ?? '-'}
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-600 [html:not(.dark)_&]:text-slate-400">/6</span>
              </div>
              {/* Mini bar indicator */}
              <div className="w-full mt-3 h-2 bg-slate-800 [html:not(.dark)_&]:bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ocean-500 to-ocean-400 transition-all duration-300"
                  style={{ width: fanLevel ? `${(fanLevel / 6) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          {/* Power Level Gauge */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-slate-900/60 [html:not(.dark)_&]:bg-white/70 backdrop-blur-xl border ${theme.border} p-5 sm:p-6`}
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl mb-2">⚡</span>
              <Text size="xs" className="text-slate-400 [html:not(.dark)_&]:text-slate-500 uppercase tracking-wider mb-1">
                Potenza
              </Text>
              <div className="flex items-baseline">
                <span className="text-4xl sm:text-5xl font-black text-ember-400 [html:not(.dark)_&]:text-ember-600">
                  {powerLevel ?? '-'}
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-600 [html:not(.dark)_&]:text-slate-400">/5</span>
              </div>
              {/* Mini bar indicator */}
              <div className="w-full mt-3 h-2 bg-slate-800 [html:not(.dark)_&]:bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ember-500 to-flame-400 transition-all duration-300"
                  style={{ width: powerLevel ? `${(powerLevel / 5) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            variant="ember"
            size="lg"
            icon="🔥"
            onClick={onIgnite}
            disabled={loading || isAccesa || needsMaintenance}
            className="h-16 sm:h-20 text-base sm:text-lg font-bold"
          >
            ACCENDI
          </Button>
          <Button
            variant="subtle"
            size="lg"
            icon="❄️"
            onClick={onShutdown}
            disabled={loading || isSpenta}
            className="h-16 sm:h-20 text-base sm:text-lg font-bold"
          >
            SPEGNI
          </Button>
        </div>

        {/* Mode Indicator */}
        <div
          className={`rounded-2xl bg-slate-900/50 [html:not(.dark)_&]:bg-white/60 backdrop-blur-xl border ${theme.border} p-4 sm:p-5`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                schedulerEnabled && semiManualMode
                  ? 'bg-warning-900/50 [html:not(.dark)_&]:bg-warning-100 border-2 border-warning-500/50 [html:not(.dark)_&]:border-warning-300'
                  : schedulerEnabled
                  ? 'bg-sage-900/50 [html:not(.dark)_&]:bg-sage-100 border-2 border-sage-500/50 [html:not(.dark)_&]:border-sage-300'
                  : 'bg-ember-900/50 [html:not(.dark)_&]:bg-ember-100 border-2 border-ember-500/50 [html:not(.dark)_&]:border-ember-300'
              }`}
            >
              <span className="text-2xl sm:text-3xl">
                {schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <Text
                className={`text-base sm:text-lg ${
                  schedulerEnabled && semiManualMode
                    ? 'text-warning-400 [html:not(.dark)_&]:text-warning-700'
                    : schedulerEnabled
                    ? 'text-sage-400 [html:not(.dark)_&]:text-sage-700'
                    : 'text-ember-400 [html:not(.dark)_&]:text-ember-700'
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
                  `${nextScheduledAction.action === 'ignite' ? '🔥' : '❄️'} ${new Date(
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
          <div className="flex flex-wrap gap-2 mt-4">
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
