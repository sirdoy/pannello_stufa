# Project Research Summary

**Project:** Pannello Stufa v2.0 - Netatmo Schedule Management & Stove Monitoring
**Domain:** Smart Home PWA Integration (Thermostat Control + Appliance Monitoring)
**Researched:** 2026-01-26
**Confidence:** HIGH

## Executive Summary

v2.0 extends Pannello Stufa with comprehensive Netatmo thermostat schedule management and enhanced stove health monitoring. Research reveals this domain is well-understood with established patterns, but has critical integration pitfalls that must be avoided. The existing v1.0 architecture is fundamentally sound — **zero new npm dependencies are needed**. All features can be implemented by extending existing patterns: Vercel Cron for monitoring, React Context API for state, date-fns v4 for timezones, and the existing Netatmo API wrapper for schedule operations.

The recommended approach follows a backend-first strategy: establish API infrastructure and monitoring logic before building UI, test each integration independently, and avoid the most common pitfall — confusing temporary setpoint overrides with permanent schedule modifications. The existing `netatmoStoveSync.js` already uses the correct pattern (temporary overrides via `setRoomThermpoint`), so the architectural foundation is solid.

Key risks center on Netatmo API rate limiting (500 calls/hour per user), OAuth token lifecycle management (refresh token rotation), and alert fatigue from over-monitoring. Mitigation requires aggressive caching (5-minute TTL in Firebase), atomic token refresh with transaction semantics, and intelligent alert deduplication (3+ consecutive failures before notification). The existing v1.0 notification system and Firebase infrastructure provide the foundation to handle these concerns.

## Key Findings

### Recommended Stack

**Zero new dependencies required.** The v1.0 stack handles 95% of v2.0 requirements out of the box. Three key findings: (1) The existing `lib/netatmoApi.js` wrapper already implements all schedule CRUD endpoints (`createSchedule`, `switchHomeSchedule`, `syncHomeSchedule`), (2) Vercel Cron infrastructure extends naturally to stove monitoring without new services, (3) date-fns v4 has native timezone support via `TZDate`, eliminating the need for date-fns-tz.

**Core technologies (no changes):**
- **Next.js 16.1.0 + React 19.2.0**: App Router for schedule UI, API routes for CRUD — existing patterns extend naturally
- **Firebase Admin/Client SDK**: Schedule caching (RTDB), token storage (RTDB), notification history (Firestore) — additive schema, no migrations
- **Vercel Cron**: Extend existing `/api/scheduler/check` endpoint with stove health monitoring — same 1-minute frequency, same secret validation
- **date-fns v4.1.0**: Native timezone support via `TZDate` for Europe/Rome schedule parsing — no third-party timezone library needed
- **React Hook Form 7.54.2 + Zod 3.24.2**: Schedule editor form validation — same pattern as v1.0 notification preferences
- **React Context API**: Thermostat schedule state management — matches existing `VersionContext` pattern, zero new state library

**What NOT to add:**
- **node-cron**: Incompatible with Vercel serverless (requires long-running process)
- **Zustand**: Context API sufficient for <10 schedules, team already familiar
- **date-fns-tz**: Redundant, v4 has built-in timezone support

### Expected Features

Research shows users expect feature parity with Netatmo's official Home + Control app (2026) for schedule management, combined with stove monitoring capabilities comparable to Thermorossi's iControl interface. Critical distinction: temporary overrides (manual boost) must NOT modify schedules — they're time-limited setpoint adjustments that expire automatically.

**Must have (table stakes):**
- **View current active schedule**: Weekly timetable with time/temp pairs, zone breakdowns
- **Switch active schedule**: One-tap between saved schedules (Home, Away, Custom)
- **Temporary override**: "Boost to 22°C for 3 hours" without modifying schedule
- **Stove health status**: At-a-glance OK/Warning/Critical indicator
- **Connection monitoring**: Online/offline detection with last-seen timestamp
- **Error history**: Past errors with timestamps (extend v1.0 notification history)
- **Maintenance alerts**: Visual warnings when cleaning needed (already implemented)

