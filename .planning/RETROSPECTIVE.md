# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v10.0 — Netatmo API Migration

**Shipped:** 2026-03-16
**Phases:** 9 | **Plans:** 18

### What Was Built
- New Netatmo proxy client replacing OAuth with API Key auth (X-API-Key header)
- All 28 Netatmo endpoints migrated: energy (7), camera (6), valve (2), health (2), API client (4), cleanup (7)
- Dead OAuth infrastructure removed: token helper, credentials, rate limiter, cache service, callback route, coordination chain
- Audit-driven gap closure: 4 phases (80-83) fixing integration issues found post-migration

### What Worked
- Parallel agent execution across independent phases (75-78 all depend on 75 only, so 76-78 could run in parallel)
- Milestone audit caught 2 critical integration gaps (home_id missing, camera toggle missing) before shipping — prevented runtime-breaking production bugs
- Server-side proxy pattern (same as Fritz!Box) was a well-known pattern that made migration straightforward
- Gap closure phases were small and focused (1-2 plans each), quick to plan and execute

### What Was Inefficient
- Phase 76 verification marked ENERGY-03/04 as "passed" at route level, missing that frontend callers were broken — verification needs to check E2E flow, not just route
- Audit was needed twice (first audit found 4 gaps, then re-audit found 2 more) — ideally audit catches all gaps in one pass
- SUMMARY frontmatter quality inconsistent — some plans missing one_liner, requirements_completed fields

### Patterns Established
- Audit-driven gap closure: run `/gsd:audit-milestone` → create gap closure phases → re-verify → ship
- Proxy client as function module (not class) — simpler for stateless API key auth
- homeId threading as optional prop through component trees — single source of truth from topology

### Key Lessons
1. **Phase verification must check E2E flows, not just individual routes** — a route passing tests doesn't mean the frontend caller passes the right data
2. **Milestone audits are essential** — they caught integration gaps that phase-level verification missed
3. **Net negative LOC is a sign of healthy cleanup** — v10.0 deleted more code than it added (-3,848 lines net)
4. **Gap closure phases should be planned during original roadmap** — budget 1-2 phases for integration fixes after migration work

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 9 phases in 2 days — fast for a migration milestone, partly because proxy pattern was established

---

## Milestone: v11.0 — API Unification & Raspberry Pi Monitor

**Shipped:** 2026-03-18
**Phases:** 8 | **Plans:** 13

### What Was Built
- Shared HomeAssistant API client (`haGet`/`haPost`) replacing duplicated fetch logic in Fritz!Box and Netatmo clients
- Fritz!Box and Netatmo migrated to shared transport — JWT login and separate env vars eliminated
- Raspberry Pi as 5th monitored device: API layer, dashboard card, /raspi detail page, cron health integration
- Camera snapshot 302 redirect and schedule 503 retry bug fixes formally verified

### What Worked
- Shared client extraction (Phase 84) before migration (85-86) was clean — both providers migrated independently with no conflicts
- knip-based dead export verification (Phase 87) caught 4 unused exports that would have been tech debt
- Raspberry Pi phases (88-90) followed established patterns (Fritz!Box had paved the way) — device registry, orchestrator hooks, presentational components all reused
- Bug fix verification phase (91) efficiently formalized debug session work without re-coding anything

### What Was Inefficient
- SUMMARY frontmatter `requirements_completed` consistently empty across 7/8 phases — executor agents not populating this field
- Nyquist validation still not completing during execution — 0/8 phases compliant despite validation infrastructure existing
- STATE.md progress percent stuck at 43% even though all phases were complete — frontmatter not kept in sync

### Patterns Established
- Shared API client extraction → provider migration → cleanup as a 3-step pattern for transport unification
- New device onboarding path: types → client → routes → hook → card → page → cron (7-step sequence, phases 88-90)
- Informational cron checks (console.warn, isolated try/catch) for non-safety-critical devices

### Key Lessons
1. **Established patterns accelerate new devices** — Raspberry Pi integration was fast because Fritz!Box had established the proxy/card/page/cron pattern
2. **Transport unification should happen before adding new devices** — having the shared client ready meant Raspberry Pi could use it directly
3. **Debug session formalization is valuable** — Phase 91 converted ad-hoc fixes into documented, verified, maintainable code
4. **SUMMARY frontmatter quality needs attention** — executor agents should populate requirements_completed during plan execution

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 8 phases in 2 days — fast execution, partly because established patterns reduced research/planning overhead

---

## Milestone: v11.1 — Test Suite & Tech Debt Cleanup

**Shipped:** 2026-03-18
**Phases:** 4 | **Plans:** 9

### What Was Built
- Jest runner scoped correctly: Playwright .spec.ts excluded, test ordering independence verified with `test:random`
- 12 failing test suites fixed across API/infrastructure (8) and component/hook (4) layers — 37 tests total
- ~179 useMemo/useCallback call-sites removed across 63 files (React Compiler handles it)
- 8 stale environment variables deleted from .env.local

### What Worked
- Foundational-first ordering: Phase 92 (Jest config) before 93-94 (test fixes) before 95 (cleanup) prevented cascading failures
- Root cause analysis on each failing suite (not just patching assertions) — e.g., TFIX-01 was two separate issues (dynamic import + missing NextResponseMock properties)
- Phase 95 ran last (after all tests green) so memoization removal could be verified against a clean baseline
- Small focused plans (1-2 tasks each, most completing in seconds to minutes) — fast cycle times

