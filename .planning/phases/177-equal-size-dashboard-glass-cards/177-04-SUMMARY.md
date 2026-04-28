---
phase: 177
plan: 04
subsystem: ember-glass-dashboard
tags: [ember-glass, dashboard-cards, lights, sonos, dash-04, dash-05]
requires:
  - 177-01 (GlassCard, CardHead, StatusDot)
  - 177-02 (Pressable, Sheet, InlineToggle, PlayingBars, SheetPlaceholderBody)
provides:
  - LightsCard dashboard summary surface (DASH-04)
  - SonosCard dashboard summary surface (DASH-05)
affects:
  - app/components/EmberGlass/cards/
tech-stack:
  added: []
  patterns:
    - "Hook-coupling pattern lifted from legacy LightsCard (Pick<UseLightsDataReturn, ...> + router)"
    - "Dialog data-state assertion (Sheet uses Radix forceMount → role=dialog always present)"
    - "Real proxy shape consumption (HueLight.light_id, SonosZoneResponse.coordinator_name, SonosPlaybackResponse.transport_state/title)"
key-files:
  created:
    - app/components/EmberGlass/cards/LightsCard.tsx
    - app/components/EmberGlass/cards/SonosCard.tsx
    - app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx
    - app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx
  modified: []
decisions:
  - "InlineToggle onChange calls e.stopPropagation() before handleAllLightsToggle (D-17)"
  - "Sheet open assertion uses dialog data-state because Sheet uses Radix forceMount"
  - "Used real proxy types from types/sonosProxy.ts (transport_state/title) rather than the placeholder shapes shown in PLAN.md examples"
metrics:
  duration: 35m
  completed: 2026-04-28
  tasks: 2
  files: 4
  tests: 11
---

# Phase 177 Plan 04: LightsCard + SonosCard Summary

LightsCard (DASH-04) and SonosCard (DASH-05) shipped — the multi-item list-class dashboard tiles that establish the ≤4-rows + overflow + footer pattern reused by future TuyaCard / DirigeraCard.

## Commits

| Phase | Type | Hash | Message |
| --- | --- | --- | --- |
| RED | test | `30d4c57f` | test(177-04): add failing test for LightsCard summary surface |
| GREEN | feat | `b3efb3be` | feat(177-04): implement LightsCard summary surface (DASH-04) |
| RED | test | `5db8763c` | test(177-04): add failing test for SonosCard summary surface |
| GREEN | feat | `29a0bb90` | feat(177-04): implement SonosCard summary surface (DASH-05) |

## Verification

```
npx jest --testPathPatterns='cards/__tests__/(LightsCard|SonosCard)\.test'
Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
```

Per-card breakdown:
- LightsCard: 6/6 (a..f covering on-light list, empty state, true→false toggle flip, sheet-on-body-click, overflow row, false→true toggle flip)
- SonosCard: 5/5 (a..e covering group names, count copy, In pausa, PlayingBars only on playing rows, sheet-on-body-click)

`npx tsc --noEmit` exits clean for both new files (filtered: zero diagnostics under `EmberGlass/cards`). Pre-existing tsc errors in unrelated files remain untouched (out-of-scope).

## Hook-shape diff vs legacy `app/components/devices/lights/LightsCard.tsx`

| Concern | Legacy (lines 31–45) | New (Phase 177) | Match |
| --- | --- | --- | --- |
| `useLightsData()` call | `const lightsData = useLightsData();` | `const lightsData = useLightsData();` | ✓ |
| `useLightsCommands` arg shape | `Pick<UseLightsDataReturn, 'setRefreshing' \| 'setLoadingMessage' \| 'setError' \| 'fetchData' \| 'groups' \| 'checkConnection' \| 'connected'> + router` | identical Pick subset + router | ✓ |
| `lights[]` field name | `lightsData.lights` (HueLight[] keyed by `light_id`) | `lightsData.lights` consumed via `l.light_id`, `l.name`, `l.on` | ✓ |

## stopPropagation verification (D-17)

LightsCard line 73:

```tsx
onChange={(e) => {
  e.stopPropagation(); // D-17 — prevent parent Pressable click → sheet open
  void cmds.handleAllLightsToggle(!anyOn);
}}
```

Test (c) in `LightsCard.test.tsx` exercises this — clicking the inline-toggle with `anyOn=true` (steady-state fixture) calls `handleAllLightsToggle(false)` and the dialog `data-state` remains `"closed"`. If propagation leaked, the parent Pressable would fire `onOpen` → dialog state would flip to `"open"` and the test would fail.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Integration shape] `useLightsCommands` argument shape**
- **Found during:** Task 1 implementation
- **Issue:** PLAN.md example used `useLightsCommands({ lightsData, router })` passing the full `lightsData` object. The actual signature is `Pick<UseLightsDataReturn, 'setRefreshing' | 'setLoadingMessage' | 'setError' | 'fetchData' | 'groups' | 'checkConnection' | 'connected'>` — passing the full object would surface stricter type-narrowing failures (and tightly couple callers to the entire return type).
- **Fix:** Built the picked subset manually exactly as the legacy `app/components/devices/lights/LightsCard.tsx:34-45` does.
- **Files modified:** `app/components/EmberGlass/cards/LightsCard.tsx`
- **Commit:** `b3efb3be`

