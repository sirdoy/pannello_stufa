'use client';

/**
 * SchedulerEngineBanner — warns when the stove engine on the Pi stops ticking (ROADMAP V8).
 *
 * Since D2 the schedule runs on the Pi: its engine ticks every minute. This
 * banner watches that heartbeat instead of the old Vercel cron (`cronHealth/lastCall`).
 *
 * Data: one REST read on mount (`GET /api/v1/thermorossi/scheduler/engine`),
 * then the WS `scheduler` topic — `data.engine` on the snapshot and every
 * `engine.tick` event timestamp. REST is re-read every minute only while the
 * WS is not connected, so a healthy page costs no extra requests.
 */

import { useEffect, useState } from 'react';
import Banner from './ui/Banner';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { SchedulerEngineHealth, SchedulerWsPayload } from '@/types/thermorossiScheduler';

const DEFAULT_STALE_AFTER_S = 180;

interface SchedulerEngineBannerProps {
  variant?: 'banner' | 'inline';
}

interface Heartbeat {
  /** Last tick (or engine start before the first tick), epoch ms. */
  lastSeenMs: number | null;
  staleAfterS: number;
  initialized: boolean;
}

function fromHealth(health: SchedulerEngineHealth): Heartbeat {
  const seconds = health.last_tick_at ?? health.started_at;
  return {
    lastSeenMs: seconds === null ? null : seconds * 1000,
    staleAfterS: health.stale_after_s || DEFAULT_STALE_AFTER_S,
    initialized: health.initialized,
  };
}

export default function SchedulerEngineBanner({ variant = 'banner' }: SchedulerEngineBannerProps) {
  const [heartbeat, setHeartbeat] = useState<Heartbeat | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const wsOpen = readyState === ReadyState.OPEN;

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/v1/thermorossi/scheduler/engine');
      if (!response.ok) return;
      setHeartbeat(fromHealth((await response.json()) as SchedulerEngineHealth));
      setNow(Date.now());
    } catch (error) {
      console.error('[SchedulerEngineBanner] Error fetching engine health:', error);
    }
  };

  // First read, then REST only as a fallback while the WS is down.
  useAdaptivePolling({
    callback: () => {
      if (heartbeat === null || !wsOpen) void fetchHealth();
    },
    interval: 60000,
    alwaysActive: false,
    immediate: true,
  });

  useEffect(() => {
    if (!wsOpen) return;
    const handleMessage = (raw: unknown) => {
      const { event, data, timestamp } = raw as SchedulerWsPayload;
      if (event === 'snapshot') {
        const engine = (data as { engine?: SchedulerEngineHealth } | null)?.engine;
        if (engine) setHeartbeat(fromHealth(engine));
      } else if (event === 'engine.tick' && timestamp) {
        const tickMs = Date.parse(timestamp);
        if (!Number.isNaN(tickMs)) {
          setHeartbeat((prev) => ({
            lastSeenMs: tickMs,
            staleAfterS: prev?.staleAfterS ?? DEFAULT_STALE_AFTER_S,
            initialized: true,
          }));
        }
      }
    };
    subscribe('scheduler', handleMessage);
    return () => unsubscribe('scheduler', handleMessage);
  }, [wsOpen, subscribe, unsubscribe]);

  // Local clock only: re-evaluate staleness without network calls.
  useAdaptivePolling({
    callback: () => setNow(Date.now()),
    interval: 30000,
    alwaysActive: false,
    immediate: false,
  });

  if (!heartbeat) return null;
  const ageS = heartbeat.lastSeenMs === null ? null : Math.max(0, (now - heartbeat.lastSeenMs) / 1000);
  const stopped = !heartbeat.initialized || ageS === null || ageS > heartbeat.staleAfterS;
  if (!stopped) return null;

  const minutes = ageS === null ? null : Math.floor(ageS / 60);
  const detail = heartbeat.initialized
    ? `Nessuna esecuzione da ${minutes ?? '?'} minuti`
    : 'Motore non avviato sul Pi';

  if (variant === 'inline') {
    return (
      <div
        data-testid="scheduler-engine-banner"
        className="flex items-center gap-4 rounded-xl border border-warning-500/40 bg-warning-900/30 p-5 backdrop-blur-xl"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-warning-500/50 bg-warning-900/40">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-warning-300">Motore stufa fermo</p>
          <p className="mt-0.5 text-sm text-warning-400">
            {detail} • La pianificazione automatica non sta girando
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="scheduler-engine-banner">
      <Banner
        variant="warning"
        icon="⚠️"
        title="Motore stufa fermo"
        description={<>{detail}. La pianificazione automatica sul Pi non sta girando.</>}
      />
    </div>
  );
}