### What Was Inefficient
- summary-extract tool returned null for all one_liners — frontmatter field either missing or not in expected format
- STATE.md progress percent stuck at 0% despite all 9 plans being complete — same frontmatter sync issue from v11.0
- Phase 95-02 needed a small follow-up commit (CameraEventsPage.tsx) caught during documentation — easy to miss files in large refactoring sweeps

### Patterns Established
- `resetAllMocks` + explicit `beforeEach` resets as standard for preventing mock bleed between tests
- Static imports required for Jest mock interception — dynamic `await import()` bypasses module mocks
- getByRole (not getByText) for testing disabled state on buttons (inner span has no disabled attribute)

### Key Lessons
1. **Mock bleed is the #1 flaky test cause** — clearAllMocks doesn't reset mockReturnValue, only call counts. Use resetAllMocks or explicit beforeEach.
2. **React Compiler makes manual memoization pure tech debt** — removal across 63 files caused zero test failures
3. **Cleanup milestones are fast** — 4 phases, 9 plans, 1 day. Budget them after feature milestones to keep the codebase healthy.
4. **SUMMARY frontmatter needs standardization** — one_liner field not consistently populated, affecting milestone tooling

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: Entire milestone completed in 1 day — smallest milestone yet (net -264 LOC), typical for cleanup work

---

## Milestone: v12.0 — Data Fetching Simplification & E2E Verification

**Shipped:** 2026-03-19
**Phases:** 3 | **Plans:** 4

### What Was Built
- Stove hook rewritten: Firebase RTDB real-time listener + sync-external-state replaced with useAdaptivePolling(60s, alwaysActive:true)
- All device hooks unified to 60s intervals (from 30s), useDeviceStaleness polling reduced from 5s to 60s
- Playwright E2E smoke tests for all 9 app pages with console error collection
- Audit gap closure: stale test assertion, Playwright selector fixes, JSDoc cleanup

### What Worked
- Smallest milestone yet in scope (3 phases, 4 plans) — focused and well-scoped
- Milestone audit ran before shipping, caught 2 integration gaps that Phase 98 fixed cleanly
- useAdaptivePolling was already battle-tested across 4 devices, so stove migration was straightforward
- Playwright page-load tests are a good foundation for future E2E expansion

### What Was Inefficient
- Phase 98 gap closure could have been avoided if Phase 96 executor had caught the stale test assertion (30000→60000ms) during execution
- SUMMARY one_liner field still not populated by extractors — recurring issue across milestones

### Patterns Established
- collectConsoleErrors helper for Playwright: attach before goto, cleanup before assertion
- Stove-specific staleness thresholds (90s on, 180s off) via optional thresholdMs parameter
- E2E-09 /admin maps to /debug — requirement mapping should document route aliases

### Key Lessons
1. **Polling unification is simple when the abstraction exists** — useAdaptivePolling made all device hooks consistent with minimal code changes
2. **Removing Firebase RTDB listener simplifies architecture** — stove hook went from dual data source (RTDB + polling) to single source (polling)
3. **Playwright smoke tests are cheap to add** — 1 plan for 9 pages, 59s execution. Worth adding early.
4. **Gap closure phases are getting smaller** — from 4 phases (v10.0) to 1 phase (v12.0), showing improved execution quality

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 3 phases in 2 days — lightweight milestone, no complex migrations or architecture changes

---

## Milestone: v13.0 — Thermorossi Proxy Migration

**Shipped:** 2026-03-20
**Phases:** 7 | **Plans:** 11

### What Was Built
- Thermorossi proxy client via shared haGet/haPost transport (completing unified API architecture for all 4 providers)
- All read and control endpoints migrated with typed proxy wrappers, 202 Accepted pattern for commands
- Frontend hooks rewritten: stove_state exact equality (switch/case), data_freshness staleness, 409 Conflict handling
- Scheduler/cron fully migrated: single getStatus() call, alarm detection, proxy health tracking
- WiNet infrastructure deleted: stoveApi, sandbox, dead routes, API key, service worker cache rule
- Gap closure: body key mismatch (Phase 104) and debug panel URL fixes (Phase 105)

### What Worked
- Proxy client pattern well-established by v10.0/v11.0 — thermorossiProxy.ts followed exact same function module pattern
- Milestone audit caught 3 integration breaks (BROKEN-01, BROKEN-02, BROKEN-03) before shipping — all fixed by gap closure phases
- Small focused gap closure phases (1 plan each) resolved issues in minutes
- switch/case on TypeScript union type provides compile-time exhaustiveness — any future stove_state addition will cause tsc error

### What Was Inefficient
- SUMMARY frontmatter still not populated with requirements-completed or one_liner — 4th consecutive milestone with this issue
- Nyquist validation 0/7 phases compliant — validation infrastructure exists but executor agents skip it
- Phase 101 useStoveCommands used shorthand `{ level }` instead of `{ value: level }` — subtle JavaScript object shorthand bug that audit caught
- staleness.cachedAt remains null (dead code) — known issue documented but not fixed

