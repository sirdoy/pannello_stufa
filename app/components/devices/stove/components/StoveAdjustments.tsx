'use client';

import ControlButton from '../../../ui/ControlButton';
import Banner from '../../../ui/Banner';
import { Heading, Text, Divider } from '../../../ui';

/**
 * StoveAdjustments - Fan and power level controls
 * Presentational component (no state/effects)
 */

export interface StoveAdjustmentsProps {
  fanLevel: number | null;
  powerLevel: number | null;
  schedulerEnabled: boolean;
  semiManualMode: boolean;
  onFanChange: (e: { target: { value: string } }) => void;
  onPowerChange: (e: { target: { value: string } }) => void;
}

export default function StoveAdjustments({
  fanLevel,
  powerLevel,
  schedulerEnabled,
  semiManualMode,
  onFanChange,
  onPowerChange,
}: StoveAdjustmentsProps) {
  return (
    <>
      <Divider label="Regolazioni" variant="gradient" spacing="large" />

      <div className="space-y-4">
        {/* Info badge quando in modalità automatica */}
        {schedulerEnabled && !semiManualMode && (
          <Banner
            variant="info"
            icon="ℹ️"
            description="La modifica attiverà la modalità Semi-Manuale"
            compact
          />
        )}

        {/* Ventilazione Control - Ember Noir */}
        <div data-control="fan" className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-5 sm:p-6 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ocean-900/50 flex items-center justify-center border-2 border-ocean-500/50 [html:not(.dark)_&]:bg-ocean-100/80 [html:not(.dark)_&]:border-ocean-300">
              <span className="text-xl sm:text-2xl">💨</span>
            </div>
            <Heading level={4} size="md" className="font-display">Ventilazione</Heading>
          </div>

          {/* 3 Colonne: [−] [Livello] [+] */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
            {/* Bottone Meno */}
            <ControlButton
              type="decrement"
              variant="subtle"
              onClick={() => {
                if (fanLevel && fanLevel > 1) {
                  const newLevel = fanLevel - 1;
                  onFanChange({ target: { value: newLevel.toString() } });
                }
              }}
              disabled={!fanLevel || fanLevel <= 1}
            />

            {/* Display Livello Centrale */}
            <div className="flex flex-col items-center justify-center px-4 sm:px-6">
              <Text variant="label" size="sm" className="mb-1 font-display">Livello</Text>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black font-display text-ocean-400 leading-none [html:not(.dark)_&]:text-ocean-600">
                  {fanLevel ?? '-'}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/6</span>
              </div>
            </div>

            {/* Bottone Più */}
            <ControlButton
              type="increment"
              variant="subtle"
              onClick={() => {
                if (fanLevel && fanLevel < 6) {
                  const newLevel = fanLevel + 1;
                  onFanChange({ target: { value: newLevel.toString() } });
                }
              }}
              disabled={!fanLevel || fanLevel >= 6}
            />
          </div>
        </div>

        {/* Potenza Control - Ember Noir */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-5 sm:p-6 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ember-900/50 flex items-center justify-center border-2 border-ember-500/50 [html:not(.dark)_&]:bg-ember-100/80 [html:not(.dark)_&]:border-ember-300">
              <span className="text-xl sm:text-2xl">⚡</span>
            </div>
            <Heading level={4} size="md" className="font-display">Potenza</Heading>
          </div>

          {/* 3 Colonne: [−] [Livello] [+] */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
            {/* Bottone Meno */}
            <ControlButton
              type="decrement"
              variant="ember"
              onClick={() => {
                if (powerLevel && powerLevel > 1) {
                  const newLevel = powerLevel - 1;
                  onPowerChange({ target: { value: newLevel.toString() } });
                }
              }}
              disabled={!powerLevel || powerLevel <= 1}
            />

            {/* Display Livello Centrale */}
            <div className="flex flex-col items-center justify-center px-4 sm:px-6">
              <Text variant="label" size="sm" className="mb-1 font-display">Livello</Text>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black font-display text-ember-400 leading-none [html:not(.dark)_&]:text-ember-600">
                  {powerLevel ?? '-'}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/5</span>
              </div>
            </div>

            {/* Bottone Più */}
            <ControlButton
              type="increment"
              variant="ember"
              onClick={() => {
                if (powerLevel && powerLevel < 5) {
                  const newLevel = powerLevel + 1;
                  onPowerChange({ target: { value: newLevel.toString() } });
                }
              }}
              disabled={!powerLevel || powerLevel >= 5}
            />
          </div>
        </div>
      </div>
    </>
  );
}
