# Phase 135: Sonos Zone Extended UI - Research

**Researched:** 2026-03-25
**Domain:** React/Next.js frontend — extending existing Sonos zone UI with play mode controls, sleep timer, and paginated queue viewer
**Confidence:** HIGH

## Summary

Phase 135 is a pure frontend extension of the existing `/sonos` page. All three API routes (`play-mode`, `sleep-timer`, `queue`) are already implemented (Phase 128) and all TypeScript types are defined in `types/sonosProxy.ts`. No new routes, no new pages, no new type definitions — this phase only adds new presentational components and extends two existing hooks.

The work splits cleanly into three lanes: (1) extend `useSonosFullData` to poll play-mode and sleep-timer per zone, (2) extend `useSonosCommands` with two new PUT handlers following the established 202+poll+refresh pattern, (3) create three new presentational components (`SonosPlayModeControls`, `SonosSleepTimer`, `SonosQueueViewer`) and wire them into `SonosZoneSection`.

**Primary recommendation:** Follow the established orchestrator pattern exactly — extend hooks first, then add presentational components, then wire into the zone section. All mutation patterns are identical to existing transport/volume commands.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Play mode controls (SONOS-35)**
- D-01: Icon toggle buttons for shuffle, repeat, crossfade — three separate toggle buttons in a row. Active state uses ember/copper accent color, inactive uses muted color. Matches existing transport controls aesthetic.
- D-02: Play mode state comes from `GET /api/sonos/zones/{groupId}/play-mode` — returns `SonosPlayModeResponse` with composite `play_mode` enum.
- D-03: Frontend decomposes composite `play_mode` into individual booleans: `shuffle` (mode contains "SHUFFLE"), `repeat` (mode contains "REPEAT"), `crossfade` (separate field if available, or derived). Toggle mutation sends `PUT /api/sonos/zones/{groupId}/play-mode` with the new composite `SonosPlayMode` value.
- D-04: Toggle mutation follows 202 + `suggested_poll_delay_s` + fetchData() refresh pattern.

**Sleep timer (SONOS-36)**
- D-05: Preset duration buttons: 15min, 30min, 45min, 60min, 90min — compact button row. Active timer shows countdown in MM:SS format.
- D-06: Cancel button appears when timer is active. Setting a new duration replaces existing timer.
- D-07: Timer state from `GET /api/sonos/zones/{groupId}/sleep-timer` — returns `SonosSleepTimerResponse` with `remaining_seconds` (null = no timer).
- D-08: Set timer via `PUT /api/sonos/zones/{groupId}/sleep-timer` with `SetSleepTimerRequest { duration: seconds }`. Cancel by sending `{ duration: 0 }`.
- D-09: Countdown display updates via polling (same 60s interval as zone data). No real-time countdown — shows last-polled remaining time.

**Queue viewer (SONOS-37)**
- D-10: Expandable inline list within zone section — toggled by a "Coda" button. Not a modal/drawer, stays inline.
- D-11: Shows track list: position number, title, artist, duration. Album art NOT displayed (deferred).
- D-12: Pagination via "Carica altri" button at bottom. Uses `limit=20` + `offset` params.
- D-13: Queue state fetched on-demand when user expands, NOT on every poll cycle.
- D-14: Empty queue shows "Coda vuota" text. Queue total count shown in header ("Coda (12 brani)").

**Zone section placement**
- D-15: Order: Now Playing → Transport Controls → Play Mode + Sleep Timer (same row) → Queue (expandable) → Volume per speaker.
- D-16: Play mode toggles and sleep timer sit in a shared row — play mode icons on left, sleep timer on right. Responsive: stacks vertically on mobile.

**Hook architecture**
- D-17: Extend `useSonosFullData` to also fetch play-mode and sleep-timer data per zone (parallel fetches per zone).
- D-18: Extend `useSonosCommands` with: `handleSetPlayMode(groupId, mode)`, `handleSetSleepTimer(groupId, duration)`.
- D-19: New `useSonosQueue` hook for on-demand queue fetching — NOT in the main polling loop. Returns `{ items, total, loading, loadMore }`.

**New presentational components**
- D-20: `SonosPlayModeControls.tsx`
- D-21: `SonosSleepTimer.tsx`
- D-22: `SonosQueueViewer.tsx`
- D-23: All new components go in `app/components/devices/sonos/components/`

