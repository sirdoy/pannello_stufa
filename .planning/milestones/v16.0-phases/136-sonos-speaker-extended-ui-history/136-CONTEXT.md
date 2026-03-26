# Phase 136: Sonos Speaker Extended UI & History - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Add per-speaker EQ controls, home theater settings (soundbar only), source switching, and group management to the /sonos page. Also add a global history chart section with type selector and time range picker. All API routes exist (Phase 128). No new API routes, no new pages — extends the existing /sonos page and SonosZoneSection component with speaker-level controls and a page-level history section.

</domain>

<decisions>
## Implementation Decisions

### EQ controls per speaker (SONOS-38)
- **D-01:** Expandable section per speaker within the volume area — each speaker's volume row gets a "EQ" expand toggle. When expanded, shows bass slider (-10 to +10), treble slider (-10 to +10), and loudness on/off toggle.
- **D-02:** Sliders use native range input styled with Tailwind (matches existing volume slider in SonosSpeakerVolume). Labels show current value next to slider.
- **D-03:** EQ data fetched per speaker from `GET /api/sonos/speakers/{uid}/eq` — returns `SonosEqResponse` with `bass`, `treble`, `loudness`.
- **D-04:** Mutations via `PUT /api/sonos/speakers/{uid}/eq` with `SetEqRequest` partial body. Follow 202 + `suggested_poll_delay_s` + fetchData() refresh pattern.
- **D-05:** Debounced slider input (200-300ms) to avoid flooding PUT requests while dragging — same pattern as volume slider.
- **D-06:** Null values in EQ response (speaker doesn't support EQ) → hide EQ expand toggle for that speaker.

### Home theater settings per soundbar (SONOS-39)
- **D-07:** Visible only for speakers with `role === 'soundbar'` (from `SonosZoneMemberResponse.role`). Not shown for `speaker`, `sub`, or `surround` roles.
- **D-08:** Settings displayed as toggle switches in a dedicated sub-section below EQ: night mode, speech enhancement (dialog_mode), sub enabled, surround enabled.
- **D-09:** Sub gain (-15 to +15) and surround volume TV/music (-15 to +15) shown as sliders, only when sub/surround are enabled respectively.
- **D-10:** Data from `GET /api/sonos/speakers/{uid}/home-theater` — returns `SonosHomeTheaterResponse`. API returns 404 for non-soundbar speakers (handled upstream).
- **D-11:** Mutations via `PUT /api/sonos/speakers/{uid}/home-theater` with `SetHomeTheaterRequest` partial body. Same 202 pattern.
- **D-12:** Home theater section is collapsible/expandable, labeled "Home Theater" — default collapsed.

### Source switch per speaker (SONOS-40)
- **D-13:** Segmented button with two options: "TV" and "Line-in" — visible only when speaker has an applicable source (soundbar speakers typically).
- **D-14:** Active source highlighted with ember/copper accent. Switching sends `POST /api/sonos/speakers/{uid}/source` with `SwitchSourceRequest { source: 'tv' | 'line_in' }`.
- **D-15:** Source switch button placed inline in the speaker row area, near the speaker name. Compact — doesn't take much vertical space.
- **D-16:** Not all speakers support source switching. If the proxy returns an error (no HDMI/line-in capability), hide the source button for that speaker. Frontend should try fetching and gracefully degrade.

### Group management per speaker (SONOS-41)
- **D-17:** Each speaker in a zone shows an "Unisci" (join) or "Separa" (unjoin) control depending on context.
- **D-18:** Join: dropdown/select to pick target zone from available zones list, then confirm. Uses `POST /api/sonos/speakers/{uid}/join` with `JoinRequest { target_uid }` where target_uid is the coordinator UID of the destination zone.
- **D-19:** Unjoin: simple button "Separa" for speakers that are non-coordinator members in a multi-speaker zone. Uses `POST /api/sonos/speakers/{uid}/unjoin` with empty body.
- **D-20:** Coordinator speakers cannot unjoin (they ARE the zone). Hide unjoin for coordinator. Show join for standalone speakers (single-member zones).
- **D-21:** After join/unjoin, full page data refresh to reflect new zone structure. Same 202 + poll delay pattern.
- **D-22:** Group controls placed in the speaker row area, compact — small button/dropdown next to speaker name.

### History chart section (SONOS-42)
- **D-23:** New section at the bottom of /sonos page, below all zone sections. Labeled "Cronologia" (history).
- **D-24:** Recharts `LineChart` for volume history (avg_volume over time), Recharts list/table for playback history (track events). Matches existing BandwidthChart pattern in /network page.
- **D-25:** Type selector: segmented button or tabs — "Volume" and "Riproduzione" (playback). Defaults to volume.
- **D-26:** Time range picker: preset buttons — "24h", "7g" (giorni), "30g". Default 24h.
- **D-27:** Data from `GET /api/sonos/history?type=volume|playback&start=...&end=...&limit=...`. Auto-granularity handled server-side.
- **D-28:** Volume chart: line chart with time on x-axis, volume (0-100) on y-axis. Shows avg_volume line. Min/max as shaded area if available.
- **D-29:** Playback history: simple list/table showing timestamp, track, artist, source_type. No chart needed — tabular display.
- **D-30:** Optional speaker/zone filter dropdown. If present, adds `speaker_uid` or `group_id` query param to history request.
- **D-31:** History data fetched on-demand when section is visible, not on every polling cycle. Uses its own fetch state.

### Component architecture
- **D-32:** New components in `app/components/devices/sonos/components/`:
  - `SonosEqControls.tsx` — bass/treble sliders + loudness toggle per speaker
  - `SonosHomeTheater.tsx` — home theater toggles/sliders for soundbar speakers
  - `SonosSourceSwitch.tsx` — TV/line-in segmented button
  - `SonosGroupControls.tsx` — join dropdown + unjoin button
  - `SonosHistoryChart.tsx` — chart section with type selector + time range + filter
- **D-33:** Extend `SonosSpeakerVolume` to include slots for EQ expand, home theater expand, source switch, and group controls per speaker. Or create a new `SonosSpeakerExtended` wrapper.
- **D-34:** Extend `useSonosCommands` with: `handleSetEq(uid, eq)`, `handleSetHomeTheater(uid, settings)`, `handleSwitchSource(uid, source)`, `handleJoinGroup(uid, targetUid)`, `handleUnjoinGroup(uid)`.
- **D-35:** Extend `useSonosFullData` to fetch EQ and home-theater data per speaker (parallel with existing zone data fetches).
- **D-36:** New `useSonosHistory` hook for on-demand history fetching — returns `{ data, loading, type, setType, timeRange, setTimeRange, speakerFilter, setFilter }`.

### Claude's Discretion
- Exact slider styling for EQ bass/treble and home theater gain controls
- Whether to expand SonosSpeakerVolume or create new SonosSpeakerExtended wrapper
- Icon choices for EQ toggle, home theater toggle, source switch icons
- History chart colors and tooltip formatting
- Responsive layout details for speaker extended controls
- How to detect source capability per speaker (try-fetch vs role-based heuristic)
- Whether playback history shows as table or compact card list
- Volume history chart: whether to show min/max shaded area or just avg line

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sonos API specification
- `docs/api/sonos.md` — §Extended Controls: EQ (GET/PUT speakers/{uid}/eq), home-theater (GET/PUT speakers/{uid}/home-theater), source (POST speakers/{uid}/source), join (POST speakers/{uid}/join), unjoin (POST speakers/{uid}/unjoin)
- `docs/api/sonos.md` — §History: GET /history with type, speaker_uid, group_id, start, end, limit, offset params; auto-granularity; volume vs playback response shapes

### Existing Sonos frontend (Phase 129 + 135)
- `app/sonos/page.tsx` — Page orchestrator to extend with history section
- `app/components/devices/sonos/components/SonosZoneSection.tsx` — Zone section to extend with per-speaker extended controls
- `app/components/devices/sonos/components/SonosSpeakerVolume.tsx` — Speaker volume row to extend with EQ/HT/source/group controls
- `app/components/devices/sonos/hooks/useSonosCommands.ts` — Command hook to extend with EQ, HT, source, join, unjoin mutations
- `app/components/devices/sonos/hooks/useSonosFullData.ts` — Data hook to extend with per-speaker EQ + HT data

### TypeScript types (Phase 128)
- `types/sonosProxy.ts` — SonosEqResponse, SonosHomeTheaterResponse, SetEqRequest, SetHomeTheaterRequest, SwitchSourceRequest, JoinRequest, SonosHistoryResponse, SonosVolumeHistoryItem, SonosPlaybackHistoryItem

### API routes (Phase 128)
- `app/api/sonos/speakers/[uid]/eq/` — GET + PUT EQ
- `app/api/sonos/speakers/[uid]/home-theater/` — GET + PUT home theater
- `app/api/sonos/speakers/[uid]/source/` — POST source switch
- `app/api/sonos/speakers/[uid]/join/` — POST join group
- `app/api/sonos/speakers/[uid]/unjoin/` — POST unjoin group
- `app/api/sonos/history/route.ts` — GET history with query params

### Chart pattern reference
- `app/network/components/BandwidthChart.tsx` — Recharts line chart with time range picker, dynamic import pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SonosSpeakerVolume` component: Per-speaker volume row with slider + mute — extend with EQ/HT/source/group slots
- `useSonosCommands` hook: 202 + poll delay + refresh pattern — extend with 5 new command handlers
- `useSonosFullData` hook: Zone + playback + volume + playMode + sleepTimer polling — extend with per-speaker EQ/HT data
- `BandwidthChart` component: Recharts LineChart with dynamic import — reference pattern for history chart
- Range input slider: Already styled in SonosSpeakerVolume — reuse pattern for EQ bass/treble and HT gain sliders
- `SonosZoneMemberResponse.role`: Already typed as `'soundbar' | 'sub' | 'surround' | 'speaker'` — use for conditional rendering

### Established Patterns
- Orchestrator pattern: hooks (data + commands) → presentational components
- 202 Accepted + `suggested_poll_delay_s` + fetchData() refresh for all mutations
- Expandable/collapsible sections (SonosQueueViewer uses this pattern with toggle button)
- Dynamic import for Recharts charts (next/dynamic with ssr: false)
- Italian UI strings throughout
- Debounced slider input for volume (reuse for EQ/HT sliders)

### Integration Points
- `SonosSpeakerVolume.tsx` — Extend each speaker row with expandable EQ, HT, source, group controls
- `SonosZoneSection.tsx` — May need minor adjustments for new speaker-level sections
- `app/sonos/page.tsx` — Add history section below zone sections
- `useSonosFullData.ts` — Add per-speaker EQ + HT fetch in parallel
- `useSonosCommands.ts` — Add 5 new command handlers
- No changes to SonosCard, DashboardCards, deviceTypes, or navigation

</code_context>

<specifics>
## Specific Ideas

- EQ controls feel like music app equalizer — compact sliders, not full-width form controls
- Home theater controls are secondary — collapsed by default, expanded on demand for soundbar owners
- Source switch is a quick action — should be immediately visible without expanding anything
- Group controls are power-user features — keep them compact, possibly behind an expand
- History chart follows the existing BandwidthChart visual language (time axis, clean lines, dark theme)
- "Cronologia" section is a global view — not per-zone, it shows system-wide history
- Playback history is inherently event-based (track changes) — a table/list fits better than a chart

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 136-sonos-speaker-extended-ui-history*
*Context gathered: 2026-03-25*
