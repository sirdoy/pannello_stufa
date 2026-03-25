# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications** — Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control** — Phases 6-10 (shipped 2026-01-28)
- ✅ **v3.0 Design System Evolution** — Phases 11-18 (shipped 2026-01-30)
- ✅ **v3.1 Design System Compliance** — Phases 19-24 (shipped 2026-02-02)
- ✅ **v3.2 Dashboard & Weather** — Phases 25-29 (shipped 2026-02-03)
- ✅ **v4.0 Advanced UI Components** — Phases 30-36 (shipped 2026-02-05)
- ✅ **v5.0 TypeScript Migration** — Phases 37-43 (shipped 2026-02-08)
- ✅ **v5.1 Tech Debt & Code Quality** — Phases 44-48 (shipped 2026-02-10)
- ✅ **v6.0 Operations, PWA & Analytics** — Phases 49-54 (shipped 2026-02-11)
- ✅ **v7.0 Performance & Resilience** — Phases 55-60 (shipped 2026-02-13)
- ✅ **v8.0 Fritz!Box Network Monitor** — Phases 61-67 (shipped 2026-02-16)
- ✅ **v8.1 Masonry Dashboard** — Phases 68-69 (shipped 2026-02-18)
- ✅ **v9.0 Performance Optimization** — Phases 70-74 (shipped 2026-02-19)
- ✅ **v10.0 Netatmo API Migration** — Phases 75-83 (shipped 2026-03-16)
- ✅ **v11.0 API Unification & Raspberry Pi Monitor** — Phases 84-91 (shipped 2026-03-18)
- ✅ **v11.1 Test Suite & Tech Debt Cleanup** — Phases 92-95 (shipped 2026-03-18)
- ✅ **v12.0 Data Fetching Simplification & E2E Verification** — Phases 96-98 (shipped 2026-03-19)
- ✅ **v13.0 Thermorossi Proxy Migration** — Phases 99-105 (shipped 2026-03-20)
- ✅ **v14.0 Hue Proxy Migration** — Phases 106-112 (shipped 2026-03-22)
- ✅ **v14.1 Tech Debt & Type Safety** — Phases 113-117 (shipped 2026-03-22)
- ✅ **v15.0 Rooms & Device Registry** — Phases 118-125 (shipped 2026-03-23)
- 🚧 **v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato** — Phases 126-137 (in progress)

## Phases

<details>
<summary>✅ v15.0 Rooms & Device Registry (Phases 118-125) — SHIPPED 2026-03-23</summary>

- [x] Phase 118: Registry Infrastructure (2/2 plans) — completed 2026-03-22
- [x] Phase 119: Rooms Infrastructure (2/2 plans) — completed 2026-03-23
- [x] Phase 120: Device Types UI (1/1 plan) — completed 2026-03-23
- [x] Phase 121: Device Registry UI (2/2 plans) — completed 2026-03-23
- [x] Phase 122: Room Management UI (2/2 plans) — completed 2026-03-23
- [x] Phase 123: Room Device Assignment (2/2 plans) — completed 2026-03-23
- [x] Phase 124: Room Status Views (1/1 plan) — completed 2026-03-23
- [x] Phase 125: Navigation Menu Links (1/1 plan) — completed 2026-03-23

</details>

<details>
<summary>✅ v14.1 Tech Debt & Type Safety (Phases 113-117) — SHIPPED 2026-03-22</summary>

- [x] Phase 113: Known Issues Fix (1/1 plan) — completed 2026-03-22
- [x] Phase 114: Type Safety lib/ (2/2 plans) — completed 2026-03-22
- [x] Phase 115: Type Safety app/ Components (2/2 plans) — completed 2026-03-22
- [x] Phase 116: Type Safety app/ Routes & Pages (2/2 plans) — completed 2026-03-22
- [x] Phase 117: Dead Code & Cleanup (2/2 plans) — completed 2026-03-22

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v14.0)</summary>

See `.planning/milestones/` for full archives.

</details>

### 🚧 v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato (In Progress)

