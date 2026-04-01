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
- ✅ **v17.1 WebSocket Alignment & Tuya Integration** — Phases 145-148 (shipped 2026-03-30)
- 🚧 **v18.0 Dark-Only & Mobile-First** — Phases 149-154 (in progress)

## Phases

<details>
<summary>✅ v17.1 WebSocket Alignment & Tuya Integration (Phases 145-148) — SHIPPED 2026-03-30</summary>

- [x] Phase 145: WS Type Alignment (3/3 plans) — completed 2026-03-28
- [x] Phase 146: Raspi WS Migration (2/2 plans) — completed 2026-03-30
- [x] Phase 147: Tuya Infrastructure (2/2 plans) — completed 2026-03-30
- [x] Phase 148: Tuya Frontend (3/3 plans) — completed 2026-03-30

</details>

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

### 🚧 v18.0 Dark-Only & Mobile-First (In Progress)

**Milestone Goal:** Eliminate the light theme entirely (dark-only codebase) and ensure every page and design system component is fully usable on a 375px mobile viewport.

- [x] **Phase 149: Theme Removal Core** - Remove ThemeContext, ThemeProvider, settings page, API route, and hardcode dark on html element (completed 2026-04-01)
- [ ] **Phase 150: Theme Prefix Cleanup** - Remove all dark: Tailwind prefixes and html:not(.dark) selectors across the codebase
- [ ] **Phase 151: Design System Mobile-First** - Fix ButtonGroup wrapping, verify all DS components at 375px, update DS showcase
- [ ] **Phase 152: Pages Audit — Core & Device Pages** - Audit dashboard, stove, thermostat, lights, and network pages at 375px
- [ ] **Phase 153: Pages Audit — Extended Device Pages** - Audit Sonos, DIRIGERA, Raspi, Tuya, and Rooms pages at 375px
- [ ] **Phase 154: Pages Audit — Admin & Support Pages** - Audit registry, settings, debug, camera, and remaining pages at 375px

## Phase Details

### Phase 149: Theme Removal Core
**Goal**: The app's theme machinery is gone — no ThemeContext, no ThemeProvider, no theme settings page, no theme API route, and the html element permanently carries class="dark"
**Depends on**: Phase 148
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, THEME-08, THEME-09
**Success Criteria** (what must be TRUE):
  1. Importing ThemeContext or useTheme causes a build error (the module does not exist)
  2. Navigating to /settings/theme returns 404
  3. Calling GET or POST /api/user/theme returns 404
  4. The html element in every rendered page has class="dark" hardcoded with no JavaScript toggling it
  5. The theme-color meta tag reads #0f172a in every rendered page's head
**Plans**: 2 plans
Plans:
- [x] 149-01-PLAN.md — Delete theme files + fix consumers (layout, ClientProviders, settings)
- [x] 149-02-PLAN.md — Remove light-mode CSS from globals.css + visual verification
**UI hint**: yes

### Phase 150: Theme Prefix Cleanup
**Goal**: Zero dark: Tailwind prefixes and zero html:not(.dark) selectors remain in the codebase — all color/opacity values that previously required a dark: variant are now the sole hardcoded value
**Depends on**: Phase 149
**Requirements**: THEME-06, THEME-07, THEME-10
**Success Criteria** (what must be TRUE):
  1. A codebase search for "dark:" returns zero results in any .tsx/.ts/.css file
  2. A codebase search for "html:not(.dark)" returns zero results
  3. The design system showcase page (/debug/design-system) loads without any theme toggle UI or light-mode examples
**Plans**: 2 plans
Plans:
- [x] 149-01-PLAN.md — Delete theme files + fix consumers (layout, ClientProviders, settings)
- [ ] 149-02-PLAN.md — Remove light-mode CSS from globals.css + visual verification
**UI hint**: yes

### Phase 151: Design System Mobile-First
**Goal**: Every design system component renders correctly on a 375px viewport — no horizontal overflow, no clipped content, and ButtonGroup wraps gracefully when buttons exceed a single row
**Depends on**: Phase 150
**Requirements**: MOBILE-01, MOBILE-02, MOBILE-03, MOBILE-04, MOBILE-05, MOBILE-06
**Success Criteria** (what must be TRUE):
  1. ButtonGroup with 4+ buttons does not overflow its container at 375px (flex-wrap is applied)
  2. The bottom navigation bar displays all 4 columns without clipping or overlap at 375px
  3. All typography on the design system page is readable at 375px with no horizontal scroll
  4. The design system showcase page (/debug/design-system) includes a mobile-first patterns section documenting base=mobile, sm:=desktop convention
