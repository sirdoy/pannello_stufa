'use client';
/**
 * SonosBody — Phase 179 Plan 07
 * Bundle source: rooms.jsx:411-426
 *
 * Renders Sonos audio body: track-line + Volume SliderRow + ControlRow with
 * SkipBack / Play-Pause / SkipForward buttons.
 *
 * Volume override note (RESEARCH §Aggregator Reconciliation Sonos):
 *   - CONTEXT D-31 prescribed per-speaker targeting (overridden per RESEARCH Pitfall 7).
 *   - handleSetZoneVolume(group_id, value) sets the whole group's volume.
 *   - Matches Phase 178 SonosSheet line 92 precedent.
 *   - device.extra.id is the group_id (== coordinator_uid for Sonos).
 *
 * D-02: inline-style + var(--token) only.
 * D-37 / D-67: no memoization hooks — inline handlers allowed.
 * T-179-07-01: 250ms debounce prevents volume command flood on drag.
 * T-179-07-02: handleSetZoneVolume — whole-group targeting (NOT per-speaker).
 * T-179-07-03: all button handlers gate `if (!groupId)` — defensive against empty id.
 */
import { useEffect, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import { SliderRow } from '../primitives/SliderRow';
import { ControlRow } from '../primitives/ControlRow';
import { MiniButton } from '../primitives/MiniButton';
import type { RoomDevice } from '../types';

export function SonosBody({ device }: { device: RoomDevice }): JSX.Element {
  const data = useSonosFullData();
  // RESEARCH §Aggregator Reconciliation Sonos + Phase 178 SonosSheet precedent:
  // prefer handleSetZoneVolume(group_id, vol) — targets the whole group (Pitfall 7).
  const cmds = useSonosCommands({ fetchData: data.fetchData, setError: () => {} });

  // device.extra.id is the group_id for Sonos (== coordinator_uid per AggregatorState.sonos)
  const groupId = String(device.extra.id ?? '');
  const initialVolume = (device.extra.volume as number | undefined) ?? 0;
  const track = (device.extra.track as string | undefined) ?? '';
  const artist = (device.extra.artist as string | undefined) ?? '';

  // D-56: omit artist when placeholder '—' (em dash) or empty
  const showArtist = artist.length > 0 && artist !== '—';

  // Volume debounce — 250ms per Phase 16.0 / Phase 178 D-08
  const [pending, setPending] = useState<number>(initialVolume);
  const debounced = useDebounce(pending, 250);

  useEffect(() => {
    if (!groupId) return;
    // Skip if value matches initial (no actual user interaction yet)
    if (debounced === initialVolume) return;
    // T-179-07-02: whole-group volume (Pitfall 7 — see RESEARCH §Aggregator Reconciliation Sonos)
    void cmds.handleSetZoneVolume(groupId, debounced);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(track || showArtist) ? (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-2)',
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10,
            marginBottom: 4,
            lineHeight: 1.4,
          }}
        >
          <span style={{ color: '#fff', fontWeight: 500 }}>{track}</span>
          {showArtist ? <span> · {artist}</span> : null}
        </div>
      ) : null}
      <SliderRow
        label="Volume"
        value={pending}
        unit="%"
        Icon={Volume2}
        tone={device.tone}
        disabled={!device.on}
        onChange={(next) => { setPending(next); }}
      />
      <ControlRow>
        <MiniButton
          Icon={SkipBack}
          ariaLabel="Brano precedente"
          onClick={() => {
            if (!groupId) return;
            void cmds.handlePrevious(groupId);
          }}
        />
        <MiniButton
          Icon={device.on ? Pause : Play}
          filled={device.on}
          tone={device.tone}
          ariaLabel={device.on ? 'Pausa' : 'Riproduci'}
          onClick={() => {
            if (!groupId) return;
            if (device.on) void cmds.handlePause(groupId);
            else void cmds.handlePlay(groupId);
          }}
        />
        <MiniButton
          Icon={SkipForward}
          ariaLabel="Brano successivo"
          onClick={() => {
            if (!groupId) return;
            void cmds.handleNext(groupId);
          }}
        />
      </ControlRow>
    </div>
  );
}
