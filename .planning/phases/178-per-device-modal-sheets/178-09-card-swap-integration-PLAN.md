---
phase: 178
plan: 09
type: execute
wave: 3
depends_on: ['178-03', '178-04', '178-05', '178-06', '178-07', '178-08']
files_modified:
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
autonomous: true
requirements: [SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06]
tags: [ember-glass, sheets, integration, cards]
must_haves:
  truths:
    - "StoveCard mounts <StoveSheet /> instead of <SheetPlaceholderBody phase=\"178\" device=\"stove\">"
    - "ClimateCard mounts <ClimateSheet /> instead of placeholder"
    - "LightsCard mounts <LightsSheet /> instead of placeholder"
    - "SonosCard mounts <SonosSheet /> instead of placeholder"
    - "TuyaCard mounts <PlugsSheet /> instead of placeholder"
    - "DirigeraCard, CameraCard, NetworkCard UNCHANGED (still SheetPlaceholderBody)"
    - "Existing Phase 177 jest specs that asserted placeholder are updated to assert real sheet rendering"
    - "Each affected card retains its useState<boolean> open + GlassCard onOpen + Sheet wrapper unchanged (D-36)"
  artifacts:
    - path: app/components/EmberGlass/cards/StoveCard.tsx
      provides: "Real StoveSheet body mounted"
    - path: app/components/EmberGlass/cards/ClimateCard.tsx
      provides: "Real ClimateSheet body mounted"
    - path: app/components/EmberGlass/cards/LightsCard.tsx
      provides: "Real LightsSheet body mounted"
    - path: app/components/EmberGlass/cards/SonosCard.tsx
      provides: "Real SonosSheet body mounted"
    - path: app/components/EmberGlass/cards/TuyaCard.tsx
      provides: "Real PlugsSheet body mounted"
  key_links:
    - from: app/components/EmberGlass/cards/StoveCard.tsx
      to: app/components/EmberGlass/sheets/StoveSheet.tsx
      via: "import { StoveSheet } from '../sheets/StoveSheet';"
      pattern: "from '../sheets/StoveSheet'"
user_setup: []
---

<objective>
Swap the placeholder sheet body in each of the 5 affected Phase 177 cards (Stove, Climate, Lights, Sonos, Tuya) for the real Phase 178 sheet body. The card-level edit is **single-line per card** (CONTEXT D-35):

| Card | Replace |
|------|---------|
| StoveCard.tsx:100 | `<SheetPlaceholderBody phase="178" device="stove" />` → `<StoveSheet />` + import swap |
| ClimateCard.tsx:117 | `<SheetPlaceholderBody phase="178" device="thermostat" />` → `<ClimateSheet />` + import swap |
| LightsCard.tsx:146 | `<SheetPlaceholderBody phase="178" device="lights" />` → `<LightsSheet />` + import swap |
| SonosCard.tsx:125 | `<SheetPlaceholderBody phase="178" device="sonos" />` → `<SonosSheet />` + import swap |
| TuyaCard.tsx:95 | `<SheetPlaceholderBody phase="178" device="plugs-tuya" />` → `<PlugsSheet />` + import swap |

DirigeraCard, CameraCard, NetworkCard, WeatherCard, RaspiCard: **UNCHANGED**.

Plus: update each card's existing Phase 177 jest spec that asserted the `SheetPlaceholderBody` was rendered. The new assertion: when the sheet is open, the corresponding `data-testid="{device}-sheet"` element is in the DOM.

The `useState<boolean>(false)` for `open`, the `<GlassCard onOpen>` wiring, and the `<Sheet open onClose title>` wrapper all stay verbatim from Phase 177 (D-36).

Purpose: Wire all 5 sheet bodies to their host cards. The dashboard now shows real device controls inside each tap-opened sheet.
Output: 5 .tsx single-line swaps, 5 jest spec updates.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md
@.planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md
@.planning/phases/178-per-device-modal-sheets/178-PATTERNS.md
@app/components/EmberGlass/cards/StoveCard.tsx
@app/components/EmberGlass/cards/ClimateCard.tsx
@app/components/EmberGlass/cards/LightsCard.tsx
@app/components/EmberGlass/cards/SonosCard.tsx
@app/components/EmberGlass/cards/TuyaCard.tsx

