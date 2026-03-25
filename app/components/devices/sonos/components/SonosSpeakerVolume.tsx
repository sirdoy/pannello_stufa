'use client';

import { useState, useRef, useEffect } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';
import type { SonosVolumeResponse, SonosEqResponse, SonosHomeTheaterResponse, SetEqRequest, SetHomeTheaterRequest } from '@/types/sonosProxy';
import SonosEqControls from './SonosEqControls';
import SonosHomeTheater from './SonosHomeTheater';
import SonosSourceSwitch from './SonosSourceSwitch';
import SonosGroupControls from './SonosGroupControls';

interface SonosSpeakerVolumeProps {
  speakerName: string;
  uid: string;
  volumeData: SonosVolumeResponse | undefined;
  onSetVolume: (uid: string, volume: number) => Promise<void>;
  onSetMute: (uid: string, mute: boolean) => Promise<void>;
  // Extended control props
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  eqData: SonosEqResponse | undefined;
  htData: SonosHomeTheaterResponse | undefined;
  currentSource?: 'tv' | 'streaming' | 'radio' | 'line_in' | 'airplay' | 'unknown' | null;
  isCoordinator: boolean;
  zoneMemberCount: number;
  availableZones: Array<{ group_id: string; label: string; coordinator_uid: string }>;
  onSetEq: (uid: string, eq: SetEqRequest) => Promise<void>;
  onSetHomeTheater: (uid: string, settings: SetHomeTheaterRequest) => Promise<void>;
  onSwitchSource: (uid: string, source: 'tv' | 'line_in') => Promise<void>;
  onJoinGroup: (uid: string, targetUid: string) => Promise<void>;
  onUnjoinGroup: (uid: string) => Promise<void>;
}

export default function SonosSpeakerVolume({
  speakerName,
  uid,
  volumeData,
  onSetVolume,
  onSetMute,
  role,
  eqData,
  htData,
  currentSource,
  isCoordinator,
  zoneMemberCount,
  availableZones,
  onSetEq,
  onSetHomeTheater,
  onSwitchSource,
  onJoinGroup,
  onUnjoinGroup,
}: SonosSpeakerVolumeProps) {
  const volume = volumeData?.volume ?? 0;
  const isMuted = volumeData?.mute ?? false;
  const isDisabled = volumeData?.volume === null;
  const [localVolume, setLocalVolume] = useState(volume);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local volume from server data
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setLocalVolume(newVol); // optimistic
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void onSetVolume(uid, newVol);
    }, 250);
  };

  return (
    <div className="space-y-1">
      {/* Volume row */}
      <div className="flex items-center gap-3 py-2">
        <span className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-600 min-w-[100px] truncate">
          {speakerName}
        </span>
        <button
          onClick={() => void onSetMute(uid, !isMuted)}
          className="p-1.5 rounded-md hover:bg-slate-700/50 [html:not(.dark)_&]:hover:bg-slate-200 transition-colors"
          aria-label={isMuted ? 'Attiva audio' : 'Disattiva audio'}
        >
          {isMuted ? (
            <VolumeX size={16} className="text-red-400" />
          ) : (
            <Volume2 size={16} className="text-slate-400" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={localVolume}
          onChange={handleVolumeChange}
          disabled={isDisabled}
          className="flex-1 h-2 rounded-lg appearance-none bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 accent-emerald-500 disabled:opacity-50"
          aria-label={`Volume ${speakerName}`}
        />
        <span className="text-xs text-slate-400 min-w-[32px] text-right">{localVolume}%</span>
      </div>

      {/* Source switch — inline, soundbar only per D-15 */}
      <SonosSourceSwitch
        uid={uid}
        role={role}
        onSwitchSource={onSwitchSource}
        currentSource={currentSource}
      />

      {/* Group controls — join dropdown (standalone coordinator) or unjoin button (non-coordinator member) */}
      <SonosGroupControls
        uid={uid}
        isCoordinator={isCoordinator}
        zoneMemberCount={zoneMemberCount}
        availableZones={availableZones}
        onJoinGroup={onJoinGroup}
        onUnjoinGroup={onUnjoinGroup}
      />

      {/* EQ controls — expandable per D-01 */}
      <SonosEqControls
        uid={uid}
        eqData={eqData}
        onSetEq={onSetEq}
      />

      {/* Home Theater — expandable, soundbar only per D-07 */}
      <SonosHomeTheater
        uid={uid}
        role={role}
        htData={htData}
        onSetHomeTheater={onSetHomeTheater}
      />
    </div>
  );
}