### Claude's Discretion
- Exact icon choices for shuffle/repeat/crossfade from lucide-react
- Spacing and gap sizes between the new control rows
- Whether sleep timer countdown shows "45:00" or "45 min rimanenti" format
- Play mode toggle animation/transition
- Queue item row layout details (spacing, truncation)
- How to derive individual toggle states from composite SonosPlayMode enum

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-35 | Play mode controls per zona nella /sonos page (shuffle, repeat, crossfade toggle buttons) | SonosPlayMode enum fully typed in sonosProxy.ts; GET+PUT routes confirmed working; derive boolean states from composite enum string matching |
| SONOS-36 | Sleep timer display e set/cancel per zona nella /sonos page | SonosSleepTimerResponse.remaining_seconds (null = inactive); preset seconds map to 15/30/45/60/90 min; PUT with duration=0 cancels; routes confirmed working |
| SONOS-37 | Queue viewer paginato per zona nella /sonos page (lista brani con titolo, artista, durata) | SonosQueueResponse fully typed; limit/offset pagination; on-demand fetch pattern; `useSonosQueue` hook approach confirmed by decision D-19 |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase |
|-----------|-----------------|
| NEVER break existing functionality | Must not change SonosZoneSection's existing transport/volume behaviour |
| PREFER editing existing files over creating new | Extend useSonosFullData.ts and useSonosCommands.ts in place; only create 3 new component files + 1 new hook file |
| ALWAYS create/update unit tests | New hook (useSonosQueue) and new commands (handleSetPlayMode, handleSetSleepTimer) need tests |
| USE design system from /debug/design-system | Icon buttons follow same pattern as SonosTransportControls — raw buttons with Tailwind, no design-system Button component needed for icon toggles |
| NEVER run `npm run build` or `npm install` | No build verification |
| NEVER commit/push without explicit request | Plan tasks without git commits |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lucide-react | installed | Icons (Shuffle, Repeat, Repeat1, Timer, X, ChevronDown, ChevronUp, ListMusic) | All Sonos controls use lucide-react |
| React (useState, useRef) | 19.x (Next.js 15.5) | Local toggle state, expandable queue | Already used in all Sonos hooks/components |
| TypeScript | 5.x strict | Type safety | strict + noUncheckedIndexedAccess enforced |

### Relevant Existing Types (all from `types/sonosProxy.ts`)
```typescript
// Play mode — composite enum
type SonosPlayMode = 'NORMAL' | 'REPEAT_ALL' | 'SHUFFLE' | 'SHUFFLE_NOREPEAT' | 'SHUFFLE_REPEAT_ONE' | 'REPEAT_ONE';
interface SonosPlayModeResponse { group_id: string; play_mode: SonosPlayMode | null; }
interface SetPlayModeRequest { mode: SonosPlayMode; }

// Sleep timer
interface SonosSleepTimerResponse { group_id: string; remaining_seconds: number | null; }
interface SetSleepTimerRequest { duration: number; }  // 0 = cancel

// Queue
interface SonosQueueItemResponse { position: number; title: string | null; artist: string | null; album: string | null; album_art_url: string | null; }
interface SonosQueueResponse { group_id: string; items: SonosQueueItemResponse[]; total: number; limit: number; offset: number; }
```

