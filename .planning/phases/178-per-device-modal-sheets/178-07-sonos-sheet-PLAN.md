---
phase: 178
plan: 07
type: execute
wave: 2
depends_on: ['178-01', '178-02']
files_modified:
  - app/components/EmberGlass/sheets/SonosSheet.tsx
  - app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx
autonomous: true
requirements: [SHEET-05]
tags: [ember-glass, sheets, sonos]
must_haves:
  truths:
    - "SonosSheet renders group list with album-art tile + name + track/artist + 34×34 play/pause circle"
    - "Per-group play/pause button stops propagation and invokes handlePlay(groupId) or handlePause(groupId)"
    - "Volume strip uses native input[type=range] with accentColor=#b080ff, debounced 250ms before handleSetZoneVolume(groupId, vol)"
    - "Master action toggles between 'Riproduci ovunque' and 'Pausa ovunque' and iterates with Promise.allSettled"
    - "Field adapter maps zone.coordinator_uid (flat string) — not zone.coordinator.uid (nested) per Pitfall 7"
    - "Empty state hides volume strip when groups.length === 0"
    - "Zero useMemo / useCallback"
  artifacts:
    - path: app/components/EmberGlass/sheets/SonosSheet.tsx
      provides: "SHEET-05 body — Sonos control sheet with debounced volume + master allSettled"
      min_lines: 200
    - path: app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx
      provides: "Jest spec — group selection + play/pause stopPropagation + debounced volume + master allSettled"
      min_lines: 180
  key_links:
    - from: app/components/EmberGlass/sheets/SonosSheet.tsx
      to: app/components/devices/sonos/hooks/useSonosFullData.ts
      via: "useSonosFullData()"
      pattern: "useSonosFullData\\("
    - from: app/components/EmberGlass/sheets/SonosSheet.tsx
      to: app/components/devices/sonos/hooks/useSonosCommands.ts
      via: "useSonosCommands().handleSetZoneVolume"
      pattern: "handleSetZoneVolume\\("
user_setup: []
---

<objective>
Ship the **SonosSheet** body (SHEET-05 / CONTEXT D-08 / D-22). Bundle visual contract: `sheets.jsx:308-398` verbatim. Consumes `useSonosFullData` (existing) + `useSonosCommands` (existing).

**Layout (UI-SPEC verbatim):**
1. **Group list** (rounded 18px container). Each row:
   - 36×36 album-art tile (gradient + PlayingBars when playing; neutral + Music icon when not).
   - Name (14px 600) + track/artist line (`{track} · {artist}` or `Non in riproduzione`).
   - 34×34 play/pause circle button (white when playing, white-08 when not).
   - Row click selects the group; play/pause button uses `e.stopPropagation()`.
2. **"Volume · {selected.name}"** eyebrow + native `<input type="range" accentColor="#b080ff">` + 13px tabular-nums readout.
3. **Master action button** — `"Riproduci ovunque"` (else) / `"Pausa ovunque"` (when any playing). Iterates `groups[]` via `Promise.allSettled` (RESEARCH §"Architecture" + memory v16.0 batch).

**Field adapter (Pitfall 7 — bundle assumes `g.coordinator.uid`, real shape is flat `zone.coordinator_uid`):**
```ts
const groups = (sonosData.data?.zones ?? []).map((zone) => ({
  id: zone.group_id,
  name: zone.coordinator_name ?? zone.label ?? '',
  playing: sonosData.data?.playback?.[zone.group_id]?.transport_state === 'PLAYING',
  track: sonosData.data?.playback?.[zone.group_id]?.title ?? '',
  artist: sonosData.data?.playback?.[zone.group_id]?.artist ?? '',
  volume: sonosData.data?.volumes?.[zone.coordinator_uid]?.volume ?? 0,
  coordinator_uid: zone.coordinator_uid,
}));
```

