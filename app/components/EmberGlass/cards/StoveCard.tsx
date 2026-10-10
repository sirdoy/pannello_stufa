'use client';

/**
 * StoveCard — Phase 177 (DASH-02), reworked in ROADMAP M77
 *
 * Dashboard summary tile for the Thermorossi stove: GlassCard + CardHead +
 * StatusDot, FlameViz, and the Sheet wrapping `<StoveSheet>`.
 *
 * The tile answers three questions at a glance: what the stove is doing (one
 * word), at which levels, and what happens next (schedule) or what is wrong
 * (alarm, cleaning due, pellet reserve, old data). No temperature: the proxy
 * exposes levels only.
 *
 * RC-clean (D-28): no useMemo / useCallback. React Compiler 1.0 auto-memoizes.
 */

import { useState, type ReactNode } from 'react';
import { Flame, Fuel, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth/useUser';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { StatusDot } from '../StatusDot';
import { FlameViz } from '../FlameViz';
import { Sheet } from '../Sheet';
import { StoveSheet } from '../sheets/StoveSheet';
import { GlassCardSkeleton } from '../GlassCardSkeleton';
import { useCardReady } from '../useCardReady';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import {
  STOVE_TONE_COLOR,
  describeStoveSchedule,
  formatStoveAge,
  getStoveStateDisplay,
} from '@/app/components/devices/stove/stoveDisplay';

const WARN = STOVE_TONE_COLOR.warn;
const DANGER = STOVE_TONE_COLOR.danger;

const lineStyle = { fontSize: 12, lineHeight: '16px', color: 'var(--text-2)' } as const;

// Icon-only: a text badge truncates the "Stufa" label on narrow cards.
function HeadBadge({ testId, label, children }: { testId: string; label: string; children: ReactNode }) {
  return (
    <span
      data-testid={testId}
      role="img"
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: 999,
        color: WARN,
        background: 'rgba(255, 184, 74, 0.14)',
        border: '1px solid rgba(255, 184, 74, 0.35)',
      }}
    >
      {children}
    </span>
  );
}

