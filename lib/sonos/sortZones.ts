/**
 * Playing zones first (ROADMAP M18).
 *
 * Stable: zones keep the backend order inside the "playing" and "not playing"
 * blocks, so the list only moves when a zone starts or stops playing.
 */
export function sortZonesPlayingFirst<T extends { group_id: string }>(
  zones: readonly T[],
  playback: Readonly<Record<string, { transport_state?: string | null } | undefined>> | undefined
): T[] {
  const isPlaying = (zone: T) => playback?.[zone.group_id]?.transport_state === 'PLAYING';
  return [...zones].sort((a, b) => Number(isPlaying(b)) - Number(isPlaying(a)));
}
