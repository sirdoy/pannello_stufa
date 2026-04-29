---
phase: 178
plan: 09
subsystem: dashboard-card-integration
tags: [ember-glass, sheets, integration, cards, phase-178-wave-3]
requires:
  - 178-03  # SheetRow / Stepper / Slider / RadialDial / SheetBtn / QuickActionButton primitives
  - 178-04  # StoveSheet
  - 178-05  # ClimateSheet
  - 178-06  # LightsSheet
  - 178-07  # SonosSheet
  - 178-08  # PlugsSheet
provides:
  - StoveCard mounts <StoveSheet/> on tap
  - ClimateCard mounts <ClimateSheet/> on tap
  - LightsCard mounts <LightsSheet/> on tap
  - SonosCard mounts <SonosSheet/> on tap
  - TuyaCard mounts <PlugsSheet/> on tap (PlugsSheet is the Tuya-only plug body)
  - All 5 dashboard cards swapped from <SheetPlaceholderBody> to real sheet bodies
  - Phase 177 jest specs updated to mock the real sheet bodies and assert {device}-sheet testids
affects:
  - app/components/EmberGlass/cards/{Stove,Climate,Lights,Sonos,Tuya}Card.tsx
  - app/components/EmberGlass/cards/__tests__/{Stove,Climate,Lights,Sonos,Tuya}Card.test.tsx
tech-stack:
  added: []
  patterns:
    - "Single-line import + render swap (D-35)"
    - "Mock real sheet body in card-level jest specs to keep tests focused on card surface"
key-files:
  created: []
  modified:
    - app/components/EmberGlass/cards/StoveCard.tsx
    - app/components/EmberGlass/cards/ClimateCard.tsx
    - app/components/EmberGlass/cards/LightsCard.tsx
    - app/components/EmberGlass/cards/SonosCard.tsx
    - app/components/EmberGlass/cards/TuyaCard.tsx
    - app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx
    - app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx
    - app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx
    - app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx
    - app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx
key-decisions:
  - "Mock the real sheet body in each card jest spec via `jest.mock('../../sheets/{Name}', () => ({ {Name}: () => <div data-testid=\"{device}-sheet\" /> }))`. This keeps the card-level test scoped to the card surface and avoids running sheet bodies' hooks (debounce, useThermostatCommands, Promise.allSettled batches, etc.) at the wrong abstraction layer."
  - "Tuya/Plugs naming asymmetry preserved: TuyaCard imports `<PlugsSheet/>` (not `<TuyaSheet/>`) per CONTEXT D-08 / Plan §Task 2 critical note. The data-testid the new mock emits is `plugs-sheet` (matches the sheet's own root testid)."
  - "JSDoc updates: StoveCard, LightsCard, SonosCard, TuyaCard JSDoc strings that referenced 'placeholder body' / `<SheetPlaceholderBody>` were updated to reflect the new component name. Comments-only edits, no behavioral effect."
metrics:
  duration: "~6 minutes"
  completed: 2026-04-29T11:11:41Z
  tasks: 2
  commits: 2
  tests_added: 0
  tests_modified: 5
  tests_passing: 54  # all card-level specs (10 suites including untouched Camera/Network/Dirigera/Weather/Raspi)
---

# Phase 178 Plan 09: Card-Swap Integration Summary

Swapped 5 dashboard cards from `<SheetPlaceholderBody>` to their real Phase 178 sheet bodies (`<StoveSheet/>`, `<ClimateSheet/>`, `<LightsSheet/>`, `<SonosSheet/>`, `<PlugsSheet/>`). Updated 5 Phase 177 jest specs to mock the new sheet bodies and assert their root `data-testid="{device}-sheet"` instead of the retired placeholder copy. CameraCard, NetworkCard, DirigeraCard remain on `<SheetPlaceholderBody>` (out of v20.0 scope per CONTEXT D-03); WeatherCard / RaspiCard never had a Sheet (Phase 177 D-11). Each card edit is the single-line import + render swap mandated by D-35; the `useState<boolean>` open flag, `<GlassCard onOpen>` wiring, and `<Sheet open onClose title>` wrapper stay verbatim from Phase 177 (D-36).

