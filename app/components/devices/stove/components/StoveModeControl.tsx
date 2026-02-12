'use client';

import Button from '../../../ui/Button';
import { Text, Divider } from '../../../ui';
import CronHealthBanner from '../../../CronHealthBanner';

/**
 * StoveModeControl - Scheduler mode selector and next action display
 * Presentational component (no state/effects)
 */

export interface StoveModeControlProps {
  schedulerEnabled: boolean;
  semiManualMode: boolean;
  returnToAutoAt: number | null;
  nextScheduledAction: any;
  onSetManualMode: () => void;
  onSetAutomaticMode: () => void;
  onClearSemiManual: () => void;
  onNavigateToScheduler: () => void;
}

export default function StoveModeControl({
  schedulerEnabled,
  semiManualMode,
  returnToAutoAt,
  nextScheduledAction,
  onSetManualMode,
  onSetAutomaticMode,
  onClearSemiManual,
  onNavigateToScheduler,
}: StoveModeControlProps) {
  return (
    <>
      {/* Separator */}
      <Divider label="Modalità Controllo" variant="gradient" spacing="large" />

      {/* Mode Indicator - Ember Noir */}
      <div className="flex flex-col gap-4 p-5 sm:p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 relative overflow-hidden [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
            schedulerEnabled && semiManualMode ? 'bg-warning-900/40 border-2 border-warning-500/50 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:border-warning-300' :
            schedulerEnabled ? 'bg-sage-900/40 border-2 border-sage-500/50 [html:not(.dark)_&]:bg-sage-100/80 [html:not(.dark)_&]:border-sage-300' :
            'bg-ember-900/40 border-2 border-ember-500/50 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:border-ember-300'
          }`}>
            <span className="text-2xl sm:text-3xl">
              {schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <Text variant="tertiary" size="sm" className="mb-2">
              Modalità
            </Text>
            <Button.Group className="w-full sm:w-auto">
              <Button
                variant={!schedulerEnabled ? 'ember' : 'subtle'}
                size="sm"
                onClick={onSetManualMode}
                aria-pressed={!schedulerEnabled}
                className="flex-1 sm:flex-none"
              >
                Manuale
              </Button>
              <Button
                variant={schedulerEnabled && !semiManualMode ? 'ember' : 'subtle'}
                size="sm"
                onClick={onSetAutomaticMode}
                aria-pressed={schedulerEnabled && !semiManualMode}
                className="flex-1 sm:flex-none"
              >
                Automatica
              </Button>
              <Button
                variant={schedulerEnabled && semiManualMode ? 'ember' : 'subtle'}
                size="sm"
                disabled
                aria-pressed={schedulerEnabled && semiManualMode}
                className="flex-1 sm:flex-none cursor-not-allowed"
              >
                Semi-man.
              </Button>
            </Button.Group>
            <Text variant="tertiary" size="sm" className="mt-2 break-words">
              {schedulerEnabled && semiManualMode && returnToAutoAt ? (
                (() => {
                  const date = new Date(returnToAutoAt);
                  const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                  const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                  return `Ritorno auto: ${time} del ${day}`;
                })()
              ) : schedulerEnabled && nextScheduledAction ? (
                <>
                  <Text as="span" className={nextScheduledAction.action === 'ignite' ? 'text-ember-400 [html:not(.dark)_&]:text-ember-600' : 'text-slate-300 [html:not(.dark)_&]:text-slate-600'}>
                    {nextScheduledAction.action === 'ignite' ? '🔥 Accensione' : '❄️ Spegnimento'}
                  </Text>
                  {' alle '}
                  <Text as="span" className="text-slate-300 [html:not(.dark)_&]:text-slate-600">
                    {(() => {
                      const date = new Date(nextScheduledAction.timestamp);
                      const time = date.toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
                      const day = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit' });
                      return `${time} del ${day}`;
                    })()}
                  </Text>
                  {nextScheduledAction.action === 'ignite' && (
                    <Text as="span" variant="tertiary" className="block sm:inline"> • P{nextScheduledAction.power}, V{nextScheduledAction.fan}</Text>
                  )}
                </>
              ) : schedulerEnabled ? (
                'Controllo automatico attivo'
              ) : (
                'Controllo manuale attivo'
              )}
            </Text>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {schedulerEnabled && semiManualMode && (
            <Button
              variant="ember"
              size="sm"
              onClick={onClearSemiManual}
              aria-label="Torna alla modalita automatica"
            >
              Torna in Automatico
            </Button>
          )}
          <Button
            variant="subtle"
            size="sm"
            onClick={onNavigateToScheduler}
            aria-label="Vai alle impostazioni di pianificazione"
          >
            Configura Pianificazione
          </Button>
        </div>
      </div>

      {/* Cron Health Warning */}
      <div className="mt-4 sm:mt-6">
        <CronHealthBanner variant="inline" />
      </div>
    </>
  );
}