<interfaces>
<!-- Verified via grep: -->
<!-- StoveCard.tsx:34   import { SheetPlaceholderBody } from './SheetPlaceholderBody'; -->
<!-- StoveCard.tsx:99   <Sheet open={open} onClose={() => setOpen(false)} title="Stufa"> -->
<!-- StoveCard.tsx:100    <SheetPlaceholderBody phase="178" device="stove" /> -->
<!-- ClimateCard.tsx:34  import { SheetPlaceholderBody } from './SheetPlaceholderBody'; -->
<!-- ClimateCard.tsx:117    <SheetPlaceholderBody phase="178" device="thermostat" /> -->
<!-- LightsCard.tsx:38  import { SheetPlaceholderBody } from './SheetPlaceholderBody'; -->
<!-- LightsCard.tsx:146    <SheetPlaceholderBody phase="178" device="lights" /> -->
<!-- SonosCard.tsx:31   import { SheetPlaceholderBody } from './SheetPlaceholderBody'; -->
<!-- SonosCard.tsx:125    <SheetPlaceholderBody phase="178" device="sonos" /> -->
<!-- TuyaCard.tsx:27    import { SheetPlaceholderBody } from './SheetPlaceholderBody'; -->
<!-- TuyaCard.tsx:95     <SheetPlaceholderBody phase="178" device="plugs-tuya" /> -->
<!-- -->
<!-- DirigeraCard, CameraCard, NetworkCard: UNCHANGED — they keep using SheetPlaceholderBody. -->
<!-- SheetPlaceholderBody.tsx itself: NOT deleted (D-03). -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Swap Stove + Climate + Lights cards (and update their jest specs)</name>
  <files>
    app/components/EmberGlass/cards/StoveCard.tsx,
    app/components/EmberGlass/cards/ClimateCard.tsx,
    app/components/EmberGlass/cards/LightsCard.tsx,
    app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx,
    app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx,
    app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-35, D-36 — single-line swap matrix)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Mounting + Sheet wiring" — illustrative diff)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 583-601 — card swap example diff)
    - app/components/EmberGlass/cards/StoveCard.tsx (FULL FILE — to find the exact import + render lines)
    - app/components/EmberGlass/cards/ClimateCard.tsx (FULL FILE)
    - app/components/EmberGlass/cards/LightsCard.tsx (FULL FILE)
    - app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx (FULL FILE — find existing placeholder assertion)
    - app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx (FULL FILE)
    - app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx (FULL FILE)
  </read_first>
  <behavior>
    For each of the 3 cards (Stove, Climate, Lights):
    - The import line `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` is REMOVED.
    - A new import line is ADDED: `import { StoveSheet } from '../sheets/StoveSheet';` (or ClimateSheet / LightsSheet).
    - The render line `<SheetPlaceholderBody phase="178" device="..." />` is replaced with `<StoveSheet />` (or `<ClimateSheet />` / `<LightsSheet />`).
    - All other code in the card file is UNCHANGED.

    For each of the 3 corresponding jest specs:
    - The assertion `expect(screen.getByTestId('sheet-placeholder-body')).toBeInTheDocument()` (or whatever the existing assertion is — find via grep) is replaced with `expect(screen.getByTestId('stove-sheet')).toBeInTheDocument()` (substitute device).
    - The mock for the sheet body must be ADDED at the top of the spec to prevent the real component from running its hooks during the card-level test:
      ```
      jest.mock('../../sheets/StoveSheet', () => ({
        StoveSheet: () => <div data-testid="stove-sheet" />,
      }));
      ```
    - All other test cases UNCHANGED.

    Verify the swap works at runtime:
    - The sheet still opens on card tap.
    - The body component renders inside the sheet.
    - Phase 177 dashboard smoke spec STILL passes (no behavioral regression).
  </behavior>
  <action>
For each of the 3 cards, perform the swap using the **Edit** tool:

**StoveCard.tsx (line 34 + 100):**
1. `Edit` line 34: replace `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` with `import { StoveSheet } from '../sheets/StoveSheet';`.
2. `Edit` line 100: replace `        <SheetPlaceholderBody phase="178" device="stove" />` with `        <StoveSheet />`.
3. If TypeScript flags an unused import (e.g. `SheetPlaceholderBodyProps` was imported), remove the unused name.

**ClimateCard.tsx (line 34 + 117):**
1. `Edit` line 34: import swap to `ClimateSheet`.
2. `Edit` line 117: render swap to `<ClimateSheet />`.

