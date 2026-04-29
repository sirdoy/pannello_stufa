---
phase: 178
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/EmberGlass/sheets/lib/findSceneByName.ts
  - app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts
  - app/components/EmberGlass/sheets/index.ts
  - app/components/EmberGlass/index.ts
autonomous: true
requirements: [SHEET-04]
tags: [ember-glass, sheets, helper, barrel]
must_haves:
  truths:
    - "findSceneByName helper exists at app/components/EmberGlass/sheets/lib/findSceneByName.ts"
    - "findSceneByName performs case-insensitive name match against HueScene[]; returns null on miss"
    - "Sheets barrel app/components/EmberGlass/sheets/index.ts exports the 5 future sheet bodies + 6 primitives + helper"
    - "Top-level app/components/EmberGlass/index.ts re-exports from ./sheets"
    - "Zero useMemo / useCallback in helper or barrel files"
  artifacts:
    - path: app/components/EmberGlass/sheets/lib/findSceneByName.ts
      provides: "Case-insensitive scene name lookup helper consumed by LightsSheet"
      min_lines: 10
    - path: app/components/EmberGlass/sheets/index.ts
      provides: "Barrel for 5 sheet bodies + 6 primitives + helper"
      min_lines: 15
  key_links:
    - from: app/components/EmberGlass/index.ts
      to: app/components/EmberGlass/sheets/index.ts
      via: "export * from './sheets'"
      pattern: "export \\* from './sheets'"
user_setup: []
---

<objective>
Ship the small `findSceneByName` helper that LightsSheet (Plan 178-06) consumes for scene name lookup, and create the new barrel file `app/components/EmberGlass/sheets/index.ts` that exports the 5 sheet bodies + 6 sub-primitives + helper. Re-export from the top-level `app/components/EmberGlass/index.ts` so phases 179-181 can import via `@/app/components/EmberGlass`.

CONTEXT D-07 + UI-SPEC §LightsSheet specify case-insensitive matching. RESEARCH §"Code Examples" gives the verbatim 15-LOC implementation.

The barrel uses **forward references** to files that don't exist yet (created in Plans 178-04..178-08). TypeScript compiles fine because the files are siblings in the same module graph; the barrel is consumed only by Plan 178-09 (card swap) which depends on Wave 2 completion.

Purpose: Tiny helper + barrel infrastructure for downstream consumption.
Output: 1 helper .ts, 1 jest spec, 2 barrel files (1 new, 1 edit).
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
@.planning/phases/178-per-device-modal-sheets/178-RESEARCH.md
@types/hueProxy.ts
@app/components/EmberGlass/index.ts

<interfaces>
<!-- HueScene type (verified via types/hueProxy.ts): -->
<!--   { scene_id: string; name: string; group_id: string; ... } -->
<!-- The helper accepts `readonly HueScene[]` and a `name: string` query. -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Ship findSceneByName helper + jest spec</name>
  <files>
    app/components/EmberGlass/sheets/lib/findSceneByName.ts,
    app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts
  </files>
  <read_first>
    - .planning/phases/178-per-device-modal-sheets/178-RESEARCH.md (§"Code Examples" → `findSceneByName` 15-LOC verbatim)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 422-438 — verbatim port code)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-07 — scene-by-name lookup spec)
    - types/hueProxy.ts (HueScene shape — verify `name: string` field exists)
  </read_first>
  <behavior>
    findSceneByName:
    - Test 1: empty catalog → returns `null`.
    - Test 2: exact-case match → returns the matching scene.
    - Test 3: case-insensitive match (`"rilassante"` query against `"Rilassante"` catalog item) → returns the scene.
    - Test 4: no match → returns `null`.
    - Test 5: multiple catalog entries with the same name (case-insensitive) → returns the first one (first match wins).
    - Test 6: catalog with mixed-case entries → query lowercase finds the right one regardless of stored casing.
  </behavior>
  <action>
**File 1: `app/components/EmberGlass/sheets/lib/findSceneByName.ts`** (verbatim from RESEARCH §"Code Examples"):

```typescript
import type { HueScene } from '@/types/hueProxy';

/**
 * Case-insensitive scene name lookup. Returns null if no match.
 * First match wins (callers responsible for catalog uniqueness).
 *
 * Source: CONTEXT D-07 / UI-SPEC §LightsSheet.
 * Used by: LightsSheet (Plan 178-06) — 4 hardcoded scene names ("Rilassante", "Concentrato",
 * "Cena", "Notte") looked up against the user's Hue scene catalog.
 *
 * Phase 178 self-contained — lives under `sheets/lib/` to keep the LightsSheet plan
 * reviewable. Can be moved to `app/components/devices/lights/utils/` later if Phase 179
 * (Rooms tab) wants the same helper.
 */
export function findSceneByName(
  catalog: readonly HueScene[],
  name: string,
): HueScene | null {
  const target = name.toLowerCase();
  return catalog.find((s) => s.name.toLowerCase() === target) ?? null;
}
```