**2. [Rule 3 — Integration shape] `HueLight.id` does not exist (real field is `light_id`)**
- **Found during:** Task 1 implementation
- **Issue:** PLAN.md example mapped `onLights.map((l) => ... key={l.id})`, but `HueLight` (per `types/hueProxy.ts:56-74`) has `light_id: string`, not `id`. PATTERNS.md carries the same placeholder.
- **Fix:** Consumed `l.light_id` for keys, `l.name` for display, `l.on` for filter.
- **Files modified:** `app/components/EmberGlass/cards/LightsCard.tsx`
- **Commit:** `b3efb3be`

**3. [Rule 3 — Integration shape] Sonos proxy types — `coordinator_name` + `transport_state` + `title`**
- **Found during:** Task 2 implementation
- **Issue:** PLAN.md and PATTERNS.md examples used `z.coordinator?.name`, `pb?.state === 'PLAYING'`, and `pb?.current_track?.title`. The real types in `types/sonosProxy.ts:67-92` are `SonosZoneResponse.coordinator_name` (flat string), `SonosPlaybackResponse.transport_state`, and `SonosPlaybackResponse.title` (no `current_track` nesting).
- **Fix:** Implementation reads `z.coordinator_name`, `pb?.transport_state === 'PLAYING'`, and `pb?.title`. Tests use the matching fixture shape so they would catch any future drift.
- **Files modified:** `app/components/EmberGlass/cards/SonosCard.tsx`, `app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx`
- **Commit:** `29a0bb90`

**4. [Rule 3 — Test-shape] Sheet open/closed assertion via `data-state`**
- **Found during:** Task 1 GREEN run
- **Issue:** PLAN.md test (d) suggested `expect(screen.queryByText(/Controlli in arrivo/)).toBeNull()` for "sheet is closed" — but `Sheet.tsx` uses Radix `forceMount` on Portal+Content (intentional for outro animation, see Phase 175 SHEET-01). That means the `<SheetPlaceholderBody>` text is always in the DOM whether the dialog is open or closed.
- **Fix:** Updated tests (c) and (d) to assert `document.querySelector('[role="dialog"]')?.getAttribute('data-state')` flipping between `"closed"` and `"open"`. SonosCard test (e) uses the same pattern from the start.
- **Files modified:** `app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx`
- **Commit:** `b3efb3be` (committed alongside the LightsCard implementation, since RED/GREEN+test-fix landed atomically)

### Auth gates

None.

### Out-of-scope items deferred

None encountered. Pre-existing tsc errors in `app/debug/**`, `app/network/**` test files predate this plan.

## Acceptance criteria audit

LightsCard (Task 1):
- [x] `data-testid="lights-card"` (1)
- [x] `InlineToggle` referenced (4 occurrences: import, JSX, doc, comment)
- [x] `e.stopPropagation()` (2 occurrences — comment + call site)
- [x] `handleAllLightsToggle` (1 — call site, reachable via `cmds.handleAllLightsToggle`)
- [x] `Spente` literal (2 — JSX + doc)
- [x] `altre` (2 — JSX + doc)
- [x] `di .*accese` regex (2)
- [x] `#f5c84a` (2 — TONE constant + doc reference)
- [x] zero `useMemo` / `useCallback` outside comments
- [x] hook-shape diff matches legacy
- [x] Test (c) asserts `handleAllLightsToggle(false)` against `anyOn=true` fixture
- [x] `npx tsc --noEmit` exits 0 for new files
- [x] jest pass — 6/6

SonosCard (Task 2):
- [x] `data-testid="sonos-card"` (1)
- [x] `PlayingBars` (3 — import + JSX + doc)
- [x] `in riprod` (1 — template literal)
- [x] `'In pausa'` literal (1)
- [x] `#b080ff` (2 — TONE + doc)
- [x] `.slice(0, 4)` (1)
- [x] `key={g.group_id}` stable key (1)
- [x] zero `useMemo` / `useCallback` outside comments
- [x] `npx tsc --noEmit` exits 0 for new files
- [x] jest pass — 5/5

## Threat Flags

None — both cards delegate writes to existing `useLightsCommands.handleAllLightsToggle` which retains the established X-API-Key auth via the shared HA proxy. SonosCard is read-only (no command surface).

## Self-Check: PASSED

- [x] `app/components/EmberGlass/cards/LightsCard.tsx` exists
- [x] `app/components/EmberGlass/cards/SonosCard.tsx` exists
- [x] `app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx` exists
- [x] `app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx` exists
- [x] Commit `30d4c57f` (RED LightsCard) found in `git log`
- [x] Commit `b3efb3be` (GREEN LightsCard) found in `git log`
- [x] Commit `5db8763c` (RED SonosCard) found in `git log`
- [x] Commit `29a0bb90` (GREEN SonosCard) found in `git log`
- [x] 11/11 jest tests pass under `cards/__tests__/(LightsCard|SonosCard)`
- [x] tsc clean for both card files
