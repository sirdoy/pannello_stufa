/**
 * StovePageAdjustments Component
 *
 * Fan and power level controls in full-page layout.
 * Only rendered when stove is WORK status.
 *
 * Props in, JSX out. No state management.
 */

import { Card, Banner, Heading, Text, ControlButton } from '@/app/components/ui';

export interface StovePageAdjustmentsProps {
  fanLevel: number | null;
  powerLevel: number | null;
  schedulerEnabled: boolean;
  semiManualMode: boolean;
  loading: boolean;
  onFanChange: (level: number) => void;
  onPowerChange: (level: number) => void;
}

export default function StovePageAdjustments(props: StovePageAdjustmentsProps) {
  const { fanLevel, powerLevel, schedulerEnabled, semiManualMode, loading, onFanChange, onPowerChange } = props;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <span className="text-2xl">🎛️</span>
        <Heading level={2} size="xl">
          Regolazioni
        </Heading>
      </div>

      {schedulerEnabled && !semiManualMode && (
        <Banner variant="info" icon="ℹ️" description="La modifica attiverà la modalità Semi-Manuale" compact />
      )}

      {/* Fan Control */}
      <Card variant="glass" className="overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ocean-900/50 [html:not(.dark)_&]:bg-ocean-100 flex items-center justify-center border-2 border-ocean-500/50 [html:not(.dark)_&]:border-ocean-300">
            <span className="text-xl sm:text-2xl">💨</span>
          </div>
          <Heading level={3} size="lg">
            Ventilazione
          </Heading>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <ControlButton
            type="decrement"
            variant="subtle"
            onClick={() => fanLevel !== null && fanLevel > 1 && onFanChange(fanLevel - 1)}
            disabled={fanLevel === null || fanLevel <= 1 || loading}
          />
          <div className="flex flex-col items-center px-6">
            <Text variant="label" size="sm" className="mb-1">
              Livello
            </Text>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl sm:text-6xl font-black text-ocean-400 [html:not(.dark)_&]:text-ocean-600">
                {fanLevel ?? '-'}
              </span>
              <span className="text-xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/6</span>
            </div>
          </div>
          <ControlButton
            type="increment"
            variant="subtle"
            onClick={() => fanLevel !== null && fanLevel < 6 && onFanChange(fanLevel + 1)}
            disabled={fanLevel === null || fanLevel >= 6 || loading}
          />
        </div>
      </Card>

      {/* Power Control */}
      <Card variant="glass" className="overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ember-900/50 [html:not(.dark)_&]:bg-ember-100 flex items-center justify-center border-2 border-ember-500/50 [html:not(.dark)_&]:border-ember-300">
            <span className="text-xl sm:text-2xl">⚡</span>
          </div>
          <Heading level={3} size="lg">
            Potenza
          </Heading>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <ControlButton
            type="decrement"
            variant="ember"
            onClick={() => powerLevel !== null && powerLevel > 1 && onPowerChange(powerLevel - 1)}
            disabled={powerLevel === null || powerLevel <= 1 || loading}
          />
          <div className="flex flex-col items-center px-6">
            <Text variant="label" size="sm" className="mb-1">
              Livello
            </Text>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl sm:text-6xl font-black text-ember-400 [html:not(.dark)_&]:text-ember-600">
                {powerLevel ?? '-'}
              </span>
              <span className="text-xl font-bold text-slate-500 [html:not(.dark)_&]:text-slate-400">/5</span>
            </div>
          </div>
          <ControlButton
            type="increment"
            variant="ember"
            onClick={() => powerLevel !== null && powerLevel < 5 && onPowerChange(powerLevel + 1)}
            disabled={powerLevel === null || powerLevel >= 5 || loading}
          />
        </div>
      </Card>
    </div>
  );
}