export default function StoveCard() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  // Hook lifted from StoveSheet body to this card (260506-d45 Fix B): the
  // sheet was previously calling useStoveData/useStoveCommands too, doubling
  // the WS subscription + adaptive-polling cost on every open. Now the card
  // owns the single mount and threads the live data into the sheet via props.
  const stove = useStoveData({ userId: user?.sub });
  const cmds = useStoveCommands({
    stoveData: {
      setLoading: stove.setLoading,
      setLoadingMessage: stove.setLoadingMessage,
      fetchStatusAndUpdate: stove.fetchStatusAndUpdate,
      setSchedulerEnabled: stove.setSchedulerEnabled,
      setSemiManualMode: stove.setSemiManualMode,
      setReturnToAutoAt: stove.setReturnToAutoAt,
      setNextScheduledAction: stove.setNextScheduledAction,
      setCleaningInProgress: stove.setCleaningInProgress,
      fetchMaintenanceStatus: stove.fetchMaintenanceStatus,
      semiManualMode: stove.semiManualMode,
    },
    router,
    user,
  });

  const state = getStoveStateDisplay(stove.status, stove.isAccesa);
  const isAlarm = state.tone === 'danger';

  // D-25: stale → amber StatusDot. `staleness` is StalenessInfo | null.
  const isStale = stove.staleness?.isStale ?? false;
  // ROADMAP M78: the last read failed → same amber dot, and the card says so.
  const unreachable = stove.unreachable ?? false;
  const dotColor = isAlarm ? DANGER : isStale || unreachable ? WARN : undefined;

  // ROADMAP M9: cleaning due (counted on the Pi) blocks ignition → visible on the card itself.
  const needsCleaning = stove.needsMaintenance;
  const cleaningHours = stove.maintenanceStatus?.currentHours;
  const tone = isAlarm ? DANGER : needsCleaning ? WARN : 'var(--accent)';

  // Last line: what is wrong first, otherwise what the schedule does next.
  const schedule = describeStoveSchedule(stove);
  const detail: { text: string; warn: boolean } = isAlarm
    ? { text: stove.errorCode ? `Errore ${stove.errorCode}` : 'Controlla la stufa', warn: false }
    : unreachable
      ? { text: 'Non risponde', warn: true }
      : isStale
      ? {
          text: stove.staleness?.cachedAt ? `Dati di ${formatStoveAge(stove.staleness.ageSeconds)} fa` : 'Dati non aggiornati',
          warn: true,
        }
      : stove.pelletLow
        ? { text: 'Pellet in riserva', warn: true }
        : { text: schedule.nextShort ?? schedule.mode, warn: false };

  // ROADMAP M15/M16: skeleton until the first fresh data (REST or WS snapshot),
  // and again after a return to foreground until the topic sends a new frame.
  const ready = useCardReady(!stove.initialLoading, 'thermorossi');
  if (!ready) return <GlassCardSkeleton label="Stufa" />;

  return (
    <>
      <GlassCard
        tone={tone}
        onOpen={() => setOpen(true)}
        data-testid="stove-card"
      >
        <CardHead
          Icon={Flame}
          label="Stufa"
          tone={tone}
          right={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {/* ROADMAP D11: reserve sensor of the stove, read on the Pi */}
              {stove.pelletLow && (
                <HeadBadge testId="stove-pellet-low-badge" label="Pellet in riserva">
                  <Fuel size={11} strokeWidth={2.4} aria-hidden />
                </HeadBadge>
              )}
              {needsCleaning && (
                <HeadBadge testId="stove-cleaning-badge" label="Pulizia richiesta">
                  <Wrench size={11} strokeWidth={2.4} aria-hidden />
                </HeadBadge>
              )}
              <StatusDot on={stove.isAccesa || isAlarm || unreachable} color={dotColor} />
            </span>
          }
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            position: 'relative',
          }}
        >
          {/* FlameViz top-right, scaled down so it stays clear of the text column. */}
          <div
            style={{
              position: 'absolute',
              right: -6,
              top: -14,
              opacity: 0.9,
              transform: 'scale(0.72)',
              transformOrigin: 'top right',
            }}
            data-testid="flame-viz-wrapper"
          >
            <FlameViz on={stove.isAccesa} intensity={(stove.powerLevel ?? 0) / 5} />
          </div>
          <div
            data-testid="stove-state"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1,
              color: isAlarm ? DANGER : stove.isAccesa ? '#fff' : 'var(--text-2)',
              letterSpacing: -0.4,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {state.short}
          </div>
          {needsCleaning ? (
            <div
              role="status"
              data-testid="stove-maintenance-alert"
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 600,
                color: WARN,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 4,
              }}
            >
              <Wrench size={12} strokeWidth={2.4} aria-hidden />
              <span>
                Pulizia richiesta
                {cleaningHours !== undefined && (
                  <span style={{ display: 'block', fontWeight: 400, color: 'var(--text-2)' }}>
                    {Math.round(cleaningHours)} h di lavoro
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div style={{ marginTop: 6, position: 'relative', zIndex: 1 }}>
              {stove.isAccesa && (
                <div data-testid="stove-levels" style={lineStyle}>
                  {`Potenza ${stove.powerLevel ?? '—'} · Ventola ${stove.fanLevel ?? '—'}`}
                </div>
              )}
              <div
                data-testid="stove-detail"
                style={{
                  ...lineStyle,
                  color: detail.warn ? WARN : 'var(--text-2)',
                  fontWeight: detail.warn ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {detail.text}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
        <StoveSheet
          stoveData={stove}
          cmds={cmds}
          onNavigate={(p) => router.push(p)}
        />
      </Sheet>
    </>
  );
}
