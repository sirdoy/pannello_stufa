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
- ✅ **v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato** — Phases 126-138 (shipped 2026-03-26)
- 🚧 **v17.0 WebSocket Real-Time Transport** — Phases 139-144 (in progress)

## Phases

<details>
<summary>✅ v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato (Phases 126-138) — SHIPPED 2026-03-26</summary>

- [x] Phase 126: Sonos Infrastructure (2/2 plans) — completed 2026-03-23
- [x] Phase 127: Sonos Transport Controls (2/2 plans) — completed 2026-03-24
- [x] Phase 128: Sonos Extended Controls (2/2 plans) — completed 2026-03-24
- [x] Phase 129: Sonos Frontend (2/2 plans) — completed 2026-03-24
- [x] Phase 130: DIRIGERA Infrastructure (2/2 plans) — completed 2026-03-24
- [x] Phase 131: DIRIGERA Frontend (2/2 plans) — completed 2026-03-24
- [x] Phase 132: Fritz!Box System & Network Services (2/2 plans) — completed 2026-03-25
- [x] Phase 133: Fritz!Box History & Budget (2/2 plans) — completed 2026-03-25
- [x] Phase 134: Fritz!Box Frontend (2/2 plans) — completed 2026-03-25
- [x] Phase 135: Sonos Zone Extended UI (2/2 plans) — completed 2026-03-25
- [x] Phase 136: Sonos Speaker Extended UI & History (2/2 plans) — completed 2026-03-25
- [x] Phase 137: Fritz!Box Extended Frontend (2/2 plans) — completed 2026-03-26
- [x] Phase 138: Sonos Frontend Wiring (2/2 plans) — completed 2026-03-26

</details>

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
<summary>✅ Earlier milestones — v1.0 through v14.1 (Phases 1-117) — all shipped</summary>

See git history for details.

</details>

### 🚧 v17.0 WebSocket Real-Time Transport (In Progress)

**Milestone Goal:** Tutte le card del dashboard ricevono dati live via WebSocket con fallback automatico a polling HTTP — senza alcuna modifica all'UX esistente.

- [x] **Phase 139: WebSocket Infrastructure** - Shared connection manager, TypeScript types, auth, reconnect, topic dispatch (completed 2026-03-26)
- [x] **Phase 140: Stove Migration** - useStoveData migrated to WS primary channel with alwaysActive fallback preserved (completed 2026-03-27)
- [x] **Phase 141: Fritz!Box & Hue Migration** - useNetworkData and useLightsData migrated to WS with buffer/history preservation (completed 2026-03-27)
- [x] **Phase 142: Sonos & DIRIGERA Migration** - useSonosData and useDirigeraData migrated to WS (completed 2026-03-27)
- [ ] **Phase 143: Netatmo Migration** - useThermostatData migrated to WS with raw payload adapter layer
- [ ] **Phase 144: Connection UX** - Visual connection status indicator, flicker-free transitions, per-card timestamps

## Phase Details

### Phase 139: WebSocket Infrastructure
**Goal**: A single shared WebSocket connection to `/ws/live` is available app-wide, handles auth, reconnects automatically, and dispatches messages to per-topic consumers
**Depends on**: Phase 138 (v16.0 complete)
**Requirements**: WS-01, WS-02, WS-03, WS-04, WS-05, WS-06
**Success Criteria** (what must be TRUE):
  1. Opening the app in two tabs does not open two WebSocket connections (MAX 2 connections respected via shared manager)
  2. Subscribing to a topic (e.g., `fritzbox`) causes the manager to send a subscribe message and route arriving payloads to the registered consumer
  3. Closing and reopening the browser tab reconnects automatically within 30 seconds using exponential backoff
  4. After any reconnection, all previously subscribed topics are re-subscribed without user action
  5. TypeScript types exist for all 6 provider WS payloads (`fritzbox`, `dirigera`, `netatmo`, `thermorossi`, `hue`, `sonos`) derived from the spec
**Plans:** 2/2 plans complete
Plans:
- [x] 139-01-PLAN.md — WS types, manager hook, React context
- [ ] 139-02-PLAN.md — Tests, mock, ClientProviders wiring

### Phase 140: Stove Migration
**Goal**: useStoveData receives live stove data via WebSocket as primary channel, falls back to HTTP polling automatically, and preserves the alwaysActive behavior that keeps polling active even with the tab hidden
**Depends on**: Phase 139
**Requirements**: MIG-01, MIG-02, MIG-03
**Success Criteria** (what must be TRUE):
  1. Stove card updates within ~1s of a state change when WebSocket is connected
  2. When the WebSocket disconnects, the stove card continues updating via HTTP polling with no user action required
  3. With the browser tab hidden, polling fallback continues firing (alwaysActive preserved — no tab-visibility pause)
