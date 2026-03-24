'use client';

import type { SonosZoneResponse, SonosPlaybackResponse, SonosVolumeResponse } from '@/types/sonosProxy';
import type { UseSonosCommandsReturn } from '../hooks/useSonosCommands';
import SonosNowPlaying from './SonosNowPlaying';
import SonosTransportControls from './SonosTransportControls';
import SonosSpeakerVolume from './SonosSpeakerVolume';

interface SonosZoneSectionProps {
  zone: SonosZoneResponse;
  playback: SonosPlaybackResponse | undefined;
  volumes: Record<string, SonosVolumeResponse>;
  commands: UseSonosCommandsReturn;
}

export default function SonosZoneSection({ zone, playback, volumes, commands }: SonosZoneSectionProps) {
  return (
    <div className="rounded-2xl bg-slate-800/50 [html:not(.dark)_&]:bg-white p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-800">
          {zone.label}
        </h2>
        <span className="text-xs text-slate-500">{zone.member_count} speaker</span>
      </div>
      <SonosNowPlaying playback={playback} />
      <SonosTransportControls
        playback={playback}
        groupId={zone.group_id}
        onPlay={commands.handlePlay}
        onPause={commands.handlePause}
        onStop={commands.handleStop}
        onNext={commands.handleNext}
        onPrevious={commands.handlePrevious}
      />
      <div className="border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200 pt-3">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Volume</h3>
        {zone.members.map(member => (
          <SonosSpeakerVolume
            key={member.uid}
            speakerName={member.name}
            uid={member.uid}
            volumeData={volumes[member.uid]}
            onSetVolume={commands.handleSetVolume}
            onSetMute={commands.handleSetMute}
          />
        ))}
      </div>
    </div>
  );
}