### Patterns Established
- 202 Accepted + suggested_poll_delay_s as command response pattern (15s ignite/shutdown, 5s settings adjustments)
- stove_state exact equality (TypeScript union + switch/case) replacing regex/substring matching
- Single proxy status call replacing multi-endpoint Promise.all (proxy bundles power_level + fan_level in status)

### Key Lessons
1. **Object shorthand is a subtle trap** — `{ level }` creates key `level`, not `value`. Audit caught this; tests didn't because they mocked at wrong layer.
2. **Debug panel URLs need to match file-system routes** — when routes change during migration, debug panel POST URLs must be updated in the same phase.
3. **Proxy migration is now a well-paved path** — v10.0 Netatmo took 9 phases, v13.0 Thermorossi took 5 core phases + 2 gap closure. Pattern maturity reduces scope.
4. **SUMMARY frontmatter quality remains the top tooling gap** — one_liner and requirements-completed consistently empty, blocking milestone tooling.

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 7 phases in 2 days — fast execution, proxy pattern fully established. Gap closure phases completed in minutes.

---

## Milestone: v14.0 — Hue Proxy Migration

**Shipped:** 2026-03-22
**Phases:** 7 | **Plans:** 12

### What Was Built
- Hue proxy client (`hueProxy.ts`) with typed wrappers for all 10 endpoints via shared haGet/haPost/haPut transport
- All read endpoints migrated: lights, groups, scenes, health, history with data_freshness/capability_tier enrichment
- All control endpoints migrated with 202 Accepted + suggested_poll_delay_s + 409 Conflict handling
- Frontend hooks rewritten: useLightsData reads flat format, useLightsCommands sends v1 body (on/bri/ct/xy)
- Legacy Hue infrastructure deleted: CLIP v2 client, remote API, OAuth, bridge discovery/pairing, connection strategy, 3 env vars
- Audit-driven gap closure (3 phases): full pages rewritten, xy type field added, debug panel method/URL fixes

### What Worked
- Proxy migration is now a fully paved path — v14.0 Hue followed exact same pattern as v10.0 Netatmo and v13.0 Thermorossi
- haPut transport added cleanly as copy of haPost with method PUT — consistent with codebase pattern, no unnecessary abstraction
- 3 audit rounds caught 7 integration gaps (INT-01 through INT-DEBUG-METHOD) before shipping — all resolved
- Full pages (lights/page.tsx, scenes/page.tsx) successfully delegated to proxy hooks after gap closure
- CLIP v1 flat body format via proxy dramatically simplified frontend code vs CLIP v2 nested objects

### What Was Inefficient
- 3 audit rounds were needed (vs 1-2 for previous milestones) — full pages and debug panel were blind spots not caught initially
- Phase 109 cleanup left `remoteApiAvailable = false` dead constant in lights/page.tsx — Phase 110 had to remove it
- Debug panel HueTab issues (wrong method, wrong URL, wrong field names) persisted through 2 audit rounds before being addressed in Phase 112
- SUMMARY frontmatter quality still inconsistent — 5th consecutive milestone with this issue

### Patterns Established
- haPut as 3rd transport method alongside haGet/haPost — all 5 device providers now use the shared transport
- callPutEndpoint pattern in debug panels mirroring callPostEndpoint — consistent fetch wrapper for debug tools
- 3-round audit for complex migrations — core phases → full page gaps → debug panel gaps

### Key Lessons
1. **All 5 providers unified** — Thermorossi, Netatmo, Fritz!Box, Raspberry Pi, Hue all use shared haGet/haPost/haPut. No direct device APIs remain.
2. **Full pages are a blind spot** — migration phases focused on hooks and routes, but full pages (lights/page.tsx) used legacy patterns that hooks refactoring didn't touch. Budget a full-page verification pass.
3. **Debug panels lag behind production code** — debug panel URLs, methods, and field names were stale after migration. Treat debug panels as first-class consumers during migration.
4. **Gap closure is getting more granular** — v10.0 had 4 gap closure phases, v13.0 had 2, v14.0 had 3 but each was smaller (1 plan). The issues are smaller but more numerous.

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 7 phases in 2 days — consistent with v10.0 and v13.0 migration pace. All proxy migrations converging on 2-day timeline regardless of provider complexity.

---

## Milestone: v14.1 — Tech Debt & Type Safety

**Shipped:** 2026-03-22
**Phases:** 5 | **Plans:** 9

### What Was Built
- All 6 known issues from v14.0 audit resolved (HueTab field names, stove staleness dead code, StoveState typing, CopyableIp design system Button, FormModal isolation flake)
- Zero `as any` casts in production code: generic `adminDbGet<T>()`, browser API type aliases, icon prop widening, variant unions, sw.ts global augmentations
- 50+ unused exports removed across 32 files, lib/core barrel pruned from 18→9 re-exports
- STARTING grace period tracking in healthMonitoring with Firebase RTDB timestamp, notificationService disabled block deleted

### What Worked
- Layered approach (lib/ → components → routes/pages → cleanup) prevented cascading type errors — each layer was clean before the next started
- Research phase correctly identified all `as any` occurrences with grep, so plans were accurately scoped
- Known issues phase first was the right call — fixed debug panel/typing bugs that would have complicated type safety work
- Dead code cleanup last ensured no unused exports were accidentally created during type safety work

