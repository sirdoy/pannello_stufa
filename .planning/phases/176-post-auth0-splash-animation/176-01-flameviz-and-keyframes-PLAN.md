---
phase: 176
plan: 01
plan_id: 176-01
slug: flameviz-and-keyframes
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/EmberGlass/FlameViz.tsx
  - app/components/EmberGlass/__tests__/FlameViz.test.tsx
  - app/components/EmberGlass/index.ts
  - app/globals.css
autonomous: true
requirements:
  - SPLASH-02
commit_strategy: per_task
must_haves:
  truths:
    - "FlameViz primitive exists and is importable from @/app/components/EmberGlass."
    - "When on={true}, FlameViz renders with accent-tinted glow box-shadow and flamePulse animation."
    - "When on={false}, FlameViz renders without glow and without animation (animation: 'none')."
    - "intensity prop scales body height linearly (intensity=0.6 → 51.2px; intensity=0.95 → 62.4px)."
    - "globals.css contains @keyframes flamePulse and @keyframes pulse blocks."
    - "Reduced-motion @media block in globals.css suppresses pulse on splash badge dot and flamePulse on FlameViz."
  artifacts:
    - path: app/components/EmberGlass/FlameViz.tsx
      provides: "Pure presentational FlameViz primitive ported verbatim from bundle cards.jsx:109-129"
      exports: ["FlameViz", "FlameVizProps"]
      contains: 'data-flame-viz="true"'
    - path: app/components/EmberGlass/__tests__/FlameViz.test.tsx
      provides: "Jest unit tests for FlameViz on/off + intensity scaling + data-attribute"
    - path: app/components/EmberGlass/index.ts
      provides: "Barrel re-export adds FlameViz + FlameVizProps"
    - path: app/globals.css
      provides: "Two new @keyframes (pulse, flamePulse) + extended reduced-motion @media guard"
      contains: "@keyframes flamePulse"
  key_links:
    - from: app/components/EmberGlass/FlameViz.tsx
      to: app/globals.css
      via: 'animation: "flamePulse 1.8s ..."'
      pattern: 'flamePulse'
    - from: app/globals.css
      to: app/components/EmberGlass/FlameViz.tsx
      via: '[data-flame-viz="true"] > div { animation: none }'
      pattern: 'data-flame-viz'
---

