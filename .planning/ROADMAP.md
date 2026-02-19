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
- 🚧 **v9.0 Performance Optimization** — Phases 70-74 (in progress)

## Phases

<details>
<summary>✅ v8.1 Masonry Dashboard (Phases 68-69) — SHIPPED 2026-02-18</summary>

- [x] Phase 68: Core Masonry Layout (1/1 plan)
- [x] Phase 69: Edge Cases, Error Boundary & Tests (2/2 plans)

</details>

<details>
<summary>✅ v8.0 Fritz!Box Network Monitor (Phases 61-67) — SHIPPED 2026-02-16</summary>

- [x] Phase 61: Foundation & Infrastructure (2/2 plans)
- [x] Phase 62: Dashboard Card (2/2 plans)
- [x] Phase 63: WAN Status & Device List (3/3 plans)
- [x] Phase 64: Bandwidth Visualization (2/2 plans)
- [x] Phase 65: Device History Timeline (3/3 plans)
- [x] Phase 66: Device Categorization (4/4 plans)
- [x] Phase 67: Bandwidth Correlation (2/2 plans)

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v7.0)</summary>

See `.planning/milestones/` for full archives.

</details>

### 🚧 v9.0 Performance Optimization (In Progress)

**Milestone Goal:** Make the app fast — reduce bundle size, establish measurable baselines, eliminate interaction sluggishness, and optimize the heaviest page (dashboard) for real users.

- [x] **Phase 70: Measurement Baseline + Quick Wins** - Establish bundle/Lighthouse baselines; apply zero-risk font and resource hint optimizations
- [x] **Phase 71: React Compiler** - Enable auto-memoization across all compliant components; isolate in its own phase for clean regression attribution
- [x] **Phase 72: Code Splitting** - Lazy-load Recharts on sub-pages; ensure PWA offline shell remains intact after chunk changes
- [x] **Phase 73: Render Optimization** - Eliminate Recharts poll-tick re-renders, stagger dashboard fetches, debounce thermostat writes (completed 2026-02-19)
- [ ] **Phase 74: Suspense Streaming (Conditional)** - Stream dashboard cards independently if Phase 70-73 results show LCP/TTI still needs improvement

## Phase Details

### Phase 70: Measurement Baseline + Quick Wins
**Goal**: Users load the app with self-hosted fonts (no Google CDN roundtrip), preconnect hints for critical API domains, a working web-vitals pipeline in production, and a committed bundle analysis and Lighthouse baseline that all future optimization phases can measure against.
**Depends on**: Nothing (first phase of v9.0)
**Requirements**: MEAS-01, MEAS-02, MEAS-03, MEAS-04, FONT-01, FONT-02, FONT-03
**Success Criteria** (what must be TRUE):
  1. User sees fonts rendered without a Google Fonts CDN network request on cold load (verified via DevTools Network tab — no requests to fonts.googleapis.com or fonts.gstatic.com)
  2. User experiences zero layout shift from font loading (CLS score 0 in Lighthouse — font space reserved before swap)
  3. Developer can run `ANALYZE=true npm run build -- --webpack` and open `client.html` to inspect per-route JS bundle composition
  4. User's browser sends preconnect requests to Firebase RTDB and Auth0 domains before any app JS fires its first API call (Netatmo excluded — server-proxied, never called from browser)
  5. Web Vitals (LCP, INP, CLS, FCP, TTFB) are reported to console/analytics pipeline on every production page load, establishing a before/after comparison baseline for phases 71-74
**Plans**: 2 plans

Plans:
- [x] 70-01-PLAN.md — Bundle analyzer + baseline capture script
- [x] 70-02-PLAN.md — Font self-hosting + preconnect hints + Web Vitals pipeline + dashboard

### Phase 71: React Compiler
**Goal**: Auto-memoization is enabled across all Rules-of-React-compliant components and hooks, replacing manual useMemo/useCallback calls; all 3,700+ existing tests remain green; any non-compliant component is individually opted out rather than blocking the whole compiler.
**Depends on**: Phase 70
**Requirements**: COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. `npx react-compiler-healthcheck` output is reviewed and any high-risk files (ThermostatCard, orchestrator hooks) are identified before the compiler is enabled
  2. User sees no regressions in device card behavior, stove control, or scheduler interactions after compiler enablement (all 3,700+ tests pass)
  3. User benefits from reduced re-render overhead — React DevTools Profiler shows fewer highlighted re-renders on polling ticks for orchestrator hooks (useStoveData, useNetworkData)
**Plans**: 1 plan

Plans:
- [x] 71-01-PLAN.md — Healthcheck + compiler enablement + regression verification

