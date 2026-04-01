'use client';

import { useCallback } from 'react';
import { useTuyaData } from '@/app/components/devices/tuya/hooks/useTuyaData';
import { useTuyaCommands } from '@/app/components/devices/tuya/hooks/useTuyaCommands';
import { TuyaPlugCard } from '@/app/components/devices/tuya/components/TuyaPlugCard';
import Heading from '@/app/components/ui/Heading';
import Skeleton from '@/app/components/ui/Skeleton';
import { Banner } from '@/app/components/ui';

/**
 * /tuya page — Multi-plug control and monitoring
 *
 * Orchestrator pattern:
 * - useTuyaData provides live plug list (WS-primary, polling fallback)
 * - useTuyaCommands provides toggle/timer handlers
 * - TuyaPlugCard renders per-plug UI with expandable energy chart
 */
export default function TuyaPage() {
  const { plugs, loading, error, stale } = useTuyaData();
  const { togglePlug, setTimer, cancelTimer } = useTuyaCommands();

  const handleToggle = useCallback(
    async (deviceId: string, currentState: boolean) => {
      const result = await togglePlug(deviceId, currentState);
      if (!result) {
        // data_confirmed=false or error — WS will push the update
        setTimeout(() => {
          // WS will push update, no explicit re-fetch needed
        }, 2000);
      }
    },
    [togglePlug]
  );

  const handleSetTimer = useCallback(
    async (deviceId: string, seconds: number) => {
      await setTimer(deviceId, seconds);
    },
    [setTimer]
  );

  const handleCancelTimer = useCallback(
    async (deviceId: string) => {
      await cancelTimer(deviceId);
    },
    [cancelTimer]
  );

  // Loading guard — only on initial load (no cached data)
  if (loading && !plugs) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[260px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">🔌</span>
        <Heading level={1} size="2xl">
          Tuya Smart Plug
        </Heading>
      </div>

      {/* Stale banner */}
      {stale && plugs && (
        <Banner variant="warning" title="Dati non aggiornati" compact={true} />
      )}

      {/* Error state — no data at all */}
      {error && !plugs && (
        <Banner variant="warning">
          Tuya non raggiungibile
        </Banner>
      )}

      {/* Plug grid */}
      {plugs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plugs.map((plug) => (
            <TuyaPlugCard
              key={plug.device_id}
              plug={plug}
              onToggle={handleToggle}
              onSetTimer={handleSetTimer}
              onCancelTimer={handleCancelTimer}
            />
          ))}
          {plugs.length === 0 && (
            <p className="col-span-full text-sm text-slate-400">
              Nessun plug rilevato.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