<objective>
Ship the `<FlameViz>` presentational primitive (Phase 176 deliverable; reused by Phase 177's StoveCard) and append the two missing CSS keyframes (`pulse` for the splash badge dot, `flamePulse` for the FlameViz inner flames) to `app/globals.css`. Both keyframes are referenced by the bundle but currently absent from `globals.css` (verified 2026-04-27).

Purpose: Phase 176's `<Splash>` component (Plan 02) imports `<FlameViz>`. Decoupling the primitive from the splash lets Phase 177 import it without redefinition (per CONTEXT.md D-03: "No other v20.0 phase is allowed to redefine FlameViz"). The keyframes are visual prerequisites — without them the splash dot is static and the flame doesn't breathe.

Output:
- New file `app/components/EmberGlass/FlameViz.tsx` (pure presentational, ~30 LOC)
- New file `app/components/EmberGlass/__tests__/FlameViz.test.tsx` (4 unit tests)
- Modified `app/components/EmberGlass/index.ts` (barrel adds 2 exports)
- Modified `app/globals.css` (append 2 keyframes + extended reduced-motion guard)
</objective>

<implements_decisions>
## Truths (Implements Decisions)

This plan explicitly implements the following CONTEXT.md decisions (citations for the decision-coverage gate):

- D-01: FlameViz lives in the `app/components/EmberGlass/` namespace (per Phase 174/175 convention).
- D-03: FlameViz primitive is defined ONCE in this plan; reused verbatim by Phase 177's StoveCard. No other v20.0 phase may redefine it.
- D-14: `@keyframes pulse` is appended to `app/globals.css` for the splash badge dot animation (consumed by Plan 02).
- D-23: FlameViz reuses Phase 174 tokens (`var(--accent)`, `color-mix(in oklab, var(--accent) ...)`) for the inner gradient — bundle-verbatim.
- D-25: AmbientBg coexists with FlameViz; FlameViz is unaware of any ambient layer (pure presentational, no parent context).
- D-29: FlameViz Jest test lives at `app/components/EmberGlass/__tests__/FlameViz.test.tsx` (test colocation rule).
</implements_decisions>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@CLAUDE.md

@.planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md
@.planning/phases/176-post-auth0-splash-animation/176-RESEARCH.md
@.planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md
@.planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md
@.planning/phases/176-post-auth0-splash-animation/176-VALIDATION.md

@app/components/EmberGlass/AmbientBg.tsx
@app/components/EmberGlass/index.ts
@app/components/EmberGlass/__tests__/AmbientBg.test.tsx

<interfaces>
<!-- Existing barrel (will be appended to in Task 3): -->

```ts
// app/components/EmberGlass/index.ts (current)
export { Pressable, usePressed } from './Pressable';
export type { PressableProps, PointerHandlers } from './Pressable';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { default as AmbientBg } from './AmbientBg';
```

<!-- Existing globals.css ambient keyframes block (the canonical analog at lines 346-363): -->

```css
/* Ambient keyframes (DS-05) ... */
@keyframes ambientA { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(40px, 30px) scale(1.15); } }
@keyframes ambientB { /* ... */ }
@keyframes ambientC { /* ... */ }

/* Reduced-motion guard (UI-SPEC §"Reduced-motion contract") */
@media (prefers-reduced-motion: reduce) {
  .ember-ambient-blob { animation: none !important; }
}
```

<!-- Bundle source (verbatim port target): .planning/inbox/ember-glass-design/project/components/cards.jsx:109-129 -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true" id="176-01-01">
  <name>Task 1: Create FlameViz primitive (verbatim bundle port) + Jest unit tests</name>
  <files>app/components/EmberGlass/FlameViz.tsx, app/components/EmberGlass/__tests__/FlameViz.test.tsx</files>

  <read_first>
    - .planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md (D-03 FlameViz scope; D-23 token reuse; D-26 token reuse)
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md (FlameViz pattern block — full code excerpt)
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"<FlameViz> (presentational primitive)" + §"Color" §"AUDIT-EXCEPTIONS" + §"Component Inventory"
    - app/components/EmberGlass/AmbientBg.tsx (canonical 'use client' + JSDoc + inline-style + AUDIT-EXCEPTION convention)
    - app/components/EmberGlass/__tests__/AmbientBg.test.tsx (render-and-assert presentational test convention)
    - app/components/EmberGlass/Pressable.tsx (forwardRef convention — NOT applied here per UI-SPEC; shows the inline-style assertion shape used in tests)
  </read_first>

  <behavior>
    - Test 1 — `on={true}` adds glow box-shadow + flamePulse animation: render `<FlameViz on />`, query `[data-flame-viz="true"] > div` first child, assert `.style.boxShadow` contains `'color-mix'`, assert `.style.animation` contains `'flamePulse'`.
    - Test 2 — `on={false}` removes box-shadow and animation: render `<FlameViz on={false} />`, assert `.style.boxShadow === 'none'` and `.style.animation === 'none'`.
    - Test 3 — `intensity` prop scales body height linearly: render at `intensity=0.6` (default), expect body height matches `/51\.2px/`; render at `intensity=0.95`, expect body height matches `/62\.4px/`. (Math: `64 * (0.5 + intensity * 0.5)`.)
    - Test 4 — `data-flame-viz="true"` attribute applied to wrapper div (so the global reduced-motion override targets it).
  </behavior>

  <action>
Create `app/components/EmberGlass/FlameViz.tsx` per UI-SPEC §"<FlameViz>" verbatim, with the following EXACT structure (lifted from bundle `.planning/inbox/ember-glass-design/project/components/cards.jsx:109-129` and PATTERNS.md):

```tsx
'use client';

import type React from 'react';

/**
 * FlameViz — Phase 176 (SPLASH-02 primitive; Phase 177 will reuse for StoveCard DASH-02).
 *
 * Pure presentational; no state, no effects.
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:109-129
 *
 * Phase 176 ships ONLY the primitive + splash usage (CONTEXT.md D-03).
 * Phase 177 will additionally import it from <StoveCard>.
 * No other v20.0 phase may redefine FlameViz.
 *
 * AUDIT-EXCEPTION (DS-02): #6a1a00 mix-target (cards.jsx:117), #fff5c0/#ffd27a tip
 * gradient (cards.jsx:125) are intentional non-token literals (UI-SPEC §Color).
 *
 * The `data-flame-viz="true"` attribute on the wrapper enables the global
 * reduced-motion override `[data-flame-viz="true"] > div { animation: none }`
 * defined in app/globals.css.
 */

export interface FlameVizProps {
  on: boolean;
  /** Default 0.6. Splash uses 0.95. Phase 177 StoveCard will pass dynamic stove power. */
  intensity?: number;
}

export function FlameViz({ on, intensity = 0.6 }: FlameVizProps): React.ReactElement {
  return (
    <div
      data-flame-viz="true"
      style={{
        width: 64,
        height: 80,
        position: 'relative',
        opacity: on ? 1 : 0.25,
        transition: 'opacity .4s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 48,
          height: 64 * (0.5 + intensity * 0.5),
          borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
          // AUDIT-EXCEPTION (DS-02): #6a1a00 mix-target — bundle cards.jsx:117
          background: `radial-gradient(ellipse at 50% 80%, color-mix(in oklab, var(--accent) 80%, white) 0%, var(--accent) 40%, color-mix(in oklab, var(--accent) 60%, #6a1a00) 90%)`,
          filter: 'blur(0.5px)',
          boxShadow: on
            ? `0 0 40px color-mix(in oklab, var(--accent) 70%, transparent), 0 0 80px color-mix(in oklab, var(--accent) 40%, transparent)`
            : 'none',
          animation: on ? 'flamePulse 1.8s ease-in-out infinite' : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 28,
          height: 40 * (0.5 + intensity * 0.5),
          borderRadius: '50% 50% 40% 40%',
          // AUDIT-EXCEPTION (DS-02): #fff5c0/#ffd27a tip gradient — bundle cards.jsx:125
          background: `radial-gradient(ellipse at 50% 90%, #fff5c0 0%, #ffd27a 50%, transparent 75%)`,
          animation: on ? 'flamePulse 1.4s ease-in-out infinite alternate' : 'none',
        }}
      />
    </div>
  );
}
```

Then create `app/components/EmberGlass/__tests__/FlameViz.test.tsx` with the four tests described in `<behavior>`. Mirror the structure of `app/components/EmberGlass/__tests__/AmbientBg.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { FlameViz } from '../FlameViz';

