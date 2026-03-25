'use client';

import { Shuffle, Repeat } from 'lucide-react';
import type { SonosPlayMode } from '@/types/sonosProxy';

interface SonosPlayModeControlsProps {
  playMode: SonosPlayMode | null;
  onSetPlayMode: (mode: SonosPlayMode) => void;
}

function decomposePlayMode(mode: SonosPlayMode | null): { isShuffle: boolean; isRepeat: boolean } {
  const isShuffle =
    mode === 'SHUFFLE' || mode === 'SHUFFLE_NOREPEAT' || mode === 'SHUFFLE_REPEAT_ONE';
  const isRepeat =
    mode === 'REPEAT_ALL' ||
    mode === 'REPEAT_ONE' ||
    mode === 'SHUFFLE_REPEAT_ONE' ||
    mode === 'SHUFFLE';
  return { isShuffle, isRepeat };
}

function composePlayMode(
  currentMode: SonosPlayMode | null,
  toggle: 'shuffle' | 'repeat'
): SonosPlayMode {
  const { isShuffle, isRepeat } = decomposePlayMode(currentMode);

  let newShuffle = isShuffle;
  let newRepeat = isRepeat;

  if (toggle === 'shuffle') {
    newShuffle = !isShuffle;
  } else {
    newRepeat = !isRepeat;
  }

  if (newShuffle && newRepeat) return 'SHUFFLE';
  if (newShuffle && !newRepeat) return 'SHUFFLE_NOREPEAT';
  if (!newShuffle && newRepeat) return 'REPEAT_ALL';
  return 'NORMAL';
}

const activeClass = 'p-2 rounded-lg bg-ember-500/20 text-ember-400 transition-colors';
const inactiveClass =
  'p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-slate-500 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-400';

export default function SonosPlayModeControls({
  playMode,
  onSetPlayMode,
}: SonosPlayModeControlsProps) {
  const { isShuffle, isRepeat } = decomposePlayMode(playMode);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onSetPlayMode(composePlayMode(playMode, 'shuffle'))}
        className={isShuffle ? activeClass : inactiveClass}
        aria-label="Shuffle"
      >
        <Shuffle size={16} />
      </button>
      <button
        onClick={() => onSetPlayMode(composePlayMode(playMode, 'repeat'))}
        className={isRepeat ? activeClass : inactiveClass}
        aria-label="Ripeti"
      >
        <Repeat size={16} />
      </button>
    </div>
  );
}