**Milestone Goal:** Integrate Sonos and DIRIGERA as new providers, complete advanced Fritz!Box endpoints — bringing documented API coverage from 56% to ~95%.

- [x] **Phase 126: Sonos Infrastructure** - Proxy client, TypeScript types, discovery routes (health, devices, device detail, zones) (completed 2026-03-23)
- [x] **Phase 127: Sonos Transport Controls** - Playback state/control routes (play/pause/stop/next/prev), volume routes (get/set per speaker and zone), seek (completed 2026-03-24)
- [x] **Phase 128: Sonos Extended Controls** - EQ, play mode, queue, home theater, source switch, grouping, sleep timer, history routes (completed 2026-03-24)
- [x] **Phase 129: Sonos Frontend** - SonosCard dashboard card, /sonos page, device registry integration, navigation menu entry (completed 2026-03-24)
- [x] **Phase 130: DIRIGERA Infrastructure** - Proxy client, TypeScript types, health route, all sensor routes (contact, motion, summary) (completed 2026-03-24)
- [x] **Phase 131: DIRIGERA Frontend** - DirigeraCard dashboard card, /dirigera page, device registry integration, navigation menu entry (completed 2026-03-24)
- [x] **Phase 132: Fritz!Box System & Network Services** - System info, WiFi clients/networks, DHCP reservations, port forwarding, UPnP, mesh topology routes (completed 2026-03-25)
- [x] **Phase 133: Fritz!Box History & Budget** - Hourly/daily/auto bandwidth history routes, daily device count, budget stats route (completed 2026-03-25)
- [x] **Phase 134: Fritz!Box Frontend** - System info section, WiFi clients tab, network services section, history charts with toggle in /network page (completed 2026-03-25)
- [x] **Phase 135: Sonos Zone Extended UI** - Play mode toggles, sleep timer, queue viewer per zone in /sonos page (completed 2026-03-25)
- [ ] **Phase 136: Sonos Speaker Extended UI & History** - EQ sliders, home theater settings, source switch, grouping, history chart in /sonos page
- [ ] **Phase 137: Fritz!Box Extended Frontend** - WiFi networks, device count chart, budget stats, auto-granularity in /network page

## Phase Details

### Phase 126: Sonos Infrastructure
**Goal**: The application can discover and inspect the Sonos system via typed proxy API
**Depends on**: Phase 125 (existing shared haGet/haPost transport)
**Requirements**: SONOS-01, SONOS-02, SONOS-03, SONOS-04, SONOS-05, SONOS-06
**Success Criteria** (what must be TRUE):
  1. sonosProxy.ts function module exists with typed wrappers using haGet transport and X-API-Key auth
  2. All Sonos TypeScript interfaces are defined (health, device, zone, playback, volume, EQ, queue, history)
  3. GET /api/sonos/health returns speaker connectivity, data freshness, device count
  4. GET /api/sonos/devices and /api/sonos/devices/{uid} return speaker list and individual speaker detail
  5. GET /api/sonos/zones returns zone groups with coordinator and members
**Plans**: 2 plans

Plans:
- [x] 126-01-PLAN.md — Sonos TypeScript types + sonosProxy.ts function module + unit tests
- [x] 126-02-PLAN.md — 4 Sonos API routes (health, devices, devices/[uid], zones)

### Phase 127: Sonos Transport Controls
**Goal**: Users can control Sonos playback and volume from the application
**Depends on**: Phase 126
**Requirements**: SONOS-07, SONOS-08, SONOS-09, SONOS-10, SONOS-11, SONOS-12, SONOS-13, SONOS-14, SONOS-15, SONOS-16, SONOS-17
**Success Criteria** (what must be TRUE):
  1. GET /api/sonos/zones/{group_id}/playback returns current playback state for a zone
  2. GET /api/sonos/speakers/{uid}/volume returns volume and mute state for a speaker
  3. POST routes for play/pause/stop/next/previous return 202 Accepted with suggested_poll_delay_s
  4. PUT /api/sonos/speakers/{uid}/volume and PUT /api/sonos/zones/{group_id}/volume set volume (0-100)
  5. PUT /api/sonos/zones/{group_id}/seek positions the track at the given HH:MM:SS timestamp
