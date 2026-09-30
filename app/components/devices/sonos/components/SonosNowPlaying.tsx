'use client';

import type { SonosPlaybackResponse } from '@/types/sonosProxy';

interface SonosNowPlayingProps {
  playback: SonosPlaybackResponse | undefined;
}

export default function SonosNowPlaying({ playback }: SonosNowPlayingProps) {
  const title = playback?.title ?? null;
  const artist = playback?.artist ?? null;
  const isPlaying = playback?.transport_state === 'PLAYING';
  const isPaused = playback?.transport_state === 'PAUSED_PLAYBACK';

  if (!title && !isPlaying && !isPaused) {
    return <p className="text-sm text-slate-400 italic">Nessuna riproduzione</p>;
  }

  return (
    <div>
      <p className="truncate text-base font-medium text-slate-100">
        {title ?? 'Nessuna riproduzione'}
      </p>
      {artist && <p className="truncate text-sm text-slate-400">{artist}</p>}
    </div>
  );
}
