# Phase 135: Sonos Zone Extended UI - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Add play mode controls (shuffle/repeat/crossfade), sleep timer display+controls, and a paginated queue viewer to each zone section in the existing /sonos page. All API routes already exist (Phase 128). No new API routes, no new pages — extends the existing SonosZoneSection component with additional controls.

</domain>

<decisions>
## Implementation Decisions

### Play mode controls (SONOS-35)
- **D-01:** Icon toggle buttons for shuffle, repeat, crossfade — three separate toggle buttons in a row. Active state uses ember/copper accent color, inactive uses muted color. Matches existing transport controls aesthetic.
- **D-02:** Play mode state comes from `GET /api/sonos/zones/{groupId}/play-mode` — returns `SonosPlayModeResponse` with composite `play_mode` enum (NORMAL, SHUFFLE, REPEAT_ALL, etc.)
- **D-03:** Frontend decomposes the composite `play_mode` into individual booleans: `shuffle` (mode contains "SHUFFLE"), `repeat` (mode contains "REPEAT"), `crossfade` (separate field if available, or derived). Toggle mutation sends `PUT /api/sonos/zones/{groupId}/play-mode` with the new composite `SonosPlayMode` value.
- **D-04:** Toggle mutation follows 202 + `suggested_poll_delay_s` + fetchData() refresh pattern (same as existing transport/volume commands in `useSonosCommands`).

### Sleep timer (SONOS-36)
- **D-05:** Preset duration buttons: 15min, 30min, 45min, 60min, 90min — compact button row. Active timer shows countdown in MM:SS format.
- **D-06:** Cancel button appears when timer is active. Setting a new duration replaces existing timer.
- **D-07:** Timer state from `GET /api/sonos/zones/{groupId}/sleep-timer` — returns `SonosSleepTimerResponse` with `remaining_seconds` (null = no timer).
- **D-08:** Set timer via `PUT /api/sonos/zones/{groupId}/sleep-timer` with `SetSleepTimerRequest { duration: seconds }`. Cancel by sending `{ duration: 0 }`.
- **D-09:** Countdown display updates via polling (same 60s interval as zone data). No real-time countdown — shows last-polled remaining time.

### Queue viewer (SONOS-37)
- **D-10:** Expandable inline list within zone section — toggled by a "Coda" button. Not a modal/drawer, stays inline.
- **D-11:** Shows track list: position number, title, artist, duration (from `SonosQueueItemResponse`). Album art NOT displayed (proxy complexity, deferred).
- **D-12:** Pagination via "Carica altri" (load more) button at bottom. Uses `limit=20` + `offset` params on `GET /api/sonos/zones/{groupId}/queue`.
- **D-13:** Queue state fetched on-demand when user expands, NOT on every poll cycle. Reduces unnecessary API calls.
- **D-14:** Empty queue shows "Coda vuota" text. Queue total count shown in header ("Coda (12 brani)").

### Zone section placement
- **D-15:** New controls placed below transport controls, above volume section. Order: Now Playing → Transport Controls → Play Mode + Sleep Timer (same row) → Queue (expandable) → Volume per speaker.
- **D-16:** Play mode toggles and sleep timer sit in a shared row — play mode icons on left, sleep timer on right. Responsive: stacks vertically on mobile.

### Hook architecture
- **D-17:** Extend `useSonosFullData` to also fetch play-mode and sleep-timer data per zone (parallel fetches per zone).
- **D-18:** Extend `useSonosCommands` with: `handleSetPlayMode(groupId, mode)`, `handleSetSleepTimer(groupId, duration)`. Same pattern as existing transport commands.
- **D-19:** New `useSonosQueue` hook for on-demand queue fetching — NOT in the main polling loop. Returns `{ items, total, loading, loadMore }`.

### New presentational components
- **D-20:** `SonosPlayModeControls.tsx` — shuffle/repeat/crossfade toggle buttons
- **D-21:** `SonosSleepTimer.tsx` — preset buttons + active timer countdown + cancel
- **D-22:** `SonosQueueViewer.tsx` — expandable track list with load-more pagination
- **D-23:** All new components go in `app/components/devices/sonos/components/`

### Claude's Discretion
- Exact icon choices for shuffle/repeat/crossfade from lucide-react
- Spacing and gap sizes between the new control rows
- Whether sleep timer countdown shows "45:00" or "45 min rimanenti" format
- Play mode toggle animation/transition
- Queue item row layout details (spacing, truncation)
- How to derive individual toggle states from composite SonosPlayMode enum

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sonos API specification
- `docs/api/sonos.md` — §Play Mode (GET/PUT play-mode endpoints, SonosPlayMode enum values), §Queue (GET queue with pagination params), §Sleep Timer (GET/PUT sleep-timer, duration in seconds, 0=cancel)

### Existing Sonos frontend (Phase 129)
- `app/sonos/page.tsx` — Current page orchestrator to extend
- `app/components/devices/sonos/components/SonosZoneSection.tsx` — Zone section component to extend with new controls
- `app/components/devices/sonos/hooks/useSonosCommands.ts` — Command hook to extend with play-mode + sleep-timer mutations
- `app/components/devices/sonos/hooks/useSonosFullData.ts` — Data hook to extend with play-mode + sleep-timer polling

### TypeScript types (Phase 128)
- `types/sonosProxy.ts` — SonosPlayMode, SonosPlayModeResponse, SonosQueueItemResponse, SonosQueueResponse, SonosSleepTimerResponse, SetPlayModeRequest, SetSleepTimerRequest

### API routes (Phase 128)
- `app/api/sonos/zones/[groupId]/play-mode/route.ts` — GET + PUT play mode
- `app/api/sonos/zones/[groupId]/queue/route.ts` — GET queue with limit/offset
- `app/api/sonos/zones/[groupId]/sleep-timer/route.ts` — GET + PUT sleep timer

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useSonosCommands` hook: Pattern for 202 + poll delay + refresh — extend with play-mode and sleep-timer handlers
- `useSonosFullData` hook: Zone data polling — extend to include play-mode and sleep-timer per zone
- `SonosZoneSection` component: Zone section layout — extend with new control slots
- `SonosTransportControls` component: Icon button pattern for playback — reuse style for play mode toggles
- `useRetryableCommand` hook: Already used for transport/volume — reuse for new commands

### Established Patterns
- Orchestrator pattern: hooks (data + commands) → presentational components
- 202 Accepted + `suggested_poll_delay_s` + fetchData() refresh for all mutations
- Italian UI strings throughout
- lucide-react icons for all interactive controls
- Presentational components receive data + callbacks via props

### Integration Points
- `SonosZoneSection.tsx` — Add new components between transport and volume sections
- `useSonosFullData.ts` — Add play-mode and sleep-timer fetch per zone
- `useSonosCommands.ts` — Add handleSetPlayMode and handleSetSleepTimer
- No changes to SonosCard, DashboardCards, deviceTypes, or navigation

</code_context>

<specifics>
## Specific Ideas

- Play mode toggles should feel like music app controls — small icon buttons, not large form elements
- Sleep timer presets match common Sonos app durations (15/30/45/60/90 min)
- Queue viewer is secondary information — expandable/collapsible keeps the zone section clean when not needed
- Queue fetched on-demand saves API calls since most users won't expand it on every page load
- "Coda" is the Italian word for queue (music context)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 135-sonos-zone-extended-ui*
*Context gathered: 2026-03-25*
