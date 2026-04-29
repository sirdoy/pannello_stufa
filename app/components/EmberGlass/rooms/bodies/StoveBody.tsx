'use client';
/**
 * StoveBody — Phase 179 Plan 05
 * Bundle source: rooms.jsx:360-381 + CONTEXT D-27
 *
 * Renders 3 StatChips (Target/Fiamma/Ventola) + ControlRow with Meno/Power/Più.
 * Self-fetches via useStoveData + useStoveCommands (D-39 per-body self-fetch pattern).
 *
 * Critical pitfalls observed:
 * - useStoveData requires { checkVersion, userId } (RESEARCH Pitfall 9)
 * - Target chip shows powerLevel/5 — no temp/target fields on live hook (RESEARCH Pitfall 1)
 * - Power level clamped 1..5 before dispatch (T-179-05-01 mitigate)
 * - handleIgnite gated on !needsCleaning (Phase 178 D-05)
 *
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback. D-67: inline handlers.
 */

import { useRouter } from 'next/navigation';
import { Minus, Plus, Power } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useVersion } from '@/app/context/VersionContext';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import { StatChip } from '../primitives/StatChip';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export function StoveBody({ device }: { device: RoomDevice }){
  const router = useRouter();
  const { checkVersion } = useVersion();
  const { user } = useUser();
  const stoveData = useStoveData({ checkVersion, userId: user?.sub });

  const cmds = useStoveCommands({
    stoveData: {
      setLoading: stoveData.setLoading,
      setLoadingMessage: stoveData.setLoadingMessage,
      fetchStatusAndUpdate: stoveData.fetchStatusAndUpdate,
      setSchedulerEnabled: stoveData.setSchedulerEnabled,
      setSemiManualMode: stoveData.setSemiManualMode,
      setReturnToAutoAt: stoveData.setReturnToAutoAt,
      setNextScheduledAction: stoveData.setNextScheduledAction,
      setCleaningInProgress: stoveData.setCleaningInProgress,
      fetchMaintenanceStatus: stoveData.fetchMaintenanceStatus,
      semiManualMode: stoveData.semiManualMode,
    },
    router,
    user,
  });

  // Prefer live hook values; powerLevel/fanLevel nullable → coerce to 0
  const powerLevel = stoveData.powerLevel ?? 0;
  const fanLevel = stoveData.fanLevel ?? 0;
  const needsCleaning = stoveData.needsMaintenance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {/* Target: powerLevel/5 — no temp/target on live hook (RESEARCH Pitfall 1) */}
        <StatChip label="Target" value={`${powerLevel}/5`} tone={device.tone} />
        <StatChip label="Fiamma" value={String(powerLevel)} tone={device.tone} />
        <StatChip label="Ventola" value={String(fanLevel)} tone={device.tone} />
      </div>
      <ControlRow>
        <MiniButton
          Icon={Minus}
          label="Meno"
          onClick={() => {
            const next = Math.max(1, powerLevel - 1);
            void cmds.handlePowerChange({ target: { value: String(next) } });
          }}
        />
        <MiniButton
          Icon={Power}
          label="Power"
          filled={device.on}
          tone={device.tone}
          onClick={() => {
            if (device.on) {
              void cmds.handleShutdown();
            } else if (!needsCleaning) {
              void cmds.handleIgnite();
            }
          }}
        />
        <MiniButton
          Icon={Plus}
          label="Più"
          onClick={() => {
            const next = Math.min(5, powerLevel + 1);
            void cmds.handlePowerChange({ target: { value: String(next) } });
          }}
        />
      </ControlRow>
    </div>
  );
}