**Plans**: 2 plans
Plans:
- [ ] 149-01-PLAN.md — Delete theme files + fix consumers (layout, ClientProviders, settings)
- [ ] 149-02-PLAN.md — Remove light-mode CSS from globals.css + visual verification
**UI hint**: yes

### Phase 152: Pages Audit — Core & Device Pages
**Goal**: The dashboard home page and all stove, thermostat, lights, and network pages are fully usable on a 375px mobile viewport with no layout breakage, overflow, or clipped controls
**Depends on**: Phase 151
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05
**Success Criteria** (what must be TRUE):
  1. The dashboard (/) renders all cards in a single-column layout at 375px with no horizontal scroll
  2. All stove sub-pages (/stove, /stove/errors, /stove/maintenance, /stove/scheduler) display without overflow or clipped buttons at 375px
  3. Both thermostat pages (/thermostat, /thermostat/schedule) show full controls without horizontal scroll at 375px
  4. All lights pages (/lights, /lights/scenes, /lights/automation) are fully operable on touch at 375px
  5. The network page (/network) displays charts and tables without overflow at 375px
**Plans**: 2 plans
Plans:
- [ ] 149-01-PLAN.md — Delete theme files + fix consumers (layout, ClientProviders, settings)
- [ ] 149-02-PLAN.md — Remove light-mode CSS from globals.css + visual verification
**UI hint**: yes

### Phase 153: Pages Audit — Extended Device Pages
**Goal**: The Sonos, DIRIGERA, Raspi, Tuya, and Rooms pages are fully usable on a 375px mobile viewport
**Depends on**: Phase 152
**Requirements**: AUDIT-06, AUDIT-07, AUDIT-08, AUDIT-09, AUDIT-10
**Success Criteria** (what must be TRUE):
  1. The Sonos page (/sonos) shows playback controls and zone list without overflow at 375px
  2. The DIRIGERA page (/dirigera) renders the sensor list without horizontal scroll at 375px
  3. The Raspi page (/raspi) and Tuya page (/tuya) display their cards without layout breakage at 375px
  4. All Rooms pages (/rooms, /rooms/status, /rooms/[id]) show room cards and device assignments in a readable single-column layout at 375px
**Plans**: 2 plans
Plans:
- [ ] 149-01-PLAN.md — Delete theme files + fix consumers (layout, ClientProviders, settings)
- [ ] 149-02-PLAN.md — Remove light-mode CSS from globals.css + visual verification
**UI hint**: yes

### Phase 154: Pages Audit — Admin & Support Pages
**Goal**: All registry, settings, debug, camera, and remaining pages are fully usable on a 375px mobile viewport
**Depends on**: Phase 153
**Requirements**: AUDIT-11, AUDIT-12, AUDIT-13, AUDIT-14, AUDIT-15
**Success Criteria** (what must be TRUE):
  1. Registry pages (/registry/devices, /registry/types) show data tables that scroll horizontally within their containers (not the viewport) at 375px
  2. All 7 settings sub-pages display forms and controls without overflow at 375px
  3. Debug pages (/debug, /debug/api, /debug/logs, /debug/notifications) show their full content without horizontal scroll at 375px
  4. Camera pages (/camera, /camera/events) display without layout breakage at 375px
  5. The remaining pages (changelog, offline, log) render correctly in a single-column layout at 375px
**Plans**: 2 plans
Plans:
- [ ] 149-01-PLAN.md — Delete theme files + fix consumers (layout, ClientProviders, settings)
- [ ] 149-02-PLAN.md — Remove light-mode CSS from globals.css + visual verification
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 145. WS Type Alignment | v17.1 | 3/3 | Complete | 2026-03-28 |
| 146. Raspi WS Migration | v17.1 | 2/2 | Complete | 2026-03-30 |
| 147. Tuya Infrastructure | v17.1 | 2/2 | Complete | 2026-03-30 |
| 148. Tuya Frontend | v17.1 | 3/3 | Complete | 2026-03-30 |
| 149. Theme Removal Core | v18.0 | 2/2 | Complete   | 2026-04-01 |
| 150. Theme Prefix Cleanup | v18.0 | 0/TBD | Not started | - |
| 151. Design System Mobile-First | v18.0 | 0/TBD | Not started | - |
| 152. Pages Audit — Core & Device Pages | v18.0 | 0/TBD | Not started | - |
| 153. Pages Audit — Extended Device Pages | v18.0 | 0/TBD | Not started | - |
| 154. Pages Audit — Admin & Support Pages | v18.0 | 0/TBD | Not started | - |
