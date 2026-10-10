'use client';

/**
 * StoveSheet (SHEET-02 / CONTEXT D-05, reworked in ROADMAP M77) — body mounted
 * by `<StoveCard>` inside `<Sheet open onClose title="Stufa">`.
 *
 * Presentational — receives stoveData/cmds from the parent (quick task
 * 260506-d45: the card already mounts useStoveData; mounting it again here
 * doubled the WS subscription and the polling on every open). The SelfFetch
 * wrapper below keeps the zero-prop contract for the design-system gallery.
 *
 * Top to bottom: what the stove is doing and what the schedule does next,
 * what is wrong (alarm, pellet reserve, cleaning due, old data), the two
 * levels while it burns, the links to the stove pages, the on/off action.
 * A command locks the controls until the stove answers and reports a failure
 * in place: nothing here fails silently.
 *
 * The card owns useRouter and threads navigation via `onNavigate`, so no
 * router instance crosses the prop boundary.
 *
 * RC-clean (D-33): no manual memoization hooks.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth/useUser';
import { Calendar, Check, Fan, Flame, Gauge, Power, Thermometer, Undo2, Wrench } from 'lucide-react';
import { Banner, Button } from '@/app/components/ui';
import {
  useStoveData,
  type UseStoveDataReturn,
} from '@/app/components/devices/stove/hooks/useStoveData';
import {
  useStoveCommands,
  type UseStoveCommandsReturn,
} from '@/app/components/devices/stove/hooks/useStoveCommands';
import {
  STOVE_TONE_COLOR,
  describeStoveSchedule,
  formatStoveAge,
  formatStoveWhen,
  getStoveStateDisplay,
} from '@/app/components/devices/stove/stoveDisplay';
import { FlameViz } from '../FlameViz';
import { LevelPicker } from './primitives/LevelPicker';
import { SheetBtn } from './primitives/SheetBtn';

const POWER_MAX = 5;
const FAN_MAX = 6;

type Pending = { kind: 'power' | 'fan'; level: number } | { kind: 'toggle' | 'mode' | 'cleaning' };

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
  const [pending, setPending] = useState<Pending | null>(null);
  const [commandFailed, setCommandFailed] = useState(false);

  const isAccesa = stoveData.isAccesa;
  const needsCleaning = stoveData.needsMaintenance;
  const state = getStoveStateDisplay(stoveData.status, isAccesa);
  const schedule = describeStoveSchedule(stoveData);
  const isStale = stoveData.staleness?.isStale ?? false;
  // ROADMAP M78: the last read failed. With no reading at all the state is unknown: the only
  // command that is safe blind is the shutdown (same choice as the engine on the Pi, D20).
  const unreachable = stoveData.unreachable ?? false;
  const canShutDown = isAccesa || stoveData.status === 'unknown';
  const busy = pending !== null || Boolean(stoveData.loading);

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

  // One command at a time: the handlers throw on a refused command (409, 5xx).
  const run = async (next: Pending, command: () => Promise<void>) => {
    setCommandFailed(false);
    setPending(next);
    try {
      await command();
    } catch {
      setCommandFailed(true);
    } finally {
      setPending(null);
    }
  };

  const pendingLevel = (kind: 'power' | 'fan') =>
    pending && pending.kind === kind && 'level' in pending ? pending.level : null;

  const staleAge = stoveData.staleness?.cachedAt ? formatStoveAge(stoveData.staleness.ageSeconds) : null;

  return (
    <div data-testid="stove-sheet">
      {/* Hero: state, then mode and next scheduled action */}
      <div
        style={{
          borderRadius: 24,
          padding: '20px',
          background: isAccesa
            ? 'linear-gradient(160deg, color-mix(in oklab, var(--accent) 25%, transparent) 0%, transparent 70%)'
            : 'rgba(255,255,255,0.03)', // AUDIT-EXCEPTION (sheets.jsx:76)
          border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (sheets.jsx:77)
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <FlameViz on={isAccesa} intensity={(stoveData.powerLevel ?? 1) / POWER_MAX} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            data-testid="stove-sheet-state"
            role="status"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -0.6,
              color: state.tone === 'muted' || state.tone === 'accent' ? '#fff' : STOVE_TONE_COLOR[state.tone],
            }}
          >
            {state.label}
          </div>
          <div data-testid="stove-sheet-schedule" style={{ marginTop: 6, fontSize: 13, color: 'var(--text-1)' }}>
            {schedule.nextLong ? `${schedule.mode} · ${schedule.nextLong.toLowerCase()}` : `Modalità ${schedule.mode.toLowerCase()}`}
          </div>
          {!isStale && !unreachable && typeof stoveData.lastUpdatedAt === 'number' && (
            <div data-testid="stove-sheet-updated" style={{ marginTop: 2, fontSize: 12, color: 'var(--text-2)' }}>
              Aggiornata {formatStoveWhen(stoveData.lastUpdatedAt)}
            </div>
          )}
        </div>
      </div>

      {/* What is wrong, most serious first */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {(state.tone === 'danger' || Boolean(stoveData.errorCode)) && (
          <div data-testid="stove-sheet-alarm">
            <Banner
              compact
              variant="error"
              title="Stufa in allarme"
              description={stoveData.errorDescription || 'Controlla la stufa prima di riaccenderla.'}
              actions={
                <Button variant="subtle" size="sm" onClick={() => onNavigate('/stove/errors')}>
                  Storico allarmi
                </Button>
              }
            />
          </div>
        )}
        {unreachable && (
          <div data-testid="stove-sheet-unreachable">
            <Banner
              compact
              variant="warning"
              title="Stufa non raggiungibile"
              description={
                typeof stoveData.lastUpdatedAt === 'number'
                  ? `Ultima lettura ${formatStoveWhen(stoveData.lastUpdatedAt)}: lo stato può essere diverso.`
                  : 'Nessuna lettura disponibile: non so se è accesa o spenta.'
              }
            />
          </div>
        )}
        {isStale && !unreachable && (
          <div data-testid="stove-sheet-stale">
            <Banner
              compact
              variant="warning"
              title="Dati non aggiornati"
              description={
                staleAge
                  ? `Ultima lettura ${staleAge} fa: la stufa non risponde, lo stato può essere diverso.`
                  : 'La stufa non risponde: lo stato può essere diverso.'
              }
            />
          </div>
        )}
        {stoveData.pelletLow && (
          <div data-testid="stove-sheet-pellet-low">
            <Banner
              compact
              variant="warning"
              title="Pellet in riserva"
              description="Ricarica il serbatoio della stufa."
            />
          </div>
        )}
        {needsCleaning && (
          <div data-testid="stove-sheet-cleaning">
            <Banner
              compact
              variant="warning"
              icon={<Wrench size={20} />}
              title="Pulizia richiesta"
              description={
                stoveData.maintenanceStatus
                  ? `${Math.round(stoveData.maintenanceStatus.currentHours)} h di lavoro: pulisci la stufa prima di riaccenderla.`
                  : 'Pulisci la stufa prima di riaccenderla.'
              }
              actions={
                <Button
                  variant="success"
                  size="sm"
                  icon={<Check size={16} />}
                  loading={pending?.kind === 'cleaning'}
                  disabled={busy}
                  onClick={() => void run({ kind: 'cleaning' }, cmds.handleConfirmCleaning)}
                >
                  Ho pulito
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Levels — only while the stove burns. One tap = one command. */}
      {isAccesa && (
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-5">
          <div data-testid="stove-sheet-power">
            <LevelPicker
              label="Potenza"
              Icon={Flame}
              value={stoveData.powerLevel}
              min={1}
              max={POWER_MAX}
              pending={pendingLevel('power')}
              disabled={busy}
              onChange={(level) =>
                void run({ kind: 'power', level }, () => cmds.handlePowerChange({ target: { value: String(level) } }))
              }
            />
          </div>
          <div data-testid="stove-sheet-fan">
            <LevelPicker
              label="Ventola"
              Icon={Fan}
              value={stoveData.fanLevel}
              min={1}
              max={FAN_MAX}
              pending={pendingLevel('fan')}
              disabled={busy}
              onChange={(level) =>
                void run({ kind: 'fan', level }, () => cmds.handleFanChange({ target: { value: String(level) } }))
              }
            />
          </div>
        </div>
      )}

      {/* Semi-manual: a manual change overrides the schedule until the next slot */}
      {schedule.mode === 'Semi-manuale' && (
        <div style={{ marginTop: 18 }}>
          <Button
            variant="subtle"
            size="sm"
            fullWidth
            icon={<Undo2 size={16} />}
            loading={pending?.kind === 'mode'}
            disabled={busy}
            data-testid="stove-sheet-back-to-auto"
            onClick={() => void run({ kind: 'mode' }, cmds.handleClearSemiManual)}
          >
            Torna in automatico
          </Button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 18,
        }}
      >
        <SheetBtn Icon={Calendar} label="Orari" onClick={() => onNavigate('/stove/scheduler')} />
        <SheetBtn Icon={Thermometer} label="Clima" onClick={() => onNavigate('/settings/thermostat')} />
        <SheetBtn Icon={Wrench} label="Manutenzione" onClick={() => onNavigate('/stove/maintenance')} />
        <SheetBtn Icon={Gauge} label="Dettagli" onClick={() => onNavigate('/stove')} />
      </div>

      {commandFailed && (
        <div data-testid="stove-sheet-command-error" style={{ marginTop: 14 }}>
          <Banner
            compact
            variant="error"
            title="Comando non riuscito"
            description="La stufa non ha accettato il comando. Riprova tra poco."
          />
        </div>
      )}

      {/* Primary action. Cleaning due blocks the ignition only: shutting down always stays possible. */}
      <div style={{ marginTop: 18 }}>
        <Button
          variant={canShutDown ? 'danger' : 'ember'}
          size="lg"
          fullWidth
          icon={<Power size={18} strokeWidth={2.2} />}
          loading={pending?.kind === 'toggle'}
          disabled={busy || (!canShutDown && needsCleaning)}
          data-testid="stove-sheet-primary-action"
          onClick={() => void run({ kind: 'toggle' }, canShutDown ? cmds.handleShutdown : cmds.handleIgnite)}
        >
          {canShutDown ? 'Spegni stufa' : needsCleaning ? 'Pulizia richiesta' : 'Accendi stufa'}
        </Button>
        {pending?.kind === 'toggle' && (
          <div
            data-testid="stove-sheet-progress"
            role="status"
            style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: 'var(--text-2)' }}
          >
            {canShutDown ? 'Spegnimento in corso…' : 'Accensione in corso…'}
          </div>
        )}
      </div>
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
  const { user } = useUser();
  const stoveData = useStoveData({ userId: user?.sub });
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
