'use client';

import { useState } from 'react';
import { useSyncedState } from '@/lib/hooks/useSyncedState';
import Text from '@/app/components/ui/Text';
import type { SonosPlaybackResponse } from '@/types/sonosProxy';

interface SonosSeekControlProps {
  playback: SonosPlaybackResponse | undefined;
  groupId: string;
  onSeek: (groupId: string, position: string) => Promise<void>;
}

/** Convert "H:MM:SS" or "HH:MM:SS" to total seconds */
function hhmmssToSeconds(ts: string): number {
  const parts = ts.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  return h * 3600 + m * 60 + s;
}

/** Convert total seconds to "HH:MM:SS" */
function secondsToHhmmss(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Format "H:MM:SS" or "HH:MM:SS" as "M:SS" for display */
function formatTime(ts: string | null): string {
  if (!ts) return '--:--';
  const total = hhmmssToSeconds(ts);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SonosSeekControl({ playback, groupId, onSeek }: SonosSeekControlProps) {
  const disabled =
    !playback ||
    playback.transport_state === 'STOPPED' ||
    playback.duration === null;

  const durationSeconds = playback?.duration ? hhmmssToSeconds(playback.duration) : 0;
  const positionSeconds = playback?.position ? hhmmssToSeconds(playback.position) : 0;

  const [isDragging, setIsDragging] = useState(false);
  // Sync from server when not dragging
  const [localPosition, setLocalPosition] = useSyncedState(positionSeconds, isDragging);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDragging(true);
    setLocalPosition(parseInt(e.target.value, 10));
  };

  const handleRelease = () => {
    const hhmmssString = secondsToHhmmss(localPosition);
    void onSeek(groupId, hhmmssString);
    setIsDragging(false);
  };

  return (
    <div className="space-y-1">
      <input
        type="range"
        min={0}
        max={durationSeconds || 1}
        value={localPosition}
        disabled={disabled}
        onChange={handleChange}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
        className="h-2 w-full rounded-lg bg-white/10 accent-ember-500 disabled:opacity-50"
        aria-label="Seek"
      />
      <div className="flex justify-between">
        <Text as="span" variant="secondary" size="xs">{formatTime(playback?.position ?? null)}</Text>
        <Text as="span" variant="secondary" size="xs">{formatTime(playback?.duration ?? null)}</Text>
      </div>
    </div>
  );
}
