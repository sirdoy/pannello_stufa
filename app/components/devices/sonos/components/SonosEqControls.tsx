'use client';

import { useState, useRef } from 'react';
import { useSyncedState } from '@/lib/hooks/useSyncedState';
import { ChevronDown } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import RangeSlider from '@/app/components/ui/RangeSlider';
import Text from '@/app/components/ui/Text';
import type { SonosEqResponse, SetEqRequest } from '@/types/sonosProxy';

interface SonosEqControlsProps {
  uid: string;
  eqData: SonosEqResponse | undefined;
  onSetEq: (uid: string, eq: SetEqRequest) => Promise<void>;
}

export default function SonosEqControls({ uid, eqData, onSetEq }: SonosEqControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Local slider values, re-synced from server data
  const [localBass, setLocalBass] = useSyncedState(eqData?.bass ?? 0);
  const [localTreble, setLocalTreble] = useSyncedState(eqData?.treble ?? 0);
  const bassDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trebleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Return null if no EQ data or all fields are null
  if (!eqData || (eqData.bass === null && eqData.treble === null && eqData.loudness === null)) {
    return null;
  }

  const handleBassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalBass(value);
    if (bassDebounceRef.current) clearTimeout(bassDebounceRef.current);
    bassDebounceRef.current = setTimeout(() => {
      void onSetEq(uid, { bass: value });
    }, 250);
  };

  const handleTrebleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalTreble(value);
    if (trebleDebounceRef.current) clearTimeout(trebleDebounceRef.current);
    trebleDebounceRef.current = setTimeout(() => {
      void onSetEq(uid, { treble: value });
    }, 250);
  };

  const handleLoudnessToggle = () => {
    void onSetEq(uid, { loudness: !eqData.loudness });
  };

  const formatValue = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-label="EQ"
        icon={<ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
        iconPosition="right"
      >
        EQ
      </Button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Bass slider */}
          <div className="flex items-center gap-3">
            <Text as="span" variant="secondary" size="xs" className="w-14">Bass</Text>
            <RangeSlider
              min={-10}
              max={10}
              value={localBass}
              onChange={handleBassChange}
              className="flex-1"
              aria-label="Bass"
            />
            <Text as="span" variant="secondary" size="xs" className="min-w-7 text-right">
              {formatValue(localBass)}
            </Text>
          </div>

          {/* Treble slider */}
          <div className="flex items-center gap-3">
            <Text as="span" variant="secondary" size="xs" className="w-14">Treble</Text>
            <RangeSlider
              min={-10}
              max={10}
              value={localTreble}
              onChange={handleTrebleChange}
              className="flex-1"
              aria-label="Treble"
            />
            <Text as="span" variant="secondary" size="xs" className="min-w-7 text-right">
              {formatValue(localTreble)}
            </Text>
          </div>

          {/* Loudness toggle */}
          <Button
            variant={eqData.loudness ? 'ember' : 'subtle'}
            size="sm"
            onClick={handleLoudnessToggle}
            aria-label={`Loudness ${eqData.loudness ? 'attivo' : 'disattivo'}`}
          >
            Loudness
          </Button>
        </div>
      )}
    </div>
  );
}
