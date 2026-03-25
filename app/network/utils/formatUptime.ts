/**
 * formatUptime
 *
 * Converts uptime in seconds to a human-readable Italian format.
 * - Days present: "Xg Yh" (giorni/ore)
 * - Hours only: "Xh Ym" (ore/minuti)
 * - Minutes only: "Xm" (minuti)
 *
 * Extracted from WanStatusCard for shared usage across network components.
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}g ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
