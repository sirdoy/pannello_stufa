# Phase 124: Room Status Views - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Per-room aggregated device status, whole-house status overview, and rooms health stats — all on a single new page. The API endpoints already exist from Phase 119: GET /rooms/{room_id}/status, GET /rooms/house/status, and GET /rooms/health. Room CRUD (Phase 122) and device assignment (Phase 123) are complete. This phase adds read-only status visualization only — no mutations.

</domain>

<decisions>
## Implementation Decisions

### Page location & navigation
- **D-01:** New page at `app/rooms/status/page.tsx` — `/rooms/status` route (whole-house view with per-room drill-down)
- **D-02:** Back button navigates to `/rooms` (rooms management page) — natural parent
- **D-03:** Page uses `SettingsLayout` with standard pattern: back button, Heading "Stato stanze", Text description — identical to Phase 120/121/122/123 pages
- **D-04:** Single page for both RSTAT-01 and RSTAT-02: whole-house overview at top, then per-room cards below — no separate per-room status page (the data is already in HouseStatusResponse)
- **D-05:** Add "Stato" navigation button on the rooms list page (`app/rooms/page.tsx`) in the toolbar area (next to "Crea stanza") linking to `/rooms/status`

### Whole-house overview
- **D-06:** Top section shows summary stats from HouseStatusResponse: total_devices, total_available, total_unavailable — three stat values inline (same pattern as health stats in Phase 121/122)
- **D-07:** Health stats from GET /rooms/health shown alongside: room_count, total_device_count, orphan_device_count — satisfies RSTAT-03
- **D-08:** Stats displayed in a single row of labeled values inside the Card header area

### Per-room cards layout
- **D-09:** Each room rendered as a Card (variant="glass") below the stats — one card per room from HouseStatusResponse.rooms[]
- **D-10:** Card header shows: room_name (Heading), device_count, and available/unavailable summary as Badges (green for available, red/ember for unavailable)
- **D-11:** Sort rooms by room_name using Italian locale (consistent with Phase 122)
- **D-12:** Inside each card: list devices as rows (not a DataTable — simpler since no sorting/actions needed), showing custom_name, provider Badge, device_type, and status indicator

### Device status display
- **D-13:** Status indicator: green dot/Badge "Disponibile" for status="available", red dot/Badge "Non disponibile" for status="unavailable"
- **D-14:** Provider column uses Badge with same variant mapping as Phase 121/123 (hue->ocean, netatmo/thermorossi->ember, others->neutral)
- **D-15:** Device type shown as mono text (same as Phase 123 device list)
- **D-16:** DeviceStatus.data field: show key metrics inline as secondary text. Per provider type:
  - Light: on/off state + brightness if available
  - Sensor: temperature + humidity if available
  - Thermostat: measured_temp + setpoint_temp + heating state
  - Speaker: playing state + volume
  - Stove: active state + temperature + power level
  - Camera: reachable state
- **D-17:** When data is null (unavailable device): show only "Non disponibile" — no data row

### Data fetching
- **D-18:** Create `useHouseStatus` hook inline — fetches GET `/api/rooms/house/status`, returns `{ houseStatus: HouseStatusResponse | null, loading, error, refetch }`
- **D-19:** Reuse `useRoomsHealth` pattern from Phase 122 for health stats — fetch GET `/api/rooms/health`, non-critical (errors silently ignored)
- **D-20:** No polling — status page shows snapshot on load. User can manually refresh via a "Aggiorna" button in the toolbar
- **D-21:** Single API call (house/status) fetches all rooms + devices + status — no per-room calls needed

### Error & loading states
- **D-22:** Loading state: Skeleton placeholder matching card grid shape
- **D-23:** Error state (house status fetch): Banner variant="error" with message
- **D-24:** Empty state (no rooms): centered message "Nessuna stanza configurata" with link to /rooms
- **D-25:** Empty room (room has 0 devices): card shows "Nessun dispositivo assegnato" — still rendered in the list

### Claude's Discretion
- Exact card spacing and responsive grid (1 col mobile, 2 col desktop)
- Device row layout within cards (flex vs grid)
- Status dot implementation (CSS dot vs Badge vs icon)
- Whether to show last_seen/timestamp data
- Exact data formatting for metrics (temperature units, percentage display)

</decisions>

<specifics>
## Specific Ideas

