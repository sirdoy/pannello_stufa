'use client';

import { useEffect, useState } from 'react';
import { Music, Pause, Play, Power, Volume2, TriangleAlert } from 'lucide-react';
import { useSonosFullData } from '@/app/components/devices/sonos/hooks/useSonosFullData';
import { useSonosCommands } from '@/app/components/devices/sonos/hooks/useSonosCommands';
import { useDebounce } from '@/app/hooks/useDebounce';
import { PlayingBars } from '../PlayingBars';

interface SonosGroup {
  id: string;
  name: string;
  playing: boolean;
  track: string;
  artist: string;
  volume: number;
  coordinator_uid: string;
}

/**
 * SonosSheet (SHEET-05 / CONTEXT D-08 — Plan 178-07).
 *
 * Body-only sheet content (D-04). No props; self-fetches via `useSonosFullData`
 * and dispatches via `useSonosCommands`.
 *
 * Visual contract verbatim from bundle `sheets.jsx:308-398`. Italian copy frozen
 * (CONTEXT D-22): `Volume · {name}`, `Non in riproduzione`, `Pausa ovunque`,
 * `Riproduci ovunque`, track line `{track} · {artist}` with middle-dot.
 *
 * Pitfalls handled:
 *  - **Pitfall 7 (flat coordinator_uid):** field adapter reads `zone.coordinator_uid`
 *    (a flat string), NOT a hypothetical nested `zone.coordinator` object.
 *  - **Pitfall A7 (group-level volume write):** uses `handleSetZoneVolume(groupId, vol)`
 *    rather than the per-speaker `handleSetVolume(uid, vol)` to match the bundle's
 *    single-slider-per-group UX.
 *  - **`useSonosFullData` exposes no `setError`:** local state holds command-side
 *    errors so `useSonosCommands` can surface failures.
 *
 * Volume writes debounced 250ms (memory v16.0). Master action iterates all groups
 * via `Promise.allSettled` for partial-failure tolerance.
 *
 * No manual memoization hooks (CONTEXT D-33 — React Compiler 1.0 auto-memoizes).
 *
 * Useful effect deps destructure `handleSetZoneVolume` directly off `cmds`
 * (rather than depending on the whole `cmds` object) so referential stability
 * is preserved across renders (checker WARNING 4).
 */
