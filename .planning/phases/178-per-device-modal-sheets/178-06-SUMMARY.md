---
phase: 178
plan: 06
subsystem: ember-glass-sheets
tags: [ember-glass, sheets, lights, hue, sheet-04, d-07, d-21]
requirements: [SHEET-04]
dependency_graph:
  requires:
    - 178-01 (QuickActionButton primitive)
    - 178-02 (findSceneByName helper)
    - app/components/EmberGlass/InlineToggle (Phase 177 primitive)
    - app/components/devices/lights/hooks/useLightsData (existing)
    - app/components/devices/lights/hooks/useLightsCommands (existing)
  provides:
    - SHEET-04 body — Lights control sheet (summary header + scene strip + per-room sections)
    - LightsSheet (named export) — body-only component (D-04) consumed by Phase 177 LightsCard
  affects:
    - app/components/EmberGlass/cards/LightsCard.tsx (single-line swap deferred to Plan 178-09)
tech_stack:
  added: []
  patterns:
    - "Bundle-verbatim inline-style + var(--token) (D-02)"
    - "Pitfall 9: byRoom mapping reverse-derived from groups[].lights[] (string[]) — NOT from lights[].room_id"
    - "Pitfall 9b: per-light row InlineToggle is semantically room-level (handleRoomToggle(group.group_id, !any_on))"
    - "Scene-by-name fallback via findSceneByName helper (case-insensitive lookup)"
    - "Disabled state on scene buttons when no Room-type primary group exists (defensive — UI-SPEC §Discretion)"
    - "RC-clean: zero useMemo / useCallback (D-33)"
key_files:
  created:
    - app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx
  modified:
    - app/components/EmberGlass/sheets/LightsSheet.tsx (stub → real implementation)
decisions:
  - "Per-light toggle is room-level (Pitfall 9 option a) — handleRoomToggle(group_id, !groupOn) regardless of individual light state. Bundle visual implies per-light but useLightsCommands exposes only room-level surface. Acceptable trade-off; documented in JSDoc + threat T-178-06-02 (accept)."
  - "Primary group for scene activation = first Room-type group (groups.find(g => g.type === 'Room')). Falls back to undefined → all scene buttons disabled with the missing-scene tooltip."
  - "errorMessage is rendered only when truthy AND non-empty string (lightsData.error is typed string|null per UseLightsDataReturn). Plan-snippet's `instanceof Error` branch was removed — never reached because the hook narrows to string|null."
  - "Loading skeleton dimensions match LightsSheet's expected ~520px height per UI-SPEC §body sizing."
metrics:
  duration_minutes: 8
  files_changed: 2
  tasks_completed: 1
  tests_added: 13
  tests_passing: 13
completed: 2026-04-29
---

# Phase 178 Plan 06: LightsSheet Summary

LightsSheet (SHEET-04 / CONTEXT D-07) ships as the bundle-verbatim Lights control surface inside the Phase 177 dashboard sheet — 3-col summary header, 2-col scene strip with name-match fallback, and per-room rounded lists wired to existing `useLightsData` + `useLightsCommands`.

## Outcome

Plan 178-06 replaces the LightsSheet stub with the production body. The implementation honors the locked bundle layout (`.planning/inbox/ember-glass-design/project/components/sheets.jsx:199-297`) and the frozen D-21 Italian copy ("Accese", "Tutte on", "Tutte off", "Scene", scene labels Rilassante / Concentrato / Cena / Notte, disabled-scene tooltip "Crea scena '{name}' su Hue"). Pitfall 9 is honored end-to-end: `byRoom` is reverse-mapped from `groups[].lights[]` (light_id strings) and the per-light row `InlineToggle` semantically writes at room level via `handleRoomToggle(group.group_id, !groupOn)`.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | RED — failing jest spec (13 cases) | `4b277f7c` | `app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx` |
| 1 | GREEN — real LightsSheet body | `2dba0acb` | `app/components/EmberGlass/sheets/LightsSheet.tsx` |

## What Was Built

### `app/components/EmberGlass/sheets/LightsSheet.tsx` (396 LOC)

