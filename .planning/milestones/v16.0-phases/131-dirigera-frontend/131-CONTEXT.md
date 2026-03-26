# Phase 131: DIRIGERA Frontend - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Build the DIRIGERA frontend: DirigeraCard dashboard card showing sensor summary, /dirigera page listing all sensors with real-time state and type filter, device registry integration, and navigation menu entry. All 5 API routes from Phase 130 are available (health, sensors, sensors/contact, sensors/motion, sensors/summary). No new API routes needed. DIRIGERA is read-only — no command hooks needed (unlike Sonos).

</domain>

<decisions>
## Implementation Decisions

### Dashboard card (DirigeraCard)
- **D-01:** Orchestrator pattern — `useDirigeraData` hook handles polling + state, `DirigeraCard` renders UI. Matches RaspiCard pattern (simplest — read-only, no commands).
- **D-02:** Card uses `SmartHomeCard` with `icon="🔌"` and `colorTheme="info"` (teal/blue palette — consistent with info devices like Network/Thermostat)
- **D-03:** Card displays: total sensors count, open contacts count, offline sensors count, low battery count — all from `/api/dirigera/sensors/summary`
- **D-04:** Card is clickable — navigates to `/dirigera` page on click (same pattern as RaspiCard)
- **D-05:** Data fetched from 2 endpoints: `/api/dirigera/health` (hub status), `/api/dirigera/sensors/summary` (fleet totals)
- **D-06:** Polling via `useAdaptivePolling` at 60s interval (matches all other device cards)
- **D-07:** Loading state shows `Skeleton.DirigeraCard` — add to Skeleton component registry
- **D-08:** Error state shows Banner variant="warning" with "Non raggiungibile" — same pattern as RaspiCard
- **D-09:** Stale state shows staleness banner when data exists but latest fetch failed
- **D-10:** Health computed from summary: error if offline_count > 0, warning if low_battery_count > 0, ok otherwise

### /dirigera page
- **D-11:** Orchestrator pattern — `useDirigeraFullData` hook fetches health + all sensors, page renders sections
- **D-12:** Page header: "DIRIGERA" heading + back button to `/` (same as RaspiPage, using PageLayout)
- **D-13:** Hub health section at top: firmware version, connected sensors count, hub reachable status
- **D-14:** Sensor list below health — each sensor shows: custom_name, room, type (contact/motion), battery_percentage, data_freshness badge, and type-specific state (is_open for contact, light_level for motion)
- **D-15:** Filter control: toggle between "Tutti" (all sensors), "Contatti" (contact only via `/api/dirigera/sensors/contact`), "Movimento" (motion only via `/api/dirigera/sensors/motion`) — three-button segmented control
- **D-16:** No command hooks needed — DIRIGERA is read-only (haGet only, per Phase 130 D-02)
- **D-17:** data_freshness badge colors: LIVE = green, STALE = amber, UNREACHABLE = red (per 3-state model from Phase 130 D-07/D-08)
- **D-18:** Battery percentage shows warning icon below 20% threshold
- **D-19:** Sensor list sorted by room name, then custom_name (alphabetical, Italian locale)

### DashboardCards integration
- **D-20:** Add `dirigera: DirigeraCard` to `CARD_COMPONENTS` registry in DashboardCards.tsx
- **D-21:** Add `dirigera: Skeleton.DirigeraCard` to `CARD_SKELETONS` registry
- **D-22:** Add `dirigera: { name: 'DIRIGERA', icon: '🔌' }` to `DEVICE_META` registry

### Device registry integration
- **D-23:** Add `'dirigera'` to `DeviceTypeId` union in deviceTypes.ts
- **D-24:** Add `DIRIGERA: 'dirigera'` to `DEVICE_TYPES` constant
- **D-25:** Add DEVICE_CONFIG entry: id='dirigera', name='DIRIGERA', icon='🔌', color='info', enabled=true, routes={ main: '/dirigera' }, features={ hasSensors: true } — add `hasSensors` to `DeviceFeatures` interface
- **D-26:** Add `'dirigera'` to `DEFAULT_DEVICE_ORDER` array (after 'sonos', last position)

### Navigation menu
- **D-27:** Navigation is automatically derived from DEVICE_CONFIG — once DIRIGERA is added, Navbar includes it automatically
- **D-28:** No manual Navbar.tsx edits needed — the device registry drives navigation
- **D-29:** Mobile bottom nav priority unchanged — DIRIGERA is not in quick actions

### File organization
- **D-30:** New directory: `app/components/devices/dirigera/` with DirigeraCard.tsx + hooks/ + components/ subdirectories
- **D-31:** Hooks: `useDirigeraData.ts` (dashboard card polling), `useDirigeraFullData.ts` (full page data)
- **D-32:** No command hook needed (read-only provider — simpler than Sonos)
- **D-33:** Page: `app/dirigera/page.tsx` — client component with orchestrator pattern
- **D-34:** Presentational sub-components in `app/components/devices/dirigera/components/`: DirigeraStats (card stats grid), DirigeraSensorList (sensor rows), DirigeraSensorRow (individual sensor), DirigeraHealthSection (hub info)

### Claude's Discretion
- Skeleton layout for Skeleton.DirigeraCard (2x2 grid matching 4 stats, or simpler)
- Exact spacing and layout within sensor list rows
- Whether sensor rows use cards or a table-like layout
- Filter segmented control styling (Tailwind)
- Battery warning icon choice (lucide-react)
- How to render light_level for motion sensors (lux value, bar, or descriptive)