describe('FlameViz (EmberGlass primitive — Phase 176)', () => {
  test('on={true} adds glow box-shadow + flamePulse animation', () => {
    const { container } = render(<FlameViz on />);
    const outer = container.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    expect(outer.style.boxShadow).toContain('color-mix');
    expect(outer.style.animation).toContain('flamePulse');
  });

  test('on={false} removes box-shadow and animation', () => {
    const { container } = render(<FlameViz on={false} />);
    const outer = container.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    expect(outer.style.boxShadow).toBe('none');
    expect(outer.style.animation).toBe('none');
  });

  test('intensity prop scales body height linearly', () => {
    // height = 64 * (0.5 + intensity * 0.5)
    const { container: c1 } = render(<FlameViz on intensity={0.6} />);
    const body1 = c1.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    expect(body1.style.height).toMatch(/51\.2px/); // 64 * 0.8

    const { container: c2 } = render(<FlameViz on intensity={0.95} />);
    const body2 = c2.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    expect(body2.style.height).toMatch(/62\.4px/); // 64 * 0.975
  });

  test('data-flame-viz="true" attribute applied to wrapper', () => {
    const { container } = render(<FlameViz on />);
    expect(container.querySelector('[data-flame-viz="true"]')).not.toBeNull();
  });
});
```

Do NOT add a `forwardRef` (UI-SPEC: "no need for ref; orchestrator drives via props"). Do NOT add a `reducedMotion` prop (UI-SPEC: "the parent <Splash> is responsible for suppressing flamePulse under reduced-motion ... locked compromise — keeps <FlameViz> zero-cost; consumer-controlled"). Do NOT consume `<Pressable>` or `<Sheet>` (CONTEXT.md D-24).

Per CLAUDE.md rule 5: tests are mandatory. Per CLAUDE.md rule 8: never call bare `npm test` from the verify block.
  </action>

  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/__tests__/FlameViz.test.tsx</automated>
  </verify>

  <acceptance_criteria>
    - File `app/components/EmberGlass/FlameViz.tsx` exists.
    - File `app/components/EmberGlass/__tests__/FlameViz.test.tsx` exists.
    - `grep -q "export function FlameViz" app/components/EmberGlass/FlameViz.tsx` returns 0.
    - `grep -q "export interface FlameVizProps" app/components/EmberGlass/FlameViz.tsx` returns 0.
    - `grep -q 'data-flame-viz="true"' app/components/EmberGlass/FlameViz.tsx` returns 0.
    - `grep -c 'AUDIT-EXCEPTION' app/components/EmberGlass/FlameViz.tsx` returns ≥ 2 (one per hardcoded gradient — `#6a1a00` and the yellow tip).
    - `grep -q 'flamePulse 1.8s ease-in-out infinite' app/components/EmberGlass/FlameViz.tsx` returns 0.
    - `grep -q "'use client'" app/components/EmberGlass/FlameViz.tsx` returns 0.
    - The 4 tests in `FlameViz.test.tsx` all pass: `npm run test:components -- app/components/EmberGlass/__tests__/FlameViz.test.tsx` exits 0.
    - No `forwardRef` import in `FlameViz.tsx` (`grep -L 'forwardRef' app/components/EmberGlass/FlameViz.tsx` finds the file).
  </acceptance_criteria>

  <done>FlameViz.tsx exists with the verbatim port + AUDIT-EXCEPTION tags; FlameViz.test.tsx exists with 4 passing tests covering on/off behavior, intensity scaling, and the data-flame-viz attribute.</done>