**Plans**: 2 plans

Plans:
- [x] 127-01-PLAN.md — Proxy command wrappers (11 functions) + unit tests
- [x] 127-02-PLAN.md — 10 API route files (8 zone + 2 speaker)

### Phase 128: Sonos Extended Controls
**Goal**: Users can access EQ, play modes, queue, home theater, grouping, sleep timer, and history for Sonos
**Depends on**: Phase 127
**Requirements**: SONOS-18, SONOS-19, SONOS-20, SONOS-21, SONOS-22, SONOS-23, SONOS-24, SONOS-25, SONOS-26, SONOS-27, SONOS-28, SONOS-29, SONOS-30
**Success Criteria** (what must be TRUE):
  1. EQ routes (GET/PUT /api/sonos/speakers/{uid}/eq) return and accept bass, treble, loudness settings
  2. Play mode routes (GET/PUT /api/sonos/zones/{group_id}/play-mode) return and set shuffle/repeat/crossfade
  3. GET /api/sonos/zones/{group_id}/queue returns paginated playback queue
  4. Home theater routes (GET/PUT), source switch (POST), and grouping routes (join/unjoin) are reachable and return 202 Accepted for mutations
  5. Sleep timer routes (GET/PUT) and GET /api/sonos/history with auto-granularity are reachable
**Plans**: 2 plans

Plans:
- [x] 128-01-PLAN.md — Proxy wrappers (12 functions) + unit tests for extended controls
- [x] 128-02-PLAN.md — 9 API route files (5 speaker + 3 zone + 1 history)

### Phase 129: Sonos Frontend
**Goal**: Sonos is visible on the dashboard and has a dedicated control page accessible from the navigation menu
**Depends on**: Phase 128
**Requirements**: SONOS-31, SONOS-32, SONOS-33, SONOS-34
**Success Criteria** (what must be TRUE):
  1. SonosCard appears on the dashboard showing now-playing track, zone status, and speaker count
  2. /sonos page lists all zones with playback controls and per-speaker volume sliders
  3. Sonos speakers can be registered in the Device Registry (DIRIGERA provider type available)
  4. Navigation menu has a Sonos entry that routes to /sonos
**Plans**: 2 plans

Plans:
- [x] 129-01-PLAN.md — SonosCard dashboard card + useSonosData hook + Skeleton + DashboardCards registries
- [x] 129-02-PLAN.md — /sonos page + useSonosFullData + useSonosCommands + zone sub-components

### Phase 130: DIRIGERA Infrastructure
**Goal**: The application can query DIRIGERA hub health and enumerate all sensors via typed proxy API
**Depends on**: Phase 125 (existing shared transport)
**Requirements**: DIRIG-01, DIRIG-02, DIRIG-03, DIRIG-04, DIRIG-05, DIRIG-06, DIRIG-07
**Success Criteria** (what must be TRUE):
  1. dirigeraProxy.ts function module exists with typed wrappers using haGet transport and X-API-Key auth
  2. All DIRIGERA TypeScript interfaces are defined (health, sensor, contact, motion, summary)
  3. GET /api/dirigera/health returns hub connection status, firmware, and connected sensor count
  4. GET /api/dirigera/sensors returns all sensors; /sensors/contact and /sensors/motion return filtered subsets with data_freshness
  5. GET /api/dirigera/sensors/summary returns fleet totals (total, open, offline, low battery)
**Plans**: 2 plans

Plans:
- [x] 130-01-PLAN.md — DIRIGERA TypeScript types + dirigeraProxy.ts function module + unit tests
- [x] 130-02-PLAN.md — 5 DIRIGERA API routes (health, sensors, sensors/contact, sensors/motion, sensors/summary)

### Phase 131: DIRIGERA Frontend
**Goal**: Sensor status is visible on the dashboard and has a dedicated page accessible from the navigation menu
**Depends on**: Phase 130
**Requirements**: DIRIG-08, DIRIG-09, DIRIG-10, DIRIG-11
**Success Criteria** (what must be TRUE):
  1. DirigeraCard appears on the dashboard showing sensor summary (total, open contacts, offline, low battery counts)
  2. /dirigera page lists all sensors with real-time state and a filter control for contact vs. motion type
  3. DIRIGERA sensors can be registered in the Device Registry
  4. Navigation menu has a DIRIGERA entry that routes to /dirigera