export function SonosSheet() {
  const sonosData = useSonosFullData();

  // Local error sink — useSonosFullData does not expose a `setError` setter, so
  // we provide one here for command-side failures (matches `app/sonos/page.tsx` pattern).
  const [, setCommandError] = useState<string | null>(null);

  const cmds = useSonosCommands({
    fetchData: sonosData.fetchData,
    setError: setCommandError,
  });
  const { handleSetZoneVolume, handlePlay, handlePause } = cmds;

  // Field adapter (Pitfall 7): zone.coordinator_uid is FLAT, not nested.
  const groups: SonosGroup[] = (sonosData.data?.zones ?? []).map((zone) => {
    const playback = sonosData.data?.playback?.[zone.group_id];
    return {
      id: zone.group_id,
      name: zone.coordinator_name ?? zone.label ?? zone.group_id,
      playing: playback?.transport_state === 'PLAYING',
      track: playback?.title ?? '',
      artist: playback?.artist ?? '',
      volume: sonosData.data?.volumes?.[zone.coordinator_uid]?.volume ?? 0,
      coordinator_uid: zone.coordinator_uid,
    };
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const safeIdx = Math.min(selectedIdx, Math.max(0, groups.length - 1));
  const selected: SonosGroup | undefined = groups[safeIdx];

  const [pendingVolume, setPendingVolume] = useState<number>(selected?.volume ?? 0);
  const debouncedVolume = useDebounce(pendingVolume, 250);

  // Reset pending on selection change to prevent cross-zone writes.
  useEffect(() => {
    if (selected) setPendingVolume(selected.volume);
    // selected.volume is a primitive — safe in the dep list.
  }, [safeIdx, selected?.id, selected?.volume]);

  // Fire volume write on debounced change (only when value diverges from server-side).
  useEffect(() => {
    if (!selected) return;
    if (debouncedVolume === selected.volume) return;
    void handleSetZoneVolume(selected.id, debouncedVolume);
  }, [debouncedVolume, selected, handleSetZoneVolume]);

  // Loading skeleton (CONTEXT D-26).
  if (sonosData.loading && !sonosData.data) {
    return (
      <div
        data-testid="sonos-sheet-skeleton"
        style={{
          height: 480,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  // Error state (CONTEXT D-27).
  if (sonosData.error && !sonosData.data) {
    return (
      <div
        data-testid="sonos-sheet-error"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '24px 0',
        }}
      >
        <TriangleAlert size={32} color="var(--text-2)" />
        <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
          Non raggiungibile. Riprova più tardi.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{sonosData.error}</div>
      </div>
    );
  }

  const anyPlaying = groups.some((g) => g.playing);

  const handleMasterAction = async () => {
    await Promise.allSettled(
      groups.map((g) => (anyPlaying ? handlePause(g.id) : handlePlay(g.id))),
    );
  };

  return (
    <div data-testid="sonos-sheet">
      {/* Group list — bundle sheets.jsx:332-370 */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)', // AUDIT-EXCEPTION
          borderRadius: 18,
          border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
          overflow: 'hidden',
        }}
      >
        {groups.map((g, i) => {
          const isLast = i === groups.length - 1;
          const isSelected = safeIdx === i;
          return (
            <div
              key={g.id}
              data-testid={`sonos-sheet-group-${i}`}
              aria-selected={isSelected}
              onClick={() => setSelectedIdx(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                gap: 12,
                cursor: 'pointer',
                borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
                background: isSelected ? 'rgba(176,128,255,0.08)' : 'transparent', // AUDIT-EXCEPTION
              }}
            >
              {/* 36×36 album-art tile */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: g.playing
                    ? 'linear-gradient(135deg, #b080ff 0%, #5eafff 100%)' // AUDIT-EXCEPTION
                    : 'rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: g.playing ? '0 0 16px rgba(176,128,255,0.35)' : 'none', // AUDIT-EXCEPTION
                }}
              >
                {g.playing ? (
                  <PlayingBars />
                ) : (
                  <Music size={14} stroke="rgba(255,255,255,0.35)" />
                )}
              </div>

              {/* Name + track stack */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{g.name}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-2)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 1,
                  }}
                >
                  {g.playing ? `${g.track} · ${g.artist}` : 'Non in riproduzione'}
                </div>
              </div>

              {/* 34×34 play/pause circle button */}
              <button
                type="button"
                data-testid={`sonos-sheet-group-${i}-play-pause`}
                data-sheet-focusable="true"
                aria-label={g.playing ? 'Pausa' : 'Riproduci'}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIdx(i);
                  if (g.playing) void handlePause(g.id);
                  else void handlePlay(g.id);
                }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: g.playing ? '#fff' : 'rgba(255,255,255,0.08)', // AUDIT-EXCEPTION
                  color: g.playing ? '#1a0f08' : '#fff', // AUDIT-EXCEPTION
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {g.playing ? (
                  <Pause size={14} strokeWidth={2.4} />
                ) : (
                  <Play size={14} strokeWidth={2.4} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Volume strip — hidden when no groups (empty state) */}
      {selected && (
        <>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginTop: 20,
              marginBottom: 10,
            }}
          >
            Volume · {selected.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Volume2 size={16} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
            <input
              type="range"
              data-testid="sonos-sheet-volume-slider"
              data-sheet-focusable="true"
              aria-label="Volume"
              min={0}
              max={100}
              value={pendingVolume}
              onChange={(e) => setPendingVolume(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#b080ff' }} // AUDIT-EXCEPTION
            />
            <div
              data-testid="sonos-sheet-volume-readout"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff', // AUDIT-EXCEPTION
                minWidth: 32,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pendingVolume}
            </div>
          </div>
        </>
      )}

      {/* Master action — Riproduci/Pausa ovunque */}
      <button
        type="button"
        data-testid="sonos-sheet-master-action"
        data-sheet-focusable="true"
        onClick={() => void handleMasterAction()}
        style={{
          marginTop: 22,
          width: '100%',
          height: 52,
          borderRadius: 16,
          background: 'rgba(176,128,255,0.15)', // AUDIT-EXCEPTION
          color: '#b080ff', // AUDIT-EXCEPTION
          border: '0.5px solid rgba(176,128,255,0.3)', // AUDIT-EXCEPTION
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <Power size={16} strokeWidth={2.2} />
        {anyPlaying ? 'Pausa ovunque' : 'Riproduci ovunque'}
      </button>
    </div>
  );
}