**Should have (competitive differentiators):**
- **Stove-thermostat coordination**: Stove ignites → temporarily boost Netatmo setpoint (+2°C for 2h) via override, NOT schedule modification
- **Unified control dashboard**: Single page showing stove + thermostat side-by-side
- **Schedule conflict detection**: Warn if stove scheduler overlaps with thermostat schedule changes
- **Performance metrics**: Flame level, pellet consumption rate, temperature trends

**Defer (v2+):**
- **Create/edit custom schedules**: HIGH complexity (time conflict detection, multi-day UI, validation) — official Netatmo app already provides excellent editor
- **Multi-zone management**: Complex UI patterns, requires per-valve API calls
- **Predictive maintenance**: Requires 90+ days operating data, ML/heuristics
- **Energy correlation analysis**: Requires historical data warehousing infrastructure

**Rationale for MVP scope:** Read + switch + temporary override covers 80% of daily use cases. Full schedule editor is complex and users already have Netatmo's official app. Validate demand before investing in elaborate CRUD UI.

### Architecture Approach

Extend existing v1.0 patterns with three new service layers: `NetatmoScheduleService` for schedule CRUD with caching, `StoveMonitorService` for health checks and drift detection, and enhanced `NetatmoStoveSync` coordination logic. Architecture follows established repository pattern (service → repository → Firebase) with cache-aside strategy (5-min TTL) to avoid Netatmo rate limits.

**Major components:**
1. **NetatmoScheduleService** — Schedule CRUD operations with cache-aside pattern, 5-minute TTL in Firebase RTDB, invalidation on writes
2. **StoveMonitorService** — Health checks (connection status, unexpected shutdowns, sync drift), runs in cron every minute, logs to `monitoring/` Firebase path
3. **API Routes (`/api/netatmo/schedules/*`)** — REST endpoints for schedule management (GET list, POST create, PUT update, DELETE), thin controllers delegating to service layer
4. **Enhanced Cron Logic** — Extend `/api/scheduler/check` with stove health monitoring, thermostat-stove sync enforcement, dead man's switch heartbeat
5. **ThermostatScheduleContext** — React Context for client-side schedule state (matches existing `VersionContext` pattern), realtime Firebase listeners

**Key architectural decisions:**
- **NEVER modify schedules programmatically** — Only users via UI. Automation uses temporary setpoint overrides with `mode='manual'` and `endtime`
- **Service layer abstraction** — Separate business logic (services) from data access (repositories) and transport (API routes) for testability
- **Cache-aside with TTL** — Cache Netatmo API responses in Firebase (5 min), invalidate on write, avoid rate limits (500/hour)
- **Fire-and-forget for non-critical tasks** — Cron executes blocking scheduler logic, then fires async tasks (valve calibration, token refresh, notifications)
- **Polling with exponential backoff** — Client polls monitoring state every 60s, doubles backoff on error (max 5 min)

### Critical Pitfalls

Research identified 6 CRITICAL pitfalls and 4 MODERATE pitfalls. Top failures come from Netatmo API rate limiting (changed behavior in 2026 with multi-user apps), OAuth token rotation invalidating old refresh tokens, and confusing setpoint overrides with schedule modifications.