**Plans**: 2 plans

Plans:
- [x] 131-01-PLAN.md — DirigeraCard dashboard card + device registry + Skeleton + DashboardCards integration
- [x] 131-02-PLAN.md — /dirigera page + useDirigeraFullData hook + sensor list sub-components

### Phase 132: Fritz!Box System & Network Services
**Goal**: The application exposes Fritz!Box system info, WiFi client data, and network service details via new API routes
**Depends on**: Phase 125 (existing Fritz!Box infrastructure at phases 61-67)
**Requirements**: FRITZ-01, FRITZ-02, FRITZ-03, FRITZ-04, FRITZ-05, FRITZ-06, FRITZ-07
**Success Criteria** (what must be TRUE):
  1. GET /api/fritzbox/system returns router model, firmware version, uptime, and CPU load
  2. GET /api/fritzbox/wifi/clients returns WiFi clients with signal strength, band, and connection speed (filterable by band)
  3. GET /api/fritzbox/wifi/networks returns configured WiFi networks with enabled/disabled status
  4. GET /api/fritzbox/network/dhcp/reservations and /network/port-forwarding return static leases and active port rules
  5. GET /api/fritzbox/network/upnp and /network/mesh return UPnP port mappings and mesh node topology
**Plans**: 2 plans

Plans:
- [x] 132-01-PLAN.md — 7 client methods + inline types + unit tests + system/wifi routes
- [x] 132-02-PLAN.md — DHCP reservations + port forwarding + UPnP + mesh routes

### Phase 133: Fritz!Box History & Budget
**Goal**: The application can retrieve multi-resolution bandwidth history and data budget statistics from Fritz!Box
**Depends on**: Phase 132
**Requirements**: FRITZ-08, FRITZ-09, FRITZ-10, FRITZ-11, FRITZ-12
**Success Criteria** (what must be TRUE):
  1. GET /api/fritzbox/history/bandwidth/hourly returns bandwidth aggregated by hour
  2. GET /api/fritzbox/history/bandwidth/daily returns bandwidth aggregated by day
  3. GET /api/fritzbox/history/devices/daily returns daily device count history
  4. GET /api/fritzbox/history/bandwidth/auto switches granularity automatically (hour vs. day) based on time range
  5. GET /api/fritzbox/budget-stats returns data budget consumption statistics
**Plans**: 2 plans

Plans:
- [x] 133-01-PLAN.md — 5 client methods + interfaces + 3 bandwidth history routes + tests
- [x] 133-02-PLAN.md — Devices/daily route + budget-stats route + tests

### Phase 134: Fritz!Box Frontend
**Goal**: The /network page displays Fritz!Box system info, WiFi clients, network services, and multi-resolution bandwidth charts
**Depends on**: Phase 133
**Requirements**: FRITZ-13, FRITZ-14, FRITZ-15, FRITZ-16
**Success Criteria** (what must be TRUE):
  1. /network page shows a system info section with router model, firmware version, and uptime
  2. /network page has a WiFi clients tab listing connected devices with signal strength bars and band labels
  3. /network page shows a network services section with DHCP reservations, port forwarding rules, UPnP mappings, and mesh topology
  4. /network page bandwidth charts have a hourly/daily toggle that switches the displayed history tier
**Plans**: 2 plans

Plans:
- [x] 134-01-PLAN.md — Hooks (4) + components (3) + utility + tests
- [x] 134-02-PLAN.md — HistoryTierToggle + BandwidthChart tier integration + page.tsx orchestrator with tabs

