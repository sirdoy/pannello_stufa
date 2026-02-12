# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** Phase 57 complete — ready for Phase 58

## Current Position

Phase: 57 of 60 (Adaptive Polling)
Plan: 3 of 3 in current phase
Status: Complete
Last activity: 2026-02-12 — Completed 57-03-PLAN.md (Stove Staleness Integration)

Progress: [████████████████████░░░] 85% (286/336 estimated plans total)

## Performance Metrics

**Velocity:**
- Total plans completed: 286 (phases 1-57 complete)
- Average duration: ~15 min (estimated)
- Total execution time: ~72 hours across 6 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 1-5 | 29 | 4 days |
| v2.0 Netatmo & Monitoring | 6-10 | 21 | 1.4 days |
| v3.0 Design System | 11-18 | 52 | 3 days |
| v3.1 Design Compliance | 19-24 | 13 | 4 days |
| v3.2 Dashboard & Weather | 25-29 | 13 | 2 days |
| v4.0 Advanced Components | 30-36 | 24 | 2 days |
| v5.0 TypeScript Migration | 37-43 | 56 | 4 days |
| v5.1 Tech Debt & Quality | 44-48 | 39 | 2 days |
| v6.0 Operations & PWA | 49-54 | 29 | 2 days |

**Recent Trend (v6.0):**
- Phase 49: 4 plans
- Phase 50: 4 plans
- Phase 51: 4 plans
- Phase 52: 3 plans
- Phase 53: 5 plans
- Phase 54: 9 plans
- Trend: Stable velocity with comprehensive mode

**Recent Phase 57 Metrics:**

| Phase-Plan | Duration | Tasks | Files | Tests |
|------------|----------|-------|-------|-------|
| 57-01 | 4 min | 2 | 6 | 21 |
| 57-02 | 2 min | 2 | 4 | 4 |
| 57-03 | 4 min | 2 | 3 | 18 |

**Phase 57 Total:** 10 minutes, 3 plans, 13 files created/modified, 43 tests

**Recent Phase 56 Metrics:**

| Phase-Plan | Duration | Tasks | Files | Tests |
|------------|----------|-------|-------|-------|
| 56-01 | 6 min | 2 | 9 | 12 |
| 56-02 | 6 min | 2 | 8 | 13 |

**Phase 56 Total:** 12 minutes, 2 plans, 17 files created/modified, 25 tests

**Recent Phase 55 Metrics:**

| Phase-Plan | Duration | Tasks | Files | Tests |
|------------|----------|-------|-------|-------|
| 55-01 | 13 min | 2 | 4 | 39 |
| 55-02 | 3 min | 1 | 4 | 10 |
| 55-03 | 6 min | 2 | 4 | 10 |
| 55-04 | 8 min | 2 | 3 | 7 (4 passing) |
| 55-05 | 6 min | 4 | 9 | 0 (user verified) |

**Phase 55 Total:** 36 minutes, 5 plans, 24 files modified/created, 66 tests