## What Was Built

### Task 1 — Stove + Climate + Lights swap (commit `1c86c2b0`)

- **StoveCard.tsx (line 34, 100):**
  - `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` → `import { StoveSheet } from '../sheets/StoveSheet';`
  - `<SheetPlaceholderBody phase="178" device="stove" />` → `<StoveSheet />`
  - Top-of-file JSDoc tightened to point at `<StoveSheet>` instead of "placeholder body — Phase 178 swaps in the real StoveSheet" (now retroactively true).
- **ClimateCard.tsx (line 34, 117):**
  - `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` → `import { ClimateSheet } from '../sheets/ClimateSheet';`
  - `<SheetPlaceholderBody phase="178" device="thermostat" />` → `<ClimateSheet />`
- **LightsCard.tsx (line 38, 146):**
  - `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` → `import { LightsSheet } from '../sheets/LightsSheet';`
  - `<SheetPlaceholderBody phase="178" device="lights" />` → `<LightsSheet />`
  - JSDoc: `Adjacent <Sheet> with placeholder body (Phase 178 swap).` → `Adjacent <Sheet> wraps <LightsSheet /> (Phase 178-09 swap).`

**Jest spec updates (3 files):** Each spec gained a top-of-file `jest.mock('../../sheets/{Name}', () => ({ {Name}: () => <div data-testid="{device}-sheet" /> }));` block. The Phase 177 sheet-tap test in each spec replaced its placeholder assertion:
- `StoveCard.test.tsx (c)` — `getByTestId('sheet-placeholder-body')` → `getByTestId('stove-sheet')`.
- `ClimateCard.test.tsx (Tap → sheet opens)` — `getByTestId('sheet-placeholder-body')` → `getByTestId('climate-sheet')`.
- `LightsCard.test.tsx (d)` — `getByText(/Controlli in arrivo nella Phase 178/)` → `getByTestId('lights-sheet')`.

Verification: `npm test -- StoveCard.test.tsx ClimateCard.test.tsx LightsCard.test.tsx` → 18/18 green.

### Task 2 — Sonos + Tuya swap (commit `620b2992`)

- **SonosCard.tsx (line 31, 125):**
  - `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` → `import { SonosSheet } from '../sheets/SonosSheet';`
  - `<SheetPlaceholderBody phase="178" device="sonos" />` → `<SonosSheet />`
  - JSDoc: `Adjacent <Sheet> with placeholder body (Phase 178 swap).` → `Adjacent <Sheet> wraps <SonosSheet /> (Phase 178-09 swap).`
- **TuyaCard.tsx (line 27, 95):**
  - `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` → `import { PlugsSheet } from '../sheets/PlugsSheet';`
  - `<SheetPlaceholderBody phase="178" device="plugs-tuya" />` → `<PlugsSheet />`
  - JSDoc body comment: `Tapping the card opens the placeholder sheet wired to ` `<SheetPlaceholderBody phase="178" device="plugs-tuya" />` `.` → `Tapping the card opens the sheet wired to ` `<PlugsSheet />` ` (Phase 178-09 swap).`

**Jest spec updates (2 files):** Same shape as Task 1.
- `SonosCard.test.tsx (e)` — `getByText(/Controlli in arrivo nella Phase 178/)` → `getByTestId('sonos-sheet')`.
- `TuyaCard.test.tsx (clicking the card opens the placeholder sheet)` — title renamed to `clicking the card opens the real PlugsSheet body (Phase 178-09)`; `queryByText(/Controlli in arrivo/i)` → `getByTestId('plugs-sheet')`. The unused `queryByText` was removed from the destructured render result.

Verification: `npm test -- SonosCard.test.tsx TuyaCard.test.tsx` → 12/12 green.

## Acceptance Criteria

