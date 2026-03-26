# Phase 129: Sonos Frontend - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Build the Sonos frontend: SonosCard dashboard card, /sonos page with zone controls and per-speaker volume, device registry integration (Sonos already in DEVICE_CONFIG), and navigation menu entry. All 23 API routes from Phases 126-128 are available. No new API routes needed.

</domain>

<decisions>
## Implementation Decisions

### Dashboard card (SonosCard)
- **D-01:** Orchestrator pattern — `useSonosData` hook handles polling + state, `SonosCard` renders UI. Matches RaspiCard, LightsCard, StoveCard pattern.
- **D-02:** Card uses `SmartHomeCard` with `icon="🎵"` and `colorTheme="sage"` (success palette, same as Raspi)
- **D-03:** Card displays: now-playing track name + artist, zone count, speaker count, playback state icon (play/pause/stop)
- **D-04:** Card is clickable — navigates to `/sonos` page on click (same pattern as RaspiCard)
- **D-05:** Data fetched from 3 endpoints: `/api/sonos/health` (speaker count), `/api/sonos/zones` (zone list + coordinators), `/api/sonos/zones/{group_id}/playback` (now-playing for first active zone)
- **D-06:** Polling via `useAdaptivePolling` at 60s interval (matches all other device cards)
- **D-07:** Loading state shows `Skeleton.SonosCard` — add to Skeleton component registry
- **D-08:** Error state shows Banner variant="warning" with "Non raggiungibile" — same pattern as RaspiCard
- **D-09:** Stale state shows staleness banner when data exists but latest fetch failed

### /sonos page
- **D-10:** Orchestrator pattern — `useSonosFullData` hook fetches all zones + playback + volume data, page renders sections
- **D-11:** Page header: "Sonos" heading + back button to `/` (same as RaspiPage, using PageLayout)
- **D-12:** Zone list: one section per zone showing zone name, current track, playback controls (play/pause/stop/next/prev), play mode indicators
- **D-13:** Per-speaker volume sliders within each zone section — range input 0-100, showing speaker name + current volume
- **D-14:** Mute toggle per speaker (button, not separate slider)
- **D-15:** Transport commands call POST endpoints, volume/mute call PUT endpoints — all return 202, frontend polls after `suggested_poll_delay_s` (1s) to refresh state
- **D-16:** `useSonosCommands` hook handles all mutations (play/pause/stop/next/prev/setVolume/setMute) — same split as useLightsCommands
- **D-17:** No EQ, queue, home theater, sleep timer, or grouping UI in this phase — API routes exist but UI is deferred

### DashboardCards integration
- **D-18:** Add `sonos: SonosCard` to `CARD_COMPONENTS` registry in DashboardCards.tsx
- **D-19:** Add `sonos: Skeleton.SonosCard` to `CARD_SKELETONS` registry
- **D-20:** Add `sonos: { name: 'Sonos', icon: '🎵' }` to `DEVICE_META` registry
- **D-21:** Sonos already in `DEFAULT_DEVICE_ORDER` (last position) — no change needed

### Device registry integration
- **D-22:** `DEVICE_CONFIG.sonos` already exists in `deviceTypes.ts` with `enabled: true`, routes (`/sonos`, `/sonos/spotify`, `/sonos/zones`), and features (`hasPlayback`, `hasZones`, `hasSpotify`, `hasSearch`)
- **D-23:** Routes in DEVICE_CONFIG may need adjustment — `/sonos/spotify` and `/sonos/zones` sub-pages are NOT built in this phase; keep config as-is (routes are aspirational, nav only uses `main`)
- **D-24:** No changes to `deviceTypes.ts` needed — Sonos is already fully configured

### Navigation menu
- **D-25:** Sonos already appears in navigation via `DEVICE_CONFIG.sonos` — Navbar.tsx renders device sections dynamically from `navStructure.devices`
- **D-26:** No manual Navbar.tsx edits needed — the device registry drives navigation automatically
- **D-27:** Mobile bottom nav priority unchanged — Sonos is not in the quick actions (stove/thermostat/lights have priority)

### File organization
- **D-28:** New directory: `app/components/devices/sonos/` with SonosCard.tsx + hooks/ + components/ subdirectories
- **D-29:** Hooks: `useSonosData.ts` (dashboard card polling), `useSonosFullData.ts` (full page data), `useSonosCommands.ts` (mutations)
- **D-30:** Page: `app/sonos/page.tsx` — client component with orchestrator pattern
- **D-31:** Presentational sub-components in `app/components/devices/sonos/components/`: SonosZoneSection, SonosSpeakerVolume, SonosNowPlaying, SonosTransportControls

### Claude's Discretion
- Skeleton layout for Skeleton.SonosCard
- Exact spacing and layout within zone sections
- Whether to show album art placeholder or just text
- Volume slider styling (Tailwind range input vs custom)
- Transport button icon library (lucide-react icons)
- How to handle zones with no active playback (empty state per zone)

</decisions>

<specifics>
## Specific Ideas

