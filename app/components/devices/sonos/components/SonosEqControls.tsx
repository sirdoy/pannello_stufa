'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SonosEqResponse, SetEqRequest } from '@/types/sonosProxy';

interface SonosEqControlsProps {
  uid: string;
  eqData: SonosEqResponse | undefined;
  onSetEq: (uid: string, eq: SetEqRequest) => Promise<void>;
}

export default function SonosEqControls({ uid, eqData, onSetEq }: SonosEqControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localBass, setLocalBass] = useState(eqData?.bass ?? 0);
  const [localTreble, setLocalTreble] = useState(eqData?.treble ?? 0);
  const bassDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trebleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local slider values from server data
  useEffect(() => {
    setLocalBass(eqData?.bass ?? 0);
  }, [eqData?.bass]);

  useEffect(() => {
    setLocalTreble(eqData?.treble ?? 0);
  }, [eqData?.treble]);

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
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700 transition-colors"
        aria-label="EQ"
      >
        <span>EQ</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Bass slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 w-14">Bass</span>
            <input
              type="range"
              min={-10}
              max={10}
              value={localBass}
              onChange={handleBassChange}
              className="flex-1 h-2 rounded-lg appearance-none bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 accent-emerald-500"
              aria-label="Bass"
            />
            <span className="text-xs text-slate-400 min-w-[28px] text-right">
              {formatValue(localBass)}
            </span>
          </div>

          {/* Treble slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 w-14">Treble</span>
            <input
              type="range"
              min={-10}
              max={10}
              value={localTreble}
              onChange={handleTrebleChange}
              className="flex-1 h-2 rounded-lg appearance-none bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 accent-emerald-500"
              aria-label="Treble"
            />
            <span className="text-xs text-slate-400 min-w-[28px] text-right">
              {formatValue(localTreble)}
            </span>
          </div>

          {/* Loudness toggle */}
          <button
            onClick={handleLoudnessToggle}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${
              eqData.loudness
                ? 'bg-amber-500/80 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-500'
            }`}
            aria-label={`Loudness ${eqData.loudness ? 'attivo' : 'disattivo'}`}
          >
            Loudness
          </button>
        </div>
      )}
    </div>
  );
}
