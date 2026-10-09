/**
 * StovePageAdjustments Component
 *
 * Fan and power level controls in full-page layout.
 * Only rendered when stove is WORK status.
 *
 * Props in, JSX out. No state management.
 */

import { SlidersHorizontal, Wind, Zap } from 'lucide-react';
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
        <SlidersHorizontal size={18} className="text-(--text-2)" aria-hidden="true" />
        <Heading level={2} size="xl">
          Regolazioni
        </Heading>
      </div>

      {schedulerEnabled && !semiManualMode && (
        <Banner variant="info" description="La modifica attiverà la modalità Semi-Manuale" compact />
      )}

      {/* Fan Control */}
      <Card variant="glass" className="overflow-hidden">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border-2 border-ocean-500/50 bg-ocean-900/50 sm:size-12">
            <Wind size={18} className="text-ocean-400" aria-hidden="true" />
          </div>
          <Heading level={3} size="lg">
            Ventilazione
          </Heading>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
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
              <Text as="span" variant="ocean" weight="black" className="text-5xl sm:text-6xl">
                {fanLevel ?? '-'}
              </Text>
              <Text as="span" variant="tertiary" size="xl" weight="bold">/6</Text>
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
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border-2 border-ember-500/50 bg-ember-900/50 sm:size-12">
            <Zap size={18} className="text-ember-400" aria-hidden="true" />
          </div>
          <Heading level={3} size="lg">
            Potenza
          </Heading>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
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
              <Text as="span" variant="ember" weight="black" className="text-5xl sm:text-6xl">
                {powerLevel ?? '-'}
              </Text>
              <Text as="span" variant="tertiary" size="xl" weight="bold">/5</Text>
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