**Note:** `SonosQueueItemResponse` does NOT include a `duration` field in the current type definition. The CONTEXT says to display "duration" but the type has no duration field. The planner should use only documented fields: position, title, artist. Duration column should be omitted or shown as "—" if unavailable.

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
app/components/devices/sonos/
├── components/
│   ├── SonosNowPlaying.tsx           (existing — no change)
│   ├── SonosTransportControls.tsx    (existing — no change)
│   ├── SonosSpeakerVolume.tsx        (existing — no change)
│   ├── SonosZoneSection.tsx          (EXTEND — add new props + render new components)
│   ├── SonosPlayModeControls.tsx     (NEW)
│   ├── SonosSleepTimer.tsx           (NEW)
│   └── SonosQueueViewer.tsx          (NEW)
├── hooks/
│   ├── useSonosFullData.ts           (EXTEND — add playModes + sleepTimers records)
│   ├── useSonosCommands.ts           (EXTEND — add handleSetPlayMode + handleSetSleepTimer)
│   └── useSonosQueue.ts              (NEW — on-demand queue fetch with load-more)
└── __tests__/ (existing, extend)
```

### Pattern 1: Extending SonosFullData with per-zone extended state
**What:** Add `playModes` and `sleepTimers` record maps (keyed by group_id) to `SonosFullData`, fetched in parallel with existing playback fetches via `Promise.allSettled`.
**When to use:** Any data that is polled on the same 60s cycle as zones.

```typescript
// Extended SonosFullData interface
export interface SonosFullData {
  zones: SonosZoneResponse[];
  playback: Record<string, SonosPlaybackResponse>;
  volumes: Record<string, SonosVolumeResponse>;
  playModes: Record<string, SonosPlayModeResponse>;      // NEW — keyed by group_id
  sleepTimers: Record<string, SonosSleepTimerResponse>;  // NEW — keyed by group_id
}
```

Fetch pattern (inside fetchData, after existing playback fetch):
```typescript
const [playModeResults, sleepTimerResults] = await Promise.all([
  Promise.allSettled(
    zones.map(z =>
      fetch(`/api/sonos/zones/${z.group_id}/play-mode`).then(r => {
        if (!r.ok) throw new Error('play-mode failed');
        return r.json() as Promise<SonosPlayModeResponse>;
      })
    )
  ),
  Promise.allSettled(
    zones.map(z =>
      fetch(`/api/sonos/zones/${z.group_id}/sleep-timer`).then(r => {
        if (!r.ok) throw new Error('sleep-timer failed');
        return r.json() as Promise<SonosSleepTimerResponse>;
      })
    )
  ),
]);
```

### Pattern 2: Play mode boolean decomposition
**What:** Derive three independent booleans from the composite SonosPlayMode enum.
**When to use:** SonosPlayModeControls needs individual toggle states.

```typescript
// Derive toggle states from composite play_mode
function decomposePlayMode(mode: SonosPlayMode | null) {
  const isShuffle = mode === 'SHUFFLE' || mode === 'SHUFFLE_NOREPEAT' || mode === 'SHUFFLE_REPEAT_ONE';
  const isRepeat = mode === 'REPEAT_ALL' || mode === 'REPEAT_ONE';
  const isRepeatOne = mode === 'REPEAT_ONE' || mode === 'SHUFFLE_REPEAT_ONE';
  return { isShuffle, isRepeat, isRepeatOne };
}

