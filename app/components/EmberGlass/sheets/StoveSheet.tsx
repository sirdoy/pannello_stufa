'use client';

/**
 * StoveSheet (SHEET-02 / CONTEXT D-05) — body component mounted by Phase 177
 * `<StoveCard>` inside `<Sheet open onClose title="Stufa">`.
 *
 * Presentational — receives stoveData/cmds from parent (per quick task
 * 260506-d45 perf fix; reverses Phase 178 D-04). The dashboard card already
 * mounts useStoveData; the sheet body re-mounting it doubled the WS subscription
 * + polling cost on every open. The SelfFetch wrapper below preserves the
 * zero-prop contract for the design-system gallery (Section10SheetGallery).
 *
 * Visual contract verbatim from bundle
 * `.planning/inbox/ember-glass-design/project/components/sheets.jsx:67-130`,
 * MINUS the dropped temperature / target / pellet hero footnote (RESEARCH
 * Pitfall 11 — the live Thermorossi proxy hook exposes only stove_state /
 * power_level / fan_level; no temp/target/pellet fields). The 54px display
 * therefore renders `{powerLevel}/5` instead of `{temp}°C`.
 *
 * Italian copy is frozen at CONTEXT D-19. Routing uses literal strings
 * `/stove/scheduler` + `/stove/maintenance` per Pitfall 2 (no STOVE_ROUTES
 * key for the scheduler/maintenance UI routes). The card owns useRouter and
 * threads navigation via the `onNavigate` callback — keeps the prop surface
 * narrow (no router instance crosses the boundary).
 *
 * Sheet sub-primitives are NOT wrapped in `<Pressable>` (D-24) — they are
 * bare buttons with `data-sheet-focusable="true"` so the global focus-ring
 * rule from app/globals.css applies.
 *
 * RC-clean (D-33): no manual memoization hooks. React Compiler 1.0
 * auto-memoizes — manual memo hooks are forbidden in this namespace.
 *
 * AUDIT-EXCEPTION literals are tagged inline with bundle source line refs.
 */

import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { AlertTriangle, Calendar, Power, TriangleAlert } from 'lucide-react';
import {
  useStoveData,
  type UseStoveDataReturn,
} from '@/app/components/devices/stove/hooks/useStoveData';
import {
  useStoveCommands,
  type UseStoveCommandsReturn,
} from '@/app/components/devices/stove/hooks/useStoveCommands';
import { useVersion } from '@/app/context/VersionContext';
import { FlameViz } from '../FlameViz';
import { SheetRow } from './primitives/SheetRow';
import { Stepper } from './primitives/Stepper';
import { SheetBtn } from './primitives/SheetBtn';

export interface StoveSheetProps {
  stoveData: UseStoveDataReturn;
  cmds: UseStoveCommandsReturn;
  /**
   * Card-owned navigation callback. The card mounts useRouter() and passes a
   * narrow `(path) => router.push(path)` shim so the router instance doesn't
   * cross the prop boundary.
   */
  onNavigate: (path: string) => void;
}