### What Was Inefficient
- SUMMARY one_liner extraction still broken for some plans — summary-extract returns null or partial fragments. 6th consecutive milestone with this issue.
- Nyquist validation still skipped across all 5 phases — validation infrastructure exists but is never exercised
- Some phase CONTEXT.md files were created but never committed (showing as untracked in git status)

### Patterns Established
- Generic `adminDbGet<T>()` as standard for typed Firebase reads — eliminates `as any` at all call sites with a single API change
- Browser API type aliases (`NetworkInformation`, `NotificationWithMaxActions`) instead of `declare global` — less intrusive, scoped to usage
- De-export pattern: remove `export` keyword but keep function if internally used — smaller public API without breaking internals
- WeakSet for private component state (`_warned` tracking) instead of module-level variables

### Key Lessons
1. **Type safety is cumulative** — v5.0 (migration), v5.1 (strict), v14.1 (zero `as any`) are 3 distinct quality levels. Each builds on the previous.
2. **`as any` in test files is acceptable tech debt** — ~309 test file occurrences are legitimate mock patterns. Trying to eliminate these would be diminishing returns.
3. **Known issues should be fixed before type refactoring** — fixing bugs first prevents type work from being complicated by stale/broken code
4. **Cleanup milestones in 1 day** — v14.1 (5 phases, 9 plans) completed same day as v14.0 shipped. Cleanup is fast when well-scoped.

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: Entire milestone completed in 1 day (same day as v14.0 shipped) — 5 phases, 9 plans, 125 files changed

---

## Milestone: v15.0 — Rooms & Device Registry

**Shipped:** 2026-03-23
**Phases:** 8 | **Plans:** 13

### What Was Built
- Device Registry typed proxy client (registryProxy.ts) + 8 API route proxies with public GET / protected mutation auth tiers
- Rooms typed proxy client (roomsProxy.ts) + 11 API route proxies with haDelete transport for resource deletion
- Device Types CRUD page (/registry/types) with Zod validation, built-in protection, Italian locale sorting
- Device Registry page (/registry/devices) with paginated list, provider filter, register/update/unregister, health stats
- Room Management page (/rooms) with create/edit/delete, device assignment/removal workflows
- Whole-house status page (/rooms/status) with per-room cards, provider-specific live metrics, manual refresh
- Navigation menu links (Registro + Stanze) wired into GLOBAL_SECTIONS

### What Worked
- Established patterns made proxy clients fast — registryProxy and roomsProxy followed exact same function module pattern as previous providers
- haDelete transport was a clean single-method addition to haClient.ts — no refactoring needed
- FormModal + ConfirmationDialog + DataTable reuse across all CRUD pages — same component pattern worked for types, devices, rooms
- Milestone audit caught missing nav menu entry — gap closure Phase 125 fixed it in 1 plan
- Italian locale sorting (localeCompare 'it') applied consistently across all list pages from the start

### What Was Inefficient
- SUMMARY one_liner field still inconsistently populated — 7th consecutive milestone with this issue
- Nyquist validation 0/8 phases compliant — all have VALIDATION.md but in draft status
- Some inline hooks (useDeviceTypesForSelect, useRegistryDevicesForSelect) duplicate fetching logic — could be shared
- Phase 124 renders null for unavailable device data — could show a more informative placeholder

### Patterns Established
- haDelete as 4th transport method (haGet/haPost/haPut/haDelete) — complete REST verb coverage
- PaginatedResponse<T> in types/common.ts — shared pagination type reusable across all paginated APIs
- FormModal render-prop with Control<T> for typed react-hook-form integration
- Badge variant convention: ocean = built-in, neutral = custom for taxonomy items
- Manual refresh (no polling) for status pages — Aggiorna button triggers refetch only

### Key Lessons
1. **UI CRUD pages follow a repeatable template** — DataTable + FormModal + ConfirmationDialog + custom hook is the standard pattern for entity management
2. **Gap closure is converging to 1 phase** — v10.0 needed 4, v13.0 needed 2, v14.0 needed 3, v15.0 needed 1. Execution quality is improving.
3. **Proxy client is now a 15-minute task** — function module pattern so well-established that client creation is near-mechanical
4. **Navigation is easy to forget** — pages existed but weren't reachable from the menu. Audit is essential for catching UX completeness gaps.

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Notable: 8 phases in 2 days — first greenfield UI milestone (not migration), same pace as previous milestones

---

## Milestone: v16.0 — Sonos, DIRIGERA & Fritz!Box Avanzato

**Shipped:** 2026-03-26
**Phases:** 13 | **Plans:** 26

### What Was Built
- Sonos full integration: sonosProxy.ts (28 functions), 23 API routes, 5 hooks, 12+ components — transport, EQ, queue, grouping, sleep timer, seek, history
- DIRIGERA sensor integration: dirigeraProxy.ts (5 functions), 5 API routes, 2 hooks, 5 components — contact/motion sensors, summary, filtering
- Fritz!Box advanced endpoints: 13 new routes (system, WiFi clients/networks, DHCP, port forwarding, UPnP, mesh, bandwidth history tiers, budget stats)
- 3 provider frontends: /sonos page (zone-based playback + extended controls), /dirigera page (sensor list + filter), enhanced /network page
- 2 new dashboard cards: SonosCard (now playing + zone status) and DirigeraCard (sensor summary)
- Phase 138 gap closure: fixed nav 404s, wired orphaned routes (devices fetch, zone volume, seek control)