- Card should show the "most interesting" zone — first zone with active playback, or first zone if all idle
- Volume slider should be debounced (200-300ms) to avoid flooding PUT requests while dragging
- Transport control buttons should use lucide-react icons (Play, Pause, Square for stop, SkipForward, SkipBack) — consistent with design system
- Zone names come from the Sonos system (e.g., "Living Room", "Kitchen") — display as-is
- Now-playing shows `track_name` + `artist` from `SonosPlaybackResponse`; if no track playing, show "Nessuna riproduzione"
- Speaker names come from `SonosDeviceResponse.name` — display next to volume slider

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sonos API specification
- `docs/api/sonos.md` — Complete 28-endpoint spec. Frontend uses: §Health (health response shape), §Discovery (devices, zones), §Monitoring (playback, volume), §Transport Controls (play/pause/stop/next/prev), §Volume Controls (speaker/zone volume, mute)

### Existing Sonos infrastructure (Phases 126-128)
- `lib/sonos/sonosProxy.ts` — All proxy wrappers (28 functions) available for direct import if needed
- `types/sonosProxy.ts` — All response/request TypeScript interfaces (SonosHealthResponse, SonosZoneResponse, SonosPlaybackResponse, SonosVolumeResponse, etc.)
- `app/api/sonos/` — 23 API route files, all operational

### Dashboard integration points
- `app/components/DashboardCards.tsx` — CARD_COMPONENTS, CARD_SKELETONS, DEVICE_META registries to extend
- `app/components/ui/Skeleton.tsx` — Add Skeleton.SonosCard sub-component
- `lib/devices/deviceTypes.ts` — DEVICE_CONFIG.sonos already configured (lines 154-173)

### Reference frontend implementations (follow these patterns)
- `app/components/devices/raspi/RaspiCard.tsx` — Simplest card pattern (SmartHomeCard + useSonosData + click-to-navigate)
- `app/components/devices/raspi/hooks/useRaspiData.ts` — Dashboard polling hook pattern (useAdaptivePolling + useVisibility)
- `app/components/devices/raspi/hooks/useRaspiFullData.ts` — Full page data hook pattern
- `app/raspi/page.tsx` — Page orchestrator pattern (PageLayout + back button + sections)
- `app/components/devices/lights/hooks/useLightsCommands.ts` — Command hook pattern for mutations
- `app/components/devices/lights/LightsCard.tsx` — Complex orchestrator with data + command hooks

### UI components
- `app/components/ui/SmartHomeCard.tsx` — Card wrapper component with colorTheme prop
- `app/components/ui/PageLayout.tsx` — Page layout with header slot
- `app/components/ui/Banner.tsx` — Warning/error banners
- `lib/hooks/useAdaptivePolling.ts` — Polling with visibility awareness
- `lib/hooks/useVisibility.ts` — Page Visibility API hook

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SmartHomeCard` component: Card wrapper with icon, title, colorTheme — direct reuse for SonosCard
- `useAdaptivePolling` + `useVisibility`: Polling infrastructure, 60s visible / 300s hidden — reuse for both hooks
- `PageLayout` + `PageLayout.Header`: Page structure with header slot — reuse for /sonos page
- `DeviceCardErrorBoundary`: Error isolation wrapper — already wraps all cards in DashboardCards.tsx
- `Skeleton` compound component: Extensible via static properties (Skeleton.SonosCard)
- `Banner` component: Warning/stale state display — reuse for error and staleness
- `HealthIndicator`: Health status dot — could show Sonos connectivity state

### Established Patterns
- Orchestrator pattern: hooks (state + effects) + presentational components (pure render)
- Dashboard card: SmartHomeCard wrapper → click navigates to dedicated page
- Data hooks: useState + useAdaptivePolling + fetch → return { data, loading, error, stale }
- Command hooks: accept data setters + router, return command functions that call fetch + refresh
- DashboardCards registries: CARD_COMPONENTS + CARD_SKELETONS + DEVICE_META — add entries for new device
- Skeleton sub-components: Skeleton.DeviceName = () => JSX, attached as static property

### Integration Points
- `DashboardCards.tsx` — Add sonos to 3 registries (components, skeletons, device meta)
- `Skeleton.tsx` — Add Skeleton.SonosCard static property
- `app/sonos/page.tsx` — New page file (Next.js App Router auto-route)
- `app/components/devices/sonos/` — New directory for card, hooks, sub-components
- No changes to deviceTypes.ts or Navbar.tsx — Sonos already configured in device registry

</code_context>

<deferred>
## Deferred Ideas

- Sonos EQ settings UI (bass/treble/loudness sliders) — future phase or backlog
- Queue management UI (view/reorder/clear) — future phase or backlog
- Home theater settings UI (night mode, dialog level, sub gain) — future phase or backlog
- Sleep timer UI — future phase or backlog
- Speaker grouping UI (join/unjoin) — future phase or backlog
- Spotify integration sub-page (`/sonos/spotify`) — future phase or backlog
- Zone detail sub-page (`/sonos/zones`) — future phase or backlog
- Album art display (requires image proxy or external URL) — future phase or backlog

</deferred>

---

*Phase: 129-sonos-frontend*
*Context gathered: 2026-03-24*
