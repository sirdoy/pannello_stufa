# Requirements: Pannello Stufa

**Defined:** 2026-02-11
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v7.0 Requirements

Requirements for Performance & Resilience milestone. Each maps to roadmap phases.

### Request Resilience

- [ ] **RETRY-01**: User sees toast notification when a device command fails
- [ ] **RETRY-02**: Transient network errors auto-retry with exponential backoff (max 3 attempts)
- [ ] **RETRY-03**: Device-offline errors show toast with manual "Retry" button
- [ ] **RETRY-04**: Stove safety commands (ignite/shutdown) use idempotency keys to prevent duplicate actions
- [ ] **RETRY-05**: Request deduplication prevents double-tap sending duplicate commands
- [ ] **RETRY-06**: Single retry layer at API boundary (no layered amplification)

### Adaptive Polling

- [ ] **POLL-01**: Polling pauses when browser tab is hidden (Page Visibility API)
- [ ] **POLL-02**: Polling resumes immediately when tab becomes visible
- [ ] **POLL-03**: Stove status keeps 5-second fixed interval when tab is active (safety-critical)
- [ ] **POLL-04**: Non-critical data (weather, tokens) uses reduced frequency when on slow network
- [ ] **POLL-05**: Staleness indicator shows when data is older than expected refresh interval

### Error Handling

- [ ] **ERR-01**: Global error boundary (error.tsx) catches unhandled errors with fallback UI
- [ ] **ERR-02**: Feature-level error boundaries isolate crashes per device card section
- [ ] **ERR-03**: Error boundaries display user-friendly message with "Try Again" action
- [ ] **ERR-04**: Retry-from-error resets component state and re-mounts
- [ ] **ERR-05**: Errors logged to analytics (fire-and-forget pattern)
- [ ] **ERR-06**: ValidationError class prevents safety alerts from being swallowed by boundaries

### Component Refactoring

- [ ] **REFAC-01**: StoveCard split into sub-components (target 200-300 LOC each)
- [ ] **REFAC-02**: LightsCard split into sub-components (target 200-300 LOC each)
- [ ] **REFAC-03**: stove/page.tsx split into sub-components (target 200-300 LOC each)
- [ ] **REFAC-04**: Complex state logic extracted into custom hooks
- [ ] **REFAC-05**: Orchestrator pattern: parent manages state, children are presentational

### Critical Path Testing

- [ ] **TEST-01**: Unit tests for /api/scheduler/check covering all execution paths
- [ ] **TEST-02**: Tests cover scheduler state transitions (OFF → START → WORK)
- [ ] **TEST-03**: Tests cover error scenarios (API timeout, invalid state, stove offline)
- [ ] **TEST-04**: Tests achieve 80%+ branch coverage on scheduler check route

### Token Lifecycle

- [ ] **TOKEN-01**: Automated FCM token cleanup runs via cron schedule
- [ ] **TOKEN-02**: Stale tokens identified by last delivery timestamp (not just age)
- [ ] **TOKEN-03**: Cleanup logs deleted tokens for audit trail
- [ ] **TOKEN-04**: Active tokens (recent delivery) never deleted by cleanup

## Future Requirements

### v7.1+ Considerations

- **ERR-DASH**: Error monitoring dashboard with aggregated error counts
- **POLL-WS**: WebSocket/SSE for real-time stove status (replace polling)
- **REFAC-THERM**: ThermostatCard refactoring (currently manageable size)
- **TEST-E2E**: Playwright E2E tests for critical user flows (ignite, schedule change)

## Out of Scope

| Feature | Reason |
|---------|--------|
| WebSocket real-time | Complexity, Vercel serverless limitation, polling sufficient for now |
| Service Worker periodic sync | Chrome/Edge only, not cross-browser |
| ML-based predictive retry | Over-engineering, exponential backoff sufficient |
| Full test rewrite | Focus on critical untested paths only |
| Error reporting service (Sentry) | Firebase analytics sufficient for this scale |
| Component library extraction | Components are project-specific, not reusable |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RETRY-01 | Pending | Pending |
| RETRY-02 | Pending | Pending |
| RETRY-03 | Pending | Pending |
| RETRY-04 | Pending | Pending |
| RETRY-05 | Pending | Pending |
| RETRY-06 | Pending | Pending |
| POLL-01 | Pending | Pending |
| POLL-02 | Pending | Pending |
| POLL-03 | Pending | Pending |
| POLL-04 | Pending | Pending |
| POLL-05 | Pending | Pending |
| ERR-01 | Pending | Pending |
| ERR-02 | Pending | Pending |
| ERR-03 | Pending | Pending |
| ERR-04 | Pending | Pending |
| ERR-05 | Pending | Pending |
| ERR-06 | Pending | Pending |
| REFAC-01 | Pending | Pending |
| REFAC-02 | Pending | Pending |
| REFAC-03 | Pending | Pending |
| REFAC-04 | Pending | Pending |
| REFAC-05 | Pending | Pending |
| TEST-01 | Pending | Pending |
| TEST-02 | Pending | Pending |
| TEST-03 | Pending | Pending |
| TEST-04 | Pending | Pending |
| TOKEN-01 | Pending | Pending |
| TOKEN-02 | Pending | Pending |
| TOKEN-03 | Pending | Pending |
| TOKEN-04 | Pending | Pending |

**Coverage:**
- v7.0 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30 ⚠️

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after initial definition*
