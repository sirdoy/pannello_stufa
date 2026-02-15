/**
 * NetworkStatusBar Component
 *
 * Full-width WAN connection status bar for NetworkCard.
 * Shows online/offline status with color coding and stale data indicator.
 *
 * Pure presentational component - no state, effects, or hooks.
 */

'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export interface NetworkStatusBarProps {
  connected: boolean;
  stale: boolean;
  lastUpdated: number | null;
}

export default function NetworkStatusBar({
  connected,
  stale,
  lastUpdated,
}: NetworkStatusBarProps) {
  return (
    <div
      className={`
        w-full rounded-lg border p-3 mb-4
        ${connected
          ? 'bg-emerald-500/20 border-emerald-500/30'
          : 'bg-red-500/20 border-red-500/30'
        }
      `}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        {/* Left: Status icon + text */}
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff
              className="w-4 h-4 text-red-400 animate-pulse"
              aria-label="Disconnected"
            />
          )}
          <span className={connected ? 'text-emerald-300' : 'text-red-300'}>
            {connected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Right: Stale indicator */}
        {stale && lastUpdated && (
          <span className="text-slate-400 text-xs">
            Aggiornato{' '}
            {formatDistanceToNow(new Date(lastUpdated), {
              locale: it,
              addSuffix: true,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