**Volume write (RESEARCH §A7):** prefer `cmds.handleSetZoneVolume(groupId, volume)` (group-level — single id; matches bundle's "single slider per group" UX). Debounced 250ms (memory v16.0 pattern).

**Italian copy frozen (D-22):** `Volume · {name}`, `Non in riproduzione`, `{track} · {artist}` (middle-dot), `Pausa ovunque` (when any playing), `Riproduci ovunque` (else).

Purpose: Ship SHEET-05 — Sonos control surface inside the dashboard sheet.
Output: 1 .tsx (replaces stub), 1 jest spec.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md
@.planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md
@.planning/phases/178-per-device-modal-sheets/178-PATTERNS.md
@.planning/phases/178-per-device-modal-sheets/178-RESEARCH.md
@.planning/inbox/ember-glass-design/project/components/sheets.jsx
@app/components/EmberGlass/cards/SonosCard.tsx
@app/components/devices/sonos/hooks/useSonosFullData.ts
@app/components/devices/sonos/hooks/useSonosCommands.ts
@app/components/EmberGlass/PlayingBars.tsx
@app/hooks/useDebounce.ts

<interfaces>
<!-- VERIFIED via useSonosFullData.ts + useSonosCommands.ts: -->
<!--   data?.zones[]:    SonosZoneResponse { group_id, label, coordinator_name, coordinator_uid (flat), members? } -->
<!--   data?.playback:   Record<group_id, { transport_state: 'PLAYING'|'PAUSED'|...; title?, artist? }> -->
<!--   data?.volumes:    Record<speaker_uid, { volume: number }> -->
<!--   loading, error, fetchData, setError -->
<!-- -->
<!--   useSonosCommands({ fetchData, setError }): -->
<!--     handlePlay(groupId)        — POST /api/v1/sonos/zones/{groupId}/play -->
<!--     handlePause(groupId)       — POST /api/v1/sonos/zones/{groupId}/pause -->
<!--     handleSetVolume(uid, vol)  — PUT  /api/v1/sonos/speakers/{uid}/volume -->
<!--     handleSetZoneVolume(groupId, vol)  — PUT /api/v1/sonos/zones/{groupId}/volume  ← prefer this -->
<!-- -->
<!--   Pitfall 7: zone.coordinator_uid is FLAT (not nested). -->
<!--   Pitfall A7: prefer handleSetZoneVolume (single arg, group-level). -->
<!-- -->
<!-- PlayingBars (Phase 177): zero-arg presentational component. -->
<!-- useDebounce: useDebounce<T>(value: T, delay: number = 300): T -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement SonosSheet body + jest spec</name>
  <files>
    app/components/EmberGlass/sheets/SonosSheet.tsx,
    app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx
  </files>
  <read_first>
    - .planning/inbox/ember-glass-design/project/components/sheets.jsx (lines 308-398 — bundle visual source for SonosSheet)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Sheet Body Contracts → SonosSheet" + §Color values)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 215-272 — field adapter + master button + volume + group-row code)
    - .planning/phases/178-per-device-modal-sheets/178-RESEARCH.md (§Pitfall 7 — flat coordinator_uid; §A7 — handleSetZoneVolume; §"Field Gaps" → SonosSheet)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-08, D-22, D-26, D-27, D-33)
    - app/components/EmberGlass/cards/SonosCard.tsx (FULL FILE — field adapter precedent at lines 41-50)
    - app/components/devices/sonos/hooks/useSonosFullData.ts (return shape — data.zones, data.playback, data.volumes)
    - app/components/devices/sonos/hooks/useSonosCommands.ts (handler signatures including handleSetZoneVolume)
    - app/components/EmberGlass/PlayingBars.tsx (zero-arg component)
    - app/hooks/useDebounce.ts (signature)
  </read_first>
  <behavior>
    SonosSheet:
    - Test 1: with 2 zones (zone 0 playing, zone 1 idle), renders:
      - `data-testid="sonos-sheet"` root.
      - `data-testid="sonos-sheet-group-0"` and `-1` rows.
      - Group 0 row contains the name "Salotto" and `track · artist` text; Group 1 contains "Camera" and "Non in riproduzione".
      - Per-group play/pause buttons `sonos-sheet-group-0-play-pause` and `-1-play-pause`.
      - Volume eyebrow "Volume · Salotto" (zone 0 default).
      - Volume slider `sonos-sheet-volume-slider` and readout `sonos-sheet-volume-readout`.
      - Master action button `sonos-sheet-master-action` with label "Pausa ovunque" (because zone 0 is playing).

    - Test 2: clicking the second group row updates the selection — volume eyebrow becomes "Volume · Camera"; readout shows that group's volume.

    - Test 3 (stopPropagation): clicking the play/pause button on group 0 (currently playing) invokes `handlePause('zone-0-id')` and does NOT change selection (selection remains on whatever was selected; OR per UI-SPEC, the handler also calls `setSelectedIdx(i)` — verify the bundle behavior). Per `sheets.jsx:359` the bundle DOES call `setSelectedIdx(i)` inside the play/pause handler — replicate that.

    - Test 4: clicking play/pause on idle group 1 invokes `handlePlay('zone-1-id')`.

    - Test 5 (debounce volume): change the volume slider to 50; immediately advance 100ms — `handleSetZoneVolume` is NOT called. Advance the timer past 250ms — `handleSetZoneVolume('zone-0-id', 50)` is called once.

    - Test 6 (debounce coalesces): change volume to 30, then 40, then 50, all within 250ms; advance timer past 250ms — `handleSetZoneVolume` is called once with the final value 50.

    - Test 7 (master action when any playing): label is "Pausa ovunque". Click it — both groups' `handlePause` is invoked exactly once each via `Promise.allSettled`.

    - Test 8 (master action when none playing): when both zones idle, label is "Riproduci ovunque". Click — both `handlePlay` invoked.

    - Test 9 (master action allSettled tolerance): when `handlePause(zone-0)` rejects, `handlePause(zone-1)` is still called and the master action does not throw uncaught.

    - Test 10 (loading skeleton): when `loading && data === null`, only `data-testid="sonos-sheet-skeleton"` renders.

    - Test 11 (empty state): when `data.zones.length === 0`, the volume strip is HIDDEN (no slider rendered) and master action label defaults to "Riproduci ovunque" (no playing).
  </behavior>
  <action>
