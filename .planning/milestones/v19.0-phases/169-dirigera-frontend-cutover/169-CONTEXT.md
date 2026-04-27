# Phase 169: DIRIGERA Frontend Cutover - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Mode:** auto (gray areas auto-selected, recommended options chosen)

<domain>
## Phase Boundary

Close the v19.0 audit DIRIGERA integration gap (phase 163 orphan). Two linked outcomes:

1. **Finish the v1 route surface.** `docs/api/dirigera.md` documents 8 canonical endpoints at `/api/v1/dirigera/*`. Phase 163 shipped 3 new ones (`history`, `stats`, `telemetry` — the DIR-01/02/03 requirements). The other 5 (`health`, `sensors`, `sensors/contact`, `sensors/motion`, `sensors/summary`) still live only at the legacy flat path `/api/dirigera/*`. Create thin v1 wrappers for those 5 so the documented surface matches the shipped surface.

2. **Migrate every frontend consumer to v1 + wire the 3 new endpoints into the DIRIGERA page.** The two hooks (`useDirigeraData`, `useDirigeraFullData`) and their test file currently fetch `/api/dirigera/*`. Rewrite them to `/api/v1/dirigera/*`. Additionally, the roadmap success criterion SC-3 requires `/dirigera` to "render history/stats/telemetry end-to-end in smoke run" — that is NEW UI surface (history list, stats tiles, telemetry viewer) not previously exposed anywhere in the frontend.

Frontend consumer surface (production code):
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — 3 fetch sites (`/api/dirigera/health` ×2, `/api/dirigera/sensors/summary`)
- `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` — 5 fetch sites (`/api/dirigera/health`, `/api/dirigera/sensors`, `/api/dirigera/sensors/contact`, `/api/dirigera/sensors/motion`)
- `app/dirigera/page.tsx` — composition only; no direct fetches, consumes `useDirigeraFullData`
- Components `DirigeraHealthSection.tsx`, `DirigeraSensorList.tsx`, `DirigeraSensorRow.tsx`, `DirigeraStats.tsx` — presentational; no fetches

Test surface:
- `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` — 3 assertions on legacy paths (lines 121, 122, 309)

Legacy route tree (5 handlers + support) to be wrapped and later deleted:
- `app/api/dirigera/health/route.ts`
- `app/api/dirigera/sensors/route.ts`
- `app/api/dirigera/sensors/summary/route.ts`
- `app/api/dirigera/sensors/contact/route.ts`
- `app/api/dirigera/sensors/motion/route.ts`

v1 routes already shipped by Phase 163 (reference pattern, not created here):
- `app/api/v1/dirigera/history/route.ts`
- `app/api/v1/dirigera/stats/route.ts`
- `app/api/v1/dirigera/telemetry/route.ts`

No debug-panel tab exists for DIRIGERA (grep confirmed). No `lib/routes.ts` entry. No `app/sw.ts` cache rule.

</domain>

<decisions>
## Implementation Decisions

### V1 Wrapper Creation (diverges from Phase 168 — wrappers are required here)

- **D-01:** Create 5 new v1 wrapper routes mirroring the Phase 161 Netatmo playbook (thin wrapper, same proxy delegate, `withAuthAndErrorHandler`, `export const dynamic = 'force-dynamic'`). Paths and delegates:
  - `app/api/v1/dirigera/health/route.ts` → `getHealth()`
  - `app/api/v1/dirigera/sensors/route.ts` → `getSensors()`
  - `app/api/v1/dirigera/sensors/summary/route.ts` → `getSensorSummary()`
  - `app/api/v1/dirigera/sensors/contact/route.ts` → `getContactSensors()`
  - `app/api/v1/dirigera/sensors/motion/route.ts` → `getMotionSensors()`
  *[auto: recommended — matches `docs/api/dirigera.md` canonical base path; without this step SC-2 (zero `/api/dirigera/` refs) cannot be met because the hooks need a v1 target to point at.]*

- **D-02:** Copy the response shape of each legacy route EXACTLY. Example: `/api/dirigera/sensors` returns `success({ sensors, count, is_stale })` — the v1 wrapper must emit the same envelope so the hook migration in D-05/D-06 is a pure URL swap, zero response-handling changes. *[auto: recommended — pure prefix swap, minimum diff.]*