**LightsCard.tsx (line 38 + 146):**
1. `Edit` line 38: import swap to `LightsSheet`.
2. `Edit` line 146: render swap to `<LightsSheet />`.

**Jest spec updates** (3 files): for each, use `Edit` to:
1. Add a `jest.mock('../../sheets/{Name}', ...)` block near the top of the spec (after existing mocks).
2. Update any assertion that checks for the placeholder. Common patterns to look for:
   - `expect(screen.queryByTestId('sheet-placeholder-body')).toBeInTheDocument()` → replace with the new `data-testid="{device}-sheet"`.
   - Any text-content assertion against `Sheet placeholder for stove` etc. → replace with the new assertion.
   - Any assertion on `<SheetPlaceholderBody>` props (`phase`, `device`) → remove (the new component takes no props).
3. Find these assertions by reading each spec file fully first; the placeholder assertions are in the "tap-to-open Sheet" tests added in Phase 177 Plan 03/04.

If a spec doesn't have a placeholder assertion (some cards may have been tested without that detail), only the mock is added.

After all swaps, **run the existing card spec suite** to confirm nothing else regressed:
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/cards/__tests__/StoveCard.test.tsx app/components/EmberGlass/cards/__tests__/ClimateCard.test.tsx app/components/EmberGlass/cards/__tests__/LightsCard.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - `app/components/EmberGlass/cards/StoveCard.tsx` contains `import { StoveSheet } from '../sheets/StoveSheet'` AND `<StoveSheet />`.
    - `app/components/EmberGlass/cards/StoveCard.tsx` does NOT contain `SheetPlaceholderBody phase="178" device="stove"`.
    - `app/components/EmberGlass/cards/ClimateCard.tsx` contains `import { ClimateSheet } from '../sheets/ClimateSheet'` AND `<ClimateSheet />`.
    - `app/components/EmberGlass/cards/ClimateCard.tsx` does NOT contain `SheetPlaceholderBody phase="178" device="thermostat"`.
    - `app/components/EmberGlass/cards/LightsCard.tsx` contains `import { LightsSheet } from '../sheets/LightsSheet'` AND `<LightsSheet />`.
    - `app/components/EmberGlass/cards/LightsCard.tsx` does NOT contain `SheetPlaceholderBody phase="178" device="lights"`.
    - The 3 corresponding jest specs each contain `jest.mock('../../sheets/{Name}'...)` (or equivalent) AND assert `data-testid="{device}-sheet"`.
    - The scoped jest run exits 0.
    - `npx tsc --noEmit` exits 0 (no new type errors).
  </acceptance_criteria>
  <done>
    Three card swaps complete + corresponding jest specs updated; scoped tests green.
  </done>
</task>

<task type="auto">
  <name>Task 2: Swap Sonos + Tuya cards (and update their jest specs)</name>
  <files>
    app/components/EmberGlass/cards/SonosCard.tsx,
    app/components/EmberGlass/cards/TuyaCard.tsx,
    app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx,
    app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx
  </files>
  <read_first>
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-35, D-36)
    - app/components/EmberGlass/cards/SonosCard.tsx (FULL FILE)
    - app/components/EmberGlass/cards/TuyaCard.tsx (FULL FILE)
    - app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx (FULL FILE)
    - app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx (FULL FILE)
    - Plan 178-09 Task 1 above for the swap pattern (mirror exactly).
  </read_first>
  <behavior>
    Same shape as Task 1, applied to SonosCard + TuyaCard:
    - SonosCard: import swap from SheetPlaceholderBody → SonosSheet; render swap.
    - TuyaCard: import swap to PlugsSheet (note the export name is `PlugsSheet`, not `TuyaSheet`); render swap.
    - Update each card's jest spec mock + placeholder assertion.

    Critical for TuyaCard: the file imports `PlugsSheet` from `../sheets/PlugsSheet`, NOT `TuyaSheet`. The component is mounted as `<PlugsSheet />` (no props) inside the existing `<Sheet open onClose title="Prese smart">` wrapper.
  </behavior>
  <action>
**SonosCard.tsx (line 31 + 125):**
1. `Edit` line 31: replace `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` with `import { SonosSheet } from '../sheets/SonosSheet';`.
2. `Edit` line 125: replace `        <SheetPlaceholderBody phase="178" device="sonos" />` with `        <SonosSheet />`.