// Compose new mode from toggle clicks
function composePlayMode(currentMode: SonosPlayMode | null, toggle: 'shuffle' | 'repeat'): SonosPlayMode {
  const { isShuffle, isRepeat } = decomposePlayMode(currentMode);
  if (toggle === 'shuffle') {
    return isShuffle ? (isRepeat ? 'REPEAT_ALL' : 'NORMAL') : (isRepeat ? 'SHUFFLE' : 'SHUFFLE_NOREPEAT');
  }
  // toggle === 'repeat'
  return isRepeat ? (isShuffle ? 'SHUFFLE_NOREPEAT' : 'NORMAL') : (isShuffle ? 'SHUFFLE' : 'REPEAT_ALL');
}
```

**Note on crossfade:** `SonosPlayModeResponse` has NO crossfade field. The composite `SonosPlayMode` enum also does not encode crossfade. The CONTEXT decision D-03 mentions "crossfade (separate field if available, or derived)" — it is NOT available in the current types. The planner should either skip the crossfade toggle or mark it as a stub that always shows inactive. Do not attempt to derive it from play_mode.

### Pattern 3: useSonosQueue — on-demand hook
**What:** Self-contained hook that fetches queue on expand, loads more on scroll/button.
**When to use:** D-13 requires queue is NOT polled; only fetched on demand.

```typescript
// useSonosQueue.ts
export interface UseSonosQueueReturn {
  items: SonosQueueItemResponse[];
  total: number;
  loading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useSonosQueue(groupId: string): UseSonosQueueReturn {
  const [items, setItems] = useState<SonosQueueItemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 20;

  const fetchPage = async (pageOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sonos/zones/${groupId}/queue?limit=${LIMIT}&offset=${pageOffset}`);
      if (!res.ok) throw new Error('Queue non disponibile');
      const data = await res.json() as SonosQueueResponse;
      setItems(prev => pageOffset === 0 ? data.items : [...prev, ...data.items]);
      setTotal(data.total);
      setOffset(pageOffset + data.items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore coda');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch (called by parent on expand)
  const fetchInitial = () => fetchPage(0);
  const loadMore = () => fetchPage(offset);
  const hasMore = items.length < total;

  return { items, total, loading, error, loadMore, hasMore, fetchInitial };
}
```

### Pattern 4: Extending useSonosCommands
**What:** Add two new PUT command handlers following the exact same structure as existing transport commands.
**When to use:** All Sonos mutations follow 202 + poll delay + fetchData pattern.

```typescript
// New handler (same pattern as handleSetVolume/handlePlay)
const handleSetPlayMode = async (groupId: string, mode: SonosPlayMode) => {
  try {
    params.setError(null);
    const response = await sonosPlayModeCmd.execute(`/api/sonos/zones/${groupId}/play-mode`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode } satisfies SetPlayModeRequest),
    });
    if (response) {
      if (!response.ok) throw new Error(`Comando fallito: ${response.status}`);
      const data = await response.json() as SonosCommandOkResponse & { suggested_poll_delay_s: number };
      await new Promise<void>(resolve => setTimeout(resolve, (data.suggested_poll_delay_s ?? 1) * 1000));
      await params.fetchData();
    }
  } catch (err: unknown) {
    params.setError(err instanceof Error ? err.message : String(err));
  }
};
```

**Note:** A third `useRetryableCommand` hook call is required at the top of `useSonosCommands` for the new commands. React hooks rules require it to be at component/hook top level, not inside conditionals. Options: (a) one shared `sonosExtendedCmd` for both play-mode and sleep-timer, or (b) two separate hooks. Given the existing pattern uses two hooks for transport vs volume, one shared hook for the two new extended commands is the simplest extension.

### Pattern 5: SonosZoneSection wiring
**What:** Pass new data slices and new command handlers as props to zone section.
**When to use:** New components need their data from the parent orchestrator (SonosPage).

Updated `SonosZoneSectionProps`:
```typescript
interface SonosZoneSectionProps {
  zone: SonosZoneResponse;
  playback: SonosPlaybackResponse | undefined;
  volumes: Record<string, SonosVolumeResponse>;
  playMode: SonosPlayModeResponse | undefined;       // NEW
  sleepTimer: SonosSleepTimerResponse | undefined;   // NEW
  commands: UseSonosCommandsReturn;
}
```

`SonosPage` passes: `playMode={data.playModes[zone.group_id]}` and `sleepTimer={data.sleepTimers[zone.group_id]}`.

### Anti-Patterns to Avoid
- **Polling queue in useSonosFullData:** Queue is on-demand only (D-13). Adding it to the polling loop would create unnecessary API calls per zone per 60s.
- **Real-time sleep timer countdown:** D-09 explicitly requires no live countdown — only the last-polled value is displayed. Do not use a `setInterval` to decrement remaining_seconds client-side.
- **Crossfade from play_mode:** The SonosPlayMode enum has no crossfade encoding. Do not attempt to derive crossfade state from the mode string; either omit the toggle or show it as always-inactive until a future phase adds a crossfade API.
- **Duration in queue items:** `SonosQueueItemResponse` has no `duration` field. The CONTEXT.md mentions "duration" in D-11 but this is not in the TypeScript type. Show position, title, artist only.
- **New useRetryableCommand inside a conditional:** Must be at top level of hook — add a single `sonosExtendedCmd` at top of useSonosCommands.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon toggle active/inactive state | Custom CSS active toggle | Tailwind conditional class with ember color | Pattern established by transport controls |
| Load-more pagination | Complex infinite scroll | Simple "Carica altri" button + offset accumulation | Matches D-12, avoids IntersectionObserver complexity |
| Sleep timer formatting | Date formatting library | `Math.floor(s/60).toString().padStart(2,'0') + ':' + (s%60).toString().padStart(2,'0')` | Simple arithmetic, no dep needed |
| Play mode composition | Separate shuffle/repeat API fields | String-matching on composite SonosPlayMode enum | API returns one composite value, must decompose |

---

## Common Pitfalls

### Pitfall 1: Duration field missing from SonosQueueItemResponse
**What goes wrong:** D-11 in CONTEXT.md says "title, artist, duration" but `SonosQueueItemResponse` has no `duration` field.
**Why it happens:** The proxy API does not expose track duration in the queue response.
**How to avoid:** Show position, title, artist only. Do not add a duration column referencing a non-existent field.
**Warning signs:** TypeScript error `Property 'duration' does not exist on type 'SonosQueueItemResponse'`.

### Pitfall 2: Crossfade not in SonosPlayMode enum
**What goes wrong:** CONTEXT D-03 says "crossfade (separate field if available, or derived)". Neither SonosPlayModeResponse nor SonosPlayMode encodes crossfade.
**Why it happens:** SoCo exposes crossfade as a separate boolean, but the proxy API does not surface it in the play-mode endpoint.
**How to avoid:** Either omit the crossfade toggle entirely, or render it as always-disabled with a visual indicator that it is not available. Do not attempt to derive it.
**Warning signs:** No `crossfade` field in `SonosPlayModeResponse`; no crossfade-related value in `SonosPlayMode` union.

### Pitfall 3: SonosFullData backward compat for existing consumers
**What goes wrong:** `SonosPage` and existing tests destructure `data` assuming only `{ zones, playback, volumes }`. Adding new fields to `SonosFullData` and `UseSonosFullDataReturn` is additive and safe, but `useSonosFullData.test.ts` mocks and assertions will need updating.
**Why it happens:** Tests verify the returned data shape.
**How to avoid:** Add new fields to `SonosFullData` interface and initialize them as empty records `{}` — existing destructuring still works. Update test fixtures to include the new fields.

### Pitfall 4: Three useRetryableCommand calls in useSonosCommands
**What goes wrong:** Adding a third hook call changes the call order if placed incorrectly, violating React hooks rules only if placed conditionally.
**Why it happens:** React requires hooks to be called unconditionally and in the same order on every render.
**How to avoid:** Add `const sonosExtendedCmd = useRetryableCommand({ device: 'sonos', action: 'extended' })` as the third unconditional call at the top of `useSonosCommands`.

### Pitfall 5: Queue expand state in SonosZoneSection vs SonosQueueViewer
**What goes wrong:** If `isExpanded` state lives in SonosZoneSection, every render of the zone section re-renders the queue. If it lives in SonosQueueViewer, the trigger button must be inside the viewer.
**Why it happens:** Shared toggle state across parent/child boundary.
**How to avoid:** Keep `isExpanded` state in `SonosQueueViewer` itself. The viewer renders its own expand/collapse button ("Coda"). This keeps the queue component self-contained and matches D-10.

### Pitfall 6: useSonosFullData fetch timing — parallel play-mode + sleep-timer
**What goes wrong:** If play-mode and sleep-timer are fetched sequentially per zone (not in parallel), a 5-zone setup takes 10 extra round-trips before data is ready.
**Why it happens:** Naive sequential awaits inside map.
**How to avoid:** Wrap both fetches in `Promise.all([Promise.allSettled(...), Promise.allSettled(...)])` as shown in Pattern 1 — two batches run in parallel, each batch has per-zone parallelism via allSettled.

---

## Code Examples

### Sleep timer seconds to MM:SS
```typescript
// Pure utility — no dependency needed
function formatRemainingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
// formatRemainingTime(2700) → "45:00"
// formatRemainingTime(90)   → "01:30"
```

### Emit active toggle button style (matching transport controls aesthetic)
```typescript
// From SonosTransportControls pattern — ember/copper accent for active
const toggleClass = (isActive: boolean) =>
  isActive
    ? 'p-2 rounded-lg bg-ember-500/20 text-ember-400 transition-colors'
    : 'p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-slate-500 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-400';
```

### SonosPage zone section call with new props
```tsx
{data?.zones.map(zone => (
  <SonosZoneSection
    key={zone.group_id}
    zone={zone}
    playback={data.playback[zone.group_id]}
    volumes={data.volumes}
    playMode={data.playModes[zone.group_id]}
    sleepTimer={data.sleepTimers[zone.group_id]}
    commands={commands}
  />
))}
```

### Lucide icons for play mode controls
```tsx
import { Shuffle, Repeat, Repeat1 } from 'lucide-react';
// Shuffle → shuffle toggle
// Repeat  → repeat-all toggle
// Repeat1 → repeat-one (if needed; may omit if only binary repeat shown)
// Timer   → sleep timer section header icon (import from lucide-react)
// ListMusic → queue viewer header icon
// X       → cancel timer button
// ChevronDown / ChevronUp → queue expand/collapse
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fetch all data on mount | useAdaptivePolling with visibility-aware intervals | Phase 57 | Background tabs poll at 300s not 60s |
| Individual fetch per command | useRetryableCommand wrapper | Phase 55 | Automatic retry, deduplication |
| Direct Sonos API | HA proxy with X-API-Key | Phase 127 | All routes go through haGet/haPost/haPut |

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is frontend code only, all API routes pre-exist from Phase 128)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern=sonos` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONOS-35 | useSonosCommands.handleSetPlayMode sends PUT, waits poll delay, calls fetchData | unit | `npm test -- --testPathPattern=useSonosCommands` | ✅ extend existing |
| SONOS-35 | useSonosFullData populates playModes record from per-zone fetch | unit | `npm test -- --testPathPattern=useSonosFullData` | ✅ extend existing |
| SONOS-35 | SonosPlayModeControls renders active/inactive state from SonosPlayMode | unit | `npm test -- --testPathPattern=SonosPlayModeControls` | ❌ Wave 0 |
| SONOS-36 | useSonosCommands.handleSetSleepTimer sends PUT with duration, calls fetchData | unit | `npm test -- --testPathPattern=useSonosCommands` | ✅ extend existing |
| SONOS-36 | SonosSleepTimer renders preset buttons, cancel button when active, MM:SS format | unit | `npm test -- --testPathPattern=SonosSleepTimer` | ❌ Wave 0 |
| SONOS-37 | useSonosQueue fetches first page on demand, loadMore appends items, hasMore flag | unit | `npm test -- --testPathPattern=useSonosQueue` | ❌ Wave 0 |
| SONOS-37 | SonosQueueViewer shows expanded list, "Carica altri" button when hasMore | unit | `npm test -- --testPathPattern=SonosQueueViewer` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=sonos`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/components/devices/sonos/components/__tests__/SonosPlayModeControls.test.tsx` — covers SONOS-35 UI
- [ ] `app/components/devices/sonos/components/__tests__/SonosSleepTimer.test.tsx` — covers SONOS-36 UI
- [ ] `app/components/devices/sonos/hooks/__tests__/useSonosQueue.test.ts` — covers SONOS-37 hook
- [ ] `app/components/devices/sonos/components/__tests__/SonosQueueViewer.test.tsx` — covers SONOS-37 UI

Existing test files to extend:
- `useSonosCommands.test.ts` — add test cases for handleSetPlayMode and handleSetSleepTimer
- `useSonosFullData.test.ts` — add assertions for playModes and sleepTimers in returned data

---

## Open Questions

1. **Crossfade toggle: omit or show-disabled?**
   - What we know: CONTEXT D-01 says "three separate toggle buttons" (shuffle, repeat, crossfade); D-03 says "crossfade (separate field if available, or derived)"
   - What's unclear: The API has no crossfade in the play-mode response. Should the planner include the button as always-disabled, or omit it?
   - Recommendation: Render two functional toggles (shuffle, repeat) and either omit crossfade or render it disabled with a tooltip. Do not attempt to wire it to an API call. The planner should choose omit for simplicity unless user specifies otherwise.

2. **Duration in queue items**
   - What we know: D-11 lists "title, artist, duration" but the TypeScript type has no duration field
   - What's unclear: Did the proxy originally expose duration and it was later removed, or was it never intended?
   - Recommendation: Implement queue viewer with position, title, artist only. Duration column can be added in a future gap closure if the proxy is updated to expose it.

---

## Sources

### Primary (HIGH confidence)
- `types/sonosProxy.ts` — Verified all relevant interfaces (SonosPlayModeResponse, SonosSleepTimerResponse, SonosQueueItemResponse, SonosQueueResponse, SetPlayModeRequest, SetSleepTimerRequest, SonosPlayMode enum)
- `docs/api/sonos.md` — Verified play-mode, sleep-timer, and queue endpoint shapes, pagination params, error codes
- `app/api/sonos/zones/[groupId]/play-mode/route.ts` — Confirmed 202 + suggested_poll_delay_s pattern
- `app/api/sonos/zones/[groupId]/sleep-timer/route.ts` — Confirmed 202 + suggested_poll_delay_s pattern
- `app/api/sonos/zones/[groupId]/queue/route.ts` — Confirmed limit/offset query params forwarding
- `app/components/devices/sonos/hooks/useSonosFullData.ts` — Verified Promise.allSettled pattern, data shape, fetchData exposure
- `app/components/devices/sonos/hooks/useSonosCommands.ts` — Verified command pattern (execute + poll delay + fetchData), existing useRetryableCommand usage
- `app/components/devices/sonos/components/SonosZoneSection.tsx` — Verified current layout, props interface
- `app/components/devices/sonos/components/SonosTransportControls.tsx` — Verified icon button pattern, Tailwind class structure
- `.planning/config.json` — Confirmed nyquist_validation: true

### Secondary (MEDIUM confidence)
- None needed — all relevant information sourced from project files directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libs confirmed present in existing components
- Architecture: HIGH — all patterns verified from existing Sonos code
- Pitfalls: HIGH — crossfade and duration gaps identified directly from type inspection
- Test gaps: HIGH — file list confirmed by directory listing

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable codebase, no third-party API changes expected)