</decisions>

<specifics>
## Specific Ideas

- Card should show the 4 key numbers from sensor summary in a clean 2x2 grid: total sensors, open contacts, offline, low battery — matching the 4-stat layout of RaspiCard (CPU/RAM/Disk/Temp)
- Sensor custom_name uses IKEA product names (e.g., "MYGGBETT Ingresso") — display as-is
- Motion sensors have `is_open: null` — don't show open/close state for motion type, show light_level instead
- Contact sensors show door/window icon based on is_open state (open = 🚪 or closed = 🔒)
- Italian labels: "Sensori totali", "Contatti aperti", "Offline", "Batteria bassa"
- Hub unreachable → entire card shows error state (not individual sensor states)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### DIRIGERA API specification
- `docs/api/dirigera.md` — Complete 8-endpoint specification. Phase 131 uses: §Health (hub status), §Sensors (all sensors), §Contact Sensors (filtered), §Motion Sensors (filtered), §Summary (fleet totals). Response shapes define what the frontend displays.

### Existing DIRIGERA infrastructure (Phase 130)
- `lib/dirigera/dirigeraProxy.ts` — 5 proxy functions: getHealth, getSensors, getContactSensors, getMotionSensors, getSensorSummary
- `types/dirigeraProxy.ts` — All TypeScript interfaces: DirigeraHealthResponse, DirigeraSensor, ContactSensor, MotionSensor, SensorSummaryResponse, DirigeraDataFreshness

### Dashboard integration points
- `app/components/DashboardCards.tsx` — CARD_COMPONENTS, CARD_SKELETONS, DEVICE_META registries to extend
- `app/components/ui/Skeleton.tsx` — Add Skeleton.DirigeraCard sub-component
- `lib/devices/deviceTypes.ts` — Add 'dirigera' to DeviceTypeId, DEVICE_TYPES, DEVICE_CONFIG, DEFAULT_DEVICE_ORDER

### Reference frontend implementations (follow these patterns)
- `app/components/devices/raspi/RaspiCard.tsx` — Simplest card pattern (SmartHomeCard + hook + click-to-navigate, read-only)
- `app/components/devices/raspi/hooks/useRaspiData.ts` — Dashboard polling hook (useAdaptivePolling + useVisibility, 60s/300s)
- `app/components/devices/raspi/hooks/useRaspiFullData.ts` — Full page data hook
- `app/components/devices/raspi/components/RaspiStats.tsx` — Stats grid layout (2x2 metrics)
- `app/raspi/page.tsx` — Page orchestrator (PageLayout + back button + sections)

### UI components
- `app/components/ui/SmartHomeCard.tsx` — Card wrapper with colorTheme and health props
- `app/components/ui/PageLayout.tsx` — Page layout with header slot
- `app/components/ui/Banner.tsx` — Warning/error/stale banners
- `lib/hooks/useAdaptivePolling.ts` — Polling with visibility awareness
- `lib/hooks/useVisibility.ts` — Page Visibility API hook

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SmartHomeCard` component: Card wrapper with icon, title, colorTheme, health — direct reuse for DirigeraCard
- `useAdaptivePolling` + `useVisibility`: Polling infrastructure (60s visible / 300s hidden) — reuse for both hooks
- `PageLayout` + `PageLayout.Header`: Page structure with header slot — reuse for /dirigera page
- `DeviceCardErrorBoundary`: Error isolation wrapper — already wraps all cards in DashboardCards.tsx
- `Skeleton` compound component: Extensible via static properties (Skeleton.DirigeraCard)
- `Banner` component: Warning/stale state display — reuse for error and staleness
- `HealthIndicator`: Health status dot — could show hub connectivity

### Established Patterns
- Orchestrator pattern: hooks (state + effects) + presentational components (pure render)
- Dashboard card: SmartHomeCard wrapper → click navigates to dedicated page
- Data hooks: useState + useAdaptivePolling + fetch → return { data, loading, error, stale, health }
- DashboardCards registries: CARD_COMPONENTS + CARD_SKELETONS + DEVICE_META — add entries for new device
- Skeleton sub-components: Skeleton.DeviceName = () => JSX, attached as static property
- Device registry: DeviceTypeId union + DEVICE_TYPES + DEVICE_CONFIG + DEFAULT_DEVICE_ORDER — drives nav automatically

### Integration Points
- `DashboardCards.tsx` — Add dirigera to 3 registries (components, skeletons, device meta)
- `Skeleton.tsx` — Add Skeleton.DirigeraCard static property
- `deviceTypes.ts` — Add dirigera to DeviceTypeId, DEVICE_TYPES, DEVICE_CONFIG, DEFAULT_DEVICE_ORDER, hasSensors to DeviceFeatures
- `app/dirigera/page.tsx` — New page file (Next.js App Router auto-route)
- `app/components/devices/dirigera/` — New directory for card, hooks, sub-components
- No changes to Navbar.tsx — navigation derived automatically from DEVICE_CONFIG

</code_context>

<deferred>
## Deferred Ideas

- Sensor event history page (GET /dirigera/history) — future phase when DIRIG-F01 route exists
- Aggregation/retention stats display — future phase when DIRIG-F02 route exists
- Sensor telemetry charts (battery trends, light level over time) — future phase when DIRIG-F03 route exists
- Sensor push notifications (offline/low battery alerts) — backlog
- Room-grouped sensor view (group sensors by room instead of flat list) — backlog

</deferred>

---

*Phase: 131-dirigera-frontend*
*Context gathered: 2026-03-24*
