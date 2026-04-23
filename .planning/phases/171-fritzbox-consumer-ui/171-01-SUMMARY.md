---
phase: 171-fritzbox-consumer-ui
plan: 01
subsystem: ui
tags:
  - telephony
  - fritzbox
  - consumer-ui
  - frontend
  - polling-hooks
  - datatable

requires:
  - phase: 162-fritz-box-gap-closure
    provides: "Fritz!Box telephony API routes (/api/fritzbox/telephony/dect, /calls, /tam) with envelope shapes {dect|calls|tam: {items, total_count, limit, offset}}"
provides:
  - "/telefonia top-level page wiring three Fritz!Box telephony endpoints into a consumer UI"
  - "Three paused-aware polling hooks (useFritzDectHandsets, useFritzCallHistory, useFritzTamStatus) cloning the canonical useFritzWifiClients pattern"
  - "Three presentational components (TamStatusCard, DectHandsetsTable, CallHistoryTable) composed exclusively from existing @/app/components/ui primitives"
  - "CommandPalette nav-telephony entry routing to /telefonia"
  - "36 new Jest tests (8 suites) covering hooks + components + page + CommandPalette"
affects:
  - "Plan 171-02 (raw history + service discovery tabs)"
  - "Future telephony actions (tap-to-call, message delete) — deferred per CONTEXT.md"

tech-stack:
  added: []  # Zero new dependencies
  patterns:
    - "Paused-aware Fritz!Box polling hook cloning useFritzWifiClients (never-throw on non-OK, paused→active defensive re-fetch)"
    - "Server-paginated hook with limit/offset URLSearchParams + page-shrink reset guard (Pitfall 2)"
    - "Orchestrator page → presentational components composition (mirrors /network, /sonos, /lights)"

key-files:
  created:
    - "app/telefonia/hooks/useFritzDectHandsets.ts"
    - "app/telefonia/hooks/useFritzCallHistory.ts"
    - "app/telefonia/hooks/useFritzTamStatus.ts"
    - "app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts"
    - "app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts"
    - "app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts"
    - "app/telefonia/components/TamStatusCard.tsx"
    - "app/telefonia/components/DectHandsetsTable.tsx"
    - "app/telefonia/components/CallHistoryTable.tsx"
    - "app/telefonia/components/__tests__/TamStatusCard.test.tsx"
    - "app/telefonia/components/__tests__/DectHandsetsTable.test.tsx"
    - "app/telefonia/components/__tests__/CallHistoryTable.test.tsx"
    - "app/telefonia/page.tsx"
    - "app/telefonia/__tests__/page.test.tsx"
    - "app/components/layout/__tests__/CommandPaletteProvider.test.tsx"
  modified:
    - "app/components/layout/CommandPaletteProvider.tsx"

key-decisions:
  - "D-01: /telefonia as a new top-level page, matching /lights, /sonos, /dirigera device-page pattern."
  - "D-02: Orchestrator + presentational split. Three stacked sections (TAM / DECT / Call history) inside PageLayout maxWidth='7xl'."
  - "D-04: DECT handsets render as DataTable with ember/warning/danger battery tier badges (pulse at <20%) and sage/warning registration badges."
  - "D-05: Call history server-paginated at 50/page via Prev/Next Button.Group; Italian call-type badges (In entrata / In uscita / Persa / Segreteria / Sconosciuto)."
  - "D-06: TAM status single Card with HealthIndicator (Attiva/Disattiva), large ember-accented new-messages count, total, stale Banner when is_stale=true."
  - "D-14, D-15, D-16: Hooks under app/telefonia/hooks/, useAdaptivePolling + useVisibility pattern, 60s visible / 300s hidden cadence, paused=true stops polling."
  - "D-17: Added nav-telephony CommandPalette entry between nav-camera and nav-settings routing to /telefonia."
  - "D-18: /telefonia uses 'use client' with useRouter + orchestrator composition (like /lights)."
  - "D-20: Jest unit coverage for each hook (success/error/paused/pagination-reset) and each component (render/empty/error/stale)."
  - "D-22: Every <verify><automated> block uses scoped test subsets — never bare `npm test`."

patterns-established:
  - "Open Question #2 resolution: every polling hook carries a defensive useEffect(() => { if (!paused) void fetchData(); }, [paused]) re-fetch effect so state refreshes immediately on paused→active transitions instead of waiting up to 60s."
  - "Pitfall 4 mitigation: components use Banner variant='error' with explicit title+description instead of the legacy stove-coupled alert primitive. Enforced by acceptance-criteria greps."
  - "Pitfall 5 mitigation: call-type helper has a default branch returning { variant: 'neutral', icon: <Phone/>, label: 'Sconosciuto' } so unknown Fritz!Box strings never throw."
  - "Pitfall 6 mitigation: timestamp is Unix seconds per raw pass-through — CallHistoryTable multiplies by 1000 before new Date()."
  - "Threat T-171-01 mitigation: zero dangerouslySetInnerHTML anywhere; all Fritz!Box-supplied strings (name, number, call_type, model, firmware_version) render via JSX text interpolation only."