### What Worked
- Sonos and DIRIGERA proxy clients followed the exact same function module pattern — created in minutes
- Provider onboarding (types → proxy → routes → hooks → card → page) is now a fully mechanical path — 7th provider (DIRIGERA) was trivial
- Fritz!Box extensions built on existing infrastructure (phases 61-67) — 13 new routes added without touching existing ones
- Promise.allSettled pattern for zone/speaker batch fetches — resilient to partial Sonos outages
- Milestone audit caught 4 integration gaps pre-ship, all fixed by Phase 138 gap closure
- Largest milestone by plan count (26 plans, 13 phases) completed in 4 days — pattern maturity pays off

### What Was Inefficient
- SUMMARY one_liner field still broken across most phases — 8th consecutive milestone with this issue, now a permanent tooling gap
- Nyquist validation 0/13 phases compliant — all have VALIDATION.md but none pass compliance check
- 26 human verification items accumulated across 7 phases — all requiring live devices that can't be automated
- Phase 135 human_needed status for 3 visual items (shuffle/repeat styling, sleep timer countdown, queue expand) — can't be CI-verified
- Some CONTEXT.md files untracked in git (not committed during phase execution)

### Patterns Established
- Zone-based UI architecture for multi-room audio (zone → speakers → controls hierarchy)
- SonosSeekControl isDragging ref pattern — prevents position sync during slider drag
- 250ms debounce on volume sliders with optimistic local state — smooth UX without API flooding
- DeviceCountChart via next/dynamic (ssr:false) — consistent with existing Recharts code-splitting
- Auto-granularity for history routes (Fritz!Box and Sonos) — user doesn't need to choose resolution
- Tab navigation with ember-400 border-b-2 active styling — consistent tab pattern for multi-section pages

### Key Lessons
1. **Largest milestone ships in same timeframe** — 26 plans in 4 days (vs 13 plans in 2 days for v15.0). Pattern maturity keeps pace constant regardless of scope.
2. **Human verification is the remaining testing gap** — 26 items across 7 phases all require live devices. No CI automation possible for physical hardware interactions.
3. **Gap closure still needed for largest milestones** — Phase 138 fixed 4 gaps. For 13-phase milestones, budget 1 gap closure phase.
4. **Read-only providers are trivially simple** — DIRIGERA (haGet only) took 2 phases (infrastructure + frontend) with zero edge cases. Control complexity drives effort.
5. **Fritz!Box extension pattern works** — adding to existing infrastructure (vs replacing like Thermorossi/Hue migration) is faster and lower risk.

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Sessions: ~8 sessions across 4 days
- Notable: 13 phases / 26 plans is the largest milestone to date — 2x the plan count of v15.0 but only 2x the time (4 vs 2 days)

---

## Milestone: v17.0 — WebSocket Real-Time Transport

**Shipped:** 2026-03-28
**Phases:** 6 | **Plans:** 11

### What Was Built
- Shared WebSocket connection manager (react-use-websocket) with exponential backoff, topic dispatch, and React context integration
- All 6 device provider hooks (Stove, Fritz!Box, Hue, Sonos, DIRIGERA, Netatmo) migrated to WS-primary with automatic HTTP polling fallback
- Netatmo WS adapter: standalone pure function normalizing raw Record<string, unknown> payload into typed interface
- Connection UX: Navbar status indicator (Connesso via WS / Riconnessione / Polling attivo) + LastUpdated timestamps on all 6 dashboard cards

### What Worked
- Consistent migration pattern across all 6 providers: WS-primary + polling fallback, conditional subscription guard, ref pattern for stale closures
- Phase 140 (Stove) established the template that Phases 141-143 replicated with minimal variation
- Netatmo adapter as standalone pure function enabled independent unit testing without hook complexity
- Milestone audit caught only cosmetic tech debt (5 items, no blockers) — execution quality high

### What Was Inefficient
- SUMMARY frontmatter one_liner field empty in most plans — gsd-tools accomplishment extraction produced garbage, had to manually rewrite MILESTONES.md entry
- Phase 140 ROADMAP plan references were wrong (listed 142-01/02 instead of 140-01) — copy-paste error in roadmap creation
- Stove unconditional WS subscription differs from guarded pattern in other hooks — inconsistency should have been caught during Phase 140 review

### Patterns Established
- WS-primary + polling-fallback hook pattern: `interval = isWsConnected ? null : pollInterval`
- Conditional WS subscription guard: `if (!isWsConnected) return` in useEffect
- Ref pattern for WS callbacks: `fetchRef.current = fetchFn` to avoid stale closures
- lastUpdatedAt derivation: prefer deriving from existing state over adding new state

### Key Lessons
1. **Pattern replication is the fastest execution mode** — once Phase 140 established the WS migration template, Phases 141-143 required zero research and minimal plan variation
2. **Adapter functions isolate complexity** — Netatmo's raw WS payload was the only non-trivial mapping; isolating it as a pure function made it independently testable
3. **Small milestones ship clean** — 6 phases / 11 plans completed in 3 days with only cosmetic tech debt, no gap closure needed
4. **Connection UX should be part of every transport change** — Phase 144 was essential for user confidence in the WS transition

