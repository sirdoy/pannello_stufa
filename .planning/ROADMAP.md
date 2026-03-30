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
- ✅ **v17.0 WebSocket Real-Time Transport** — Phases 139-144 (shipped 2026-03-28)
- 🚧 **v17.1 WebSocket Alignment & Tuya Integration** — Phases 145-148 (in progress)

## Phases

<details>
<summary>✅ v17.0 WebSocket Real-Time Transport (Phases 139-144) — SHIPPED 2026-03-28</summary>

- [x] Phase 139: WebSocket Infrastructure (2/2 plans) — completed 2026-03-26
- [x] Phase 140: Stove Migration (1/1 plan) — completed 2026-03-27
- [x] Phase 141: Fritz!Box & Hue Migration (2/2 plans) — completed 2026-03-27
- [x] Phase 142: Sonos & DIRIGERA Migration (2/2 plans) — completed 2026-03-27
- [x] Phase 143: Netatmo Migration (2/2 plans) — completed 2026-03-28
- [x] Phase 144: Connection UX (2/2 plans) — completed 2026-03-28

</details>

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
<summary>✅ Earlier milestones — v1.0 through v15.0 (Phases 1-125) — all shipped</summary>

See git history and `.planning/milestones/` for details.

</details>

### 🚧 v17.1 WebSocket Alignment & Tuya Integration (In Progress)

**Milestone Goal:** Align all 8 WS topic payload types with the enriched HA proxy shapes, migrate Raspberry Pi to WS-primary transport, and deliver the Tuya smart plug provider end-to-end (infrastructure + frontend + WS subscription).

- [x] **Phase 145: WS Type Alignment** - Update all topic payload types to match enriched HA proxy shapes (completed 2026-03-28)
- [ ] **Phase 146: Raspi WS Migration** - Migrate useRaspiData to WS-primary with polling fallback and connection UX
- [ ] **Phase 147: Tuya Infrastructure** - Proxy client, TypeScript types, and 6 API route proxies
- [ ] **Phase 148: Tuya Frontend** - Hooks, dashboard card, /tuya page, registry entry, and energy history chart

## Phase Details

### Phase 145: WS Type Alignment
**Goal**: All 8 WS topic payload types match the enriched HA proxy shapes — adding data_freshness, registry metadata fields, and correcting structural mismatches
**Depends on**: Phase 144 (existing WS infrastructure)
**Requirements**: WSTYPE-01, WSTYPE-02, WSTYPE-03, WSTYPE-04, WSTYPE-05, WSTYPE-06, WSTYPE-07, WSTYPE-08, WSTYPE-09, WSTYPE-10, WSTYPE-11, WSTYPE-12, WSTYPE-13, WSTYPE-14
**Success Criteria** (what must be TRUE):
  1. Every WS topic payload type includes a `data_freshness` field matching the corresponding REST endpoint shape
  2. FritzBoxData, FritzBoxDevice, DirigeraData, DirigeraBaseSensor, ThermorossiData, HueData, HueLight, SonosData, SonosSpeaker, and NetatmoData all compile without type errors against their enriched field additions
  3. HueData keeps array shape (D-01 override) — lights: HueLight[] | null, groups: HueGroup[] | null — with data_freshness added
  4. Topic union type includes all 8 topics (`raspi` and `tuya` added) and TopicDataMap maps them to their payload types
**Plans**: 3 plans

Plans:
- [x] 145-01-PLAN.md — Create types/tuyaProxy.ts + add registry metadata to HueLight and ThermorossiStatusResponse
- [x] 145-02-PLAN.md — Add registry metadata to SonosDeviceResponse and DirigeraSensor
- [x] 145-03-PLAN.md — Rewrite types/websocket.ts with all 8 enriched topic types

### Phase 146: Raspi WS Migration
**Goal**: useRaspiData subscribes to the `raspi` WS topic as primary source, falls back to HTTP polling when disconnected, and RaspiCard displays a live LastUpdated timestamp — extending the connection UX to cover the 8th provider
**Depends on**: Phase 145
**Requirements**: RASPI-01, RASPI-02, RASPI-03, RASPI-04, UX-01, UX-03
**Success Criteria** (what must be TRUE):
  1. RaspiCard data refreshes in real time without user interaction when WS is connected
  2. RaspiCard continues updating via HTTP polling when WS is disconnected (no data freeze)
  3. RaspiCard displays an Italian-locale "aggiornato X secondi fa" timestamp that updates live
  4. NavbarConnectionStatus reflects the `raspi` topic as part of the WS subscription set
  5. RaspiData TypeScript type matches the documented WS payload shape and compiles cleanly
**Plans**: 2 plans

Plans:
- [ ] 146-01-PLAN.md — Rewrite useRaspiData with WS-primary + polling fallback + tests
- [ ] 146-02-PLAN.md — Add LastUpdated timestamp to RaspiCard + tests
**UI hint**: yes

### Phase 147: Tuya Infrastructure
**Goal**: A complete server-side Tuya integration — proxy client, types, and 6 API route proxies — that the frontend hooks can consume in the next phase
**Depends on**: Phase 145
**Requirements**: TUYA-01, TUYA-02, TUYA-03, TUYA-04, TUYA-05, TUYA-06, TUYA-07, TUYA-08
**Success Criteria** (what must be TRUE):
  1. `GET /api/tuya/health` returns proxy health without authentication errors
  2. `GET /api/tuya/plugs` returns a typed list of TuyaPlug objects
  3. `GET /api/tuya/plugs/[device_id]` and `GET /api/tuya/plugs/[device_id]/history` return correctly typed single-plug and energy history responses
  4. `POST /api/tuya/plugs/[device_id]/state` and `POST /api/tuya/plugs/[device_id]/timer` accept typed request bodies and return 202 Accepted
  5. All route files compile with zero TypeScript errors and follow the existing haGet/haPost proxy pattern
**Plans**: TBD

Plans:
- [ ] 147-01: TBD

### Phase 148: Tuya Frontend
**Goal**: Users can monitor and control Tuya smart plugs from the dashboard and a dedicated /tuya page, with live WS data, on/off toggles, timer controls, energy history charts, and correct registry entries
**Depends on**: Phase 147
**Requirements**: TUYA-09, TUYA-10, TUYA-11, TUYA-12, TUYA-13, TUYA-14, UX-02
**Success Criteria** (what must be TRUE):
  1. TuyaCard on the dashboard shows plug status, power gauge, and a live LastUpdated timestamp that updates without page reload
  2. User can toggle a plug on/off from TuyaCard and the state change reflects immediately
  3. /tuya page shows a multi-plug grid with on/off toggles, energy charts with 24h/7d/30d selector, and timer controls
  4. Tuya device appears in the device registry and in the navigation menu without 404 errors
  5. NavbarConnectionStatus includes the `tuya` WS topic subscription
**Plans**: TBD

Plans:
- [ ] 148-01: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 145. WS Type Alignment | v17.1 | 3/3 | Complete    | 2026-03-28 |
| 146. Raspi WS Migration | v17.1 | 0/2 | Not started | - |
| 147. Tuya Infrastructure | v17.1 | 0/TBD | Not started | - |
| 148. Tuya Frontend | v17.1 | 0/TBD | Not started | - |