requirements-completed:
  - FRITZ-01
  - FRITZ-02
  - FRITZ-03

# Metrics
duration: ~25min
completed: 2026-04-23
---

# Phase 171-01: Fritz!Box Telephony Consumer UI Summary

**Wired Fritz!Box DECT handsets, call history, and answering machine (TAM) endpoints into a new /telefonia production page with full Italian Ember-Noir UI, server-paginated call history, and a CommandPalette entry.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-04-23T19:08Z
- **Tasks:** 3/3
- **Files created:** 15
- **Files modified:** 1
- **Commits:** 3 atomic task commits + this summary commit
- **Test coverage added:** 36 Jest tests across 8 suites, all green

## Accomplishments

- Shipped /telefonia as a self-contained consumer-facing telephony page (Italian-locale, Ember-Noir themed) — previously the three endpoints had zero UI consumers despite landing in phase 162.
- All three FRITZ requirements (FRITZ-01 DECT, FRITZ-02 Calls, FRITZ-03 TAM) closed end-to-end: API route → polling hook → presentational component → orchestrator page → nav entry.
- Established the paused-aware defensive re-fetch pattern across all three new hooks (Open Question #2 resolution) — a zero-cost safety net that keeps the six Fritz!Box hooks symmetric and future-proofs tab-paused re-mount flows.

## Task Commits

Each task was committed atomically with `--no-verify` (parallel-executor worktree convention):

1. **Task 1: Three telephony polling hooks + tests** — `2db69d81` (feat)
   - useFritzDectHandsets, useFritzCallHistory (with Pitfall 2 pagination-shrink reset), useFritzTamStatus
   - 13 Jest unit tests covering success/error/paused/pagination scenarios
2. **Task 2: Three presentational components + tests** — `79ac06c1` (feat)
   - TamStatusCard, DectHandsetsTable, CallHistoryTable
   - 16 Jest component tests covering render/empty/error/stale + Pitfalls 5 & 6
3. **Task 3: /telefonia orchestrator page + CommandPalette wiring + tests** — `6314b14b` (feat)
   - app/telefonia/page.tsx composes the three hooks and three components
   - CommandPaletteProvider gets nav-telephony entry (between nav-camera and nav-settings)
   - 7 Jest tests (page + CommandPalette integration)

## Files Created

### Hooks
- `app/telefonia/hooks/useFritzDectHandsets.ts` — polls /api/fritzbox/telephony/dect
- `app/telefonia/hooks/useFritzCallHistory.ts` — server-paginated 50/page, limit/offset URLSearchParams
- `app/telefonia/hooks/useFritzTamStatus.ts` — polls /api/fritzbox/telephony/tam

### Components
- `app/telefonia/components/TamStatusCard.tsx` — Card + HealthIndicator + ember-accented new-message count
- `app/telefonia/components/DectHandsetsTable.tsx` — DataTable with battery tier badges + registration badges
- `app/telefonia/components/CallHistoryTable.tsx` — DataTable + Prev/Next Button.Group + Italian-locale timestamps

### Orchestrator / Integration
- `app/telefonia/page.tsx` — /telefonia orchestrator, PageLayout + three sections
- `app/components/layout/CommandPaletteProvider.tsx` (modified) — added nav-telephony entry + Phone import

### Tests (all passing)
- `app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts` (4 tests)
- `app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts` (5 tests — includes pagination-reset on shrink)
- `app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts` (4 tests)
- `app/telefonia/components/__tests__/TamStatusCard.test.tsx` (5 tests — enabled/disabled/stale/error/skeleton)
- `app/telefonia/components/__tests__/DectHandsetsTable.test.tsx` (4 tests — render/empty/error/unregistered)
- `app/telefonia/components/__tests__/CallHistoryTable.test.tsx` (7 tests — call-type/duration/timestamp/pagination/empty)
- `app/telefonia/__tests__/page.test.tsx` (4 tests — h1/sections/no-console-errors/back-button)
- `app/components/layout/__tests__/CommandPaletteProvider.test.tsx` (3 tests — nav-telephony exists/routes/no-errors)

## Deviations from Plan

None — plan executed exactly as written with one cosmetic refinement.

### Documentation wording refinement (cosmetic, not a logic deviation)

- **Found during:** Task 3 acceptance-criteria verification
- **Issue:** The plan's literal acceptance-criteria grep patterns `! grep -q "ErrorAlert"` and `! grep -q "dangerouslySetInnerHTML"` would produce false-positive failures because the component JSDoc comments documented the bans by mentioning the banned terms verbatim (e.g., "No ErrorAlert (Pitfall 4)" and "No dangerouslySetInnerHTML (threat T-171-01)").
- **Fix:** Rewrote each component's top-of-file JSDoc to describe the bans without containing the literal substrings (e.g., "Uses Banner variant='error' per Pitfall 4 (not the legacy alert primitive)"). No code behavior changed. All acceptance-criteria greps now pass cleanly.
- **Files touched:** app/telefonia/components/TamStatusCard.tsx, DectHandsetsTable.tsx, CallHistoryTable.tsx (comments only).
- **Commit:** 6314b14b (bundled into Task 3 commit)

Per deviation-rule framework this is not a Rule 1/2/3 auto-fix — it is a trivial documentation tweak to satisfy the plan's literal verification pattern. Flagged here for traceability.

## Verification

Scoped Jest subsets (per CLAUDE.md Rule 8 — never bare `npm test`):

```
npm test -- app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts
→ Test Suites: 3 passed, 3 total · Tests: 13 passed, 13 total

npm test -- app/telefonia/components/__tests__/TamStatusCard.test.tsx app/telefonia/components/__tests__/DectHandsetsTable.test.tsx app/telefonia/components/__tests__/CallHistoryTable.test.tsx
→ Test Suites: 3 passed, 3 total · Tests: 16 passed, 16 total

npm test -- app/telefonia/__tests__/page.test.tsx app/components/layout/__tests__/CommandPaletteProvider.test.tsx
→ Test Suites: 2 passed, 2 total · Tests: 7 passed, 7 total

Combined: Test Suites: 8 passed · Tests: 36 passed
```

### Acceptance-criteria grep checks (all green)

- `grep -q "setStale(true)" app/telefonia/hooks/useFritzDectHandsets.ts` ✓
- `grep -q "PAGE_SIZE >= totalCount" app/telefonia/hooks/useFritzCallHistory.ts` ✓ (Pitfall 2)
- `grep -q "alwaysActive: false" app/telefonia/hooks/useFritzTamStatus.ts` ✓
- `grep -q "'use client'" app/telefonia/hooks/useFritzDectHandsets.ts` ✓
- `grep -q "if (!paused) void fetchData" app/telefonia/hooks/useFritzDectHandsets.ts` ✓ (Open Question #2)
- `grep -q "if (!paused) void fetchData" app/telefonia/hooks/useFritzCallHistory.ts` ✓
- `grep -q "if (!paused) void fetchData" app/telefonia/hooks/useFritzTamStatus.ts` ✓
- `grep -q "timestamp \* 1000" app/telefonia/components/CallHistoryTable.tsx` ✓ (Pitfall 6)
- `grep -q "Sconosciuto" app/telefonia/components/CallHistoryTable.tsx` ✓ (Pitfall 5)
- `! grep -rq "ErrorAlert" app/telefonia/` ✓ (Pitfall 4)
- `! grep -rq "dangerouslySetInnerHTML" app/telefonia/` ✓ (threat T-171-01)
- `grep -q "Cornette DECT" app/telefonia/components/DectHandsetsTable.tsx` ✓
- `grep -q "Cronologia chiamate" app/telefonia/components/CallHistoryTable.tsx` ✓
- `grep -q "Segreteria" app/telefonia/components/TamStatusCard.tsx` ✓
- `grep -q "nav-telephony" app/components/layout/CommandPaletteProvider.tsx` ✓ (D-17)
- `grep -q "/telefonia" app/components/layout/CommandPaletteProvider.tsx` ✓
- `grep -q "nav-telephony" app/components/layout/__tests__/CommandPaletteProvider.test.tsx` ✓

## Known Stubs

None. All three sections render live data from their respective /api/fritzbox/telephony endpoints. No hardcoded empty arrays, no placeholder text, no unwired components.

## Threat Flags

None introduced beyond the plan's registered threat model. All five STRIDE rows in `<threat_model>` remain accurate — no new network surface, auth paths, or trust boundaries were created in this plan.

## Self-Check: PASSED

### Files exist
- FOUND: app/telefonia/hooks/useFritzDectHandsets.ts
- FOUND: app/telefonia/hooks/useFritzCallHistory.ts
- FOUND: app/telefonia/hooks/useFritzTamStatus.ts
- FOUND: app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts
- FOUND: app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts
- FOUND: app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts
- FOUND: app/telefonia/components/TamStatusCard.tsx
- FOUND: app/telefonia/components/DectHandsetsTable.tsx
- FOUND: app/telefonia/components/CallHistoryTable.tsx
- FOUND: app/telefonia/components/__tests__/TamStatusCard.test.tsx
- FOUND: app/telefonia/components/__tests__/DectHandsetsTable.test.tsx
- FOUND: app/telefonia/components/__tests__/CallHistoryTable.test.tsx
- FOUND: app/telefonia/page.tsx
- FOUND: app/telefonia/__tests__/page.test.tsx
- FOUND: app/components/layout/__tests__/CommandPaletteProvider.test.tsx
- MODIFIED: app/components/layout/CommandPaletteProvider.tsx

### Commits exist (task-atomic)
- FOUND: 2db69d81 (Task 1 — telephony polling hooks)
- FOUND: 79ac06c1 (Task 2 — telephony presentational components)
- FOUND: 6314b14b (Task 3 — /telefonia page + CommandPalette wiring)