### Cost Observations
- Model mix: balanced profile (sonnet executors, sonnet verifiers)
- Sessions: ~4 sessions across 3 days
- Notable: fastest per-phase execution rate (1.8 plans/day average)

---

## Milestone: v17.1 — WebSocket Alignment & Tuya Integration

**Shipped:** 2026-03-30
**Phases:** 4 | **Plans:** 10

### What Was Built
- All 8 WS topic payload types enriched with data_freshness, custom_name, device_type to match HA proxy shapes
- Raspberry Pi migrated to WS-primary transport (8th and final provider on WebSocket)
- Tuya smart plug provider end-to-end: proxy client (6 functions), 6 API routes, 2 hooks, dashboard card, /tuya page with plug grid + energy charts + timer controls
- Device registry and navigation updated for Tuya as 8th provider

### What Worked
- WS type alignment (Phase 145) was a clean foundation — additive field additions with no breaking changes
- Tuya followed established provider onboarding template (types → client → routes → hooks → card → page → registry)
- Phase 146 and 147 ran as independent parallel tracks (no dependency between Raspi WS and Tuya infra)
- Milestone audit scored 35/35 requirements, 6/6 E2E flows — zero gaps found

### What Was Inefficient
- SUMMARY.md one_liner extraction failed for most Phase 145-146 summaries (empty one-liners) — persistent tooling gap
- Nyquist compliance partial (1/4 phases fully compliant) — validation drafts not promoted

### Patterns Established
- Tuya 200 OK (not 202 Accepted) pattern for synchronous-confirm APIs — different from Thermorossi/Hue 202 pattern
- Two useEffect timer pattern: sync from WS push + interval tick for countdown display
- Inline WS payload mapping (no standalone adapter) for simple providers with few fields

### Key Lessons
- 8th provider onboarding was fastest yet — proxy pattern fully mature, zero research needed for implementation approach
- SUMMARY frontmatter quality remains a gap (same observation since v11.0) — tooling fix needed at executor level
- Timer countdown UX requires two effects (WS sync + tick) to avoid stale state — not immediately obvious pattern

### Cost Observations
- Model mix: ~40% opus, ~60% sonnet (via balanced profile)
- Sessions: ~4 (discuss, plan, execute, milestone audit)
- Notable: smallest milestone in recent history (4 phases, 10 plans) but highest LOC output (+10,013) due to Tuya greenfield code

---

## Milestone: v20.0 — Ember Glass Redesign

**Shipped:** 2026-05-03
**Phases:** 10 | **Plans:** 66

### What Was Built
- Token-driven Ember Glass design system on `:root` (11 CSS custom properties, oklch accent + 6 hues, Outfit + Inter via next/font, ambient glow with pre-paint script, backdrop-filter + WebKit fallback + @supports graceful degradation)
- Two shared interaction primitives composed by every later phase: `<Pressable>` + `usePressed` + `.press-anim` (DS-07) and `<Sheet>` Radix Dialog facade with scroll-lock + 4 dismissal modes (SHEET-01)
- Post-Auth0 splash with 4-phase state machine, sessionStorage gate, reduced-motion fallback, non-blocking initial fetches
- Equal-size 2-column 1:1 dashboard with 10 device cards; 5 micro-primitives (GlassCard, CardHead, StatusDot, MiniStat, InlineToggle); v9.0 stagger preserved; React Compiler clean
- 5 per-device modal sheets (Stove, Climate w/ Apple-Home radial dial, Lights w/ scenes, Sonos w/ master, Plugs report-only); 6 bundle-verbatim sub-primitives; new `useThermostatCommands` hook
- Data-driven Rooms tab: RoomCard 3×2 chip grid + RoomSheet expanded device cards with type-specific bodies for 9 device classes
- Full Automations editor: discriminated-union types rewrite, 4-tab editor, AND/OR depth-2 condition nesting, 11 API action types, save guard + edit/delete
- Glass bottom tab bar: 4 sections, accent-glow active state, sheet-aware visibility via SheetCounter, iOS safe-area
- `/debug/design-system-v2` single source of truth: 13 live primitive samples + accent picker inline
- Hygiene cleanup phase (183): 6 orphan files deleted, 26 traceability rows + 2 checkboxes flipped, BL-01 note appended, 5 console.error calls added, 7 VALIDATION.md frontmatters normalized

### What Worked
- **Bundle-verbatim porting** — copying primitives byte-for-byte from `.planning/inbox/ember-glass-design/` minimized invention; visuals matched the design source on first compile
- **Foundation-first sequencing** — Phase 174 tokens + Phase 175 primitives shipped before any consuming phase, so dashboard/sheets/rooms/automations/nav all composed against stable APIs
- **CONTEXT-locked deviations** — AUTO-03 (2 trigger types vs bundle's 5) and AUTO-05 (11 action types vs bundle's 9) were locked in 180-CONTEXT.md before code, preventing rework
- **Re-audit closed prior gaps** — Phase 183 hygiene phase was scoped from the first audit's `tech_debt` block and then a re-audit confirmed `passed`, closing the loop
- **Polymorphic Pressable** as the single grep-target for SC-#1 made the DS-07 invariant verifiable