</task>

<task type="auto" id="176-01-02">
  <name>Task 2: Append @keyframes pulse + @keyframes flamePulse + reduced-motion guard to globals.css</name>
  <files>app/globals.css</files>

  <read_first>
    - .planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md (D-14 pulse keyframe; D-17/D-18 reduced-motion handling)
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"CSS Keyframes (`app/globals.css` append)" — exact CSS block to append
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md "app/globals.css (modify, append keyframes)" pattern block
    - app/globals.css lines 340-365 (existing ambientA/B/C keyframes + reduced-motion guard convention)
  </read_first>

  <action>
Verify the current state of `app/globals.css` (RESEARCH and UI-SPEC both confirm `@keyframes flamePulse` and `@keyframes pulse` are MISSING; only `pulse-ember` exists at ~line 814):

```bash
grep -nE '^@keyframes (flamePulse|pulse) ' app/globals.css
```

If either keyframe ALREADY exists (unexpected), STOP and report — do not duplicate. Otherwise, APPEND the following block to the end of `app/globals.css` (preserve the existing trailing newline; add a single blank line before the new block):

```css

/* Phase 176 — Splash badge status dot pulse (bundle splash.jsx:85). */
@keyframes pulse {
  0%   { transform: scale(1);   opacity: 1; }
  50%  { transform: scale(1.4); opacity: 0.6; }
  100% { transform: scale(1);   opacity: 1; }
}

/* Phase 176 — FlameViz inner-flame breathing animation (bundle cards.jsx:120, 126).
   Used by both the outer flame body (1.8s ease-in-out infinite) and the inner flame tip
   (1.4s ease-in-out infinite alternate). The keyframe shape is shared; the duration
   and alternate flag are set inline in FlameViz.tsx. */
@keyframes flamePulse {
  0%, 100% { transform: translateX(-50%) scaleY(1);    opacity: 1;    }
  50%      { transform: translateX(-50%) scaleY(1.05); opacity: 0.92; }
}

/* Phase 176 — extend reduced-motion guard for splash badge dot + FlameViz inner flames.
   See CONTEXT.md D-17/D-18 (reduced-motion contract) and UI-SPEC §"CSS Keyframes". */
@media (prefers-reduced-motion: reduce) {
  [data-testid="splash-badge"] > div:first-child { animation: none !important; }
  [data-flame-viz="true"] > div { animation: none !important; }
}
```