export function StoveSheet({ stoveData, cmds, onNavigate }: StoveSheetProps) {
  // Field adapter (RESEARCH §"Field Gaps" — bundle assumed s.temp/s.target/
  // s.pelletPercent; none exist on the live hook). Fallbacks mirror Phase 177
  // StoveCard.tsx:76 — null-coalesce powerLevel/fanLevel to 1.
  const isAccesa = stoveData.isAccesa;
  const powerLevel = stoveData.powerLevel ?? 1;
  const fanLevel = stoveData.fanLevel ?? 1;
  const needsCleaning = stoveData.needsMaintenance;

  // Loading skeleton (D-26) — first-load only, before any cached data lands.
  if (stoveData.initialLoading && stoveData.powerLevel === null) {
    return (
      <div
        data-testid="stove-sheet-skeleton"
        style={{
          height: 360,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  // Error state (D-27) — only when there's no cached level data to fall back
  // to. `errorDescription` is `string` (defaults to '' so the truthy guard
  // skips the no-error case). Per RESEARCH Open Q3 the hook surfaces a string
  // not an Error instance — render verbatim as the secondary line.
  if (
    stoveData.errorDescription &&
    stoveData.powerLevel === null &&
    stoveData.fanLevel === null
  ) {
    return (
      <div
        data-testid="stove-sheet-error"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '24px 0',
        }}
      >
        <TriangleAlert size={32} color="var(--text-2)" />
        <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
          Non raggiungibile. Riprova più tardi.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {stoveData.errorDescription}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="stove-sheet">
      {/* Hero block — bundle sheets.jsx:71-92 (minus dropped temp/target/pellet) */}
      <div
        style={{
          borderRadius: 24,
          padding: '24px 20px',
          background: isAccesa
            ? 'linear-gradient(160deg, color-mix(in oklab, var(--accent) 25%, transparent) 0%, transparent 70%)'
            : 'rgba(255,255,255,0.03)', // AUDIT-EXCEPTION (sheets.jsx:76)
          border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (sheets.jsx:77)
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <FlameViz on={isAccesa} intensity={powerLevel / 5} />
        <div style={{ flex: 1 }}>
          <div
            data-testid="stove-sheet-state"
            style={{
              fontSize: 12,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {isAccesa ? 'In funzione' : 'Spenta'}
          </div>
          <div
            data-testid="stove-sheet-temp"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 54,
              fontWeight: 600,
              color: '#fff', // AUDIT-EXCEPTION (sheets.jsx:84)
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {powerLevel}
            <span style={{ fontSize: 22, opacity: 0.5 }}>/5</span>
          </div>
          {/* Hero footnote intentionally dropped — Pitfall 11 (no target /
              pelletPercent on the live hook). */}
        </div>
      </div>

      {/* Livello fiamma + Ventola — stacked on mobile, 2-col on desktop (sm+).
          Hidden when stove is off (no point showing levels for an off stove). */}
      {isAccesa && (
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-5">
        {/* Stepper wraps onChange to fit handlePowerChange's synthetic-event signature. */}
        <div data-testid="stove-sheet-power-stepper">
          <SheetRow label="Livello fiamma" value={`${powerLevel}/5`}>
            <Stepper
              value={powerLevel}
              min={1}
              max={5}
              onChange={(v) =>
                void cmds.handlePowerChange({ target: { value: String(v) } })
              }
            />
          </SheetRow>
        </div>

        <div data-testid="stove-sheet-fan-stepper">
          <SheetRow label="Ventola" value={`${fanLevel}/5`}>
            <Stepper
              value={fanLevel}
              min={1}
              max={5}
              onChange={(v) =>
                void cmds.handleFanChange({ target: { value: String(v) } })
              }
            />
          </SheetRow>
        </div>
      </div>
      )}

      {/* 2-col SheetBtn grid — Pitfall 2: literal route strings, not
          STOVE_ROUTES.* (the constants object exposes API-route keys, not the
          /stove/scheduler + /stove/maintenance UI pages). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 22,
        }}
      >
        <SheetBtn
          Icon={Calendar}
          label="Orari"
          onClick={() => onNavigate('/stove/scheduler')}
        />
        <SheetBtn
          Icon={AlertTriangle}
          label="Manutenzione"
          onClick={() => onNavigate('/stove/maintenance')}
        />
      </div>

      {/* Primary action — bundle sheets.jsx:113-127. Disabled when
          needsCleaning so a stove with overdue maintenance cannot ignite (T-178-04-01). */}
      <button
        type="button"
        data-testid="stove-sheet-primary-action"
        data-sheet-focusable="true"
        disabled={needsCleaning}
        onClick={() =>
          void (isAccesa ? cmds.handleShutdown() : cmds.handleIgnite())
        }
        style={{
          marginTop: 18,
          width: '100%',
          height: 56,
          borderRadius: 18,
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 600,
          cursor: needsCleaning ? 'not-allowed' : 'pointer',
          opacity: needsCleaning ? 0.6 : 1,
          background: isAccesa
            ? 'rgba(255, 77, 92, 0.15)' // AUDIT-EXCEPTION (sheets.jsx:119) — destructive ember
            : 'var(--accent)',
          color: isAccesa ? '#ff6676' : '#1a0f08', // AUDIT-EXCEPTION (sheets.jsx:120)
          border: isAccesa
            ? '0.5px solid rgba(255, 77, 92, 0.25)' // AUDIT-EXCEPTION (sheets.jsx:124)
            : 'none',
          boxShadow: isAccesa
            ? 'none'
            : '0 0 30px color-mix(in oklab, var(--accent) 40%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <Power size={18} strokeWidth={2.2} />
        {needsCleaning
          ? 'Manutenzione richiesta'
          : isAccesa
            ? 'Spegni stufa'
            : 'Accendi stufa'}
      </button>
    </div>
  );
}

/**
 * StoveSheetSelfFetch — zero-prop wrapper preserving the Phase 178 D-04 contract
 * for callers that don't already have a card-level useStoveData mount (notably
 * Section10SheetGallery on /debug/design-system-v2). Production cards (StoveCard)
 * use the prop-based StoveSheet directly to avoid double-mounting the hook.
 */
export function StoveSheetSelfFetch() {
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
  return (
    <StoveSheet
      stoveData={stoveData}
      cmds={cmds}
      onNavigate={(p) => router.push(p)}
    />
  );
}