### What Was Inefficient
- **Visual UAT debt accumulated across 7 phases** (~50+ items) — autonomous code-verification is not a substitute for real-device visual fidelity, motion curves, or copy parity
- **Playwright runtime gates blocked end-to-end on infra** — Auth0 storageState + Firebase Database URL + VersionEnforcer overlay turned authored specs into static review only
- **REQUIREMENTS.md doc-drift caught only by audit** — 26 Pending traceability rows + 2 unchecked DSREF boxes survived implementation; needed dedicated Phase 183-02 to flip
- **VALIDATION.md frontmatter convention drift** — 7 phases shipped with `status: draft` + `nyquist_compliant: false` until Phase 183-05 normalized; suggests planner template needs alignment
- **Legacy `ui/Sheet.tsx` + `ui/BottomSheet.tsx` deletion deferred mid-phase** — RESEARCH grep correctly caught live importers (`/debug/design-system` + scheduler `IntervalBottomSheet`) but only after Phase 183-01 was already in motion; a pre-phase grep would have scoped 183 cleanly upfront

### Patterns Established
- **EmberGlass namespace + barrel** — `app/components/EmberGlass/` + `index.ts` re-exports as the single import surface for every glass primitive
- **`usePressed()` + `.press-anim` triad** — the polymorphic `<Pressable as>` + hook + CSS class is the only sanctioned way to opt into DS-07 (3 grep targets enforce the invariant)
- **Sheet primitive contract** — Radix Dialog facade with `forceMount` on Portal/Overlay/Content (for outro animation), `onPointerDownOutside.preventDefault()` + own backdrop onClick (avoids double-fire), `useRef`-captured scrollY for scroll-lock + restore, VisuallyHidden Title fallback
- **z-index 200/201 reserved** for sheets; nav (181) stays below
- **SheetCounter pure module** — broadcasts `body[data-sheet-open]` so any later chrome (nav bar, FAB) can react via CSS without coupling to Sheet implementation
- **Discriminated-union API types + `assertNever`** — TriggerType / ConditionNode / ActionItem unions in 180 made the editor's 11 action forms exhaustively type-checked
- **Apple-Home radial dial debounced 500ms** + **Sonos volume slider debounced 250ms** — established two debounce constants for analog controls
- **AmbientBg pre-paint script** — inline script in `app/layout.tsx` reads localStorage before React hydrates, eliminating accent/ambient hue flash on first paint
- **Append-only Post-Verification Update pattern** (183-03) — preserves original audit trail when re-verifying deferred blockers, instead of mutating the prior verification footer

### Key Lessons
- **Foundation phases pay off across the milestone** — Phases 174 + 175 (6 plans total) unlocked 60 plans of consumer code. ROI is invisible in the foundation-phase metric but compounds downstream
- **Audit-driven hygiene phases are now standard** — Phase 183 (5 plans) closed all actionable items from the first audit; without a re-audit gate, the milestone would have shipped with REQUIREMENTS doc-drift, orphan files, and 7 stale VALIDATION frontmatters
- **Visual UAT is the new ceiling** — pure-UI milestones expose the same testing-ceiling problem v16.0 hit with hardware-required Sonos UAT: code-verification ≠ visual-fidelity verification. Future milestones should budget for real-device sweeps explicitly, not assume autonomous closure
- **Playwright runtime infrastructure needs its own milestone** — three different blockers (Auth0 storageState, Firebase env, VersionEnforcer overlay) each one-off, but together they neutralize 7 phases of authored specs. Treating Playwright runtime as infra (not per-phase work) would unblock everything at once
- **Per-row Edit beats bulk replace_all for traceability flips** — Phase 183-02 used 26 evidence-anchored Edit calls so each Pending→Complete row remained auditable; replace_all would have erased the per-REQ-ID provenance
- **Locked deviations save rework** — AUTO-03/AUTO-05 (5→2 triggers, 9→11 actions) were API-truth corrections lockable in CONTEXT before code; doing it after would have been a rewrite

### Cost Observations
- Model mix: balanced profile (~40% opus, ~60% sonnet)
- Sessions: ~12-15 (discuss + plan + execute + verify per phase + 2 audits + close)
- Notable: largest milestone by plan count (66) and LOC delta (+107,433) — pure-UI rewrite generated more code than any backend milestone in project history; React Compiler stayed clean throughout (zero new opt-outs)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v9.0 | 5 | 8 | Performance optimization — measurement-first |
| v10.0 | 9 | 18 | API migration — audit-driven gap closure |
| v11.0 | 8 | 13 | Transport unification + new device onboarding |
| v11.1 | 4 | 9 | Test cleanup + memoization removal |
| v12.0 | 3 | 4 | Polling unification + E2E smoke tests |
| v13.0 | 7 | 11 | Thermorossi proxy migration — unified all 4 providers |
| v14.0 | 7 | 12 | Hue proxy migration — unified all 5 providers, no direct APIs remain |
| v14.1 | 5 | 9 | Type safety + dead code cleanup — zero `as any` in production code |
| v15.0 | 8 | 13 | Rooms & Device Registry — first greenfield UI milestone |
| v16.0 | 13 | 26 | Sonos + DIRIGERA + Fritz!Box advanced — largest milestone, 7 providers |
| v17.0 | 6 | 11 | WebSocket real-time transport — WS-primary for all 6 providers |
| v17.1 | 4 | 10 | WS type alignment + Tuya integration — 8th provider, all on WS |
| v18.0 | 7 | 15 | Dark-only + mobile-first — light theme deleted, 375px Playwright sweep |
| v19.0 | 18 | 39 | API alignment + full coverage — `/api/v1/{provider}` namespace, ~80 endpoints exposed, all wired to UI |
| v20.0 | 10 | 66 | Ember Glass UI rewrite — token-driven design system, 10 dashboard cards, 5 device sheets, full automations editor, glass nav |