**File 1: `app/components/EmberGlass/sheets/SonosSheet.tsx`** (replaces stub):

```tsx
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
 * SonosSheet (SHEET-05 / CONTEXT D-08) — body-only component (D-04). No props;
 * self-fetches via useSonosFullData + useSonosCommands.
 *
 * Visual contract verbatim from bundle `sheets.jsx:308-398`. Italian copy frozen (D-22).
 *
 * Field adapter (Pitfall 7): zone.coordinator_uid is FLAT (not nested). Volume writes
 * use cmds.handleSetZoneVolume(groupId, vol) — group-level, single id.
 *
 * Master action iterates with Promise.allSettled (memory v16.0 batch pattern) for
 * partial failure tolerance.
 *
 * No useMemo / useCallback (D-33).
 */
export function SonosSheet() {
  const sonosData = useSonosFullData();
  const cmds = useSonosCommands({
    fetchData: sonosData.fetchData,
    setError: sonosData.setError,
  });

  // Field adapter: bundle → live hook (Pitfall 7).
  const groups: SonosGroup[] = (sonosData.data?.zones ?? []).map((zone: any) => {
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

  // Reset pending on selection change
  useEffect(() => {
    if (selected) setPendingVolume(selected.volume);
  }, [safeIdx, selected?.id, selected?.volume]);

  // Per checker WARNING 4: destructure the stable callback rather than depending on the whole
  // `cmds` object. `useRetryableCommand`-wrapped handlers are useCallback-stable, so depending
  // on the named field gives referential identity stability across renders.
  const { handleSetZoneVolume, handlePlay, handlePause } = cmds;

  // Fire volume write on debounced change (only when value diverges from server-side)
  useEffect(() => {
    if (!selected) return;
    if (debouncedVolume === selected.volume) return;
    void handleSetZoneVolume(selected.id, debouncedVolume);
  }, [debouncedVolume, selected, handleSetZoneVolume]);

  // Loading skeleton (D-26)
  if (sonosData.loading && !sonosData.data) {
    return (
      <div
        data-testid="sonos-sheet-skeleton"
        style={{
          height: 480,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)',
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  // Error state (D-27)
  if (sonosData.error && !sonosData.data) {
    const errMessage = typeof sonosData.error === 'string' ? sonosData.error : '';
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
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{errMessage}</div>
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
      {/* Group list */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 18,
          border: '0.5px solid rgba(255,255,255,0.06)',
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
                borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
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
                    : 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: g.playing ? '0 0 16px rgba(176,128,255,0.35)' : 'none',
                }}
              >
                {g.playing ? <PlayingBars /> : <Music size={14} stroke="rgba(255,255,255,0.35)" />}
              </div>

              {/* Name + track */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                  {g.name}
                </div>
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

              {/* Play/pause button */}
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
                {g.playing ? <Pause size={14} strokeWidth={2.4} /> : <Play size={14} strokeWidth={2.4} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Volume strip — hidden when no groups */}
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
                color: '#fff',
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

      {/* Master action */}
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
          color: '#b080ff',
          border: '0.5px solid rgba(176,128,255,0.3)',
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
```