**File 2: `app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts`** — pure function spec, no jsdom, no React. Mirror existing `lib/utils/__tests__/*.test.ts` patterns:

```typescript
import { findSceneByName } from '../findSceneByName';
import type { HueScene } from '@/types/hueProxy';

const makeScene = (overrides: Partial<HueScene>): HueScene => ({
  scene_id: 's1',
  name: 'Default',
  group_id: 'g1',
  ...overrides,
} as HueScene);

describe('findSceneByName (CONTEXT D-07)', () => {
  it('returns null for an empty catalog', () => {
    expect(findSceneByName([], 'Rilassante')).toBeNull();
  });

  it('returns the matching scene on exact-case hit', () => {
    const catalog = [makeScene({ scene_id: 's1', name: 'Rilassante' })];
    const result = findSceneByName(catalog, 'Rilassante');
    expect(result?.scene_id).toBe('s1');
  });

  it('matches case-insensitively', () => {
    const catalog = [makeScene({ scene_id: 's1', name: 'RILASSANTE' })];
    const result = findSceneByName(catalog, 'rilassante');
    expect(result?.scene_id).toBe('s1');
  });

  it('returns null on miss', () => {
    const catalog = [makeScene({ scene_id: 's1', name: 'Rilassante' })];
    expect(findSceneByName(catalog, 'Concentrato')).toBeNull();
  });

  it('returns the first match when multiple entries collide (case-insensitive)', () => {
    const catalog = [
      makeScene({ scene_id: 'first', name: 'Rilassante' }),
      makeScene({ scene_id: 'second', name: 'rilassante' }),
    ];
    const result = findSceneByName(catalog, 'Rilassante');
    expect(result?.scene_id).toBe('first');
  });

  it('handles mixed-case lookup against differently-cased catalog entries', () => {
    const catalog = [
      makeScene({ scene_id: 'a', name: 'Notte' }),
      makeScene({ scene_id: 'b', name: 'CENA' }),
    ];
    expect(findSceneByName(catalog, 'cena')?.scene_id).toBe('b');
    expect(findSceneByName(catalog, 'NOTTE')?.scene_id).toBe('a');
  });
});
```

