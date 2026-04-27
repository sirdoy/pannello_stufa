# Phase 169: DIRIGERA Frontend Cutover - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in `169-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 169-dirigera-frontend-cutover
**Mode:** `--auto --chain` (all gray areas auto-selected, recommended options chosen)
**Areas discussed:** V1 Wrapper Coverage, Hook Migration, New UI Surface, Pagination UX, Legacy Deletion, Plan Structure

---

## V1 Wrapper Coverage for Legacy Endpoints

| Option | Description | Selected |
|--------|-------------|----------|
| Create v1 wrappers for all 5 legacy endpoints | Mirror Phase 161/168 playbook: thin `withAuthAndErrorHandler` wrappers at `/api/v1/dirigera/*` delegating to same proxy functions. Enables SC-2 (zero `/api/dirigera/` refs). | ✓ |
| Leave legacy endpoints untouched | Hooks keep fetching legacy paths. Violates SC-2. | |
| Move legacy routes in-place to v1 paths | Requires rewriting existing Phase 163 tests + breaks any existing consumer. Not Next.js-friendly. | |

**Auto selection:** Option 1 — mandatory to meet SC-2. [recommended default]
**Notes:** Docs already list all 8 canonical endpoints at `/api/v1/dirigera/*`. Wrapper creation is the only path that lets the code match the docs without breaking existing consumers.

---

## Hook + Test Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Pure prefix swap (`/api/dirigera/*` → `/api/v1/dirigera/*`) | Edit `useDirigeraData.ts`, `useDirigeraFullData.ts`, `useDirigeraData.test.ts` — URL only. | ✓ |
| Fold all legacy endpoints into `useDirigeraFullData` | Restructure hook API surface. Higher risk. | |
| Replace hooks with a single SWR/React-Query store | Out of scope — cross-cutting refactor. | |

**Auto selection:** Option 1 — minimum diff, zero logic change. [recommended default]

---

## New UI: history / stats / telemetry on `/dirigera`

| Option | Description | Selected |
|--------|-------------|----------|
| Three collapsible sections on `/dirigera`, one hook per endpoint | Independent hooks (`useDirigeraHistory`, `useDirigeraStats`, `useDirigeraTelemetry`), independent panels. Matches `useSonosHistory`/`useSonosQueue` precedent. | ✓ |
| Fold history/stats/telemetry into `useDirigeraFullData` | Mixes polling lifecycles — history paginated, stats aggregated, sensor list polled fast. Couples unrelated re-fetches. | |
| Separate `/dirigera/history` + `/dirigera/stats` + `/dirigera/telemetry` sub-pages | Heavier nav; SC-3 says render end-to-end on `/dirigera`. | |
| Modal/dialog-based history viewer | Poor scanability; not typical for audit-style data. | |

**Auto selection:** Option 1 — one responsibility per hook, simple composition. [recommended default]

---

## Pagination UX for history / telemetry

| Option | Description | Selected |
|--------|-------------|----------|
| "Load more" button appending next 50 rows via `offset` | Keyboard-accessible; no virtualization complexity. | ✓ |
| Infinite scroll | Requires intersection-observer + scroll anchor; extra deps. | |
| Pager (1,2,3…) | DIRIGERA `total` field available but pager UX rarely matches append-style event data. | |
| Cursor pagination | Hub API is offset-based; no cursor support. | |

**Auto selection:** Option 1 — simplest, accessible. [recommended default]
**Notes:** No filter controls in this phase — hooks accept param objects so filters are a drop-in future enhancement.

---

## Legacy Route Deletion Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Delete entire `app/api/dirigera/` tree after cutover verified | Mirror Phase 167/168 protocol: pre/post grep sweep + v1-intact safety gate + Jest + Playwright smoke. | ✓ |
| Leave legacy routes as adapters that 308-redirect to v1 | Violates SC-2 ("zero `/api/dirigera/` refs"). | |
| Partial deletion (keep `/health` only) | No functional reason; breaks invariant. | |

**Auto selection:** Option 1 — consistent with prior cutover phases. [recommended default]
**Notes:** D-12 adds two v1-intact safety gates (pre + post) asserting `find app/api/v1/dirigera -name route.ts | wc -l == 8`.

---

## Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 3-plan wave structure | (1) Wrappers + hook migration, (2) New UI, (3) Legacy deletion. Matches 166/167/168. | ✓ |
| 2-plan structure (combined 1+2, deletion second) | Conflates wrapper creation with new UI — rollback on UI failure drags out v1 wrappers. | |
| 1-plan monolith | Harder rollback; risk not isolated. | |

**Auto selection:** Option 1 — risk isolation + precedent. [recommended default]

---

## Claude's Discretion

- Exact panel component names (`DirigeraHistoryPanel` / `DirigeraStatsPanel` / `DirigeraTelemetryPanel` proposed; Claude may rename if collision with existing `DirigeraStats.tsx` demands it)
- Whether to memoize "Load more" offset state inside hook or lift to panel
- Internal card layout for stats panel (4-up grid vs 2×2)
- Whether to reuse/rename existing `DirigeraStats.tsx` (fleet summary) vs build a new `DirigeraStatsPanel` for aggregation/retention
- Ordering of sub-steps within each wave

## Deferred Ideas

- Sensor-id picker and filter UI for history/telemetry panels
- Virtualization for large tables
- Debug DirigeraTab (none currently exists)
- Consolidation of `DirigeraStats.tsx` and `DirigeraStatsPanel.tsx`
- Playwright `@smoke` tag infrastructure (cross-provider)
- Infinite scroll / scroll-anchored pagination
- WebSocket push for sensor history events
- `lib/routes.ts` entry consolidation for DIRIGERA routes
