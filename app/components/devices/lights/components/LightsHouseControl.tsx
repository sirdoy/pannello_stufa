'use client';

import { Button, Text } from '../../../ui';

/**
 * LightsHouseControl - Whole-house light toggle component
 *
 * Displays current state of all lights in the house with smart button logic:
 * - Mixed state: show both "Tutte" and "Spegni" buttons
 * - All off: show "Accendi Tutte" ember button (prominent CTA)
 * - All on: show "Spegni Tutte" subtle button
 *
 * Follows Phase 58 orchestrator pattern: purely presentational (no state management)
 */

export interface LightsHouseControlProps {
  hasAnyLights: boolean;
  totalLightsOn: number;
  totalLights: number;
  allHouseLightsOn: boolean;
  allHouseLightsOff: boolean;
  refreshing: boolean;
  onAllLightsToggle: (on: boolean) => void;
}

export default function LightsHouseControl({
  hasAnyLights,
  totalLightsOn,
  totalLights,
  allHouseLightsOn,
  allHouseLightsOff,
  refreshing,
  onAllLightsToggle,
}: LightsHouseControlProps) {
  if (!hasAnyLights) {
    return null;
  }

  return (
    <div className="mb-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 [html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:border-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">🏠</span>
          <div className="min-w-0">
            <Text size="sm" className="font-display truncate">Tutta la Casa</Text>
            <Text variant="tertiary" size="xs">{totalLightsOn}/{totalLights} accese</Text>
          </div>
        </div>

        {/* Smart button based on state */}
        <div className="flex-shrink-0">
          {/* Mixed state: show both buttons compact */}
          {!allHouseLightsOn && !allHouseLightsOff && (
            <div className="flex gap-2">
              <Button
                variant="subtle"
                onClick={() => onAllLightsToggle(true)}
                disabled={refreshing}
                size="sm"
                icon="💡"
              >
                Tutte
              </Button>
              <Button
                variant="subtle"
                onClick={() => onAllLightsToggle(false)}
                disabled={refreshing}
                size="sm"
                icon="🌙"
              >
                Spegni
              </Button>
            </div>
          )}

          {/* All off: show only "Accendi" - prominent CTA */}
          {allHouseLightsOff && (
            <Button
              variant="ember"
              onClick={() => onAllLightsToggle(true)}
              disabled={refreshing}
              size="sm"
              icon="💡"
            >
              Accendi Tutte
            </Button>
          )}

          {/* All on: show only "Spegni" */}
          {allHouseLightsOn && (
            <Button
              variant="subtle"
              onClick={() => onAllLightsToggle(false)}
              disabled={refreshing}
              size="sm"
              icon="🌙"
            >
              Spegni Tutte
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
