/**
 * NetworkInfo Component
 *
 * Secondary info grid showing device count, health, and uptime.
 * Uses InfoBox component from design system.
 *
 * Pure presentational component - no state, effects, or hooks.
 */

'use client';

import InfoBox from '@/app/components/ui/InfoBox';
import type { WanData, NetworkHealthStatus } from '../types';

export interface NetworkInfoProps {
  activeDeviceCount: number;
  wan: WanData | null;
  health: NetworkHealthStatus;
}

/**
 * Format uptime in seconds to human-readable Italian format
 * Examples: "2g 5h", "3h 15m", "45m"
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return hours > 0 ? `${days}g ${hours}h` : `${days}g`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Map health status to Italian label
 */
function getHealthLabel(health: NetworkHealthStatus): string {
  const labels: Record<NetworkHealthStatus, string> = {
    excellent: 'Eccellente',
    good: 'Buona',
    degraded: 'Degradata',
    poor: 'Scarsa',
  };
  return labels[health];
}

/**
 * Map health status to InfoBox variant
 */
function getHealthVariant(health: NetworkHealthStatus): 'sage' | 'warning' | 'danger' {
  if (health === 'excellent' || health === 'good') return 'sage';
  if (health === 'degraded') return 'warning';
  return 'danger';
}

export default function NetworkInfo({
  activeDeviceCount,
  wan,
  health,
}: NetworkInfoProps) {
  const uptime = wan?.uptime ?? 0;
  const healthLabel = getHealthLabel(health);
  const healthVariant = getHealthVariant(health);

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {/* Device Count */}
      <InfoBox
        icon="📱"
        label="Dispositivi"
        value={activeDeviceCount}
        variant="sage"
      />

      {/* Network Health */}
      <InfoBox
        icon="📶"
        label="Salute"
        value={healthLabel}
        variant={healthVariant}
      />

      {/* Uptime */}
      <InfoBox
        icon="⏱️"
        label="Uptime"
        value={formatUptime(uptime)}
        variant="sage"
      />
    </div>
  );
}