1. **Netatmo Rate Limiting (CRITICAL)** — 500 calls/hour per user, but shared OAuth apps get lower limits. Avoid: Poll thermostat at 60s (not 5s like stove), cache schedules in Firebase (5-min TTL), batch multi-room operations, track API call count with 80% warning threshold
2. **Setpoint Override vs Schedule Modification (CRITICAL)** — Using `switchSchedule` API instead of `setThermpoint` for temporary overrides corrupts user schedules permanently. Avoid: NEVER modify schedules programmatically, use `setThermpoint` with `mode='manual'` and `endtime`, visual UI indicators for "Override active until 18:00"
3. **OAuth Token Refresh Rotation (CRITICAL)** — Netatmo rotates BOTH access_token AND refresh_token on every refresh, old tokens immediately invalidated. Avoid: Always save new refresh_token from response, use Firebase transaction for atomic updates, deduplicate concurrent refresh attempts with in-memory lock
4. **Cron Silent Failures (CRITICAL)** — Cron job stops running but no alerts triggered, monitoring fails silently for hours. Avoid: Store `lastRunAt` timestamp in Firebase (heartbeat), dead man's switch alerts if >10 minutes, log every execution with status, trigger admin notification on failure
5. **State Sync Race Conditions (CRITICAL)** — Stove state changes rapidly, multiple sources modify thermostat simultaneously, final state unpredictable. Avoid: Debounce stove state changes (2 minutes stable before sync), timestamp-based conflict resolution, user override priority (don't auto-sync for 30 min after manual change)
6. **Alert Fatigue (CRITICAL)** — 50 notifications/hour from transient issues, user disables all alerts at OS level. Avoid: Alert deduplication (max 1 per 30 min for same issue), only alert on 3+ consecutive failures (not transient), severity-based rate limiting (CRITICAL: 10/hour, ERROR: 5/hour, WARNING: 1/hour)

**Moderate pitfalls:** Schedule CRUD without validation (overlapping time slots), polling frequency trade-offs (battery vs responsiveness), multi-room coordination partial failures (some rooms sync, others don't), environment variable confusion (dev vs prod credentials mixed).

## Implications for Roadmap

Based on research dependencies and architectural constraints, recommend **5 phases** following backend-first approach. Foundation phases (1-2) establish API infrastructure and monitoring logic independently of UI complexity. Integration phase (3) is the critical risk area where setpoint override semantics must be correct. UI phases (4-5) consume stable backend APIs.

### Phase 1: Netatmo Schedule API Infrastructure
**Rationale:** Backend-first allows testing schedule operations independently of UI complexity. Establishes cache-aside pattern, rate limiting, and token refresh logic that all later phases depend on.

**Delivers:**
- `NetatmoScheduleService` with schedule CRUD operations
- Firebase caching layer (5-min TTL, invalidation on writes)
- API routes (`/api/netatmo/schedules/*`) with validation
- Rate limiter (500 calls/hour tracking with 80% warning)
- Atomic token refresh with transaction semantics

**Addresses:** Table stakes feature "View current schedule", avoids Pitfall #1 (rate limiting) and Pitfall #3 (token refresh)

**Avoids:** Netatmo rate limit violations, token rotation issues, unbatched API calls

**Research Flag:** LOW — Netatmo API well-documented, existing wrapper has all endpoints

### Phase 2: Stove Health Monitoring Backend
**Rationale:** Monitoring logic informs alert UI requirements. Implementing backend first reveals which metrics matter and what alert thresholds make sense before building dashboard.

**Delivers:**
- `StoveMonitorService` with health checks, drift detection, connection monitoring
- Firebase `monitoring/` schema (currentHealth, issues log, cron heartbeat)
- Cron integration in `/api/scheduler/check` with dead man's switch
- Alert evaluation logic (deduplication, severity-based rate limiting)
- Execution logging with heartbeat tracking

**Addresses:** Table stakes features (health status, connection monitoring, error history), avoids Pitfall #4 (cron silent failures) and Pitfall #6 (alert fatigue)

**Avoids:** Silent monitoring failures, notification spam, missing dead man's switch

**Research Flag:** LOW — Standard monitoring patterns, existing cron infrastructure extends naturally

### Phase 3: Stove-Thermostat Integration Correction
**Rationale:** Fix the critical semantic distinction between temporary overrides and schedule modifications. This is the highest-risk phase — getting it wrong corrupts user schedules permanently.

**Delivers:**
- Verify `NetatmoStoveSync.syncLivingRoomWithStove()` uses setpoint override (already correct)
- Continuous enforcement logic in cron (re-apply overrides if drifted)
- Debouncing (2 minutes stable stove state before sync)
- User override detection (manual thermostat changes block auto-sync for 30 min)
- State machine tracking (idle → pending → synced → user_override)

**Addresses:** Differentiator feature (stove-thermostat coordination), avoids Pitfall #2 (setpoint vs schedule confusion) and Pitfall #5 (race conditions)

**Avoids:** Permanent schedule corruption, rapid state oscillation, fighting user manual changes

**Research Flag:** MEDIUM — Existing code already correct but needs verification, debouncing and conflict resolution are novel

### Phase 4: Schedule Management UI
**Rationale:** UI depends on stable backend from Phase 1. Focus on read-only display + schedule switching first, defer complex schedule editor to post-MVP.

**Delivers:**
- `ThermostatScheduleContext` (React Context matching VersionContext pattern)
- Schedule display components (weekly timetable, zone breakdown)
- Schedule selector dropdown in ThermostatCard
- Temporary override form ("Boost to 22°C for 3 hours")
- Form validation with React Hook Form + Zod

**Addresses:** Table stakes features (view schedule, switch schedule, temporary override)

**Avoids:** Complex schedule editor UI (defer to official Netatmo app)

**Research Flag:** LOW — Standard form patterns, existing v1.0 form components reusable

### Phase 5: Monitoring Dashboard & Alerts UI
**Rationale:** UI depends on monitoring backend from Phase 2. Dashboard surfaces INFO/WARNING in UI without notifications, alerts trigger for CRITICAL/ERROR only.

**Delivers:**
- `StoveMonitorBanner` component for health alerts
- Monitoring history dashboard (execution log, issue timeline)
- New notification triggers (`triggerStoveConnectionLostServer`, `triggerStoveDriftServer`)
- Per-room sync status display
- Cron health visualization (last run, execution duration trends)

**Addresses:** Table stakes features (maintenance alerts, error history), differentiator (unified control dashboard)

**Avoids:** Alert fatigue by surfacing low-severity issues in UI only

**Research Flag:** LOW — Extend existing v1.0 notification system, standard dashboard patterns

### Phase Ordering Rationale

- **Backend-first reduces UI rework risk** — Testing schedule API operations independently (Phase 1) surfaces edge cases before UI is built. Monitoring logic (Phase 2) informs what alerts actually matter.
- **Critical integration isolated** — Phase 3 focuses solely on setpoint override semantics, the highest-risk area. Separating from UI allows thorough testing of state machine logic.
- **Dependency chain respected** — Phase 4 (Schedule UI) requires Phase 1 (API infrastructure). Phase 5 (Monitoring UI) requires Phase 2 (Monitoring backend). Integration (Phase 3) is independent and can be parallelized.
- **MVP scope validated** — Deferring schedule editor to post-MVP (not in phases 1-5) allows validating demand before investing 10-12 hours in complex form UI. Official Netatmo app already provides excellent editor.

### Research Flags

**Phases likely needing deeper research:**
- **Phase 3 (Stove-Thermostat Integration)** — Novel coordination patterns, debouncing and conflict resolution strategies need validation. Existing code appears correct but multi-room atomicity and rollback need research.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Netatmo API Infrastructure)** — Well-documented API, existing wrapper has all endpoints, cache-aside is standard pattern
- **Phase 2 (Monitoring Backend)** — Standard monitoring patterns, existing cron infrastructure, Firebase schema is additive
- **Phase 4 (Schedule UI)** — React Context, React Hook Form, form validation — all standard patterns with v1.0 precedents
- **Phase 5 (Monitoring UI)** — Dashboard components, notification triggers — extend existing v1.0 notification system

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified in current codebase, zero new dependencies needed, existing patterns extend naturally |
| Features | HIGH | Netatmo official docs + Thermorossi API well-documented, user expectations clear from 2026 Home + Control app research |
| Architecture | HIGH | Existing v1.0 patterns (repository, cache-aside, fire-and-forget) apply directly, service layer abstraction is standard |
| Pitfalls | HIGH | Netatmo community discussions reveal consistent failure patterns (rate limiting, token rotation, schedule confusion), documented with official sources |

**Overall confidence:** HIGH

All four research files are based on verified sources: official Netatmo API documentation, existing codebase analysis (v1.0 implementation patterns), 2026 web research for monitoring best practices, and community issue discussions revealing real-world failure modes. The recommendation to use existing infrastructure (zero new dependencies) is validated by line-by-line analysis of current code showing all necessary capabilities already present.

### Gaps to Address

**Multi-room atomicity during partial failures:** Phase 3 needs research on rollback strategies when 3 rooms configured but API call fails for room #2 after room #1 succeeds. Research suggests batch operations or transaction pattern, but Netatmo API documentation doesn't specify batch endpoints for setpoint operations. **Resolution:** During Phase 3 planning, run `/gsd:research-phase "Multi-room thermostat setpoint coordination"` to investigate Netatmo API batch capabilities and rollback patterns.

**Adaptive polling strategy for background PWA:** Phase 1 recommends 60s foreground / 5min background polling, but iOS PWA background behavior is inconsistent (sometimes stops polling entirely). **Resolution:** Phase 4 implementation should test Page Visibility API behavior on iOS Safari 17+ and adjust polling strategy based on actual background execution patterns.

**Alert deduplication tuning:** Phase 2 proposes 3+ consecutive failures before alerting, but optimal threshold depends on failure frequency distribution (not available until system runs in production). **Resolution:** Start conservative (3 failures), log alert evaluation decisions to Firebase, adjust threshold based on 7-day production data.

**Schedule cache invalidation timing:** 5-minute TTL balances freshness vs rate limits, but if user edits schedule in official Netatmo app, PWA shows stale data for up to 5 minutes. **Resolution:** Phase 4 UI should have manual refresh button for schedule list, consider reducing TTL to 2 minutes if rate limit headroom exists after 30-day monitoring.

## Sources

### Primary (HIGH confidence)
- **Current codebase** (`lib/netatmoApi.js`, `lib/netatmoStoveSync.js`, `/api/scheduler/check/route.js`) — Verified existing implementation patterns, API wrapper functions, service architecture
- **Netatmo Developer Documentation** (dev.netatmo.com) — Energy API, schedule management endpoints, OAuth flow, rate limiting policies
- **Vercel Cron Documentation** (vercel.com/docs/cron-jobs) — Serverless cron patterns, function duration limits, secret validation
- **date-fns v4 Documentation** (date-fns.org) — TZDate timezone support, format functions, v4 migration guide

### Secondary (MEDIUM confidence)
- **Netatmo Community Helpcenter** — Rate limiting discussions (error 26), token refresh issues, schedule vs override confusion patterns
- **Home Assistant Netatmo Integration** (github.com/home-assistant/core) — Issue #158845 on rate limits, community integration patterns
- **Thermorossi iControl Documentation** — Available monitoring features, error codes, performance metrics
- **2026 Cron Monitoring Guides** (dev.to, betterstack.com) — Dead man's switch patterns, execution logging, health check endpoints
- **Smart Home Best Practices** (Energy.gov, SmartHomeWizards) — Thermostat programming patterns, override semantics, alert fatigue reduction

### Tertiary (LOW confidence — needs validation)
- **Distributed systems race condition patterns** (Medium articles) — Timestamp-based conflict resolution, state machine approaches
- **IoT monitoring trends** (UptimeRobot, Netdata blogs) — 2026 monitoring patterns, polling vs webhooks trade-offs

---
*Research completed: 2026-01-26*
*Ready for roadmap: yes*
*Total research files synthesized: 4 (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)*