**Plans**: 2 plans
Plans:
- [x] 142-01-PLAN.md — Migrate useSonosData to WS-primary with polling fallback
- [x] 142-02-PLAN.md — Migrate useDirigeraData to WS-primary with polling fallback

### Phase 141: Fritz!Box & Hue Migration
**Goal**: useNetworkData and useLightsData receive data via WebSocket as primary channel, fall back to polling, and the Fritz!Box sparkline buffer and bandwidth history survive WS/polling transitions without data loss
**Depends on**: Phase 139
**Requirements**: MIG-04, MIG-05, MIG-06, MIG-07, MIG-08
**Success Criteria** (what must be TRUE):
  1. Network card (devices, bandwidth, WAN) updates live from the `fritzbox` WS topic when connected
  2. Lights card updates live from the `hue` WS topic when connected
  3. When WebSocket disconnects, both cards continue updating via HTTP polling
  4. The bandwidth sparkline history is not reset or emptied when transitioning between WS and polling modes
**Plans**: 2 plans
Plans:
- [x] 141-01-PLAN.md — Migrate useNetworkData to WS-primary with polling fallback (Fritz\!Box sparkline continuity)
- [x] 141-02-PLAN.md — Migrate useLightsData to WS-primary with polling fallback (Hue Record-to-array mapping)
**UI hint**: yes

### Phase 142: Sonos & DIRIGERA Migration
**Goal**: useSonosData and useDirigeraData receive data via WebSocket as primary channel with HTTP polling fallback
**Depends on**: Phase 139
**Requirements**: MIG-09, MIG-10, MIG-11, MIG-12
**Success Criteria** (what must be TRUE):
  1. Sonos card (speakers, groups) updates live from the `sonos` WS topic when connected
  2. DIRIGERA card updates live from the `dirigera` WS topic when connected
  3. When WebSocket disconnects, both Sonos and DIRIGERA cards continue updating via HTTP polling
**Plans**: 2 plans
Plans:
- [x] 142-01-PLAN.md — Migrate useSonosData to WS-primary with polling fallback
- [ ] 142-02-PLAN.md — Migrate useDirigeraData to WS-primary with polling fallback

### Phase 143: Netatmo Migration
**Goal**: useThermostatData receives Netatmo data via WebSocket as primary channel with an adapter layer that normalises the raw `Record<string, unknown>` WS payload into the existing typed Netatmo shape, with HTTP polling fallback
**Depends on**: Phase 139
**Requirements**: MIG-13, MIG-14
**Success Criteria** (what must be TRUE):
  1. Thermostat card updates live from the `netatmo` WS topic when connected
  2. The existing Netatmo typed interface is satisfied by the adapter — no TypeScript errors, no runtime shape mismatches
  3. When WebSocket disconnects, the thermostat card continues updating via HTTP polling
**Plans**: 2 plans
Plans:
- [ ] 142-01-PLAN.md — Migrate useSonosData to WS-primary with polling fallback
- [ ] 142-02-PLAN.md — Migrate useDirigeraData to WS-primary with polling fallback

### Phase 144: Connection UX
**Goal**: Users can see the current WebSocket connection state at a glance, transitions between WebSocket and polling are invisible in the data stream, and every card shows when its data was last refreshed
**Depends on**: Phase 143 (all migrations complete)
**Requirements**: UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. A connection status indicator is visible on the dashboard showing one of three states: connected (WS live), reconnecting (backoff in progress), or fallback (polling active)
  2. Switching from WebSocket to polling and back does not cause any card to flash, blank, or show stale data for more than one polling interval
  3. Every dashboard card displays a "last updated" timestamp sourced from the WS `ts` field when on WebSocket or from the polling response time when on HTTP
**Plans**: 2 plans
Plans:
- [ ] 141-01-PLAN.md — Migrate useNetworkData to WS-primary with polling fallback (Fritz\!Box sparkline continuity)
- [x] 141-02-PLAN.md — Migrate useLightsData to WS-primary with polling fallback (Hue Record-to-array mapping)
**UI hint**: yes

## Progress

**Execution Order:** 139 → 140 → 141 → 142 → 143 → 144

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 139. WebSocket Infrastructure | v17.0 | 1/2 | Complete    | 2026-03-26 |
| 140. Stove Migration | v17.0 | 1/1 | Complete    | 2026-03-27 |
| 141. Fritz!Box & Hue Migration | v17.0 | 2/2 | Complete    | 2026-03-27 |
| 142. Sonos & DIRIGERA Migration | v17.0 | 2/2 | Complete    | 2026-03-27 |
| 143. Netatmo Migration | v17.0 | 0/TBD | Not started | - |
| 144. Connection UX | v17.0 | 0/TBD | Not started | - |
