'use client';

import { Button, ControlButton, Heading, Slider, Text } from '../../../ui';
import { cn } from '@/lib/utils/cn';
import type { AdaptiveClasses } from '../hooks/useLightsData';

/**
 * LightsRoomControl - Dynamic-styled room control area
 *
 * Displays room light controls with adaptive styling based on light colors:
 * - ON badge with glow effect
 * - Room name (single light) or lights status summary (multiple lights)
 * - On/Off buttons with smart state logic
 * - Brightness slider with commit-on-release pattern
 * - +/- ControlButtons for brightness steps
 * - Color control link (if room has color-capable lights)
 *
 * Follows Phase 58 orchestrator pattern: purely presentational (no state management)
 * The localBrightness state is managed by parent and passed as prop for smooth dragging.
 */

export interface LightsRoomControlProps {
  // Room state
  selectedRoom: any;
  selectedRoomGroupedLightId: string | null;
  roomLights: any[];
  isRoomOn: boolean;

  // Light counts
  lightsOnCount: number;
  lightsOffCount: number;
  allLightsOn: boolean;
  allLightsOff: boolean;

  // Brightness
  avgBrightness: number;
  localBrightness: number | null;
  setLocalBrightness: (val: number | null) => void;

  // Dynamic styling
  dynamicRoomStyle: Record<string, string> | null;
  contrastMode: 'light' | 'dark' | 'default';
  adaptive: AdaptiveClasses;

  // Color support
  hasColorLights: boolean;

  // Loading state
  refreshing: boolean;

  // Callbacks
  onRoomToggle: (roomId: string | null | undefined, on: boolean) => void;
  onBrightnessChange: (roomId: string | null | undefined, brightness: string) => void;
  onNavigateToColors: () => void;
}

