'use client';

import { useState, useRef } from 'react';
import { useSyncedState } from '@/lib/hooks/useSyncedState';
import { ChevronDown } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Text from '@/app/components/ui/Text';
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

  const toggleVariant = (active: boolean | null) => (active ? 'ember' : 'subtle');

  const formatValue = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-label="Home Theater"
        icon={<ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
        iconPosition="right"
      >
        Home Theater
      </Button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Toggle buttons row */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={toggleVariant(htData.night_mode)}
              size="sm"
              onClick={() => void onSetHomeTheater(uid, { night_mode: !htData.night_mode })}
              aria-label={`Modalita notte ${htData.night_mode ? 'attiva' : 'disattiva'}`}
            >
              Modalita notte
            </Button>

            <Button
              variant={toggleVariant(htData.dialog_mode)}
              size="sm"
              onClick={() => void onSetHomeTheater(uid, { dialog_mode: !htData.dialog_mode })}
              aria-label={`Dialogo ${htData.dialog_mode ? 'attivo' : 'disattivo'}`}
            >
              Dialogo
            </Button>

            <Button
              variant={toggleVariant(htData.sub_enabled)}
              size="sm"
              onClick={() => void onSetHomeTheater(uid, { sub_enabled: !htData.sub_enabled })}
              aria-label={`Subwoofer ${htData.sub_enabled ? 'attivo' : 'disattivo'}`}
            >
              Subwoofer
            </Button>

            <Button
              variant={toggleVariant(htData.surround_enabled)}
              size="sm"
              onClick={() => void onSetHomeTheater(uid, { surround_enabled: !htData.surround_enabled })}
              aria-label={`Surround ${htData.surround_enabled ? 'attivo' : 'disattivo'}`}
            >
              Surround
            </Button>
          </div>

          {/* Sub gain slider — visible only when sub_enabled */}
          {htData.sub_enabled === true && (
            <div className="flex items-center gap-3">
              <Text as="span" variant="secondary" size="xs" className="w-24 shrink-0">
                Guadagno Sub
              </Text>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSubGain}
                onChange={handleSubGainChange}
                className="h-2 flex-1 appearance-none rounded-lg bg-white/10 accent-ember-500"
                aria-label="Guadagno Sub"
              />
              <Text as="span" variant="secondary" size="xs" className="min-w-7 text-right">
                {formatValue(localSubGain)}
              </Text>
            </div>
          )}

          {/* Surround TV volume slider — visible only when surround_enabled */}
          {htData.surround_enabled === true && (
            <div className="flex items-center gap-3">
              <Text as="span" variant="secondary" size="xs" className="w-24 shrink-0">
                Volume Surround TV
              </Text>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSurroundTv}
                onChange={handleSurroundTvChange}
                className="h-2 flex-1 appearance-none rounded-lg bg-white/10 accent-ember-500"
                aria-label="Volume Surround TV"
              />
              <Text as="span" variant="secondary" size="xs" className="min-w-7 text-right">
                {formatValue(localSurroundTv)}
              </Text>
            </div>
          )}

          {/* Surround music volume slider — visible only when surround_enabled */}
          {htData.surround_enabled === true && (
            <div className="flex items-center gap-3">
              <Text as="span" variant="secondary" size="xs" className="w-24 shrink-0">
                Volume Surround Musica
              </Text>
              <input
                type="range"
                min={-15}
                max={15}
                value={localSurroundMusic}
                onChange={handleSurroundMusicChange}
                className="h-2 flex-1 appearance-none rounded-lg bg-white/10 accent-ember-500"
                aria-label="Volume Surround Musica"
              />
              <Text as="span" variant="secondary" size="xs" className="min-w-7 text-right">
                {formatValue(localSurroundMusic)}
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