NOTE: verify `sonosData.error` field type by reading useSonosFullData.ts. If it's a `string | null` that's the simple path; if it's structured, adjust the error block accordingly. Per RESEARCH §Open Q3, sonos hook returns string error.

**File 2: `app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx`**:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SonosSheet } from '../SonosSheet';

const mockHandlePlay = jest.fn().mockResolvedValue(undefined);
const mockHandlePause = jest.fn().mockResolvedValue(undefined);
const mockHandleSetZoneVolume = jest.fn().mockResolvedValue(undefined);
const mockHandleSetVolume = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/sonos/hooks/useSonosCommands', () => ({
  useSonosCommands: () => ({
    handlePlay: mockHandlePlay,
    handlePause: mockHandlePause,
    handleSetZoneVolume: mockHandleSetZoneVolume,
    handleSetVolume: mockHandleSetVolume,
  }),
}));

const baseData = {
  data: {
    zones: [
      { group_id: 'z1', label: 'Z1', coordinator_name: 'Salotto', coordinator_uid: 'uid-1' },
      { group_id: 'z2', label: 'Z2', coordinator_name: 'Camera', coordinator_uid: 'uid-2' },
    ],
    playback: {
      z1: { transport_state: 'PLAYING', title: 'Track', artist: 'Artist' },
      z2: { transport_state: 'PAUSED' },
    },
    volumes: {
      'uid-1': { volume: 30 },
      'uid-2': { volume: 60 },
    },
  } as any,
  loading: false,
  error: null,
  fetchData: jest.fn().mockResolvedValue(undefined),
  setError: jest.fn(),
};

let dataOverride: Partial<typeof baseData> = {};

jest.mock('@/app/components/devices/sonos/hooks/useSonosFullData', () => ({
  useSonosFullData: () => ({ ...baseData, ...dataOverride }),
}));

