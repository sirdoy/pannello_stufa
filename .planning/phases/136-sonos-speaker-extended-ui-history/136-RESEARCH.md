# Phase 136: Sonos Speaker Extended UI & History - Research

**Researched:** 2026-03-25
**Domain:** React/Next.js 15 frontend — per-speaker controls and history charting on existing /sonos page
**Confidence:** HIGH

## Summary

Phase 136 extends the existing /sonos page with per-speaker EQ controls, home theater settings (soundbar only), source switching, group join/unjoin controls, and a global Cronologia history section. All API routes, TypeScript types, and proxy client functions were built in Phase 128. The frontend patterns from Phase 129 and 135 define the exact component and hook style to follow.

The work divides into two layers: (1) speaker-level controls that slot into the existing `SonosSpeakerVolume` row within `SonosZoneSection`, and (2) a new page-level `SonosHistoryChart` section added below zone sections in `app/sonos/page.tsx`. No new API routes, pages, or navigation changes are needed.

The main complexity is managing per-speaker async data (EQ and HT fetched in `useSonosFullData`) alongside debounced slider state (same 250ms pattern as volume). The history section is deliberately on-demand, using a standalone `useSonosHistory` hook that does not participate in the main polling cycle.

**Primary recommendation:** Extend existing hooks and components minimally — add new slots to `SonosSpeakerVolume`, keep each feature in its own small component, follow the 202 + `suggested_poll_delay_s` + `fetchData()` pattern without deviation.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**EQ controls per speaker (SONOS-38)**
- D-01: Expandable section per speaker within the volume area — each speaker's volume row gets a "EQ" expand toggle. When expanded, shows bass slider (-10 to +10), treble slider (-10 to +10), and loudness on/off toggle.
- D-02: Sliders use native range input styled with Tailwind (matches existing volume slider in SonosSpeakerVolume). Labels show current value next to slider.
- D-03: EQ data fetched per speaker from `GET /api/sonos/speakers/{uid}/eq` — returns `SonosEqResponse` with `bass`, `treble`, `loudness`.
- D-04: Mutations via `PUT /api/sonos/speakers/{uid}/eq` with `SetEqRequest` partial body. Follow 202 + `suggested_poll_delay_s` + fetchData() refresh pattern.
- D-05: Debounced slider input (200-300ms) to avoid flooding PUT requests while dragging — same pattern as volume slider.
- D-06: Null values in EQ response (speaker doesn't support EQ) → hide EQ expand toggle for that speaker.

**Home theater settings per soundbar (SONOS-39)**
- D-07: Visible only for speakers with `role === 'soundbar'` (from `SonosZoneMemberResponse.role`). Not shown for `speaker`, `sub`, or `surround` roles.
- D-08: Settings displayed as toggle switches in a dedicated sub-section below EQ: night mode, speech enhancement (dialog_mode), sub enabled, surround enabled.
- D-09: Sub gain (-15 to +15) and surround volume TV/music (-15 to +15) shown as sliders, only when sub/surround are enabled respectively.
- D-10: Data from `GET /api/sonos/speakers/{uid}/home-theater` — returns `SonosHomeTheaterResponse`. API returns 404 for non-soundbar speakers (handled upstream by role-check).
- D-11: Mutations via `PUT /api/sonos/speakers/{uid}/home-theater` with `SetHomeTheaterRequest` partial body. Same 202 pattern.
- D-12: Home theater section is collapsible/expandable, labeled "Home Theater" — default collapsed.

**Source switch per speaker (SONOS-40)**
- D-13: Segmented button with two options: "TV" and "Line-in" — visible only when speaker has an applicable source (soundbar speakers typically).
- D-14: Active source highlighted with ember/copper accent. Switching sends `POST /api/sonos/speakers/{uid}/source` with `SwitchSourceRequest { source: 'tv' | 'line_in' }`.
- D-15: Source switch button placed inline in the speaker row area, near the speaker name. Compact — doesn't take much vertical space.
- D-16: Not all speakers support source switching. If the proxy returns an error (no HDMI/line-in capability), hide the source button for that speaker. Frontend should try fetching and gracefully degrade.

**Group management per speaker (SONOS-41)**
- D-17: Each speaker in a zone shows an "Unisci" (join) or "Separa" (unjoin) control depending on context.
- D-18: Join: dropdown/select to pick target zone from available zones list, then confirm. Uses `POST /api/sonos/speakers/{uid}/join` with `JoinRequest { target_uid }` where target_uid is the coordinator UID of the destination zone.
- D-19: Unjoin: simple button "Separa" for speakers that are non-coordinator members in a multi-speaker zone. Uses `POST /api/sonos/speakers/{uid}/unjoin` with empty body.
- D-20: Coordinator speakers cannot unjoin (they ARE the zone). Hide unjoin for coordinator. Show join for standalone speakers (single-member zones).
- D-21: After join/unjoin, full page data refresh to reflect new zone structure. Same 202 + poll delay pattern.
- D-22: Group controls placed in the speaker row area, compact — small button/dropdown next to speaker name.

**History chart section (SONOS-42)**
- D-23: New section at the bottom of /sonos page, below all zone sections. Labeled "Cronologia" (history).
- D-24: Recharts `LineChart` for volume history (avg_volume over time), Recharts list/table for playback history (track events). Matches existing BandwidthChart pattern in /network page.
- D-25: Type selector: segmented button or tabs — "Volume" and "Riproduzione" (playback). Defaults to volume.
- D-26: Time range picker: preset buttons — "24h", "7g" (giorni), "30g". Default 24h.
- D-27: Data from `GET /api/sonos/history?type=volume|playback&start=...&end=...&limit=...`. Auto-granularity handled server-side.
- D-28: Volume chart: line chart with time on x-axis, volume (0-100) on y-axis. Shows avg_volume line. Min/max as shaded area if available.
- D-29: Playback history: simple list/table showing timestamp, track, artist, source_type. No chart needed — tabular display.
- D-30: Optional speaker/zone filter dropdown. If present, adds `speaker_uid` or `group_id` query param to history request.
- D-31: History data fetched on-demand when section is visible, not on every polling cycle. Uses its own fetch state.

**Component architecture**
- D-32: New components in `app/components/devices/sonos/components/`:
  - `SonosEqControls.tsx`
  - `SonosHomeTheater.tsx`
  - `SonosSourceSwitch.tsx`
  - `SonosGroupControls.tsx`
  - `SonosHistoryChart.tsx`
- D-33: Extend `SonosSpeakerVolume` to include slots for EQ expand, home theater expand, source switch, and group controls per speaker. Or create a new `SonosSpeakerExtended` wrapper.
- D-34: Extend `useSonosCommands` with: `handleSetEq`, `handleSetHomeTheater`, `handleSwitchSource`, `handleJoinGroup`, `handleUnjoinGroup`.
- D-35: Extend `useSonosFullData` to fetch EQ and home-theater data per speaker (parallel with existing zone data fetches).
- D-36: New `useSonosHistory` hook for on-demand history fetching.

### Claude's Discretion
- Exact slider styling for EQ bass/treble and home theater gain controls
- Whether to expand SonosSpeakerVolume or create new SonosSpeakerExtended wrapper
- Icon choices for EQ toggle, home theater toggle, source switch icons
- History chart colors and tooltip formatting
- Responsive layout details for speaker extended controls
- How to detect source capability per speaker (try-fetch vs role-based heuristic)
- Whether playback history shows as table or compact card list
- Volume history chart: whether to show min/max shaded area or just avg line

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-38 | EQ controls per speaker nella /sonos page (bass/treble sliders, loudness toggle) | API routes exist (`/api/sonos/speakers/[uid]/eq/route.ts`), types exist (`SonosEqResponse`, `SetEqRequest`), proxy functions exist (`getEq`, `setEq`), 202 pattern confirmed |
| SONOS-39 | Home theater settings per soundbar nella /sonos page (night mode, speech enhance, sub, surround) | API routes exist (`/api/sonos/speakers/[uid]/home-theater/route.ts`), types exist (`SonosHomeTheaterResponse`, `SetHomeTheaterRequest`), proxy functions exist, 404 for non-soundbar confirmed |
| SONOS-40 | Source switch (TV/line-in) per speaker nella /sonos page | API route exists (`/api/sonos/speakers/[uid]/source/route.ts`), `SwitchSourceRequest` type exists, role-based detection via `SonosZoneMemberResponse.role === 'soundbar'` |
| SONOS-41 | Group management per speaker nella /sonos page (join a gruppo, unjoin da gruppo) | API routes exist (join/unjoin), `JoinRequest` type exists, `coordinator_uid` from zone data, zones list available in `useSonosFullData` for join target picker |
| SONOS-42 | History chart nella /sonos page (volume/playback, selettore tipo, time range, filtro speaker/zona) | API route exists (`/api/sonos/history/route.ts`), `SonosHistoryResponse`, `SonosVolumeHistoryItem`, `SonosPlaybackHistoryItem` types exist, `BandwidthChart` as reference pattern |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (Next.js 15) | 15.5 | Component framework | Project standard |
| Recharts | existing | LineChart for volume history | Already used in BandwidthChart, dynamic imported |
| date-fns | existing | Timestamp formatting in chart | Already used in BandwidthChart |
| Lucide React | existing | Icons (ChevronDown, Music, etc.) | Project-wide icon library |
| Tailwind CSS | existing | Styling | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useRetryableCommand` | internal | Wraps fetch with retry for mutations | All 5 new command handlers in `useSonosCommands` |
| `useAdaptivePolling` | internal | Polling with visibility awareness | Already in `useSonosFullData` — no new polling for history |
| `useVisibility` | internal | Page visibility for poll interval | Already used — no new usage |

**Installation:** No new packages required. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure (additions only)
```
app/components/devices/sonos/
├── components/
│   ├── SonosEqControls.tsx          # NEW — bass/treble sliders + loudness toggle
│   ├── SonosHomeTheater.tsx         # NEW — HT toggles/sliders (soundbar only)
│   ├── SonosSourceSwitch.tsx        # NEW — TV/line-in segmented button
│   ├── SonosGroupControls.tsx       # NEW — join dropdown + unjoin button
│   ├── SonosHistoryChart.tsx        # NEW — history chart + type selector + time range
│   ├── SonosSpeakerVolume.tsx       # EXTEND — add EQ/HT/source/group slots
│   └── SonosZoneSection.tsx         # EXTEND — pass new data props + commands
├── hooks/
│   ├── useSonosCommands.ts          # EXTEND — 5 new handlers
│   ├── useSonosFullData.ts          # EXTEND — per-speaker EQ + HT data
│   └── useSonosHistory.ts           # NEW — on-demand history fetch
app/sonos/page.tsx                   # EXTEND — add SonosHistoryChart below zones
```

### Pattern 1: Expandable Speaker Sub-section (EQ Controls)

**What:** Collapsible row below each speaker in SonosSpeakerVolume — toggle button reveals sliders/toggles. Fetch EQ data from `useSonosFullData`, display with optimistic local state and 250ms debounce before PUT.

**When to use:** EQ and Home Theater — data fetched eagerly at page load, expand is just UI reveal.

```typescript
// Source: SonosSpeakerVolume.tsx + SonosQueueViewer.tsx (established pattern)
const [isEqExpanded, setIsEqExpanded] = useState(false);

// EQ toggle button (only shown when eqData !== undefined and bass/treble not null)
<button onClick={() => setIsEqExpanded(v => !v)} ...>
  <SlidersHorizontal size={14} />
  <span>EQ</span>
  {isEqExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
</button>

// Debounced slider — reuse same pattern as volume
const [localBass, setLocalBass] = useState(eqData?.bass ?? 0);
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const handleBassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const v = parseInt(e.target.value, 10);
  setLocalBass(v);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    void onSetEq(uid, { bass: v });
  }, 250);
};

