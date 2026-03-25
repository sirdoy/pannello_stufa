'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [localSubGain, setLocalSubGain] = useState(htData?.sub_gain ?? 0);
  const [localSurroundTv, setLocalSurroundTv] = useState(htData?.surround_volume_tv ?? 0);
  const [localSurroundMusic, setLocalSurroundMusic] = useState(htData?.surround_volume_music ?? 0);
  const subGainDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surroundTvDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surroundMusicDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local slider values from server data
  useEffect(() => {
    setLocalSubGain(htData?.sub_gain ?? 0);
  }, [htData?.sub_gain]);

  useEffect(() => {
    setLocalSurroundTv(htData?.surround_volume_tv ?? 0);
  }, [htData?.surround_volume_tv]);

  useEffect(() => {
    setLocalSurroundMusic(htData?.surround_volume_music ?? 0);
  }, [htData?.surround_volume_music]);

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
        : 'bg-slate-700 text-slate-400 hover:bg-slate-600 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-500'
    }`;

  const formatValue = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 [html:not(.dark)_&]:text-slate-500 [html:not(.dark)_&]:hover:text-slate-700 transition-colors"
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
              <span className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 w-24 flex-shrink-0">
                Guadagno Sub
              </span>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSubGain}
                onChange={handleSubGainChange}
                className="flex-1 h-2 rounded-lg appearance-none bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 accent-emerald-500"
                aria-label="Guadagno Sub"
              />
              <span className="text-xs text-slate-400 min-w-[28px] text-right">
                {formatValue(localSubGain)}
              </span>
            </div>
          )}

          {/* Surround TV volume slider — visible only when surround_enabled */}
          {htData.surround_enabled === true && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 w-24 flex-shrink-0">
                Volume Surround TV
              </span>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSurroundTv}
                onChange={handleSurroundTvChange}
                className="flex-1 h-2 rounded-lg appearance-none bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 accent-emerald-500"
                aria-label="Volume Surround TV"
              />
              <span className="text-xs text-slate-400 min-w-[28px] text-right">
                {formatValue(localSurroundTv)}
              </span>
            </div>
          )}

          {/* Surround music volume slider — visible only when surround_enabled */}
          {htData.surround_enabled === true && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 w-24 flex-shrink-0">
                Volume Surround Musica
              </span>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSurroundMusic}
                onChange={handleSurroundMusicChange}
                className="flex-1 h-2 rounded-lg appearance-none bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 accent-emerald-500"
                aria-label="Volume Surround Musica"
              />
              <span className="text-xs text-slate-400 min-w-[28px] text-right">
                {formatValue(localSurroundMusic)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