- Italian language for all UI labels: "Stato stanze", "Disponibile", "Non disponibile", "Aggiorna", "Nessuna stanza configurata"
- The HouseStatusResponse gives everything in one call — use it as the single data source (no need for per-room status calls)
- Keep it read-only and simple: this is a monitoring/overview page, not a control page
- Follow docs/api/rooms.md "Frontend Component Suggestions" for Status & Health: CardGrid + StatusBadge + StatCards pattern
- Provider-specific data rendering should be concise (one-line per metric), not verbose

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Status & Health API contract
- `docs/api/rooms.md` §Status & Health — GET /rooms/house/status (HouseStatusResponse), GET /rooms/{room_id}/status (RoomStatusResponse), GET /rooms/health (RoomsHealthResponse): response shapes, error codes (404 room not found, 503 not initialized)
- `docs/api/rooms.md` §TypeScript Interfaces — DeviceStatus, RoomStatusResponse, HouseStatusResponse, RoomsHealthResponse, and all 6 provider-specific status interfaces (LightStatus, SensorStatus, ThermostatStatus, SpeakerStatus, StoveStatus, CameraStatus)
- `docs/api/rooms.md` §Frontend Component Suggestions — CardGrid + StatusBadge + StatCards recommendations

### Existing API layer (Phase 119)
- `app/api/rooms/house/status/route.ts` — GET whole-house status proxy route
- `app/api/rooms/[room_id]/status/route.ts` — GET per-room status proxy route
- `app/api/rooms/health/route.ts` — GET health stats proxy route

### Type definitions
- `types/rooms.ts` — DeviceStatus, RoomStatusResponse, HouseStatusResponse, RoomsHealthResponse, LightStatus, SensorStatus, ThermostatStatus, SpeakerStatus, StoveStatus, CameraStatus

### UI component patterns (reference implementations)
- `app/rooms/page.tsx` — Phase 122 Rooms page: useRoomsHealth pattern, health stats inline, SettingsLayout — MODIFY to add "Stato" navigation button
- `app/rooms/[room_id]/page.tsx` — Phase 123 Room detail page: getProviderBadgeVariant helper, Badge variant mapping
- `app/components/ui/Card.tsx` — Card component for room cards
- `app/components/ui/Badge.tsx` — Provider/status distinction
- `app/components/ui/Banner.tsx` — Persistent error state
- `app/components/ui/Skeleton.tsx` — Loading placeholder
- `app/components/ui/SettingsLayout.tsx` — Page layout with back button and heading
- `app/components/ui/Button.tsx` — Refresh button

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SettingsLayout` component: page chrome with back button and title
- `Card` component (variant="glass"): room card container
- `Badge` component: provider distinction (ocean/ember/neutral) + status indication
- `Banner` component: persistent error display
- `Skeleton` component: loading placeholder
- `Button` component: "Aggiorna" refresh and "Stato" navigation
- `useToast` hook: transient feedback (not heavily needed here — read-only page)
- `getProviderBadgeVariant` helper in room detail page — can be extracted or duplicated
- `DeviceStatus`, `RoomStatusResponse`, `HouseStatusResponse` types already in `types/rooms.ts`
- `useRoomsHealth` pattern from `app/rooms/page.tsx` — reuse for health stats

### Established Patterns
- Client pages use `fetch()` to call Next.js API routes
- Hook pattern: `useState` + `useCallback` + `useEffect` for fetch-on-mount with refetch
- Health stats: inline in Card header, non-critical (errors silently ignored)
- `'use client'` directive on all interactive pages
- Italian locale for sorting: `.localeCompare(b.name, 'it')`
- Badge variant mapping: hue->ocean, netatmo/thermorossi->ember, others->neutral

### Integration Points
- `app/rooms/status/page.tsx` — NEW page file (new directory under existing `app/rooms/`)
- `app/rooms/page.tsx` — MODIFY to add "Stato" navigation button in toolbar
- Fetches from existing API routes: GET `/api/rooms/house/status`, GET `/api/rooms/health`
- Imports types from `types/rooms.ts` (HouseStatusResponse, RoomStatusResponse, DeviceStatus, RoomsHealthResponse, all provider status types)

</code_context>

<deferred>
## Deferred Ideas

- Real-time WebSocket updates for live status — explicitly out of scope per REQUIREMENTS.md
- Room floor plan / visual layout — explicitly out of scope per REQUIREMENTS.md
- Device control actions from status view (toggle lights, change thermostat) — separate milestone
- Historical status / uptime tracking — future enhancement
- Status notifications / alerts when devices go offline — separate feature

</deferred>

---

*Phase: 124-room-status-views*
*Context gathered: 2026-03-23*