jest.mock('../../PlayingBars', () => ({
  PlayingBars: () => <div data-testid="playing-bars-mock" />,
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  dataOverride = {};
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SonosSheet (SHEET-05 / CONTEXT D-08)', () => {
  it('renders 2 group rows + volume strip + master action', () => {
    render(<SonosSheet />);
    expect(screen.getByTestId('sonos-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('sonos-sheet-group-0')).toHaveTextContent('Salotto');
    expect(screen.getByTestId('sonos-sheet-group-0')).toHaveTextContent('Track · Artist');
    expect(screen.getByTestId('sonos-sheet-group-1')).toHaveTextContent('Camera');
    expect(screen.getByTestId('sonos-sheet-group-1')).toHaveTextContent('Non in riproduzione');
    expect(screen.getByTestId('sonos-sheet-volume-slider')).toBeInTheDocument();
    expect(screen.getByTestId('sonos-sheet-volume-readout')).toHaveTextContent('30');
    expect(screen.getByTestId('sonos-sheet-master-action')).toHaveTextContent('Pausa ovunque');
  });

  it('selecting group 1 updates volume eyebrow + readout', () => {
    render(<SonosSheet />);
    fireEvent.click(screen.getByTestId('sonos-sheet-group-1'));
    expect(screen.getByText(/Volume · Camera/)).toBeInTheDocument();
    expect(screen.getByTestId('sonos-sheet-volume-readout')).toHaveTextContent('60');
  });

  it('clicking play/pause on group 0 (playing) invokes handlePause + stopPropagation', () => {
    render(<SonosSheet />);
    const btn = screen.getByTestId('sonos-sheet-group-0-play-pause');
    fireEvent.click(btn);
    expect(mockHandlePause).toHaveBeenCalledWith('z1');
    expect(mockHandlePlay).not.toHaveBeenCalled();
  });

  it('clicking play/pause on group 1 (idle) invokes handlePlay', () => {
    render(<SonosSheet />);
    const btn = screen.getByTestId('sonos-sheet-group-1-play-pause');
    fireEvent.click(btn);
    expect(mockHandlePlay).toHaveBeenCalledWith('z2');
  });

  it('volume slider write debounced 250ms before handleSetZoneVolume', () => {
    render(<SonosSheet />);
    const slider = screen.getByTestId('sonos-sheet-volume-slider');
    fireEvent.change(slider, { target: { value: '50' } });
    expect(mockHandleSetZoneVolume).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(100));
    expect(mockHandleSetZoneVolume).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(150));
    expect(mockHandleSetZoneVolume).toHaveBeenCalledWith('z1', 50);
  });

  it('debounce coalesces multiple rapid volume changes into one write', () => {
    render(<SonosSheet />);
    const slider = screen.getByTestId('sonos-sheet-volume-slider');
    fireEvent.change(slider, { target: { value: '40' } });
    fireEvent.change(slider, { target: { value: '50' } });
    fireEvent.change(slider, { target: { value: '60' } });
    act(() => jest.advanceTimersByTime(250));
    expect(mockHandleSetZoneVolume).toHaveBeenCalledTimes(1);
    expect(mockHandleSetZoneVolume).toHaveBeenCalledWith('z1', 60);
  });

  it('master action when any playing → Pausa ovunque + iterates handlePause', async () => {
    render(<SonosSheet />);
    expect(screen.getByTestId('sonos-sheet-master-action')).toHaveTextContent('Pausa ovunque');
    await act(async () => {
      fireEvent.click(screen.getByTestId('sonos-sheet-master-action'));
    });
    expect(mockHandlePause).toHaveBeenCalledWith('z1');
    expect(mockHandlePause).toHaveBeenCalledWith('z2');
    expect(mockHandlePlay).not.toHaveBeenCalled();
  });

  it('master action when none playing → Riproduci ovunque + iterates handlePlay', async () => {
    dataOverride = {
      data: {
        ...baseData.data,
        playback: {
          z1: { transport_state: 'PAUSED' },
          z2: { transport_state: 'PAUSED' },
        },
      } as any,
    };
    render(<SonosSheet />);
    expect(screen.getByTestId('sonos-sheet-master-action')).toHaveTextContent('Riproduci ovunque');
    await act(async () => {
      fireEvent.click(screen.getByTestId('sonos-sheet-master-action'));
    });
    expect(mockHandlePlay).toHaveBeenCalledWith('z1');
    expect(mockHandlePlay).toHaveBeenCalledWith('z2');
  });

  it('master action allSettled tolerates partial failure', async () => {
    mockHandlePause.mockRejectedValueOnce(new Error('network'));
    render(<SonosSheet />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('sonos-sheet-master-action'));
    });
    // Despite z1 rejecting, z2's handlePause was still called.
    expect(mockHandlePause).toHaveBeenCalledWith('z1');
    expect(mockHandlePause).toHaveBeenCalledWith('z2');
  });

  it('renders skeleton when loading and no data', () => {
    dataOverride = { data: null, loading: true } as any;
    render(<SonosSheet />);
    expect(screen.getByTestId('sonos-sheet-skeleton')).toBeInTheDocument();
  });

  it('hides volume strip when zones is empty', () => {
    dataOverride = {
      data: { zones: [], playback: {}, volumes: {} } as any,
    };
    render(<SonosSheet />);
    expect(screen.queryByTestId('sonos-sheet-volume-slider')).not.toBeInTheDocument();
    expect(screen.getByTestId('sonos-sheet-master-action')).toHaveTextContent('Riproduci ovunque');
  });
});
```
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/SonosSheet.tsx` exists and contains:
      - `'use client'`.
      - `useSonosFullData()` AND `useSonosCommands({ fetchData, setError })`.
      - `useDebounce(pendingVolume, 250)`.
      - `cmds.handleSetZoneVolume(selected.id, debouncedVolume)`.
      - `Promise.allSettled(groups.map(g => ...))`.
      - The string `'Pausa ovunque'` AND `'Riproduci ovunque'` AND `'Non in riproduzione'` AND `'Volume ·'`.
      - The string `accentColor: '#b080ff'`.
      - `e.stopPropagation()` inside the play/pause button onClick.
      - data-testid: `sonos-sheet`, `sonos-sheet-group-{i}`, `sonos-sheet-group-{i}-play-pause`, `sonos-sheet-volume-slider`, `sonos-sheet-volume-readout`, `sonos-sheet-master-action`, `sonos-sheet-skeleton`, `sonos-sheet-error`.
      - Field adapter using `zone.coordinator_uid` (NOT `zone.coordinator.uid`).
    - Spec ships with at least 10 `it(` cases; exits 0.
    - `! grep -E "useMemo|useCallback" app/components/EmberGlass/sheets/SonosSheet.tsx` returns no hits.
    - `! grep -E "coordinator\\.uid" app/components/EmberGlass/sheets/SonosSheet.tsx` returns no hits (Pitfall 7 — flat field only).
    - `! grep -E "useEffect.*\\b(cmds)\\b" app/components/EmberGlass/sheets/SonosSheet.tsx` returns no matches (checker WARNING 4 — destructure `cmds.handleSetZoneVolume` / `cmds.handlePlay` / `cmds.handlePause` rather than depend on the whole `cmds` object).
  </acceptance_criteria>
  <done>
    SonosSheet ships GREEN; debounced volume + master allSettled + stopPropagation + flat coordinator_uid all covered.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → useSonosCommands → /api/v1/sonos/* | Existing routes; auth enforced server-side |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-07-01 | Tampering | Volume out-of-range | mitigate | Slider clamps 0..100; HTTP route validates server-side. |
| T-178-07-02 | Tampering | Master action partial failure exposes inconsistent state | accept | Promise.allSettled tolerates partial failures (memory v16.0); next data tick reconciles. NavbarConnectionStatus surfaces global health. |
| T-178-07-03 | Tampering | Cross-group volume write race | mitigate | useEffect resets pendingVolume on selectedIdx change; tested. |
</threat_model>

<verification>
```bash
npm run test:components -- app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx
npx tsc --noEmit
```
</verification>

<success_criteria>
- [ ] SonosSheet ships with group list + volume strip + master action.
- [ ] Volume debounced 250ms.
- [ ] Master action uses Promise.allSettled.
- [ ] Play/pause stopPropagation works.
- [ ] Field adapter uses flat `zone.coordinator_uid`.
- [ ] Spec exits 0; zero useMemo/useCallback.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-07-SUMMARY.md`.
</output>
