'use client';

import { Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react';
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
  const buttonClass =
    'p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-slate-200 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:hover:bg-slate-300 [html:not(.dark)_&]:text-slate-700';

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => void onPrevious(groupId)}
        className={buttonClass}
        aria-label="Precedente"
      >
        <SkipBack size={18} />
      </button>
      {isPlaying ? (
        <button
          onClick={() => void onPause(groupId)}
          className={buttonClass}
          aria-label="Pausa"
        >
          <Pause size={18} />
        </button>
      ) : (
        <button
          onClick={() => void onPlay(groupId)}
          className={buttonClass}
          aria-label="Play"
        >
          <Play size={18} />
        </button>
      )}
      <button
        onClick={() => void onStop(groupId)}
        className={buttonClass}
        aria-label="Stop"
      >
        <Square size={18} />
      </button>
      <button
        onClick={() => void onNext(groupId)}
        className={buttonClass}
        aria-label="Successivo"
      >
        <SkipForward size={18} />
      </button>
    </div>
  );
}