*Updated 2026-02-12*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v7.0: Dynamic Firebase imports in middleware (avoid loading in routes that don't use idempotency)
- v7.0: Idempotency keys use Firebase RTDB dual storage (keys by ID + lookup by hash) with 1-hour TTL
- v7.0: Firebase keys sanitized by replacing forbidden chars with underscores
- v7.0: crypto.randomUUID() for idempotency key generation (UUID v4 format)
- v6.0: Firebase RTDB for rate limiting (transactions provide atomicity without Redis)
- v6.0: GitHub Actions for cron automation (5-min schedule operational)
- v6.0: Fire-and-forget analytics (errors logged but never thrown)
- v5.1: Parallel wave execution (5 agents in parallel for independent plans)
- v5.0: git mv for TS migration (preserves git blame and history)
- [Phase 55]: Map<string, number> for deduplication (not WeakMap)
- [Phase 55]: Error toasts are persistent (duration 0) to require explicit user acknowledgment
- [Phase 55]: useRetryableCommand is the single retry layer for all device commands (RETRY-06)
- [Phase 55]: One useRetryableCommand hook instance per command type (React hooks rules)
- [Phase 55]: Error banners at top of device cards (consistent with existing status banners)
- [Phase 56]: ValidationError bypasses error boundaries via instanceof check (safety-critical errors propagate)
- [Phase 56]: Error logging is operational, not analytics (no consent check required per GDPR)
- [Phase 56]: component_error events filtered from analytics aggregation (not usage statistics)
- [Phase 56]: react-error-boundary library over manual Error Boundary implementation (battle-tested, hooks support)
- [Phase 56]: Server Component (page.tsx) renders Client Component error boundaries (valid Next.js pattern)
- [Phase 56]: DEVICE_META map provides fallback for unknown device IDs (⚠️ icon, raw card.id)
- [Phase 57]: Progressive enhancement: useNetworkQuality returns 'unknown' (not 'fast') when API unavailable
- [Phase 57]: Visibility restore triggers immediate callback for fresh data without interval wait
- [Phase 57]: alwaysActive flag allows safety-critical features to poll even when tab hidden
- [Phase 57]: Ref pattern (Dan Abramov) for callback storage avoids stale closures in intervals
- [Phase 57]: Network multiplier: 30s fast/unknown, 60s slow for CronHealthBanner
- [Phase 57]: Two polling loops in CronHealthBanner: fetch + check (different concerns)
- [Phase 57]: StoveCard polling is safety-critical and NEVER pauses (only staleness display is visibility-aware)
- [Phase 57]: useDeviceStaleness pauses 5s IndexedDB polling when tab hidden (non-critical UI concern)
- [Phase 57]: Staleness badge only shows when tab visible AND data stale (no point showing when user can't see)

### Pending Todos

None yet.

### Blockers/Concerns

**v7.0 Planning Gaps (from research):**
- Playwright vs Cypress strategy decision needed for Phase 60 testing
- ~~Idempotency key storage design needed for Phase 55~~ ✓ RESOLVED: Firebase RTDB with dual storage pattern implemented
- Error boundary logging integration level (basic logEvent vs dashboard UI)
- Token cleanup migration path (extract to service vs new route)

## Session Continuity

Last session: 2026-02-12T14:01:40Z
Stopped at: Phase 57 (Adaptive Polling) COMPLETE — Plan 03 (Stove Staleness Integration)
Resume file: None

**Phase 57 Progress:**
- Plan 01: Adaptive Polling Foundation ✓ COMPLETE (4 min, 21 tests, commits b7c13b7, 6205766)
- Plan 02: Adaptive Polling Integration ✓ COMPLETE (2 min, 4 tests, commits 9a4f648, f973c7b)
- Plan 03: Stove Staleness Integration ✓ COMPLETE (4 min, 18 tests, commits ed7a0ff, fb3f650)

**Phase 56 Progress:**
- Plan 01: Error Boundaries Foundation ✓ COMPLETE (6 min, 12 tests, commits 16ba9e3, ef8fb4a)
- Plan 02: Feature-Level Error Boundaries ✓ COMPLETE (6 min, 13 tests, commits 12e5f3d, aa085ee)

**Phase 55 Progress (COMPLETE):**
- Plan 01: Core Retry Infrastructure ✓ COMPLETE (13 min, 39 tests, commits d711733, 2645c3d)
- Plan 02: Idempotency Manager ✓ COMPLETE (3 min, 10 tests, commit 54da7fa)
- Plan 03: Retry Hook Integration ✓ COMPLETE (6 min, 10 tests, commits f016b5e, 6f8f059)
- Plan 04: Idempotency Middleware ✓ COMPLETE (8 min, 7 tests, commit b66d13b)
- Plan 05: Retry Infrastructure Integration ✓ COMPLETE (6 min, 0 tests (user verified), commits 776eb03, b9c9eae, ac3f0ac)