Do NOT modify the existing `pulse-ember` keyframe (separate animation; do not collide). Do NOT remove the existing `.ember-ambient-blob` reduced-motion guard at lines ~360-363 — the new `@media` block is a SECOND, sibling block specific to Phase 176 selectors.

This task creates no test file (CSS append). Verification is grep-based.
  </action>

  <verify>
    <automated>grep -c '^@keyframes flamePulse' app/globals.css | grep -q '^1$' &amp;&amp; grep -c '^@keyframes pulse ' app/globals.css | grep -q '^1$' &amp;&amp; grep -q '\[data-flame-viz="true"\] > div { animation: none' app/globals.css &amp;&amp; grep -q '\[data-testid="splash-badge"\] > div:first-child { animation: none' app/globals.css</automated>
  </verify>

  <acceptance_criteria>
    - `grep -c '^@keyframes flamePulse' app/globals.css` returns exactly `1`.
    - `grep -c '^@keyframes pulse ' app/globals.css` returns exactly `1` (NOT `pulse-ember` — note trailing space).
    - `grep -q '\[data-flame-viz="true"\] > div { animation: none' app/globals.css` returns 0.
    - `grep -q '\[data-testid="splash-badge"\] > div:first-child { animation: none' app/globals.css` returns 0.
    - The existing `.ember-ambient-blob { animation: none !important; }` rule is still present (`grep -q 'ember-ambient-blob' app/globals.css` returns 0).
    - The existing `@keyframes pulse-ember` block is unmodified (`grep -q '@keyframes pulse-ember' app/globals.css` returns 0).
  </acceptance_criteria>

  <done>globals.css contains both new `@keyframes` blocks plus a Phase 176-specific reduced-motion guard targeting splash badge dot and FlameViz inner flames; existing keyframes and guards are untouched.</done>
</task>

<task type="auto" id="176-01-03">
  <name>Task 3: Add FlameViz exports to EmberGlass barrel index.ts</name>
  <files>app/components/EmberGlass/index.ts</files>

  <read_first>
    - app/components/EmberGlass/index.ts (current 5-line barrel)
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md "app/components/EmberGlass/index.ts (modify, barrel re-export)" pattern block
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"Component Inventory" (barrel re-export row)
  </read_first>

  <action>
Append to `app/components/EmberGlass/index.ts` (preserve existing 5 lines; add 2 new lines at the end). Do NOT add Splash/SplashGate exports yet — those are Plans 02/03.

Final state of the file:

```ts
export { Pressable, usePressed } from './Pressable';
export type { PressableProps, PointerHandlers } from './Pressable';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { default as AmbientBg } from './AmbientBg';
export { FlameViz } from './FlameViz';
export type { FlameVizProps } from './FlameViz';
```

The `Splash`/`SplashGate` exports will be added by Plans 02 and 03 respectively (each plan owns its own primitive's barrel addition to keep parallel-friendly file ownership; Plan 01 owns FlameViz's lines only).