- `'use client'`; no props; self-fetches `useLightsData` + `useLightsCommands` (D-04 body-only convention).
- **Loading skeleton** (`data-testid="lights-sheet-skeleton"`) gated on `loading && lights.length === 0 && groups.length === 0` — matches D-26 first-fetch contract; later refreshes keep the cached UI.
- **Error fallback** (`data-testid="lights-sheet-error"`) gated on `error && lights.length === 0 && groups.length === 0` — renders `<TriangleAlert>` + `Non raggiungibile. Riprova più tardi.` + the hook's error string verbatim (D-27).
- **Summary header** — 3-col grid (`1fr auto auto`, gap 10, marginBottom 18). Count card flips background tint based on `onCount > 0`: `rgba(245,200,74,0.1)` (yellow) ↔ `rgba(255,255,255,0.04)` (neutral). `<QuickActionButton>` "Tutte on" carries `active={allOn}` (yellow when every light is on) + click → `handleAllLightsToggle(true)`. "Tutte off" pill always inactive + click → `handleAllLightsToggle(false)`.
- **Scene strip** — 11px caps eyebrow `Scene` + 2-col grid of 4 buttons (`Rilassante`, `Concentrato`, `Cena`, `Notte`). Each button looks up its match via `findSceneByName(scenes, name)`. On hit + valid `primaryGroupId`, fires `handleSceneActivate(match.scene_id, primaryGroupId)`. On miss OR no Room-type group, button renders with `data-disabled="true"`, `disabled`, `cursor: not-allowed`, `opacity: 0.5`, and `title="Crea scena '{name}' su Hue"` (HTML tooltip).
- **Per-room sections** — `for (const group of groups)` filtered by `group.type === 'Room'`; each section renders an 11px caps eyebrow with the raw room name + a rounded list container with per-light rows (32×32 bulb tile, name, `<InlineToggle on color="#f5c84a">`). Each row toggle calls `handleRoomToggle(section.group.group_id, !groupOn)` where `groupOn = section.group.any_on === true` — Pitfall 9 room-level write.

### `app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx` (265 LOC, 13 cases)

| # | Case | What it asserts |
|---|------|-----------------|
| 1 | Render shape | `lights-sheet` root + count `3 / 6` + Tutte on/off pills + 4 scene testids + 2 room sections + 6 per-light toggle wrappers |
| 2 | Tutte on | `handleAllLightsToggle(true)` |
| 3 | Tutte off | `handleAllLightsToggle(false)` |
| 4 | Rilassante click | `handleSceneActivate('s-rilassante', 'g1')` |
| 5 | Concentrato disabled | `data-disabled=true`, `title="Crea scena 'Concentrato' su Hue"`, `disabled` attribute, click is no-op |
| 6 | No Room group | All 4 scene buttons rendered with `data-disabled="true"` |
| 7 | Per-light Salotto toggle | `handleRoomToggle('g1', false)` (group `any_on=true` → next `false`) |
| 8 | Per-light Camera toggle | `handleRoomToggle('g2', true)` (group `any_on=false` → next `true`) |
| 9 | Count card yellow | `rgba(245,200,74,0.1)` (jsdom comma-normalized) |
| 10 | Count card neutral | `rgba(255,255,255,0.04)` when `onCount === 0` |
| 11 | Tutte on active state | `rgba(245,200,74,0.18)` + `rgb(245,200,74)` (jsdom hex→rgb conversion) |
| 12 | Loading skeleton | `lights-sheet-skeleton` rendered alone (no root, no other testids) |
| 13 | Error fallback | `lights-sheet-error` + literal IT copy + the error string passed through |

## Verification

```bash
npx jest app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx --no-coverage
# Test Suites: 1 passed, 1 total
# Tests:       13 passed, 13 total

npx jest app/components/EmberGlass/sheets/ --no-coverage
# Test Suites: 10 passed, 10 total
# Tests:       77 passed, 77 total

npx tsc --noEmit  # zero errors in LightsSheet.tsx and LightsSheet.test.tsx (pre-existing
                  # errors in unrelated debug/network test files are out of scope per
                  # SCOPE BOUNDARY rule)

# Acceptance grep checks (all GREEN):
grep -cE "useMemo|useCallback" app/components/EmberGlass/sheets/LightsSheet.tsx        # → 0
grep -cE "Rilassante|Concentrato|Cena|Notte" app/components/EmberGlass/sheets/LightsSheet.tsx  # → 5
grep -n "Crea scena" app/components/EmberGlass/sheets/LightsSheet.tsx                  # → JSDoc + tooltip
grep -n "section.group.group_id" app/components/EmberGlass/sheets/LightsSheet.tsx      # → 2 hits (key + handler)
```

## Deviations from Plan

### Adjustments to Plan-snippet code (none are deviations — plan author flagged them for verification)

**1. [Verified] InlineToggle.onChange signature**
- **Found during:** Task 1 GREEN
- **Issue:** Plan-snippet snippet wrote `<InlineToggle onChange={(next) => handleRoomToggle(group_id, next)} />` where `next` was treated as a boolean. The actual `InlineToggle.onChange` signature is `(e: MouseEvent<HTMLButtonElement>) => void` (verified in `app/components/EmberGlass/InlineToggle.tsx`).
- **Fix:** Compute the next state from the group's `any_on` and ignore the event arg: `onChange={() => void cmds.handleRoomToggle(section.group.group_id, !groupOn)}`. Result is identical to the spec must_have ("invokes `handleRoomToggle(group.group_id, !groupOn)`"); just the call shape differs.
- **Plan acknowledgement:** the plan's `<action>` block flagged this exact verification need ("`InlineToggle` primitive's emit shape … must be verified by reading `InlineToggle.tsx`. … Plan executor verifies and adjusts the spec helper accordingly.").