**TuyaCard.tsx (line 27 + 95):**
1. `Edit` line 27: replace `import { SheetPlaceholderBody } from './SheetPlaceholderBody';` with `import { PlugsSheet } from '../sheets/PlugsSheet';`.
2. `Edit` line 95: replace `        <SheetPlaceholderBody phase="178" device="plugs-tuya" />` with `        <PlugsSheet />`.
3. NOTE: TuyaCard.tsx:10 contains a JSDoc reference: `* sheet wired to \`<SheetPlaceholderBody phase="178" device="plugs-tuya" />\`.` — UPDATE this JSDoc line to reflect the new component (e.g. `sheet wired to <PlugsSheet />`).

**Jest spec updates (2 files)** — same pattern as Task 1:
1. Add `jest.mock('../../sheets/SonosSheet', () => ({ SonosSheet: () => <div data-testid="sonos-sheet" /> }));` to SonosCard spec.
2. Add `jest.mock('../../sheets/PlugsSheet', () => ({ PlugsSheet: () => <div data-testid="plugs-sheet" /> }));` to TuyaCard spec.
3. Update placeholder assertions to assert `data-testid="sonos-sheet"` / `data-testid="plugs-sheet"`.

Verify the existing Phase 177 dashboard spec (`tests/smoke/dashboard-glass-cards.spec.ts`) still passes — Phase 178 Plan 178-10 will EXTEND it but the existing tests must remain green:

```bash
npm run test:components -- app/components/EmberGlass/cards/__tests__
```

(The Phase 177 spec uses E2E playwright; the jest card specs are sufficient for unit-level verification of the swap.)
  </action>
  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/cards/__tests__/SonosCard.test.tsx app/components/EmberGlass/cards/__tests__/TuyaCard.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - `app/components/EmberGlass/cards/SonosCard.tsx` contains `import { SonosSheet } from '../sheets/SonosSheet'` AND `<SonosSheet />`.
    - `app/components/EmberGlass/cards/SonosCard.tsx` does NOT contain `SheetPlaceholderBody phase="178" device="sonos"`.
    - `app/components/EmberGlass/cards/TuyaCard.tsx` contains `import { PlugsSheet } from '../sheets/PlugsSheet'` AND `<PlugsSheet />`.
    - `app/components/EmberGlass/cards/TuyaCard.tsx` does NOT contain `SheetPlaceholderBody phase="178" device="plugs-tuya"`.
    - `app/components/EmberGlass/cards/TuyaCard.tsx` JSDoc no longer references `SheetPlaceholderBody`.
    - DirigeraCard, CameraCard, NetworkCard files NOT modified — `! grep -L "<SheetPlaceholderBody phase=\"178\"" app/components/EmberGlass/cards/{DirigeraCard,CameraCard,NetworkCard}.tsx` returns at least one MATCH per card (placeholder still present).
    - The 2 jest specs include the new sheet mock + assertion; both exit 0.
    - `npx tsc --noEmit` exits 0.
  </acceptance_criteria>
  <done>
    Two more card swaps complete; DirigeraCard/CameraCard/NetworkCard untouched (verified via grep).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → 5 device sheet bodies | Sheets self-fetch via existing hooks; no new auth surface |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-09-01 | Tampering | Card swap inadvertently changes Sheet primitive props | mitigate | The plan tasks limit edits to two lines per card (import + body); `<Sheet open onClose title>` wrapper unchanged. Acceptance criteria asserts grep boundaries. |
| T-178-09-02 | Information Disclosure | Sheet body opens for unauthenticated user | accept | Phase 177 already gates dashboard mount on Auth0 session; Phase 178 inherits. No new auth surface. |
</threat_model>

<verification>
```bash
npm run test:components -- app/components/EmberGlass/cards/__tests__
npx tsc --noEmit
```

Five card swaps complete; jest spec suites green; tsc clean.
</verification>

<success_criteria>
- [ ] Five cards swap their placeholder for the real sheet body via single-line import + render edits.
- [ ] DirigeraCard, CameraCard, NetworkCard, WeatherCard, RaspiCard UNCHANGED.
- [ ] Five card jest specs updated with sheet mocks + new testid assertions; all green.
- [ ] `npx tsc --noEmit` clean.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-09-SUMMARY.md`.
</output>