- **D-03:** Add co-located route tests under `app/api/v1/dirigera/{health,sensors,sensors/summary,sensors/contact,sensors/motion}/__tests__/route.test.ts`. Pattern: mock `@/lib/dirigera/dirigeraProxy`, assert auth wrapper applied and response body matches. *[auto: recommended — consistent with Phase 163 test discipline (`history/stats/telemetry` each has co-located tests).]*

### Hook + Test Migration (URL swap only, no signature change)

- **D-04:** `useDirigeraData.ts` — swap both `/api/dirigera/health` references (lines 51, 81) and `/api/dirigera/sensors/summary` (line 52) to the v1 prefix. No logic change. *[auto: recommended — pure prefix swap.]*
- **D-05:** `useDirigeraFullData.ts` — swap `FILTER_ENDPOINTS` map (lines 16–20) and the health fetch (line 55) to the v1 prefix. No signature change; consumers (`app/dirigera/page.tsx`) stay untouched. *[auto: recommended.]*
- **D-06:** `useDirigeraData.test.ts` — update 3 assertions (lines 121, 122, 309) to v1 paths. *[auto: recommended.]*

### New UI: history / stats / telemetry on `/dirigera` page (satisfies SC-3)

- **D-07:** Add three new hooks next to the existing ones — `useDirigeraHistory`, `useDirigeraStats`, `useDirigeraTelemetry` — each a small wrapper around the existing `getHistory` / `getStats` / `getTelemetry` route shapes via `fetch()`. Independent hooks (not folded into `useDirigeraFullData`) because history/telemetry are paginated (limit/offset) and stats is aggregated metadata — mixing their lifecycles with the sensor-list polling loop creates unrelated re-fetch storms. *[auto: recommended — one responsibility per hook, matches `useSonosHistory` / `useSonosQueue` precedent from Phase 130+.]*
  - `useDirigeraHistory(params?: SensorHistoryParams)` — polls slowly (300 s visible / 600 s hidden) because event history grows monotonically; latest page shown.
  - `useDirigeraStats()` — polls slowly (300 s / 600 s) because stats aggregate daily buckets.
  - `useDirigeraTelemetry(params?: SensorTelemetryParams)` — same cadence as history; defaults to latest telemetry page.
- **D-08:** Render three new collapsible sections on `/dirigera` page, appended after `DirigeraSensorList`:
  1. **Stats tile row** (`DirigeraStatsPanel`) — 4 cards: total events, retention days, most active sensor, events-last-24h. Populated from `useDirigeraStats`. Always visible when data present.
  2. **Recent Events** (`DirigeraHistoryPanel`) — table showing latest 50 events (sensor, type, timestamp); "Load more" button appends next 50 via `offset` param. Populated from `useDirigeraHistory({ limit: 50 })`.
  3. **Telemetry** (`DirigeraTelemetryPanel`) — same shape as history but for telemetry rows. Populated from `useDirigeraTelemetry({ limit: 50 })`.
  *[auto: recommended — simple, testable, reuses existing design-system primitives (Card, Table, Heading). Infinite scroll deliberately NOT picked because "Load more" is keyboard-accessible and avoids virtualization complexity.]*
- **D-09:** No filter controls in this phase (no sensor-id picker, no date range, no event-type filter). The hooks accept param objects so a future phase can surface controls without refactoring. *[auto: recommended — SC-3 says "renders history/stats/telemetry end-to-end", not "with filters". Keep scope tight.]*
- **D-10:** Section states:
  - **Loading:** spinner reusing existing pattern from `DirigeraHealthSection`.
  - **Empty:** "Nessun evento" / "Nessuna telemetria" / "Statistiche non disponibili" (Italian, matching existing DIRIGERA page copy).
  - **Error:** stale badge + message, mirror `DirigeraHealthSection` error treatment.
  *[auto: recommended — consistency with existing page.]*

### Legacy Route Deletion