**2. [Verified] errorMessage type narrowing**
- **Found during:** Task 1 GREEN
- **Issue:** Plan-snippet rendered the error secondary line via a chain `typeof errorMessage === 'string' ? errorMessage : errorMessage instanceof Error ? errorMessage.message : ''`. `UseLightsDataReturn.error` is typed `string | null`, so the `instanceof Error` branch was unreachable.
- **Fix:** Simplified to `typeof errorMessage === 'string' && errorMessage.length > 0` and rendered the string directly. Test 13 still passes.

**3. [Verified] Loading skeleton renders alone**
- **Found during:** Task 1 GREEN test design
- **Issue:** Plan must_have implied the skeleton renders inside the body. Implementation chose to early-return the skeleton (no `lights-sheet` root rendered). Test 12 asserts both: `getByTestId('lights-sheet-skeleton')` succeeds AND `queryByTestId('lights-sheet')` is null.
- **Rationale:** Loading + cached-data branches are mutually exclusive; rendering both at once would double-render under the same path. The early-return matches the canonical sheet body skeleton pattern (StoveSheet, PlugsSheet do the same).

These adjustments are **not deviations from intent** — the plan author explicitly delegated each verification step to the executor. They do not affect any acceptance criterion, must-have truth, or threat-model row.

### Out-of-scope discoveries

- **Stray uncommitted changes from parallel worktree agents** — `app/components/EmberGlass/sheets/StoveSheet.tsx` and `.claude/settings.local.json` showed as modified at agent start (made by sibling agents in the same worktree). NOT my files. NOT staged. NOT committed. Per `destructive_git_prohibition`, I did not run any blanket reset / clean / restore command. My commits stage only the files I changed (`LightsSheet.tsx` + `__tests__/LightsSheet.test.tsx`).

## CLAUDE.md Compliance

| Rule | Status | Notes |
|------|--------|-------|
| 1 — Never break existing | OK | No existing tests touched; `app/components/EmberGlass/sheets/` 10 suites all green (77 tests). |
| 2 — Wait for version updates | OK | No deps added. |
| 3 — Prefer editing existing | OK | `LightsSheet.tsx` was edited (stub → real); only the new test file was created. |
| 4 — Never run build/install | OK | Only `npx jest` and `npx tsc --noEmit` were invoked. |
| 5 — Always create/update tests | OK | 13-case jest spec ships alongside the body. |
| 6 — Use design system | OK | Inline-style + `var(--token)` per Phase 174 D-12; bundle gradients/colors tagged `// AUDIT-EXCEPTION`. |
| 7 — Never commit/push without request | OK | User explicitly requested per-task atomic commits; no push made. |
| 8 — Use scoped test subsets | OK | Verification used `npx jest <path>` (single file + sheets/ subdirectory) — never `npm test` alone. |

## Threat Compliance

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-178-06-01 (scene name → arbitrary scene_id misroute) | mitigate | OK — `findSceneByName` returns null on miss; native `disabled` attribute prevents click; on hit, `match.scene_id` is the user's own catalog entry (no user-supplied path). Test 5 + 6 cover the disabled paths. |
| T-178-06-02 (per-light toggle escalates to room-level write) | accept | Documented in JSDoc + this Summary's Decisions. Bundle visual implies per-light, command surface is room-level. |
| T-178-06-03 (room names verbatim) | accept | React escapes JSX text. Room names come from typed `HueGroup.name` via the typed proxy. |

No new threats introduced. No `## Threat Flags` section needed.

## Known Stubs

None. All UI surfaces render real data from `useLightsData()`. The 4 hardcoded scene names (Rilassante / Concentrato / Cena / Notte) are intentional D-21 frozen IT copy paired with intentional D-07 frozen scene gradients — not stubs. The 4 scene gradients are bundle-verbatim AUDIT-EXCEPTION literals.

## Self-Check: PASSED

- File `app/components/EmberGlass/sheets/LightsSheet.tsx` exists at HEAD (`git ls-tree HEAD app/components/EmberGlass/sheets/LightsSheet.tsx` → blob present).
- File `app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx` exists at HEAD.
- Commit `4b277f7c` (RED) — present in `git log --oneline -5`.
- Commit `2dba0acb` (GREEN) — present in `git log --oneline -5`.
- Test suite runs GREEN: 13/13 cases pass under `npx jest`.
- `tsc --noEmit` clean for changed files (pre-existing unrelated errors out of scope per SCOPE BOUNDARY).
- Acceptance grep checks all GREEN (no useMemo/useCallback; SCENES table; tooltip; byRoom from groups; group_id room toggle).