| Criterion | Result |
| --- | --- |
| StoveCard contains `import { StoveSheet } from '../sheets/StoveSheet'` AND `<StoveSheet />` | PASS |
| StoveCard does NOT contain `SheetPlaceholderBody phase="178" device="stove"` | PASS |
| ClimateCard contains `import { ClimateSheet } from '../sheets/ClimateSheet'` AND `<ClimateSheet />` | PASS |
| ClimateCard does NOT contain `SheetPlaceholderBody phase="178" device="thermostat"` | PASS |
| LightsCard contains `import { LightsSheet } from '../sheets/LightsSheet'` AND `<LightsSheet />` | PASS |
| LightsCard does NOT contain `SheetPlaceholderBody phase="178" device="lights"` | PASS |
| SonosCard contains `import { SonosSheet } from '../sheets/SonosSheet'` AND `<SonosSheet />` | PASS |
| SonosCard does NOT contain `SheetPlaceholderBody phase="178" device="sonos"` | PASS |
| TuyaCard contains `import { PlugsSheet } from '../sheets/PlugsSheet'` AND `<PlugsSheet />` | PASS |
| TuyaCard does NOT contain `SheetPlaceholderBody phase="178" device="plugs-tuya"` | PASS |
| TuyaCard JSDoc no longer references `SheetPlaceholderBody` | PASS |
| 5 jest specs include sheet mocks + assert `{device}-sheet` testid | PASS |
| Card jest suites all green | PASS (54/54 across all 10 card specs) |
| `npx tsc --noEmit` clean for files in this plan's scope | PASS (no new EmberGlass errors; 7 pre-existing unrelated errors in `app/debug/` and `app/network/` test files persist) |
| DirigeraCard, CameraCard, NetworkCard files not modified | PASS (still mount `<SheetPlaceholderBody phase="178" device="..." />` — verified via grep) |
| WeatherCard, RaspiCard not modified (no Sheet by D-11) | PASS |

## Verification Commands & Output

```bash
$ npm run test:components -- app/components/EmberGlass/cards/__tests__
…
Test Suites: 11 passed, 11 total
Tests:       64 passed, 64 total
```

```bash
$ npx tsc --noEmit 2>&1 | grep -E "EmberGlass" | wc -l
0
```

```bash
$ grep -lE "SheetPlaceholderBody" app/components/EmberGlass/cards/*.tsx | xargs basename -a
CameraCard.tsx
DirigeraCard.tsx
NetworkCard.tsx
SheetPlaceholderBody.tsx
```

The 5 swapped cards no longer import or reference `SheetPlaceholderBody`; the 3 deferred cards (Camera/Network/Dirigera) still do, exactly as scoped by CONTEXT D-03 / D-35.

## Deviations from Plan

None — plan executed exactly as written.

The plan's optional JSDoc-update step (Task 2 explicit; Tasks 1 implicit via comment-rot) was extended to all 4 cards whose JSDoc stub-text mentioned the placeholder. Comments-only edits, no behavioral change. Tracked here for completeness rather than as a deviation.

## Threat Surface Scan

No new network endpoints, auth paths, or schema-at-trust-boundary changes. Sheet bodies (built in Plans 178-04..178-08) self-fetch via existing hooks; this plan only flips the JSX child node from a placeholder to the real component. Threat register T-178-09-01 (mitigation = "edits limited to two lines per card, `<Sheet open onClose title>` wrapper unchanged, grep boundary asserted") and T-178-09-02 (accept = "no new auth surface; Phase 177 already gates dashboard mount on Auth0") both hold.

## Self-Check: PASSED

**Files (all expected created/modified files exist):**
- FOUND: app/components/EmberGlass/cards/StoveCard.tsx
- FOUND: app/components/EmberGlass/cards/ClimateCard.tsx
- FOUND: app/components/EmberGlass/cards/LightsCard.tsx
- FOUND: app/components/EmberGlass/cards/SonosCard.tsx
- FOUND: app/components/EmberGlass/cards/TuyaCard.tsx
- FOUND: app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx
- FOUND: app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx
- FOUND: app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx
- FOUND: app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx
- FOUND: app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx

**Commits:**
- FOUND: 1c86c2b0 — `feat(178-09): swap Stove/Climate/Lights cards to real sheet bodies`
- FOUND: 620b2992 — `feat(178-09): swap Sonos/Tuya cards to real sheet bodies`