### Cumulative Quality

| Milestone | Tests | Coverage Notes | Net LOC |
|-----------|-------|----------------|---------|
| v9.0 | 4,004+ | React Compiler zero regressions | +7,920 |
| v10.0 | 4,000+ | 28/28 requirements | -3,848 |
| v11.0 | 4,000+ | 18/18 requirements | +11,425 |
| v11.1 | 4,000+ | 16/16 requirements | -264 |
| v12.0 | 4,000+ | 18/18 requirements | +2,709 |
| v13.0 | 4,000+ | 26/26 requirements | +5,130 |
| v14.0 | 4,000+ | 27/27 requirements | +5,258 |
| v14.1 | 4,000+ | 26/26 requirements | +5,798 |
| v15.0 | 4,000+ | 25/25 requirements | +5,417 |
| v16.0 | 4,000+ | 62/62 requirements | +20,351 |
| v17.0 | 4,000+ | 23/23 requirements | +3,245 |
| v17.1 | 4,000+ | 35/35 requirements | +10,013 |
| v18.0 | 4,000+ | 31/31 requirements | +8,304 |
| v19.0 | 4,000+ | 52/52 requirements | +71,274 |
| v20.0 | 4,000+ | 50/50 requirements | +107,433 |

### Top Lessons (Verified Across Milestones)

1. **Audit before shipping** — milestone audit catches integration gaps that phase verification misses (verified v10.0, v11.0)
2. **Parallel execution** — independent phases run well in parallel with agent-based execution (verified v5.0, v8.0, v10.0)
3. **Proxy pattern is reliable** — server-side proxy with rate limiting works for Fritz!Box, Netatmo, and Raspberry Pi (verified v8.0, v10.0, v11.0)
4. **Established patterns accelerate** — new device onboarding follows Fritz!Box's proxy/card/page/cron template (verified v11.0)
5. **Cleanup milestones after feature milestones** — v11.1 cleaned up v9.0-v11.0 tech debt in 1 day, keeping codebase healthy (verified v11.1)
6. **Focused milestones ship faster** — v12.0 (3 phases, 4 plans) completed in 2 days with zero tech debt accumulated (verified v12.0)
7. **Proxy migration speed improves with pattern maturity** — v10.0 (9 phases) → v13.0 (5+2 phases) → v14.0 (4+3 phases), all completing in 2 days (verified v10.0-v14.0)
8. **SUMMARY frontmatter quality is a persistent tooling gap** — one_liner and requirements-completed consistently empty across v11.0-v14.0, needs executor-level fix
9. **Full pages and debug panels are migration blind spots** — hooks/routes get migrated first, but full pages and debug tools use legacy patterns that audit must catch (verified v14.0)
10. **UI CRUD pages are a repeatable template** — DataTable + FormModal + ConfirmationDialog + custom hook is the standard entity management pattern (verified v15.0)
11. **Gap closure is converging** — from 4 phases (v10.0) to 1 phase (v15.0, v16.0), showing improving execution quality over time
12. **Pattern maturity keeps pace constant** — v16.0 (26 plans) shipped in 4 days, same daily throughput as v15.0 (13 plans in 2 days). Established patterns eliminate research overhead.
13. **Human verification is the testing ceiling** — 26 items in v16.0 require physical hardware. No amount of automation can replace plugging in a Sonos speaker.
14. **Pattern replication is the fastest execution mode** — v17.0 established one migration template (Phase 140) then replicated it 5 times with minimal variation, shipping 6 phases in 3 days (verified v17.0)
15. **Foundation phases compound across the milestone** — v20.0 Phases 174 + 175 (6 plans) unlocked 60 plans of consumer code; ROI invisible in foundation metrics but compounds downstream (verified v20.0)
16. **Visual UAT is the new ceiling for UI milestones** — v20.0 accumulated ~50+ deferred visual items; code-verification ≠ visual-fidelity verification, budget for real-device sweeps explicitly (verified v20.0; mirrors v16.0 hardware-UAT ceiling)
17. **Audit-driven hygiene phases close the loop** — v20.0 Phase 183 (5 plans) closed every actionable item from the first audit, then re-audit confirmed `passed`; dedicate a final hygiene phase per milestone to convert `tech_debt` → `passed` (verified v20.0)
18. **CONTEXT-locked deviations save rework** — v20.0 AUTO-03/AUTO-05 (5→2 triggers, 9→11 actions) were API-truth corrections locked before code; deviations caught after implementation become rewrites (verified v20.0)
19. **Per-row Edit beats bulk replace_all for traceability** — v20.0 Phase 183-02 used 26 evidence-anchored Edits so each Pending→Complete flip remained auditable per REQ-ID (verified v20.0)
20. **Polymorphic primitives + grep-targets enforce design invariants** — v20.0 `<Pressable>` + `usePressed` + `.press-anim` triad gave SC-#1 three grep targets; primitives that can be enforced by grep stay enforceable across phases (verified v20.0)
