'use client';

import Text from '@/app/components/ui/Text';
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
    return <Text variant="secondary" size="sm" className="italic">Nessuna riproduzione</Text>;
  }

  return (
    <div>
      <Text weight="medium" className="truncate">
        {title ?? 'Nessuna riproduzione'}
      </Text>
      {artist && <Text variant="secondary" size="sm" className="truncate">{artist}</Text>}
    </div>
  );
}