- **D-11:** Delete the entire `app/api/dirigera/` tree (5 route.ts files + any co-located `__tests__/`) in a dedicated wave after the hooks are on v1 and all smoke tests pass. Pre-deletion and post-deletion grep sweeps across `app/`, `lib/`, `types/`, `hooks/`, `components/`, `__tests__/` must return zero `/api/dirigera/` matches (ignoring `lib/version.ts` historical changelog and `.planning/` archival docs). *[auto: recommended — mirror Phase 167 D-17 / Phase 168 D-12 protocol.]*
- **D-12:** Two v1-intact safety gates (pre-deletion + post-deletion) assert `find app/api/v1/dirigera -name route.ts | wc -l == 8` to catch a wrong-path deletion before and after `rm -rf`. *[auto: recommended — Phase 168 Plan-03 proved this cheaply catches catastrophic mis-deletion.]*

### Tests

- **D-13:** Jest runs full suite after each wave; must stay green. Any pre-existing failing suite (unrelated to dirigera) is documented, not masked. *[auto: recommended — Phase 167/168 precedent.]*
- **D-14:** Playwright smoke — reuse the existing `/dirigera` smoke test from Phase 97. Add a brief assertion that the stats/history/telemetry panels render without console errors. If the `@smoke` tag infrastructure is still missing (discovered in Phase 167), fall back to a phase-specific grep target and document the limitation. *[auto: recommended — don't expand smoke test infra in this phase; that's a known deferred task.]*

### Documentation

- **D-15:** `docs/api/dirigera.md` already lists the canonical base path `/api/v1/dirigera/*` and documents all 8 endpoints. No doc changes needed — the v1 wrappers make the code catch up to the already-written docs. *[auto: recommended.]*

### Plan Structure (3 waves — mirror Phases 166/167/168)

- **D-16:** Three-plan wave structure:
  1. **Plan 169-01 (Wave 1):** Create 5 v1 wrapper routes + co-located tests (D-01, D-02, D-03). Migrate `useDirigeraData` + `useDirigeraFullData` + `useDirigeraData.test.ts` to v1 URLs (D-04, D-05, D-06). Full Jest green + Playwright smoke at wave end.
  2. **Plan 169-02 (Wave 2):** Ship the new UI surface (D-07, D-08, D-09, D-10) — three hooks, three panels, `/dirigera` page composition. Unit tests for the three hooks (mock fetch, assert URL + param serialization + response mapping).
  3. **Plan 169-03 (Wave 3):** Delete `app/api/dirigera/` legacy tree (D-11, D-12). Repo-wide grep sweep. Full Jest + Playwright smoke green.
  *[auto: recommended — matches 166/167/168 cadence; isolates UI risk from backend surface change from deletion.]*
- **D-17:** Alternative considered and rejected: two-plan structure (wrap + migrate + UI in one, delete in one). Rejected because conflating wrapper creation with new UI work makes rollback on UI failure also rip out v1 wrappers — unnecessarily coupled. *[auto recommended — risk isolation.]*

### Claude's Discretion

- Exact component names for the three new panels (`DirigeraStatsPanel`, `DirigeraHistoryPanel`, `DirigeraTelemetryPanel` proposed; equivalent names fine).
- Whether to memoize the "Load more" offset state inside each hook vs lift to the panel component.
- Exact card layout inside `DirigeraStatsPanel` (4-up grid vs 2×2).
- Whether to reuse `DirigeraStats.tsx` (existing, summary-shaped) or build a dedicated `DirigeraStatsPanel` — existing file serves a different purpose (fleet summary, not aggregation/retention metadata), so new component is cleaner but Claude may unify if architecture permits.
- Order of sub-steps within each wave.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `docs/api/dirigera.md` — Authoritative DIRIGERA API spec (all 8 v1 endpoints with DTOs, pagination, query params)
- `docs/api/README.md` — API authentication patterns (`X-API-Key`, `withAuthAndErrorHandler`)

### Existing V1 Routes (shipped by Phase 163 — reference pattern for D-01 wrappers)
- `app/api/v1/dirigera/history/route.ts`
- `app/api/v1/dirigera/stats/route.ts`
- `app/api/v1/dirigera/telemetry/route.ts`
- `app/api/v1/dirigera/history/__tests__/route.test.ts` — route test template

### Legacy Route Tree (targets for D-11 deletion)
- `app/api/dirigera/health/route.ts`
- `app/api/dirigera/sensors/route.ts`
- `app/api/dirigera/sensors/summary/route.ts`
- `app/api/dirigera/sensors/contact/route.ts`
- `app/api/dirigera/sensors/motion/route.ts`