export default function LightsRoomControl({
  selectedRoom,
  selectedRoomGroupedLightId,
  roomLights,
  isRoomOn,
  lightsOnCount,
  lightsOffCount,
  allLightsOn,
  allLightsOff,
  avgBrightness,
  localBrightness,
  setLocalBrightness,
  dynamicRoomStyle,
  adaptive,
  hasColorLights,
  refreshing,
  onRoomToggle,
  onBrightnessChange,
  onNavigateToColors,
}: LightsRoomControlProps) {
  return (
    <div
      className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-500 border ${
        !dynamicRoomStyle ? (
          isRoomOn
            ? 'bg-gradient-to-br from-warning-900/40 via-slate-900/60 to-ember-900/30 border-warning-500/40 shadow-[0_0_30px_rgba(234,179,8,0.2)] [html:not(.dark)_&]:from-warning-100/80 [html:not(.dark)_&]:via-warning-50/90 [html:not(.dark)_&]:to-ember-100/70 [html:not(.dark)_&]:border-warning-300 [html:not(.dark)_&]:shadow-[0_0_20px_rgba(234,179,8,0.15)]'
            : 'bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-slate-800/50 border-slate-600/40 [html:not(.dark)_&]:from-slate-100/80 [html:not(.dark)_&]:via-white/90 [html:not(.dark)_&]:to-slate-100/70 [html:not(.dark)_&]:border-slate-200'
        ) : ''
      }`}
      style={dynamicRoomStyle || {}}
    >
      {/* ON Badge - adaptive to background */}
      {isRoomOn && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-lg animate-pulse ${
              adaptive.badgeGlow || 'bg-warning-500/30 [html:not(.dark)_&]:bg-warning-400/40'
            }`}></div>
            <div className={`relative px-3 py-1.5 rounded-full shadow-lg ring-2 ${
              adaptive.badge
                ? `${adaptive.badge} ring-current/30`
                : 'bg-gradient-to-br from-warning-500 to-warning-600 text-white ring-slate-900/50 [html:not(.dark)_&]:ring-white/50'
            }`}>
              <span className="text-xs font-bold font-display">💡 ACCESO</span>
            </div>
          </div>
        </div>
      )}

      {/* Room name (solo se c'è una sola stanza) */}
      {roomLights.length === 1 && (
        <div className="text-center mb-6">
          <Heading level={3} size="sm" variant={adaptive.heading ? 'default' : 'subtle'} className={`uppercase tracking-wider font-display ${adaptive.heading}`}>
            {selectedRoom.metadata?.name || 'Stanza'}
          </Heading>
        </div>
      )}

      {/* Lights Status Summary */}
      {roomLights.length > 1 && (
        <div className="flex justify-center gap-4 mb-4 text-xs font-display">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
            adaptive.statusOn
              ? adaptive.statusOn
              : (lightsOnCount > 0
                ? 'bg-warning-900/40 text-warning-400 border-warning-500/30 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:text-warning-700 [html:not(.dark)_&]:border-warning-300'
                : 'bg-slate-800/50 text-slate-500 border-slate-700/30 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:border-slate-200')
          }`}>
            <span>💡</span>
            <span className="font-semibold">{lightsOnCount} accese</span>
          </span>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
            adaptive.statusOff
              ? adaptive.statusOff
              : (lightsOffCount > 0
                ? 'bg-slate-800/50 text-slate-400 border-slate-700/30 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:border-slate-200'
                : 'bg-slate-800/30 text-slate-600 border-slate-700/20 [html:not(.dark)_&]:bg-slate-50 [html:not(.dark)_&]:text-slate-400 [html:not(.dark)_&]:border-slate-100')
          }`}>
            <span>🌙</span>
            <span className="font-semibold">{lightsOffCount} spente</span>
          </span>
        </div>
      )}

      {/* On/Off Button - Show only the relevant action */}
      <div className="mb-6">
        {/* Mixed state: show both buttons */}
        {!allLightsOn && !allLightsOff && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={adaptive.buttonVariant || 'subtle'}
              onClick={() => onRoomToggle(selectedRoomGroupedLightId, true)}
              disabled={refreshing || !selectedRoomGroupedLightId}
              icon="💡"
              size="lg"
              className={`h-16 sm:h-20 font-display ${adaptive.buttonClass}`}
            >
              Accendi tutte
            </Button>
            <Button
              variant={adaptive.buttonVariant || 'subtle'}
              onClick={() => onRoomToggle(selectedRoomGroupedLightId, false)}
              disabled={refreshing || !selectedRoomGroupedLightId}
              icon="🌙"
              size="lg"
              className={`h-16 sm:h-20 font-display ${adaptive.buttonClass}`}
            >
              Spegni tutte
            </Button>
          </div>
        )}

        {/* All lights off: show only "Accendi" - prominent CTA */}
        {allLightsOff && (
          <Button
            variant={adaptive.buttonVariant || 'ember'}
            onClick={() => onRoomToggle(selectedRoomGroupedLightId, true)}
            disabled={refreshing || !selectedRoomGroupedLightId}
            icon="💡"
            size="lg"
            className={`w-full h-16 sm:h-20 font-display ${
              adaptive.buttonClass
                || 'ring-2 ring-ember-500/30 ring-offset-2 ring-offset-slate-900 [html:not(.dark)_&]:ring-offset-white'
            }`}
          >
            Accendi
          </Button>
        )}

        {/* All lights on: show only "Spegni" */}
        {allLightsOn && (
          <Button
            variant={adaptive.buttonVariant || 'subtle'}
            onClick={() => onRoomToggle(selectedRoomGroupedLightId, false)}
            disabled={refreshing || !selectedRoomGroupedLightId}
            icon="🌙"
            size="lg"
            className={`w-full h-16 sm:h-20 font-display ${adaptive.buttonClass}`}
          >
            Spegni
          </Button>
        )}
      </div>

      {/* Brightness Control - Adaptive */}
      {isRoomOn && (
        <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 sm:p-5 ${
          adaptive.brightnessPanel
            ? adaptive.brightnessPanel
            : 'bg-slate-800/50 border-slate-700/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200'
        }`}>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">☀️</span>
                <Text size="sm" variant={adaptive.heading ? 'body' : undefined} className={`font-bold font-display ${adaptive.heading}`}>Luminosità</Text>
              </div>
              <span className={`text-2xl sm:text-3xl font-black font-display ${
                adaptive.brightnessValue
                  ? adaptive.brightnessValue
                  : 'text-warning-400 [html:not(.dark)_&]:text-warning-700'
              }`}>
                {localBrightness !== null ? localBrightness : avgBrightness}%
              </span>
            </div>

            {/* Slider - Design system component with commit-on-release pattern */}
            <Slider
              value={localBrightness !== null ? localBrightness : avgBrightness}
              onChange={((value: number | number[]) => {
                // Update local state during drag for smooth UI
                const numValue = Array.isArray(value) ? value[0] : value;
                if (numValue !== undefined) {
                  setLocalBrightness(numValue);
                }
              }) as any}
              onValueCommit={((value: number | number[]) => {
                // Commit to API on release (Radix onValueCommit)
                const numValue = Array.isArray(value) ? value[0] : value;
                if (numValue !== undefined) {
                  onBrightnessChange(selectedRoomGroupedLightId || undefined, numValue.toString());
                }
                setLocalBrightness(null);
              }) as any}
              min={1}
              max={100}
              variant="ember"
              disabled={refreshing || !selectedRoomGroupedLightId}
              aria-label="Luminosita"
              className={cn(
                'w-full',
                adaptive.slider
              )}
            />

            {/* +/- Buttons with long-press support */}
            <div className="flex items-center gap-2">
              <ControlButton
                type="decrement"
                variant={(adaptive.buttonVariant as any) || 'subtle'}
                size="sm"
                step={5}
                onChange={(delta: number) => {
                  const newValue = Math.max(1, avgBrightness + delta);
                  onBrightnessChange(selectedRoomGroupedLightId || undefined, newValue.toString());
                }}
                disabled={refreshing || avgBrightness <= 1 || !selectedRoomGroupedLightId}
                className={`flex-1 ${adaptive.buttonClass}`}
              />
              <ControlButton
                type="increment"
                variant={(adaptive.buttonVariant as any) || 'subtle'}
                size="sm"
                step={5}
                onChange={(delta: number) => {
                  const newValue = Math.min(100, avgBrightness + delta);
                  onBrightnessChange(selectedRoomGroupedLightId || undefined, newValue.toString());
                }}
                disabled={refreshing || avgBrightness >= 100 || !selectedRoomGroupedLightId}
                className={`flex-1 ${adaptive.buttonClass}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Color Control Link (if available) */}
      {isRoomOn && hasColorLights && (
        <div className="mt-4">
          <Button
            variant={adaptive.buttonVariant || 'subtle'}
            size="sm"
            icon="🎨"
            onClick={onNavigateToColors}
            className={`w-full font-display ${adaptive.buttonClass}`}
          >
            Controllo Colore
          </Button>
        </div>
      )}
    </div>
  );
}