### Phase 135: Sonos Zone Extended UI
**Goal**: The /sonos page shows play mode controls, sleep timer, and queue viewer for each zone
**Depends on**: Phase 129 (existing /sonos page with transport + volume)
**Requirements**: SONOS-35, SONOS-36, SONOS-37
**Success Criteria** (what must be TRUE):
  1. Each zone section in /sonos shows shuffle/repeat/crossfade toggle buttons reflecting current play mode state
  2. Each zone section shows the remaining sleep timer and has set/cancel controls
  3. Each zone section has an expandable queue viewer showing paginated track list (title, artist, duration)
  4. Play mode and sleep timer mutations return 202 and trigger data refresh
  5. Queue supports limit/offset pagination with load-more or scroll
**Plans**: 2 plans

Plans:
- [x] 135-01-PLAN.md — Extend hooks (useSonosFullData + useSonosCommands + new useSonosQueue) with play-mode, sleep-timer, queue support
- [x] 135-02-PLAN.md — 3 presentational components (PlayModeControls, SleepTimer, QueueViewer) + zone section wiring + page orchestrator

### Phase 136: Sonos Speaker Extended UI & History
**Goal**: The /sonos page shows per-speaker EQ/home theater/source/grouping controls and a global history chart
**Depends on**: Phase 135
**Requirements**: SONOS-38, SONOS-39, SONOS-40, SONOS-41, SONOS-42
**Success Criteria** (what must be TRUE):
  1. Each speaker in a zone has expandable EQ controls (bass/treble sliders -10 to +10, loudness toggle)
  2. Speakers identified as soundbars show home theater settings (night mode, speech enhance, sub, surround toggles)
  3. Each speaker has a source switch button (TV/line-in) visible when applicable
  4. Each speaker has join/unjoin group controls allowing dynamic zone re-grouping
  5. /sonos page has a history section with a chart showing volume or playback events, type selector, and time range picker
**Plans**: 2 plans

Plans:
- [ ] 136-01-PLAN.md — Extend hooks (useSonosCommands + useSonosFullData + useSonosHistory) + 5 new presentational components + tests
- [ ] 136-02-PLAN.md — Wire components into SonosSpeakerVolume, SonosZoneSection, page.tsx + history section

### Phase 137: Fritz!Box Extended Frontend
**Goal**: The /network page shows WiFi networks, device count history, budget statistics, and auto-granularity
**Depends on**: Phase 134 (existing /network page with system info, WiFi clients, network services, tier toggle)
**Requirements**: FRITZ-17, FRITZ-18, FRITZ-19, FRITZ-20
**Success Criteria** (what must be TRUE):
  1. /network WiFi tab (or new sub-tab) shows configured WiFi networks with SSID, band, enabled/disabled status badge
  2. /network page has a device count chart showing daily connected device counts over time
  3. /network page has a budget stats card showing data consumption, utilization percentage with progress bar, and ok/warning/danger status
  4. Bandwidth chart supports auto-granularity mode that automatically selects hourly or daily resolution based on time range

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-117 | v1.0-v14.1 | 407/407 | Complete | 2026-03-22 |
| 118-125 | v15.0 | 13/13 | Complete | 2026-03-23 |
| 126 | v16.0 | 2/2 | Complete    | 2026-03-23 |
| 127 | v16.0 | 2/2 | Complete    | 2026-03-24 |
| 128 | v16.0 | 2/2 | Complete    | 2026-03-24 |
| 129 | v16.0 | 2/2 | Complete    | 2026-03-24 |
| 130 | v16.0 | 2/2 | Complete    | 2026-03-24 |
| 131 | v16.0 | 2/2 | Complete    | 2026-03-24 |
| 132 | v16.0 | 2/2 | Complete    | 2026-03-25 |
| 133 | v16.0 | 2/2 | Complete    | 2026-03-25 |
| 134 | v16.0 | 2/2 | Complete    | 2026-03-25 |
| 135 | v16.0 | 2/2 | Complete    | 2026-03-25 |
| 136 | v16.0 | 0/0 | Planned     | — |
| 137 | v16.0 | 0/0 | Planned     | — |

**Total:** 21 milestones shipped, 125 phases complete, 420 plans executed. v16.0 in progress (12 phases, 9 complete + 3 planned).

---

*Roadmap updated: 2026-03-25 — Phase 135 planned (2 plans in 2 waves)*
