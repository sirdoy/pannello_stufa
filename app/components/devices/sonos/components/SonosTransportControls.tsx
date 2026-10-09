'use client';

import { Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import type { SonosPlaybackResponse } from '@/types/sonosProxy';

interface SonosTransportControlsProps {
  playback: SonosPlaybackResponse | undefined;
  groupId: string;
  onPlay: (groupId: string) => Promise<void>;
  onPause: (groupId: string) => Promise<void>;
  onStop: (groupId: string) => Promise<void>;
  onNext: (groupId: string) => Promise<void>;
  onPrevious: (groupId: string) => Promise<void>;
}

export default function SonosTransportControls({
  playback,
  groupId,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrevious,
}: SonosTransportControlsProps) {
  const isPlaying = playback?.transport_state === 'PLAYING';

  return (
    <div className="flex items-center gap-2">
      <Button.Icon
        variant="subtle"
        size="sm"
        onClick={() => void onPrevious(groupId)}
        aria-label="Precedente"
        icon={<SkipBack size={18} />}
      />
      {isPlaying ? (
        <Button.Icon
          variant="subtle"
          size="sm"
          onClick={() => void onPause(groupId)}
          aria-label="Pausa"
          icon={<Pause size={18} />}
        />
      ) : (
        <Button.Icon
          variant="subtle"
          size="sm"
          onClick={() => void onPlay(groupId)}
          aria-label="Play"
          icon={<Play size={18} />}
        />
      )}
      <Button.Icon
        variant="subtle"
        size="sm"
        onClick={() => void onStop(groupId)}
        aria-label="Stop"
        icon={<Square size={18} />}
      />
      <Button.Icon
        variant="subtle"
        size="sm"
        onClick={() => void onNext(groupId)}
        aria-label="Successivo"
        icon={<SkipForward size={18} />}
      />
    </div>
  );
}
