'use client';

import { useState, useRef } from 'react';
import { useSyncedState } from '@/lib/hooks/useSyncedState';
import { ChevronDown } from 'lucide-react';
import type { SonosHomeTheaterResponse, SetHomeTheaterRequest } from '@/types/sonosProxy';

interface SonosHomeTheaterProps {
  uid: string;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  htData: SonosHomeTheaterResponse | undefined;
  onSetHomeTheater: (uid: string, settings: SetHomeTheaterRequest) => Promise<void>;
}

export default function SonosHomeTheater({ uid, role, htData, onSetHomeTheater }: SonosHomeTheaterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Local slider values, re-synced from server data
  const [localSubGain, setLocalSubGain] = useSyncedState(htData?.sub_gain ?? 0);
  const [localSurroundTv, setLocalSurroundTv] = useSyncedState(htData?.surround_volume_tv ?? 0);
  const [localSurroundMusic, setLocalSurroundMusic] = useSyncedState(htData?.surround_volume_music ?? 0);
  const subGainDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surroundTvDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surroundMusicDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only render for soundbar role
  if (role !== 'soundbar') {
    return null;
  }

  if (!htData) {
    return null;
  }

  const handleSubGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalSubGain(value);
    if (subGainDebounceRef.current) clearTimeout(subGainDebounceRef.current);
    subGainDebounceRef.current = setTimeout(() => {
      void onSetHomeTheater(uid, { sub_gain: value });
    }, 250);
  };

  const handleSurroundTvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalSurroundTv(value);
    if (surroundTvDebounceRef.current) clearTimeout(surroundTvDebounceRef.current);
    surroundTvDebounceRef.current = setTimeout(() => {
      void onSetHomeTheater(uid, { surround_volume_tv: value });
    }, 250);
  };

  const handleSurroundMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalSurroundMusic(value);
    if (surroundMusicDebounceRef.current) clearTimeout(surroundMusicDebounceRef.current);
    surroundMusicDebounceRef.current = setTimeout(() => {
      void onSetHomeTheater(uid, { surround_volume_music: value });
    }, 250);
  };

  const toggleClass = (active: boolean | null) =>
    `text-xs px-3 py-1 rounded-md transition-colors ${
      active
        ? 'bg-amber-500/80 text-white'
        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
    }`;

  const formatValue = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-200"
        aria-label="Home Theater"
      >
        <span>Home Theater</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Toggle buttons row */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void onSetHomeTheater(uid, { night_mode: !htData.night_mode })}
              className={toggleClass(htData.night_mode)}
              aria-label={`Modalita notte ${htData.night_mode ? 'attiva' : 'disattiva'}`}
            >
              Modalita notte
            </button>

            <button
              onClick={() => void onSetHomeTheater(uid, { dialog_mode: !htData.dialog_mode })}
              className={toggleClass(htData.dialog_mode)}
              aria-label={`Dialogo ${htData.dialog_mode ? 'attivo' : 'disattivo'}`}
            >
              Dialogo
            </button>

            <button
              onClick={() => void onSetHomeTheater(uid, { sub_enabled: !htData.sub_enabled })}
              className={toggleClass(htData.sub_enabled)}
              aria-label={`Subwoofer ${htData.sub_enabled ? 'attivo' : 'disattivo'}`}
            >
              Subwoofer
            </button>

            <button
              onClick={() => void onSetHomeTheater(uid, { surround_enabled: !htData.surround_enabled })}
              className={toggleClass(htData.surround_enabled)}
              aria-label={`Surround ${htData.surround_enabled ? 'attivo' : 'disattivo'}`}
            >
              Surround
            </button>
          </div>

          {/* Sub gain slider — visible only when sub_enabled */}
          {htData.sub_enabled === true && (
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-slate-400">
                Guadagno Sub
              </span>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSubGain}
                onChange={handleSubGainChange}
                className="h-2 flex-1 appearance-none rounded-lg bg-slate-700/50 accent-emerald-500"
                aria-label="Guadagno Sub"
              />
              <span className="min-w-7 text-right text-xs text-slate-400">
                {formatValue(localSubGain)}
              </span>
            </div>
          )}

          {/* Surround TV volume slider — visible only when surround_enabled */}
          {htData.surround_enabled === true && (
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-slate-400">
                Volume Surround TV
              </span>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSurroundTv}
                onChange={handleSurroundTvChange}
                className="h-2 flex-1 appearance-none rounded-lg bg-slate-700/50 accent-emerald-500"
                aria-label="Volume Surround TV"
              />
              <span className="min-w-7 text-right text-xs text-slate-400">
                {formatValue(localSurroundTv)}
              </span>
            </div>
          )}

          {/* Surround music volume slider — visible only when surround_enabled */}
          {htData.surround_enabled === true && (
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-slate-400">
                Volume Surround Musica
              </span>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSurroundMusic}
                onChange={handleSurroundMusicChange}
                className="h-2 flex-1 appearance-none rounded-lg bg-slate-700/50 accent-emerald-500"
                aria-label="Volume Surround Musica"
              />
              <span className="min-w-7 text-right text-xs text-slate-400">
                {formatValue(localSurroundMusic)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