Note: per CONTEXT.md D-01, `FlameViz`/`Splash`/`SplashGate` are all named (not `default`) — the `default as AmbientBg` aliasing is a one-off legacy from Phase 174.
  </action>

  <verify>
    <automated>grep -q "^export { FlameViz } from './FlameViz';" app/components/EmberGlass/index.ts &amp;&amp; grep -q "^export type { FlameVizProps } from './FlameViz';" app/components/EmberGlass/index.ts &amp;&amp; node -e "const x = require('./app/components/EmberGlass/FlameViz.tsx'); console.log('ok');" 2>/dev/null || npm run test:components -- app/components/EmberGlass/__tests__/FlameViz.test.tsx</automated>
  </verify>

  <acceptance_criteria>
    - `grep -q "^export { FlameViz } from './FlameViz';" app/components/EmberGlass/index.ts` returns 0.
    - `grep -q "^export type { FlameVizProps } from './FlameViz';" app/components/EmberGlass/index.ts` returns 0.
    - The 5 pre-existing exports (`Pressable`, `PressableProps/PointerHandlers`, `Sheet`, `SheetProps`, `AmbientBg`) still exist.
    - File is 7 lines (5 original + 2 new); no `Splash`/`SplashGate` lines yet.
    - FlameViz test still passes (sanity check that the import path resolves through the barrel): `npm run test:components -- app/components/EmberGlass/__tests__/FlameViz.test.tsx` exits 0.
  </acceptance_criteria>

  <done>Barrel index.ts re-exports FlameViz + FlameVizProps without disturbing prior exports; downstream plans (02/03) can append their own primitives.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none) | Phase 176-01 ships only presentational code (`<FlameViz>`) and global CSS keyframes. No network I/O, no user input, no auth, no storage. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-176-01-01 | Information Disclosure | `<FlameViz>` inline styles render bundle hex literals (#6a1a00, #fff5c0, #ffd27a) | accept | Public visual constants; no PII or secrets. AUDIT-EXCEPTION-tagged for Phase 174 DS-02 grep gate. |
| T-176-01-02 | Tampering | `app/globals.css` keyframe append — runtime CSS injection | accept | Static append at build time; no dynamic CSS. Reduced-motion `@media` block uses `!important` deliberately to win specificity wars (matches existing `.ember-ambient-blob` convention). |
| T-176-01-03 | Denial of Service | CSS animations on every `<FlameViz>` consumer | accept | Animations are GPU-composited (`transform: scaleY`, `opacity`) — cheap; reduced-motion users get the override. No layout thrash. |

ASVS L1 applicable controls: V14.4 (no exposure of sensitive resources via static assets) — N/A; V11.1 (input validation) — N/A (no input). No `high` severity threats. Phase explicitly declared minimal threat surface in planning_context.
</threat_model>

<verification>
After all 3 tasks complete:
1. `npm run test:components -- app/components/EmberGlass/__tests__/FlameViz.test.tsx` — all 4 tests green.
2. `grep -c '^@keyframes flamePulse' app/globals.css` returns `1`.
3. `grep -c '^@keyframes pulse ' app/globals.css` returns `1`.
4. `grep -c "FlameViz" app/components/EmberGlass/index.ts` returns ≥ 2 (export + type export lines).
5. AUDIT-EXCEPTION grep gate (Phase 174 DS-02 inheritance):
   `grep -E '#[0-9a-fA-F]{3,8}\b' app/components/EmberGlass/FlameViz.tsx | grep -v AUDIT-EXCEPTION | wc -l` returns `0` (every hex literal is AUDIT-EXCEPTION-tagged).
</verification>

<success_criteria>
- `<FlameViz>` is importable via `import { FlameViz } from '@/app/components/EmberGlass';` and renders without errors.
- The two missing keyframes (`pulse`, `flamePulse`) exist in `globals.css` and are consumed correctly by `FlameViz.tsx` (`flamePulse`) and the future `Splash.tsx` (`pulse` — Plan 02).
- Reduced-motion CSS guard suppresses `flamePulse` on FlameViz and `pulse` on splash badge dot when the user prefers reduced motion.
- All 4 Jest unit tests pass on `npm run test:components -- FlameViz.test.tsx`.
- No regressions in existing EmberGlass barrel exports.
</success_criteria>

<output>
After completion, create `.planning/phases/176-post-auth0-splash-animation/176-01-SUMMARY.md` per `$HOME/.claude/get-shit-done/templates/summary.md`. Document: 3 commits (FlameViz primitive + tests; globals.css keyframes; barrel exports); files added/modified; how Plan 02 and Plan 03 will consume the FlameViz import + the keyframes; any unexpected pre-existing keyframes that required reconciliation.
</output>
