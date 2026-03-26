'use client';

import { useState, useRef, useEffect } from 'react';
import type {
  SonosZoneResponse,
  SonosPlaybackResponse,
  SonosVolumeResponse,
  SonosPlayModeResponse,
  SonosSleepTimerResponse,
  SonosPlayMode,
  SonosEqResponse,
  SonosHomeTheaterResponse,
} from '@/types/sonosProxy';
import type { UseSonosCommandsReturn } from '../hooks/useSonosCommands';
import SonosNowPlaying from './SonosNowPlaying';
import SonosTransportControls from './SonosTransportControls';
import SonosSeekControl from './SonosSeekControl';
import SonosSpeakerVolume from './SonosSpeakerVolume';
import SonosPlayModeControls from './SonosPlayModeControls';
import SonosSleepTimer from './SonosSleepTimer';
import SonosQueueViewer from './SonosQueueViewer';

interface SonosZoneSectionProps {
  zone: SonosZoneResponse;
  playback: SonosPlaybackResponse | undefined;
  volumes: Record<string, SonosVolumeResponse>;
  playMode: SonosPlayModeResponse | undefined;
  sleepTimer: SonosSleepTimerResponse | undefined;
  commands: UseSonosCommandsReturn;
  // Extended data props
  eqData: Record<string, SonosEqResponse>;
  homeTheaterData: Record<string, SonosHomeTheaterResponse>;
  allZones: SonosZoneResponse[];
}

export default function SonosZoneSection({
  zone,
  playback,
  volumes,
  playMode,
  sleepTimer,
  commands,
  eqData,
  homeTheaterData,
  allZones,
}: SonosZoneSectionProps) {
  const coordinatorVolume = volumes[zone.coordinator_uid]?.volume ?? 50;
  const [localZoneVolume, setLocalZoneVolume] = useState(coordinatorVolume);
  const zoneVolumeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalZoneVolume(coordinatorVolume);
  }, [coordinatorVolume]);

  const handleZoneVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setLocalZoneVolume(newVol);
    if (zoneVolumeDebounceRef.current) clearTimeout(zoneVolumeDebounceRef.current);
    zoneVolumeDebounceRef.current = setTimeout(() => {
      void commands.handleSetZoneVolume(zone.group_id, newVol);
    }, 250);
  };

  return (
    <div className="rounded-2xl bg-slate-800/50 [html:not(.dark)_&]:bg-white p-5 sm:p-6 space-y-4">
      {/* Zone header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-800">
          {zone.label}
        </h2>
        <span className="text-xs text-slate-500">{zone.member_count} speaker</span>
      </div>

      {/* Now Playing */}
      <SonosNowPlaying playback={playback} />

      {/* Transport Controls */}
      <SonosTransportControls
        playback={playback}
        groupId={zone.group_id}
        onPlay={commands.handlePlay}
        onPause={commands.handlePause}
        onStop={commands.handleStop}
        onNext={commands.handleNext}
        onPrevious={commands.handlePrevious}
      />

      {/* Seek Control */}
      <SonosSeekControl
        playback={playback}
        groupId={zone.group_id}
        onSeek={commands.handleSeek}
      />

      {/* Play Mode + Sleep Timer — same row per D-16, stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SonosPlayModeControls
          playMode={playMode?.play_mode ?? null}
          onSetPlayMode={(mode: SonosPlayMode) => void commands.handleSetPlayMode(zone.group_id, mode)}
        />
        <SonosSleepTimer
          remainingSeconds={sleepTimer?.remaining_seconds ?? null}
          onSetTimer={(duration: number) => void commands.handleSetSleepTimer(zone.group_id, duration)}
        />
      </div>

      {/* Queue Viewer — expandable per D-10 */}
      <SonosQueueViewer groupId={zone.group_id} />

      {/* Zone volume — affects all speakers in zone */}
      <div className="border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200 pt-3">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Volume Zona</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-8 text-right">{localZoneVolume}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={localZoneVolume}
            onChange={handleZoneVolumeChange}
            className="w-full h-2 rounded-lg bg-slate-700 [html:not(.dark)_&]:bg-slate-200 accent-success-500"
            aria-label="Volume Zona"
          />
        </div>
      </div>

      {/* Volume per speaker */}
      <div className="border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200 pt-3">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Volume Speaker</h3>
        {zone.members.map(member => (
          <SonosSpeakerVolume
            key={member.uid}
            speakerName={member.name}
            uid={member.uid}
            volumeData={volumes[member.uid]}
            onSetVolume={commands.handleSetVolume}
            onSetMute={commands.handleSetMute}
            role={member.role}
            eqData={eqData[member.uid]}
            htData={homeTheaterData[member.uid]}
            currentSource={playback?.source_type ?? null}
            isCoordinator={member.uid === zone.coordinator_uid}
            zoneMemberCount={zone.member_count}
            availableZones={allZones
              .filter(z => z.group_id !== zone.group_id)
              .map(z => ({ group_id: z.group_id, label: z.label, coordinator_uid: z.coordinator_uid }))}
            onSetEq={commands.handleSetEq}
            onSetHomeTheater={commands.handleSetHomeTheater}
            onSwitchSource={commands.handleSwitchSource}
            onJoinGroup={commands.handleJoinGroup}
            onUnjoinGroup={commands.handleUnjoinGroup}
          />
        ))}
      </div>
    </div>
  );
}
