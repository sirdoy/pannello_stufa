'use client';

import { Shuffle, Repeat } from 'lucide-react';
import Button from '@/app/components/ui/Button';
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

export default function SonosPlayModeControls({
  playMode,
  onSetPlayMode,
}: SonosPlayModeControlsProps) {
  const { isShuffle, isRepeat } = decomposePlayMode(playMode);

  return (
    <div className="flex items-center gap-2">
      <Button.Icon
        variant={isShuffle ? 'ember' : 'subtle'}
        size="sm"
        onClick={() => onSetPlayMode(composePlayMode(playMode, 'shuffle'))}
        aria-label="Shuffle"
        icon={<Shuffle size={16} />}
      />
      <Button.Icon
        variant={isRepeat ? 'ember' : 'subtle'}
        size="sm"
        onClick={() => onSetPlayMode(composePlayMode(playMode, 'repeat'))}
        aria-label="Ripeti"
        icon={<Repeat size={16} />}
      />
    </div>
  );
}
