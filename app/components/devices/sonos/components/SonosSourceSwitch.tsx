'use client';

import Button from '@/app/components/ui/Button';

interface SonosSourceSwitchProps {
  uid: string;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  onSwitchSource: (uid: string, source: 'tv' | 'line_in') => Promise<void>;
  currentSource?: 'tv' | 'streaming' | 'radio' | 'line_in' | 'airplay' | 'unknown' | null;
}

export default function SonosSourceSwitch({
  uid,
  role,
  onSwitchSource,
  currentSource,
}: SonosSourceSwitchProps) {
  // Only render for soundbar role
  if (role !== 'soundbar') {
    return null;
  }

  const isTvActive = currentSource === 'tv';
  const isLineInActive = currentSource === 'line_in';

  return (
    <div className="mt-2 inline-flex items-center gap-1">
      <Button
        variant={isTvActive ? 'ember' : 'subtle'}
        size="sm"
        onClick={() => void onSwitchSource(uid, 'tv')}
        aria-label="Sorgente TV"
        aria-pressed={isTvActive}
      >
        TV
      </Button>
      <Button
        variant={isLineInActive ? 'ember' : 'subtle'}
        size="sm"
        onClick={() => void onSwitchSource(uid, 'line_in')}
        aria-label="Sorgente Line-in"
        aria-pressed={isLineInActive}
      >
        Line-in
      </Button>
    </div>
  );
}
