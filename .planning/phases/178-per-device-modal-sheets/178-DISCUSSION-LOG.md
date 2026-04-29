# Phase 178: Per-Device Modal Sheets - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 178-per-device-modal-sheets
**Mode:** `--auto --chain` (gray areas auto-resolved with recommended defaults)
**Areas discussed:** file layout, sheet body composition, command-hook surface, scope of cards covered, Italian copy, tests, debounce strategy, scene-by-name lookup

---

## File layout — sheet bodies and sub-primitives

| Option | Description | Selected |
|--------|-------------|----------|
| A. Co-locate sheet bodies in `EmberGlass/cards/` next to their cards | Smaller surface, but mixes summary cards with full bodies | |
| B. New `EmberGlass/sheets/` subfolder + `sheets/primitives/` for shared sub-primitives | Mirrors `cards/` layout, easier discovery, supports Phase 179 reuse | ✓ |
| C. Inline each body inside its parent card file | Fewest files but huge file diffs and harder to test | |

**Auto choice:** B (recommended).
**Notes:** Mirrors Phase 177 D-01 split (`primitives/`-style namespace under `EmberGlass/`). Re-exported from the top-level barrel.

---

## Card-coverage scope — which cards get real sheet bodies

| Option | Description | Selected |
|--------|-------------|----------|
| A. Stove + Climate + Lights + Sonos + Tuya only (5 SHEET-* requirements) | Matches roadmap; Camera/Network/Dirigera keep placeholder | ✓ |
| B. Add Camera + Network + Dirigera as well | Scope creep — neither has SHEET-* requirement, Dirigera lacks command API | |
| C. Drop Tuya, ship 4 only | Violates SHEET-06 | |

**Auto choice:** A (recommended).
**Notes:** Camera/Network deferred — no SHEET-07/SHEET-08 spec yet. Dirigera deferred — read-only proxy at this milestone (no write API in `app/api/v1/dirigera/`). `<SheetPlaceholderBody>` retained for those three cards.

---

## Stove "Temperatura obiettivo" slider

| Option | Description | Selected |
|--------|-------------|----------|
| A. Drop the row from StoveSheet | Thermorossi proxy has no setpoint endpoint | ✓ |
| B. Wire to Netatmo stove-room setpoint | Couples StoveSheet to ClimateSheet data; UX-cleaner but adds coupling | |
| C. Render slider but disable it | Confusing — slider visible but unwirable | |

**Auto choice:** A (recommended).
**Notes:** Documented as deferred idea. A follow-up phase can either add a Thermorossi setpoint endpoint (option B path) or wire to Netatmo room setpoint.

---

## Hue scene resolution for the 4 named scene buttons

| Option | Description | Selected |
|--------|-------------|----------|
| A. Name match (case-insensitive) against existing Hue catalog; disable button if not found | Zero new infra, falls back gracefully | ✓ |
| B. Hardcoded Hue scene IDs | Brittle across users / Hue setups | |
| C. Build a scene-creation flow inline | Out of scope; significant feature | |

**Auto choice:** A (recommended).
**Notes:** New helper `findSceneByName` lives at `app/components/EmberGlass/sheets/lib/`. Disabled buttons show a `title="Crea scena 'Rilassante' su Hue"` tooltip.

---

## ClimateSheet target temperature debounce

| Option | Description | Selected |
|--------|-------------|----------|
| A. 500ms debounce via existing `useDebounce` | Matches `ThermostatCard.tsx` pattern | ✓ |
| B. No debounce — write on every ± click | Floods API on rapid taps | |
| C. 1000ms debounce | Feels laggy | |

**Auto choice:** A (recommended).

---

## SonosSheet volume debounce

| Option | Description | Selected |
|--------|-------------|----------|
| A. 250ms debounce via `useDebounce` | Matches v16.0 memory pattern | ✓ |
| B. 500ms debounce | Slower feedback than the user expects | |
| C. No debounce | Floods API on slider drag | |

**Auto choice:** A (recommended).

---

## Master "Riproduci/Pausa ovunque" failure mode

| Option | Description | Selected |
|--------|-------------|----------|
| A. `Promise.allSettled` — partial failures tolerated | Matches v16.0 batch pattern | ✓ |
| B. `Promise.all` — single failure aborts all | Loud failure mode, unfriendly UX | |

**Auto choice:** A (recommended).

---

## Test surface

| Option | Description | Selected |
|--------|-------------|----------|
| A. Jest specs per sheet + per sub-primitive + extend Phase 177 Playwright spec | Comprehensive; no new spec file | ✓ |
| B. Jest only — skip Playwright additions | Misses end-to-end wiring verification | |
| C. New separate Playwright file per sheet | More files, more boilerplate beforeAll/afterAll | |

**Auto choice:** A (recommended).
**Notes:** 5 new `test.describe` blocks added to `tests/playwright/dashboard-glass-cards.spec.ts`.

---

## Sub-primitive shipping breadth

| Option | Description | Selected |
|--------|-------------|----------|
| A. Ship `SheetRow`, `Stepper`, `Slider`, `RadialDial`, `SheetBtn`, `QuickActionButton` (6 primitives) | Front-loads Phase 179 Rooms tab needs | ✓ |
| B. Ship only what Phase 178 directly consumes (drop `Slider`) | Smaller diff but adds churn for Phase 179 | |
| C. Ship `BigSlider` too | Phase 179 only — not needed in 178 | |

**Auto choice:** A (recommended).
**Notes:** `<Slider>` is built but unused in Phase 178; Phase 179 Rooms tab will consume it. `<BigSlider>` deferred to Phase 179.

---

## Optimistic UI for InlineToggle

| Option | Description | Selected |
|--------|-------------|----------|
| A. Reuse existing optimistic pattern from `useLightsCommands` / `useTuyaCommands` | Consistent with rest of app | ✓ |
| B. Add explicit `pending` state per row | Overkill; existing retry infra handles this | |

**Auto choice:** A (recommended).

---

## Claude's Discretion

- Whether `<RadialDial>` exposes drag/touch on the arc in a follow-up phase. Out of scope here; ± buttons are sufficient for v20.0.
- Whether `findSceneByName` lives under `sheets/lib/` (chosen) or `app/components/devices/lights/utils/` — recommend the sheet-local path for self-contained review.
- `data-testid` granularity — apply liberally per Phase 176/177 precedent.
- Sonos volume scope (per-group via coordinator chosen vs per-speaker matrix) — deferred to a polish phase.

## Deferred Ideas

- CameraSheet, NetworkSheet, DirigeraSheet bodies (no SHEET-* requirement / no command API).
- Stove "Temperatura obiettivo" slider (no Thermorossi setpoint API today).
- Stove pellet percentage line (verify `useStoveData` exposes the field).
- `<BigSlider>` sub-primitive (Phase 179 will consume).
- Long-press / swipe-to-dismiss gestures on Sheet.
- Reduced-motion overrides on sheet open/close + radial dial.
- `<RadialDial>` arc drag/touch.
- Hue scene-creation UI.
- Sonos per-speaker volume matrix.
- Cleanup phase: delete `<SheetPlaceholderBody>` + legacy big cards + orphan per-device skeletons.
- Design System Reference v2 entry for the new sheets (Phase 182).
- Web Vitals telemetry on sheet open/close.