### Phase 72: Code Splitting
**Goal**: Recharts chart code is deferred on the /network and /analytics sub-pages so it only downloads when a user actually visits those pages; the consent-gated correlation chart never downloads JS for users without analytics consent; the PWA offline shell continues to serve all six dashboard cards without ChunkLoadError after the build.
**Depends on**: Phase 71
**Requirements**: SPLIT-01, SPLIT-02, SPLIT-03, SPLIT-04
**Success Criteria** (what must be TRUE):
  1. First Load JS for /network route is reduced (verified by bundle analyzer before/after diff — Recharts chunk absent from initial payload)
  2. First Load JS for /analytics route is reduced (verified by bundle analyzer — chart chunks absent from initial payload)
  3. User without analytics consent never triggers a network request for the BandwidthCorrelationChart JS chunk (verified via DevTools Network tab with consent denied)
  4. After building with new dynamic imports, user can load the dashboard offline and all six device cards render without ChunkLoadError (verified by DevTools Network offline mode + hard refresh)
**Plans**: 1 plan

Plans:
- [x] 72-01-PLAN.md — Dynamic-import Recharts charts on /network and /analytics with consent-gated loading

### Phase 73: Render Optimization
**Goal**: Recharts charts stop re-rendering on every polling tick; the six dashboard device cards stagger their initial data fetches so no thundering herd fires on mount; thermostat setpoint writes are debounced to reduce unnecessary API calls during rapid input.
**Depends on**: Phase 70
**Requirements**: REND-01, REND-02, REND-03, REND-04
**Success Criteria** (what must be TRUE):
  1. Recharts charts (bandwidth, analytics) are absent from the React DevTools Profiler flame graph during polling tick updates — chart components no longer re-render every 30 seconds when data reference is stable
  2. User experiences smooth chart display with no visible animation restart on polling updates (isAnimationActive={false} on all chart series)
  3. User's browser fires staggered initial API calls on dashboard load — network waterfall shows stove at t=0, thermostat ~50ms, lights ~100ms, weather ~250ms, camera ~400ms, network ~500ms (not all six within 100ms)
  4. User's thermostat setpoint input triggers at most one API write per 500ms burst of adjustments (verified by monitoring network requests during rapid slider movement)
**Plans**: 2 plans

Plans:
- [ ] 73-01-PLAN.md — Chart memoization (React.memo + isAnimationActive={false}) for analytics charts and NetworkBandwidth
- [ ] 73-02-PLAN.md — Polling stagger via useAdaptivePolling initialDelay + thermostat debounced setpoint writes

### Phase 74: Suspense Streaming (Conditional)
**Goal**: Dashboard cards stream in progressively as their data resolves, so the user sees the first card (stove, safety-critical) within ~300ms of navigation rather than waiting for all six cards to complete their fetches; the page shell renders immediately with skeleton fallbacks for each card.
**Depends on**: Phase 70, Phase 71, Phase 72, Phase 73
**Requirements**: SUSP-01, SUSP-02, SUSP-03
**Success Criteria** (what must be TRUE):
  1. User sees a skeleton fallback for each of the six dashboard cards within ~300ms of page navigation (dashboard shell renders immediately before any device data resolves)
  2. User sees cards stream in one at a time as each device's data becomes available — the page does not wait for all six cards before showing any of them
  3. User's stove card is always the first card to become visible (safety-critical priority), regardless of network conditions or the order other cards resolve
**Plans**: 2 plans

Plans:
- [ ] 74-01-PLAN.md — loading.tsx skeleton shell + page.tsx restructure with async DashboardCards server component
- [ ] 74-02-PLAN.md — Per-card Suspense boundaries with skeleton fallbacks + unit tests

## Progress

**Execution Order:**
Phases execute in numeric order: 70 → 71 → 72 → 73 → 74

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 29/29 | ✓ Complete | 2026-01-26 |
| 6-10 | v2.0 | 21/21 | ✓ Complete | 2026-01-28 |
| 11-18 | v3.0 | 52/52 | ✓ Complete | 2026-01-30 |
| 19-24 | v3.1 | 13/13 | ✓ Complete | 2026-02-02 |
| 25-29 | v3.2 | 13/13 | ✓ Complete | 2026-02-03 |
| 30-36 | v4.0 | 24/24 | ✓ Complete | 2026-02-05 |
| 37-43 | v5.0 | 56/56 | ✓ Complete | 2026-02-08 |
| 44-48 | v5.1 | 39/39 | ✓ Complete | 2026-02-10 |
| 49-54 | v6.0 | 29/29 | ✓ Complete | 2026-02-11 |
| 55-60 | v7.0 | 22/22 | ✓ Complete | 2026-02-13 |
| 61-67 | v8.0 | 18/18 | ✓ Complete | 2026-02-16 |
| 68-69 | v8.1 | 3/3 | ✓ Complete | 2026-02-18 |
| 70. Measurement Baseline + Quick Wins | v9.0 | Complete    | 2026-02-18 | 2026-02-18 |
| 71. React Compiler | v9.0 | Complete    | 2026-02-18 | - |
| 72. Code Splitting | v9.0 | Complete    | 2026-02-18 | 8dafcb0, e88e692 |
| 73. Render Optimization | 2/2 | Complete    | 2026-02-19 | - |
| 74. Suspense Streaming (Conditional) | v9.0 | 0/2 | Not started | - |

**Total:** 12 milestones shipped, 69 phases complete, 322 plans executed + 5 phases planned (v9.0)

---

*Roadmap updated: 2026-02-18 — v9.0 Performance Optimization roadmap created*
