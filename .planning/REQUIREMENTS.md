# Requirements: Pannello Stufa v9.0

**Defined:** 2026-02-18
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v9.0 Requirements

Requirements for performance optimization milestone. Each maps to roadmap phases.

### Measurement & Baseline

- [ ] **MEAS-01**: User can view bundle size analysis report showing per-route JS breakdown
- [ ] **MEAS-02**: User can see Lighthouse performance score baseline (LCP, FCP, INP, CLS)
- [ ] **MEAS-03**: User can monitor real-user performance metrics via web-vitals pipeline
- [ ] **MEAS-04**: User can compare before/after metrics after each optimization phase

### Font & Resource Optimization

- [ ] **FONT-01**: User sees fonts load without external network roundtrip (next/font self-hosting)
- [ ] **FONT-02**: User sees zero layout shift from font loading (CLS improvement)
- [ ] **FONT-03**: User benefits from preconnect hints for critical external resources (Firebase, Auth0)

### React Compiler

- [ ] **COMP-01**: User benefits from auto-memoization replacing manual useMemo/useCallback
- [ ] **COMP-02**: User sees no regressions in existing functionality after compiler enablement
- [ ] **COMP-03**: User benefits from compiler healthcheck validating Rules of React compliance

### Code Splitting

- [ ] **SPLIT-01**: User on /network page downloads Recharts only when visiting that page
- [ ] **SPLIT-02**: User on /analytics page downloads chart code only when visiting that page
- [ ] **SPLIT-03**: User without analytics consent never downloads consent-gated chart code
- [ ] **SPLIT-04**: User's PWA offline functionality remains intact after code splitting changes

### Render Optimization

- [ ] **REND-01**: User sees smooth chart updates without full SVG re-render on polling ticks
- [ ] **REND-02**: User experiences staggered dashboard card loading (no thundering herd)
- [ ] **REND-03**: User benefits from stable data references preventing unnecessary re-renders
- [ ] **REND-04**: User experiences debounced thermostat writes reducing API calls

### Suspense Streaming (Conditional)

- [ ] **SUSP-01**: User sees skeleton fallbacks for each dashboard card during loading
- [ ] **SUSP-02**: User sees cards stream in progressively as data becomes available
- [ ] **SUSP-03**: User's stove card always loads first (safety-critical priority)

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Optimization

- **ADV-01**: ThermostatCard orchestrator refactor (897 LOC, not yet split)
- **ADV-02**: Image optimization with next/image for camera snapshots
- **ADV-03**: Service worker precache optimization for critical routes
- **ADV-04**: Per-device bandwidth tracking in Fritz!Box

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Lighthouse CI in GitHub Actions | Overkill for private PWA behind Auth0 |
| size-limit / bundlesize tools | @next/bundle-analyzer sufficient for this project |
| react-window / virtualization | Only 6 device cards on dashboard, no long lists to virtualize |
| SSR → SSG migration | App requires real-time data, static generation not applicable |
| CDN edge caching | Already on Vercel, CDN built-in |
| Web Workers for polling | Existing useAdaptivePolling pattern sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MEAS-01 | Phase 70 | Pending |
| MEAS-02 | Phase 70 | Pending |
| MEAS-03 | Phase 70 | Pending |
| MEAS-04 | Phase 70 | Pending |
| FONT-01 | Phase 70 | Pending |
| FONT-02 | Phase 70 | Pending |
| FONT-03 | Phase 70 | Pending |
| COMP-01 | Phase 71 | Pending |
| COMP-02 | Phase 71 | Pending |
| COMP-03 | Phase 71 | Pending |
| SPLIT-01 | Phase 72 | Pending |
| SPLIT-02 | Phase 72 | Pending |
| SPLIT-03 | Phase 72 | Pending |
| SPLIT-04 | Phase 72 | Pending |
| REND-01 | Phase 73 | Pending |
| REND-02 | Phase 73 | Pending |
| REND-03 | Phase 73 | Pending |
| REND-04 | Phase 73 | Pending |
| SUSP-01 | Phase 74 | Pending |
| SUSP-02 | Phase 74 | Pending |
| SUSP-03 | Phase 74 | Pending |

**Coverage:**
- v9.0 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 — traceability populated after roadmap creation (phases 70-74)*
