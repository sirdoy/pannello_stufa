'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import Text from './Text';

/**
 * OfflineBanner Component
 *
 * Shows a persistent banner when the device is offline.
 * Also shows reconnection message when coming back online.
 *
 * Features:
 * - Automatic show/hide based on connection status
 * - Shows pending command count
 * - Reconnection success animation
 * - Synced command notification
 *
 * @param {Object} props - Component props
 * @param {boolean} props.showPendingCount - Show pending command count
 * @param {boolean} props.fixed - Use fixed positioning at top
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * // In your layout or page
 * <OfflineBanner showPendingCount />
 *
 * // Fixed at top of screen
 * <OfflineBanner fixed />
 */
export default function OfflineBanner({
  showPendingCount = true,
  fixed = false,
  className = '',
}) {
  const { isOnline, wasOffline, offlineSince } = useOnlineStatus();
  const { pendingCount, lastSyncedCommand } = useBackgroundSync();
  const [showReconnected, setShowReconnected] = useState(false);

  // Show reconnected message briefly when coming back online
  useEffect(() => {
    if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline]);

  // Don't render if online and no special messages
  if (isOnline && !showReconnected && !lastSyncedCommand) {
    return null;
  }

  // Calculate offline duration
  const getOfflineDuration = () => {
    if (!offlineSince) return '';
    const minutes = Math.round((Date.now() - offlineSince.getTime()) / 60000);
    if (minutes < 1) return 'adesso';
    if (minutes < 60) return `${minutes} min`;
    return `${Math.round(minutes / 60)} ore`;
  };

  const baseClasses = `
    px-4 py-2 text-center transition-all duration-300 z-50
    ${fixed ? 'fixed top-0 left-0 right-0' : ''}
  `;

  // Reconnected state
  if (showReconnected) {
    return (
      <div
        className={`
          ${baseClasses}
          bg-emerald-500/90 dark:bg-emerald-600/90
          backdrop-blur-sm
          ${className}
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <Text className="text-white">
            <span className="mr-1">🌐</span>
            Connessione ripristinata
          </Text>
          {pendingCount > 0 && (
            <Text className="text-white/80 text-sm">
              • Sincronizzazione in corso...
            </Text>
          )}
        </div>
      </div>
    );
  }

  // Synced command notification
  if (lastSyncedCommand) {
    const actionLabels = {
      'stove/ignite': '🔥 Stufa accesa',
      'stove/shutdown': '🌙 Stufa spenta',
      'stove/set-power': '⚡ Potenza impostata',
    };
    const label = actionLabels[lastSyncedCommand.endpoint] || 'Comando eseguito';

    return (
      <div
        className={`
          ${baseClasses}
          bg-emerald-500/90 dark:bg-emerald-600/90
          backdrop-blur-sm
          animate-pulse
          ${className}
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <Text className="text-white">
            ✓ {label}
          </Text>
        </div>
      </div>
    );
  }

  // Offline state
  if (!isOnline) {
    return (
      <div
        className={`
          ${baseClasses}
          bg-amber-500/90 dark:bg-amber-600/90
          backdrop-blur-sm
          ${className}
        `}
      >
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Text className="text-white">
            <span className="mr-1">📡</span>
            Offline
            {offlineSince && (
              <span className="text-white/70 text-sm ml-1">
                da {getOfflineDuration()}
              </span>
            )}
          </Text>
          {showPendingCount && pendingCount > 0 && (
            <Text className="text-white/90 text-sm">
              • {pendingCount} {pendingCount === 1 ? 'comando' : 'comandi'} in coda
            </Text>
          )}
        </div>
      </div>
    );
  }

  return null;
}