### Proxy Layer
- `lib/dirigera/dirigeraProxy.ts` — All 8 proxy functions present (getHealth, getSensors, getSensorSummary, getContactSensors, getMotionSensors, getHistory, getStats, getTelemetry). No new functions to add; new routes delegate to existing ones.
- `lib/dirigera/__tests__/dirigeraProxy.test.ts` — Proxy-level unit tests (reference for new route tests)
- `types/dirigeraProxy.ts` — DTOs (`DirigeraHealthResponse`, `SensorSummaryResponse`, `DirigeraSensor`, `DirigeraSensorsResponse`, `ContactSensorsResponse`, `MotionSensorsResponse`, `SensorHistoryResponse`, `DirigeraStatsResponse`, `SensorTelemetryResponse`, `SensorHistoryParams`, `SensorTelemetryParams`)
- `lib/haClient.ts` — Shared `haGet` transport (auth, timeouts, RFC 9457 error mapping)
- `lib/core` — `withAuthAndErrorHandler`, `success`

### Frontend Files to Modify
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` (D-04)
- `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` (D-05)
- `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` (D-06)
- `app/dirigera/page.tsx` (D-08 — add 3 sections)

### Frontend Files to Create
- `app/components/devices/dirigera/hooks/useDirigeraHistory.ts` (D-07)
- `app/components/devices/dirigera/hooks/useDirigeraStats.ts` (D-07)
- `app/components/devices/dirigera/hooks/useDirigeraTelemetry.ts` (D-07)
- `app/components/devices/dirigera/components/DirigeraHistoryPanel.tsx` (D-08)
- `app/components/devices/dirigera/components/DirigeraStatsPanel.tsx` (D-08)
- `app/components/devices/dirigera/components/DirigeraTelemetryPanel.tsx` (D-08)
- Co-located hook + route + panel unit tests under respective `__tests__/` dirs

### Requirements
- `.planning/REQUIREMENTS.md` §DIR-01, §DIR-02, §DIR-03 — acceptance for the 3 v1 endpoints consumed here
- `.planning/REQUIREMENTS.md` §Mapping table lines 155–157 — DIR-01/02/03 pending, closed by phase 163 + 169

### Prior Phase Context
- `.planning/phases/163-dirigera-gap-closure/163-CONTEXT.md` — Created history/stats/telemetry v1 routes. Explicitly deferred legacy `/api/dirigera/*` migration to a later phase (D-02 there); THIS phase is that later phase.
- `.planning/phases/168-netatmo-frontend-cutover/168-CONTEXT.md` — Direct structural template (3-plan wave, grep-sweep discipline, legacy-tree deletion, v1-intact safety gates).
- `.planning/phases/167-sonos-frontend-cutover/167-CONTEXT.md` — Debug-panel precedent (not applicable here — no DIRIGERA debug tab exists).
- `.planning/phases/166-hue-frontend-cutover/166-CONTEXT.md` — Earlier cutover reference.
- `.planning/phases/161-netatmo-gap-closure/161-CONTEXT.md` — Wrapper-creation pattern (relevant to D-01).

### Design System
- `app/debug/design-system` — Reference for Card, Heading, Table, Button, Badge primitives used in D-08 panels
- `docs/design-system.md` — Component usage guide

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/dirigera/dirigeraProxy.ts` already exports all 8 proxy functions — wrapper routes are thin delegates, zero proxy work.
- `types/dirigeraProxy.ts` already declares every response/param type (including `SensorHistoryParams`, `SensorTelemetryParams`) — no type work beyond maybe adding panel-local prop interfaces.
- `app/api/v1/dirigera/history/route.ts` is a ready-made template for the 5 new wrappers (handles optional param parsing, silent drop of invalid numerics).
- `useAdaptivePolling` + `useVisibility` hooks (already used by `useDirigeraData`/`useDirigeraFullData`) — reuse for the 3 new hooks with longer intervals.
- Design-system primitives at `/debug/design-system` — Card, Heading, Table, Badge, Button all ready for D-08 panels.

### Established Patterns
- Legacy→v1 cutover pattern (Phases 166/167/168): 3-plan wave (URL rewrite → UI/debug panel sync → delete tree + grep sweep). Use same pattern.
- Route wrapper template: `withAuthAndErrorHandler` + proxy call + `success()` envelope (if legacy emits one) + `export const dynamic = 'force-dynamic'`.
- Hook test pattern: `fetchMock` global, assert `toHaveBeenCalledWith('/api/v1/...')` — existing `useDirigeraData.test.ts` already structured this way; mechanical URL update.
- Italian error copy convention: "DIRIGERA non raggiungibile", "Nessun evento" — match existing page tone.
- Polling cadence heuristics: visible 60 s for fast-changing data, 300 s for slow/aggregated data. History/stats/telemetry are slow.

### Integration Points
- `app/dirigera/page.tsx` composes `useDirigeraFullData` — add three sections after `DirigeraSensorList` (D-08). Page-level state stays tiny.
- No `lib/routes.ts` entry for DIRIGERA (the codebase mixes direct string fetches with `lib/routes.ts`; DIRIGERA always used inline strings). No update needed.
- No `app/sw.ts` cache rule for DIRIGERA. No update needed.
- No debug DirigeraTab exists (grep confirmed). No debug panel work this phase; a future dedupe/debug-coverage phase may add one.
- Phase 141+ WebSocket integration for `dirigera` topic already lives in `useDirigeraData.ts` — untouched by the URL swap (WS subscribe/unsubscribe is orthogonal to HTTP fetch URLs).

</code_context>

<specifics>
## Specific Ideas

- The naming mismatch in ROADMAP.md phase 169 "Plans:" block (the 2 listed items reference `/api/stove/` — that is a copy-paste artifact from Phase 164). The real plan count for this phase is 3 (per D-16), not 2. The researcher/planner should treat the ROADMAP `Plans:` block as noise for this phase and follow the success criteria + D-16 plan shape.
- DIRIGERA differs from Netatmo (Phase 168): Netatmo had every v1 wrapper already in place, so Phase 168 was pure URL swap. DIRIGERA requires BOTH wrapper creation (5 new routes) AND new UI (history/stats/telemetry). This is a heavier phase than 168 — closer to the combined "Phase 161 + 168" effort.
- The `SensorHistoryParams` and `SensorTelemetryParams` interfaces accept `sensor_id`, `event_type`, `start`, `end`, `limit`, `offset`. SC-3 demands rendering end-to-end in a smoke run — default to no filters, `limit=50`, `offset=0`, let the "Load more" bump offset by 50. Don't expose the other knobs in this phase.
- No WebSocket topic for history/stats/telemetry — these are HTTP-only reads. Do NOT add a WS subscription path for them.
- Phase 163 added `getHistory`/`getStats`/`getTelemetry` to `lib/dirigera/dirigeraProxy.ts`. Phase 169 consumes them indirectly via the new v1 routes; no direct consumer from the frontend calls the proxy functions (they flow through the Next.js API layer as all other provider integrations do).
- `app/components/devices/dirigera/components/DirigeraStats.tsx` ALREADY exists but renders the `SensorSummaryResponse` (fleet summary — offline count, low battery count). The new stats panel for `/api/v1/dirigera/stats` is structurally different (aggregation + retention metadata). Recommend naming the new component `DirigeraStatsPanel` to avoid collision, or move the existing one to `DirigeraFleetSummary` and use `DirigeraStats` for the new panel (Claude's discretion in D).

</specifics>

<deferred>
## Deferred Ideas

- Sensor-id picker and date-range / event-type filter UI on the history/telemetry panels — future DIRIGERA UX enhancement.
- Virtualization (react-window or similar) for large history/telemetry tables — not needed at 50-row pages.
- Debug DirigeraTab — no debug panel exists; adding one is a future debug-coverage phase.
- Consolidation of `DirigeraStats.tsx` (fleet summary) and `DirigeraStatsPanel.tsx` (aggregation/retention) — structural dedupe, future phase.
- Playwright `@smoke` tag infrastructure — still missing repo-wide (noted Phase 167), future test-harness phase.
- Infinite scroll / auto-load on scroll for history/telemetry — Phase 169 picks "Load more" button; future UX phase may revisit.
- WebSocket push for sensor history events — currently HTTP-only; future real-time enhancement.
- `lib/routes.ts` entry for DIRIGERA routes — currently uses inline strings; consolidation is a cross-provider routes-registry phase.

</deferred>

---

*Phase: 169-dirigera-frontend-cutover*
*Context gathered: 2026-04-22*
*Auto-mode decisions — user review recommended before planning*
