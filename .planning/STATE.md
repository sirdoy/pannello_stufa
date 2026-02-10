# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** Phase 49 - Persistent Rate Limiting (v6.0 Operations, PWA & Analytics)

## Current Position

Phase: 49 of 54 (Persistent Rate Limiting)
Plan: 3 of 4 complete
Status: Executing wave 1 plans (01-03 persistent libraries)
Last activity: 2026-02-10 — Completed 49-03-PLAN.md (persistent coordination throttle)

Progress: [████████░░] 82.5% (248 of 300+ estimated total plans)

## Performance Metrics

**Velocity (v5.0-v5.1):**
- Total plans completed: 247 (v1.0-v5.1)
- v5.0 milestone: 56 plans in 4 days
- v5.1 milestone: 39 plans in 2 days

**By Phase (recent milestones):**

| Phase | Plans | Milestone | Duration |
|-------|-------|-----------|----------|
| 37-43 | 56 | v5.0 TypeScript | 4 days |
| 44-48 | 39 | v5.1 Tech Debt | 2 days |
| 49-54 | TBD | v6.0 Operations | Starting |

**Recent Trend:**
- Parallel execution enabled (5-agent waves)
- Comprehensive depth setting
- Yolo mode active (autonomous execution with verification)

## Accumulated Context

### Decisions

Recent decisions affecting v6.0 work (full log in PROJECT.md):

- **Simple read/write for coordination throttle (49-03)**: Last-writer-wins acceptable for single timestamp storage; no transaction overhead needed
- **Firebase RTDB for rate limiting**: Transactions provide atomicity without Redis complexity (Phase 49 foundation)
- **GitHub Actions for cron**: External HTTP scheduler, no stateful server needed (Phase 50 approach)
- **Playwright auth state pattern**: Session caching prevents redundant Auth0 logins (Phase 51 implementation)
- **Platform-specific FCM payloads**: iOS requires aps.category, Android uses clickAction (Phase 52 complexity)
- **Consent-first analytics**: GDPR compliance blocks all tracking without explicit opt-in (Phase 54 blocker)

### Pending Todos

None yet for v6.0. Use `/gsd:add-todo` to capture ideas during execution.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 16 | fix weather tab coordinates from config | 2026-02-09 | 00f3184 | [16-fix-weather-tab-coordinates-from-config](./quick/16-fix-weather-tab-coordinates-from-config/) |
| 15 | aggiungi la favicon | 2026-02-09 | 266bd24 | [15-aggiungi-la-favicon](./quick/15-aggiungi-la-favicon/) |

### Blockers/Concerns

**v6.0 Risks (from research):**
- Phase 49: Serverless state loss if Firebase transactions fail (feature flag mitigation)
- Phase 50: Vercel 10s timeout for cron orchestrator (fire-and-forget pattern required)
- Phase 52: iOS notification category registration in PWA unclear (needs deeper research during planning)
- Phase 54: GDPR consent banner UX must not block essential controls (essential mode implementation critical)

**Known Issues (carried from v5.1):**
- Worker teardown warning (React 19 cosmetic, documented as not actionable)
- 179 unused exports remain (131 intentional design system barrel, 48 utility)
- 2 knip false positives (app/sw.ts, firebase-messaging-sw.js)

## Session Continuity

Last session: 2026-02-10
Stopped at: Completed 49-03-PLAN.md (persistent coordination throttle with TDD)
Resume file: None

Next action: Execute remaining Phase 49 plans (49-04 integration)

---
*State updated: 2026-02-10 after completing 49-03-PLAN.md*