If the `HueScene` type has additional required fields beyond `scene_id`, `name`, `group_id`, the `as HueScene` cast in `makeScene` accommodates them; the helper only reads `name`, so the cast is safe.
  </action>
  <verify>
    <automated>npm run test:unit -- app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/lib/findSceneByName.ts` exists.
    - File contains `export function findSceneByName` AND `s.name.toLowerCase() === target`.
    - File imports `HueScene` from `@/types/hueProxy`.
    - Spec file `app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts` contains AT LEAST 6 `it(` test cases.
    - `npm run test:unit -- app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts` exits 0.
    - Zero `useMemo`/`useCallback` (helper is a pure function).
  </acceptance_criteria>
  <done>
    Helper file + jest spec exist; spec exits 0; helper is pure (no React).
  </done>
</task>

<task type="auto">
  <name>Task 2: Ship sheets barrel + extend EmberGlass barrel</name>
  <files>
    app/components/EmberGlass/sheets/index.ts,
    app/components/EmberGlass/index.ts
  </files>
  <read_first>
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 442-474 — barrel verbatim source)
    - .planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md (§"Component Inventory" — file list with exports)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-01 — folder layout + barrel re-export contract)
    - app/components/EmberGlass/index.ts (existing barrel — mirror lines 1-36 pattern)
  </read_first>
  <behavior>
    sheets barrel:
    - Exports `StoveSheet`, `ClimateSheet`, `LightsSheet`, `SonosSheet`, `PlugsSheet` (the 5 sheet bodies — Plans 178-04..178-08 ship the .tsx files).
    - Exports `SheetRow`, `Stepper`, `Slider`, `RadialDial`, `SheetBtn`, `QuickActionButton` plus their `*Props` types (Plan 178-01 already shipped these files).
    - Exports `findSceneByName` (Task 1 above ships the file).
    - Uses named exports for sub-primitives + helper, named exports for sheet bodies.

    EmberGlass top-level barrel:
    - Append a single `export * from './sheets'` line at the end.
    - Existing exports unchanged.

    TypeScript compilation:
    - Run `npx tsc --noEmit` to confirm no errors after both files exist. NOTE: at the time of execution, the 5 sheet body files DO NOT yet exist (Plans 178-04..178-08 ship them). To avoid blocking this plan's verify step, the barrel for sheet bodies must reference files that the executor creates as STUBS (1-line placeholder modules) — see action below.
  </behavior>
  <action>
**File 1: `app/components/EmberGlass/sheets/index.ts`** (NEW — mirror `app/components/EmberGlass/index.ts:1-36` pattern):

```typescript
// Sheet bodies (Plans 178-04..178-08 implement; this barrel forwards as named exports)
export { StoveSheet } from './StoveSheet';
export { ClimateSheet } from './ClimateSheet';
export { LightsSheet } from './LightsSheet';
export { SonosSheet } from './SonosSheet';
export { PlugsSheet } from './PlugsSheet';

// Sub-primitives (Plan 178-01)
export { SheetRow } from './primitives/SheetRow';
export type { SheetRowProps } from './primitives/SheetRow';
export { Stepper } from './primitives/Stepper';
export type { StepperProps } from './primitives/Stepper';
export { Slider } from './primitives/Slider';
export type { SliderProps } from './primitives/Slider';
export { RadialDial } from './primitives/RadialDial';
export type { RadialDialProps } from './primitives/RadialDial';
export { SheetBtn } from './primitives/SheetBtn';
export type { SheetBtnProps } from './primitives/SheetBtn';
export { QuickActionButton } from './primitives/QuickActionButton';
export type { QuickActionButtonProps } from './primitives/QuickActionButton';

// Helper
export { findSceneByName } from './lib/findSceneByName';
```

**Stub the 5 sheet body files so the barrel compiles** — Plans 178-04..178-08 will OVERWRITE these stubs with the real implementations. Each stub is a 4-line placeholder:

`app/components/EmberGlass/sheets/StoveSheet.tsx`:
```tsx
'use client';
/** Stub — Plan 178-04 ships the real implementation. */
export function StoveSheet(): React.ReactElement {
  return <div data-testid="stove-sheet-stub" />;
}
```

Repeat for `ClimateSheet.tsx`, `LightsSheet.tsx`, `SonosSheet.tsx`, `PlugsSheet.tsx` — substitute the export name + testid accordingly. NOTE: each stub should also `import type * as React from 'react'` or use the implicit JSX runtime; the simplest form is:

```tsx
'use client';
/** Stub — Plan 178-04 ships the real implementation. */
export function StoveSheet() {
  return <div data-testid="stove-sheet-stub" />;
}
```

(no explicit return type — TypeScript infers; React 19 auto-runtime handles the JSX import.)

These 5 stubs will be marked in the file header so executors of plans 178-04..178-08 know to overwrite. Add a TODO comment at the top of each stub:
```tsx
// TODO Plan 178-{NN}: replace stub with real {Name} implementation per UI-SPEC + PATTERNS.
```

**File 7: `app/components/EmberGlass/index.ts`** (EDIT — append one line at the end of the existing barrel):

Use the Edit tool. After the last existing export line (`export type { SheetPlaceholderBodyProps, SheetPlaceholderDevice } from './cards/SheetPlaceholderBody';`), APPEND:

```typescript

// Phase 178 — sheets (bodies + sub-primitives + helper)
export * from './sheets';
```

(Note the leading blank line for visual separation.)

**TypeScript verification:**
After all 7 files exist, run `npx tsc --noEmit` to confirm no compile errors. The stubs satisfy the barrel's named exports; later plans replace them.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `app/components/EmberGlass/sheets/index.ts` exists.
    - File contains `export { StoveSheet }`, `export { ClimateSheet }`, `export { LightsSheet }`, `export { SonosSheet }`, `export { PlugsSheet }`.
    - File contains `export { SheetRow }`, `export { Stepper }`, `export { Slider }`, `export { RadialDial }`, `export { SheetBtn }`, `export { QuickActionButton }`, AND the matching `export type { *Props }` re-exports.
    - File contains `export { findSceneByName } from './lib/findSceneByName'`.
    - Five stub files exist: `StoveSheet.tsx`, `ClimateSheet.tsx`, `LightsSheet.tsx`, `SonosSheet.tsx`, `PlugsSheet.tsx` — each with a TODO marker `// TODO Plan 178-` and a `data-testid="*-sheet-stub"` div.
    - File `app/components/EmberGlass/index.ts` contains `export * from './sheets'`.
    - `npx tsc --noEmit` exits 0 with no new errors attributable to the new files.
  </acceptance_criteria>
  <done>
    Sheets barrel + 5 sheet body stubs ship; top-level barrel re-exports the new module; tsc green.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → no API | None — pure helper + barrel re-exports |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-02-01 | Tampering | findSceneByName lowercase comparison | accept | The helper compares two strings via `toLowerCase()`; both inputs come from typed hooks (`HueScene.name` from server proxy + literal scene names from sheet body source). No user-supplied input crosses the helper. |
| T-178-02-02 | Information Disclosure | Barrel re-exports | accept | Barrel exposes only public component names + types; mirrors Phase 174-177 precedent. No internal-only symbols leaked. |
</threat_model>

<verification>
```bash
npm run test:unit -- app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts
npx tsc --noEmit
```
</verification>

<success_criteria>
- [ ] Helper `findSceneByName.ts` ships with 6+ jest cases, all green.
- [ ] Sheets barrel `index.ts` ships with 5 body exports + 6 primitive exports + helper export.
- [ ] Five sheet body stub files exist with TODO markers (Plans 178-04..178-08 will replace them).
- [ ] Top-level EmberGlass barrel re-exports from `./sheets`.
- [ ] `npx tsc --noEmit` clean.
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-02-SUMMARY.md`.
</output>