<input type="range" min={-10} max={10} value={localBass} onChange={handleBassChange}
  className="flex-1 h-2 rounded-lg appearance-none bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 accent-ember-500" />
<span className="text-xs text-slate-400 min-w-[24px] text-right">{localBass > 0 ? `+${localBass}` : localBass}</span>
```

### Pattern 2: EQ and HT Data Fetching in useSonosFullData

**What:** Add two new `Promise.allSettled` batches in the existing `fetchData()` chain for EQ and HT data per speaker. EQ fetched for ALL speakers; HT fetched only for soundbar speakers (role === 'soundbar').

**When to use:** Per-speaker data fetched once at page load and after each mutation refresh.

```typescript
// Source: useSonosFullData.ts (established structure)
// After volumes are fetched — Step 6: EQ per speaker
const eqResults = await Promise.allSettled(
  allUids.map(uid =>
    fetch(`/api/sonos/speakers/${uid}/eq`).then(r => {
      if (!r.ok) throw new Error('eq failed');
      return r.json() as Promise<SonosEqResponse>;
    })
  )
);
const eqs: Record<string, SonosEqResponse> = {};
eqResults.forEach((r, i) => {
  if (r.status === 'fulfilled') eqs[allUids[i]!] = r.value;
});

// Step 7: HT for soundbar speakers only
const soundbarUids = [...new Set(
  zones.flatMap(z => z.members.filter(m => m.role === 'soundbar').map(m => m.uid))
)];
const htResults = await Promise.allSettled(
  soundbarUids.map(uid =>
    fetch(`/api/sonos/speakers/${uid}/home-theater`).then(r => {
      if (!r.ok) throw new Error('ht failed');
      return r.json() as Promise<SonosHomeTheaterResponse>;
    })
  )
);
const homeTheaterData: Record<string, SonosHomeTheaterResponse> = {};
htResults.forEach((r, i) => {
  if (r.status === 'fulfilled') homeTheaterData[soundbarUids[i]!] = r.value;
});
```

### Pattern 3: Command Handler Extension in useSonosCommands

**What:** Add 5 new handlers using the same `sonosExtendedCmd` (already exists) for EQ, HT, source, join, unjoin — follow exact same try/catch + 202 + poll delay + fetchData() structure.

```typescript
// Source: useSonosCommands.ts (established 202 pattern)
const handleSetEq = async (uid: string, eq: SetEqRequest) => {
  try {
    params.setError(null);
    const response = await sonosExtendedCmd.execute(`/api/sonos/speakers/${uid}/eq`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eq satisfies SetEqRequest),
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

// Unjoin uses haPost with no body
const handleUnjoinGroup = async (uid: string) => {
  try {
    params.setError(null);
    const response = await sonosExtendedCmd.execute(`/api/sonos/speakers/${uid}/unjoin`, {
      method: 'POST',
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

### Pattern 4: useSonosHistory Hook (on-demand)

**What:** Standalone hook, not integrated with `useAdaptivePolling`. Fetches on demand when user interacts with type/range selector or when section first renders. Returns data, loading, type, timeRange, and setter functions.

```typescript
// Source: useSonosQueue.ts (on-demand fetch pattern)
export type SonosHistoryType = 'volume' | 'playback';
export type SonosHistoryRange = '24h' | '7d' | '30d';

export function useSonosHistory() {
  const [type, setType] = useState<SonosHistoryType>('volume');
  const [timeRange, setTimeRange] = useState<SonosHistoryRange>('24h');
  const [speakerFilter, setSpeakerFilter] = useState<string | null>(null);
  const [data, setData] = useState<SonosHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = Math.floor(Date.now() / 1000);
      const rangeSeconds = { '24h': 86400, '7d': 604800, '30d': 2592000 };
      const start = now - rangeSeconds[timeRange];
      const params = new URLSearchParams({
        type,
        start: String(start),
        end: String(now),
        limit: '200',
      });
      if (type === 'volume' && speakerFilter) params.set('speaker_uid', speakerFilter);
      if (type === 'playback' && speakerFilter) params.set('group_id', speakerFilter);
      const res = await fetch(`/api/sonos/history?${params.toString()}`);
      if (!res.ok) throw new Error('Cronologia non disponibile');
      const json = await res.json() as SonosHistoryResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore cronologia');
    } finally {
      setLoading(false);
    }
  }, [type, timeRange, speakerFilter]);

  // Refetch when type, range, or filter changes
  useEffect(() => { void fetchHistory(); }, [fetchHistory]);

  return { data, loading, error, type, setType, timeRange, setTimeRange, speakerFilter, setSpeakerFilter };
}
```

### Pattern 5: History Chart with Recharts (Volume Mode)

**What:** Dynamic-imported LineChart following BandwidthChart pattern. Volume history maps `timestamp` (x-axis, formatted with date-fns) to `avg_volume` or `volume` (y-axis). Playback history renders as a compact list table.

```typescript
// Source: BandwidthChart.tsx (established Recharts pattern)
// Dynamic import at component level (parent file)
const SonosHistoryChart = dynamic(
  () => import('./SonosHistoryChart'),
  { ssr: false }
);

// Inside SonosHistoryChart (not dynamically imported itself):
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// Volume chart data mapping
const chartData = (items as SonosVolumeHistoryItem[]).map(item => ({
  time: item.timestamp * 1000, // Recharts uses ms
  volume: item.avg_volume ?? item.volume,
  min: item.min_volume,
  max: item.max_volume,
}));

// X-axis formatter
const formatXAxis = (ts: number) => {
  if (timeRange === '30d') return format(ts, 'dd/MM');
  if (timeRange === '7d') return format(ts, 'dd/MM HH:mm');
  return format(ts, 'HH:mm');
};
```

### Pattern 6: Source Switch — Role-Based Visibility

**What:** Source switch component only shown for `role === 'soundbar'` members. This is determined from `zone.members` which already includes the `role` field via `SonosZoneMemberResponse`. No try-fetch needed — role check is sufficient.

**When to use:** Avoids unnecessary API calls for non-soundbar speakers.

```typescript
// Source: types/sonosProxy.ts — SonosZoneMemberResponse
// role: 'soundbar' | 'sub' | 'surround' | 'speaker'
// Visibility logic (in SonosSpeakerVolume or SonosSpeakerExtended):
const isSoundbar = member.role === 'soundbar';

// Show source switch only for soundbar
{isSoundbar && (
  <SonosSourceSwitch
    uid={uid}
    currentSource={playback?.source_type ?? null}
    onSwitchSource={onSwitchSource}
  />
)}
```

### Pattern 7: Group Controls — Coordinator Detection

**What:** Coordinator identity determined by comparing `member.uid === zone.coordinator_uid`. Coordinator hides unjoin. Non-coordinator in multi-member zone shows unjoin. Any speaker can show join (for adding to another zone).

```typescript
// Source: types/sonosProxy.ts — SonosZoneResponse
// zone.coordinator_uid === member.uid → coordinator
const isCoordinator = member.uid === zone.coordinator_uid;
const isInMultiMemberZone = zone.member_count > 1;

// Join: show for standalone coordinators (single-member zone)
const showJoin = isCoordinator && zone.member_count === 1;
// Unjoin: show for non-coordinators in multi-member zone
const showUnjoin = !isCoordinator && isInMultiMemberZone;
```

### Anti-Patterns to Avoid

- **Fetching EQ/HT outside of useSonosFullData:** EQ and HT must be fetched in the main `fetchData()` cycle so they refresh after every mutation. A separate polling hook would duplicate requests.
- **Using `useAdaptivePolling` for history:** History is on-demand. Adding it to the polling cycle wastes requests — use `useEffect` + `fetchHistory` triggered by state changes.
- **Sending full EQ object on slider change:** Use partial PUT (only the changed field). `SetEqRequest` is all-optional; send `{ bass: newValue }` not `{ bass, treble, loudness }` on each slider event.
- **Calling home-theater GET for non-soundbar speakers:** Role guard in `useSonosFullData` — only fetch HT for `role === 'soundbar'` UIDs, not all speakers.
- **Re-implementing TimeRangeSelector:** Reuse the Button.Group + Button variant pattern directly in `SonosHistoryChart` with Sonos-specific range labels ("24h", "7g", "30g") rather than importing the network-specific `TimeRangeSelector`.
- **Blocking SonosSpeakerVolume with loading state during EQ fetch:** EQ data arrives with the initial page load; show skeleton or hide toggle rather than blocking the entire volume row.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced slider | Custom debounce logic | `useRef` + `setTimeout` (existing SonosSpeakerVolume pattern) | Already battle-tested in volume slider; consistent 250ms |
| Chart time formatting | Custom date formatter | `date-fns format()` | Already imported in BandwidthChart |
| Chart rendering | Custom SVG chart | `recharts` LineChart + ResponsiveContainer | Already in project, same bundle, SSR disabled |
| Optimistic slider state | Server round-trip on drag | `localBass/localTreble` useState + server sync on debounce | Same pattern as localVolume in SonosSpeakerVolume |
| Coordinator detection | Extra API call | `zone.coordinator_uid` from zone data | Already in `SonosZoneResponse` |
| Soundbar detection | Extra API call | `member.role === 'soundbar'` from zone members | Already in `SonosZoneMemberResponse.role` |

**Key insight:** The zone data from `GET /api/sonos/zones` already contains the role and coordinator fields needed for all conditional rendering decisions. No extra discovery calls needed.

---

## Common Pitfalls

### Pitfall 1: EQ Null Values Hidden Behind Expand Toggle
**What goes wrong:** EQ toggle is shown but when expanded all values are null — slider state initializes to 0 but server has null.
**Why it happens:** EQ API returns null bass/treble when speaker doesn't support EQ (surrounds, Sub).
**How to avoid:** Per D-06 — hide the EQ expand toggle entirely when `eqData?.bass === null && eqData?.treble === null`. Check eqData presence before showing toggle.
**Warning signs:** Speaker shows EQ button but sliders behave strangely or mutations return 502.

### Pitfall 2: Home Theater 404 for Non-Soundbar
**What goes wrong:** HT fetch called for a non-soundbar speaker returns 404, surfaced as error in the UI.
**Why it happens:** API doc: "Only available for speakers with `role: 'soundbar'` -- returns 404 for non-soundbar speakers."
**How to avoid:** In `useSonosFullData`, filter to `role === 'soundbar'` before fetching. Never call `GET /home-theater` for other roles.
**Warning signs:** Console 404 errors for `speakers/[uid]/home-theater`.

### Pitfall 3: Sub/Surround Sliders Shown When Disabled
**What goes wrong:** Sub gain slider shown even when `sub_enabled: false`, leading to confusing UX and potentially sending gain values that have no effect.
**Why it happens:** Per D-09, gain sliders should only appear when sub/surround are respectively enabled.
**How to avoid:** Conditional render: `{htData?.sub_enabled && <SubGainSlider />}` and `{htData?.surround_enabled && <SurroundVolumeSlider />}`.
**Warning signs:** Sub gain slider appears greyed-out while toggle is off.

### Pitfall 4: Join Target Includes Current Zone
**What goes wrong:** Join dropdown lists all zones including the zone the speaker already belongs to.
**Why it happens:** `zones` array from `useSonosFullData` includes the speaker's current zone.
**How to avoid:** Filter join targets to `zones.filter(z => z.group_id !== speaker's current group_id)`. Pass current zone's group_id to `SonosGroupControls`.
**Warning signs:** User can "join" a speaker to its own zone, causing a no-op or SoCo error.

### Pitfall 5: History Data Shape Depends on Granularity
**What goes wrong:** Chart tries to read `avg_volume` for raw granularity data — it's null. `volume` is only populated for raw, `avg_volume` for hourly/daily.
**Why it happens:** Auto-granularity means 24h = raw (use `volume`), 7d = hourly (use `avg_volume`), 30d = daily (use `avg_volume`).
**How to avoid:** In chart data mapping: `item.avg_volume ?? item.volume` as the y-value — covers both raw and aggregated tiers. Check `data.granularity` from response to format x-axis appropriately.
**Warning signs:** Line chart shows flat line at 0 for 24h range.

### Pitfall 6: History timestamp is Unix epoch (seconds, not ms)
**What goes wrong:** Recharts/date-fns receive seconds, display dates from 1970.
**Why it happens:** `SonosVolumeHistoryItem.timestamp` is Unix epoch **int** (seconds), not milliseconds.
**How to avoid:** Multiply by 1000 when mapping to chart data: `time: item.timestamp * 1000`.
**Warning signs:** X-axis shows dates like "01/01/1970".

### Pitfall 7: SonosSpeakerVolume becomes too wide with new controls
**What goes wrong:** Speaker row overflows on mobile with name + mute + volume + source + group controls all inline.
**Why it happens:** D-15/D-22 say controls are compact and inline, but small screens have limited width.
**How to avoid:** Source switch and group controls can wrap to second line on small screens (sm:flex-row layout). Keep speaker name truncated with `truncate`. New expandable sections (EQ, HT) always go below the main row.
**Warning signs:** Speaker row content clips or wraps unexpectedly on 375px viewport.

---

## Code Examples

Verified patterns from official sources (project codebase):

### Existing 202 Accepted + poll delay pattern
```typescript
// Source: useSonosCommands.ts (handleSetPlayMode)
const response = await sonosExtendedCmd.execute(`/api/sonos/zones/${groupId}/play-mode`, {
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
```

### Existing expandable pattern (SonosQueueViewer)
```typescript
// Source: SonosQueueViewer.tsx
const [isExpanded, setIsExpanded] = useState(false);
const handleToggle = () => {
  const expanding = !isExpanded;
  setIsExpanded(expanding);
  if (expanding) { void fetchInitial(); }
};
// EQ/HT: no fetchInitial needed — data already in useSonosFullData
```

### Existing debounce + optimistic state (SonosSpeakerVolume)
```typescript
// Source: SonosSpeakerVolume.tsx
const [localVolume, setLocalVolume] = useState(volume);
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => { setLocalVolume(volume); }, [volume]);
const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newVol = parseInt(e.target.value, 10);
  setLocalVolume(newVol);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => { void onSetVolume(uid, newVol); }, 250);
};
```

### Recharts LineChart with dynamic import (BandwidthChart pattern)
```typescript
// Source: BandwidthChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
    <XAxis dataKey="time" tickFormatter={formatXAxis} stroke="currentColor" className="opacity-60" style={{ fontSize: '12px' }} />
    <YAxis stroke="currentColor" className="opacity-60" style={{ fontSize: '12px' }} />
    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 }} />
    <Line type="monotone" dataKey="volume" stroke="rgb(251, 146, 60)" strokeWidth={2} dot={false} isAnimationActive={false} />
  </LineChart>
</ResponsiveContainer>
```

### Type-safe partial EQ PUT
```typescript
// Source: types/sonosProxy.ts — SetEqRequest
// interface SetEqRequest { bass?: number; treble?: number; loudness?: boolean; }
body: JSON.stringify({ bass: newBass } satisfies SetEqRequest)
```

### Toggle switch (loudness / night mode)
```typescript
// Inline toggle pattern used throughout the project
<button
  onClick={() => void onSetEq(uid, { loudness: !eqData.loudness })}
  className={eqData.loudness
    ? 'w-9 h-5 rounded-full bg-ember-500 relative transition-colors'
    : 'w-9 h-5 rounded-full bg-slate-600 relative transition-colors'
  }
  role="switch"
  aria-checked={eqData.loudness ?? false}
>
  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${eqData.loudness ? 'translate-x-4' : 'translate-x-0.5'}`} />
</button>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Sonos CLIP API calls | HA proxy via `haGet/haPost/haPut` | Phase 129 | All Sonos routes use X-API-Key, no CLIP |
| Volume-only speaker row | Extensible speaker row with slots | Phase 136 | New controls slot into existing row layout |
| Chart data from Firebase RTDB | Sonos proxy history endpoint | Phase 128 | Auto-granularity, no client-side aggregation |

---

## Open Questions

1. **Source capability detection: role-based vs try-fetch (D-16)**
   - What we know: The API returns 404 for non-soundbar speakers on `/source`. The `role` field in `SonosZoneMemberResponse` identifies soundbars.
   - What's unclear: The CONTEXT says "frontend should try fetching and gracefully degrade" but also shows a role check for visibility. Role-based detection is simpler and avoids a failed request.
   - Recommendation: Use `role === 'soundbar'` as the primary guard. This is reliable (same guard used for HT) and avoids wasted API calls. Grace degrade applies to unexpected 502/503 during actual source switch.

2. **useSonosHistory: trigger on mount vs user interaction**
   - What we know: D-31 says "fetched on-demand when section is visible, not on every polling cycle."
   - What's unclear: Whether to auto-fetch on first render of SonosHistoryChart or wait for user interaction.
   - Recommendation: Auto-fetch on mount of SonosHistoryChart using `useEffect` (triggered once). This matches D-31 (not every poll cycle, but does fetch when section appears). Type/range changes trigger refetch via the `useCallback` dependency pattern shown in Pattern 4.

3. **SonosSpeakerVolume extension vs new SonosSpeakerExtended wrapper (D-33)**
   - What we know: D-33 leaves both options open as Claude's discretion.
   - Recommendation: Extend `SonosSpeakerVolume` with new optional props for EQ/HT/source/group data + callbacks. Avoids an extra wrapper component and keeps the speaker row in one file. The existing component is already self-contained at 72 LOC.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase adds frontend components only, all API routes already exist).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (with React Testing Library) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="sonos" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONOS-38 | SonosEqControls renders sliders, expand toggle, debounced PUT | unit | `npm test -- --testPathPattern="SonosEqControls" -x` | ❌ Wave 0 |
| SONOS-38 | useSonosFullData includes eqs record after fetch | unit | `npm test -- --testPathPattern="useSonosFullData" -x` | ❌ Wave 0 |
| SONOS-39 | SonosHomeTheater renders only for soundbar role | unit | `npm test -- --testPathPattern="SonosHomeTheater" -x` | ❌ Wave 0 |
| SONOS-40 | SonosSourceSwitch visible only for soundbar, calls onSwitchSource | unit | `npm test -- --testPathPattern="SonosSourceSwitch" -x` | ❌ Wave 0 |
| SONOS-41 | SonosGroupControls shows join for standalone, unjoin for non-coordinator | unit | `npm test -- --testPathPattern="SonosGroupControls" -x` | ❌ Wave 0 |
| SONOS-41 | handleJoinGroup / handleUnjoinGroup call correct endpoints | unit | `npm test -- --testPathPattern="useSonosCommands" -x` | ❌ Wave 0 (extend existing) |
| SONOS-42 | useSonosHistory fetches correct URL with type/range params | unit | `npm test -- --testPathPattern="useSonosHistory" -x` | ❌ Wave 0 |
| SONOS-42 | SonosHistoryChart renders type selector, time range buttons | unit | `npm test -- --testPathPattern="SonosHistoryChart" -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="sonos" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/components/devices/sonos/SonosEqControls.test.tsx` — covers SONOS-38
- [ ] `__tests__/components/devices/sonos/SonosHomeTheater.test.tsx` — covers SONOS-39
- [ ] `__tests__/components/devices/sonos/SonosSourceSwitch.test.tsx` — covers SONOS-40
- [ ] `__tests__/components/devices/sonos/SonosGroupControls.test.tsx` — covers SONOS-41
- [ ] `__tests__/hooks/useSonosHistory.test.ts` — covers SONOS-42
- [ ] `__tests__/components/devices/sonos/SonosHistoryChart.test.tsx` — covers SONOS-42
- [ ] Extend `__tests__/lib/sonosProxy.test.ts` — add EQ/HT/source/join/unjoin proxy wrappers (already tested for phases 127-128; verify extended commands are covered)
- [ ] Extend useSonosCommands test — add handleSetEq, handleSetHomeTheater, handleSwitchSource, handleJoinGroup, handleUnjoinGroup assertions
- [ ] Extend useSonosFullData test — add eqs and homeTheaterData records

---

## Sources

### Primary (HIGH confidence)
- `types/sonosProxy.ts` — all type definitions verified against actual file (SonosEqResponse, SonosHomeTheaterResponse, SetEqRequest, SetHomeTheaterRequest, SwitchSourceRequest, JoinRequest, SonosHistoryResponse, SonosVolumeHistoryItem, SonosPlaybackHistoryItem)
- `docs/api/sonos.md` — §Extended Controls and §History sections read in full; all endpoint shapes, error responses, and field availability tables confirmed
- `app/api/sonos/speakers/[uid]/eq/route.ts` — 202 pattern confirmed (`suggested_poll_delay_s: 1`)
- `app/api/sonos/speakers/[uid]/home-theater/route.ts` — 202 pattern confirmed
- `app/api/sonos/history/route.ts` — GET with searchParams forwarding confirmed
- `app/components/devices/sonos/hooks/useSonosCommands.ts` — `sonosExtendedCmd` already exists, 202 pattern established
- `app/components/devices/sonos/hooks/useSonosFullData.ts` — Promise.allSettled structure, data shape, fetchData export confirmed
- `app/components/devices/sonos/components/SonosSpeakerVolume.tsx` — debounce + optimistic state pattern confirmed
- `app/components/devices/sonos/components/SonosQueueViewer.tsx` — expandable section pattern confirmed
- `app/network/components/BandwidthChart.tsx` — Recharts LineChart pattern, dynamic import, date-fns usage confirmed
- `app/network/components/TimeRangeSelector.tsx` — Button.Group + variant pattern confirmed

### Secondary (MEDIUM confidence)
- `app/components/devices/sonos/components/SonosZoneSection.tsx` — current prop interface confirmed; knows what new props need threading
- `app/components/devices/sonos/components/SonosPlayModeControls.tsx` — toggle button styling (`activeClass`/`inactiveClass`) reuse pattern
- `app/components/devices/sonos/components/SonosSleepTimer.tsx` — preset buttons pattern reuse for history time range

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all existing dependencies confirmed present
- Architecture: HIGH — all patterns directly from existing Phase 129/135 code in the same codebase
- Pitfalls: HIGH — all from API spec (null handling, 404 behavior, granularity rules, epoch unit)
- History data mapping: HIGH — granularity table in API doc is authoritative

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable internal API, no external dependency changes)
