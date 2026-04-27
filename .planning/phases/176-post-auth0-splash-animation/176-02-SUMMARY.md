---
phase: 176
plan: 02
plan_id: 176-02
slug: splash-presentational
subsystem: app-shell
tags: [splash, animation, accessibility, primitives, ember-glass, reduced-motion, ssr-safe]
requires:
  - 176-01            # FlameViz + globals.css keyframes (pulse + flamePulse)
  - phase-174         # Tokens (--accent, --text-2, --font-display) + AmbientBg
provides:
  - Splash            # Pure presentational overlay for the boot animation
  - SplashProps       # { onDone: () => void; reducedMotion?: boolean }
  - useReducedMotion  # SSR-safe matchMedia('(prefers-reduced-motion: reduce)') hook
affects:
  - app/components/EmberGlass/index.ts (barrel re-export)
tech-stack:
  added:
    - react-18-fake-timers (test-time only, no runtime cost)
  patterns:
    - presentational-component-with-fake-timer-tests
    - ssr-safe-matchmedia-hook (mirror of useVisibility pattern)
    - audit-exception-inline-tagged-hex-literals
key-files:
  created:
    - lib/hooks/useReducedMotion.ts
    - lib/hooks/__tests__/useReducedMotion.test.ts
    - app/components/EmberGlass/Splash.tsx
    - app/components/EmberGlass/__tests__/Splash.test.tsx
  modified:
    - app/components/EmberGlass/index.ts
decisions:
  - id: D-13
    title: Full-motion timer beats locked at t=600/1500/2100ms
    rationale: Bundle splash.jsx:13-15 verbatim — phase 0→1 t=600, phase 1→2 t=1500, phase 2→3 t=2100 (onDone fires).
  - id: D-17
    title: Extract useReducedMotion to lib/hooks/ for Phase 177+ reuse
    rationale: Hook is bigger than the splash use case; glass-card primitives in Phase 177 will consume the same matchMedia subscription.
  - id: D-18
    title: Reduced-motion collapses to a single 200ms opacity-only fade
    rationale: WCAG 2.1 SC 2.3.3 (Animation from Interactions) — eliminate vestibular triggers without breaking the boot UX (still visible, still timed).
  - id: D-19
    title: Reduced-motion has ZERO transform/scale on overlay or any child
    rationale: Strict compliance with prefers-reduced-motion semantics — no scale, no translate, no transform-driven motion. pulse keyframe also suppressed.
  - id: D-22
    title: pointerEvents flips to 'none' at phase ≥ 2 (full-motion) / phase ≥ 1 (reduced-motion)
    rationale: Once the overlay starts fading out, the underlying AppShell must accept clicks even though the overlay is still in the DOM during the transition.
  - id: D-29
    title: Splash + useReducedMotion Jest tests colocated under __tests__/
    rationale: Standard project convention; tests next to source.
metrics:
  duration: ~22min
  tasks: 3
  loc_added: ~527 (Splash.tsx 207 + Splash.test.tsx 193 + useReducedMotion.ts 32 + useReducedMotion.test.ts 95)
  loc_modified: 2 (barrel append)
  files_created: 4
  files_modified: 1
  tests_added: 17 (4 hook + 13 component)
  completed: 2026-04-27T15:17:10Z
---

# Phase 176 Plan 02: Splash Presentational Summary

JWT-style one-liner: shipped the `<Splash>` 4-phase animation overlay (verbatim port of bundle splash.jsx) plus the SSR-safe `useReducedMotion()` hook for Plan 03 to consume — pure presentational with zero auth/storage/matchMedia entanglement, 17 Jest tests passing.

## Objective

Deliver SPLASH-02 (animation sequence) + SPLASH-03 (reduced-motion contract) at the primitive layer:

- `<Splash>` is dumb (D-02): owns ONLY the phase-timer state machine; calls `props.onDone()` once when the transition completes.
- `useReducedMotion()` is extracted to `lib/hooks/` (D-17) so Phase 177+ glass-card primitives can reuse it.
- Plan 03 (`<SplashGate>`) will compose the two: it consumes Auth0 + sessionStorage + this hook, and renders `<Splash>` as a sibling overlay.

## Implementation Walkthrough

### Task 1 — `useReducedMotion` hook + dedicated unit test (commit 6c7102f7)

Mirrors `lib/hooks/useVisibility.ts` shape:
- `useState(false)` SSR-safe default (full-motion default — no flicker on hydration if user does NOT prefer reduced motion).
- `useEffect` post-mount: reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, subscribes to `change` events.
- Modern API only: `addEventListener('change', handler)` / `removeEventListener('change', handler)` — NOT the deprecated `addListener`/`removeListener` (RESEARCH §"Common Pitfalls" Pitfall 3). Safari 14+ / Chrome 90+.

Dedicated unit test (4 `it()` blocks per CLAUDE.md Rule 5 + planner-revision feedback):
1. Returns `false` on first render (SSR-safe default).
2. Flips to `true` post-mount when `matchMedia.matches === true`.
3. Responds to synthetic `change` events on the media query.
4. Removes the listener on unmount, asserting **same handler reference** for add + remove (cleanup correctness).

Why a dedicated test matters: Plan 03 mocks the hook module wholesale via `jest.mock('@/lib/hooks/useReducedMotion', ...)`, so without this test the hook's actual matchMedia subscription / change listener / cleanup paths would have ZERO direct coverage.

### Task 2 — `<Splash>` overlay + 13 Jest fake-timer tests (commit 7771e443)

Verbatim port of `.planning/inbox/ember-glass-design/project/components/splash.jsx:1-91` with these locked deviations from bundle:

| Locked Deviation | Reason | Tag |
|------------------|--------|-----|
| `position: 'fixed'` (vs bundle `'absolute'`) | UI-SPEC §"Position resolution" — overlay must cover the viewport regardless of scroll position. | `// AUDIT-EXCEPTION` inline + JSDoc |
| Reduced-motion 2-phase variant added (not in bundle) | D-17/D-18/D-19 — bundle shipped only the full-motion path. | reducedMotion ternaries |
| `data-testid` attrs added (not in bundle) | UI-SPEC §"Component API + Variants" — required for Plan 04 Playwright. | inline JSX |
| All hex literals (`#1c1917`, `#0a0908`, `#fff`, `#6aa86a`) tagged | DS-02 grep gate (Phase 174 inheritance). | `// AUDIT-EXCEPTION (DS-02)` |

Phase state machine (4-phase full-motion + 2-phase reduced-motion):

```
Full-motion:                   Reduced-motion:
  t=0    → phase 0               t=0    → phase 0 (all opacity:1, no transforms)
  t=600  → phase 1               t=200  → phase 1 + onDone() + return null
  t=1500 → phase 2 (pointerEvents: 'none')
  t=2100 → phase 3 + onDone() + return null
```

13 tests organized into 3 describe blocks (Full-motion: 5, Reduced-motion: 3, DOM structure: 5). All use `jest.useFakeTimers()` and wrap timer advances in `act()`.

Italian copy invariants honored:
- `Connessione al gateway…` — U+2026 horizontal ellipsis (NEVER three periods).
- `Autenticato · Auth0` — U+00B7 middle dot (NEVER hyphen-minus).

Both unicode codepoints are explicitly asserted in the test file via inline string literals built from the codepoint character.

DS-02 grep gate clean: `grep -E '#[0-9a-fA-F]{3,8}\b' Splash.tsx | grep -v AUDIT-EXCEPTION | wc -l` returns `0`.

### Task 3 — Barrel export (commit 0c079915)

Appended two lines to `app/components/EmberGlass/index.ts`:

```ts
export { Splash } from './Splash';
export type { SplashProps } from './Splash';
```

The 7 prior lines (Pressable / Sheet / AmbientBg / FlameViz) preserved verbatim. File is exactly 9 lines. Plan 03 will append a 10th line for `SplashGate`.

## How Plan 03 Will Consume This

`<SplashGate>` (Plan 03) is the orchestrator that owns all integration concerns:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { Splash } from '@/app/components/EmberGlass';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

export function SplashGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(/* sessionStorage probe */);

  // ... Auth0 gate + sessionStorage write on onDone ...

  return (
    <>
      <AppShellInner ready={!visible}>{children}</AppShellInner>
      {visible && <Splash onDone={() => setVisible(false)} reducedMotion={reducedMotion} />}
    </>
  );
}
```

Two seams Plan 03 plugs into:
1. `<Splash onDone={...} reducedMotion={...} />` — the orchestrator passes both props verbatim.
2. `useReducedMotion()` — called once at the top of `<SplashGate>` and forwarded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] `Object.defineProperty` failed for `window.matchMedia` in test**

- **Found during:** Task 1 (TDD GREEN phase, after writing the hook)
- **Issue:** `jest.setup.ts:84` pre-installs `window.matchMedia` with `writable: true` but without `configurable: true`, so attempting to redefine it via `Object.defineProperty(window, 'matchMedia', ...)` in the test throws `TypeError: Cannot redefine property: matchMedia`.
- **Fix:** Switched to direct value reassignment — `(window as unknown as { matchMedia: ... }).matchMedia = jest.fn().mockImplementation(...)` — which respects the `writable: true` flag without redefining the descriptor.
- **Files modified:** `lib/hooks/__tests__/useReducedMotion.test.ts`
- **Commit:** 6c7102f7

**2. [Rule 1 — Bug] `runOnlyPendingTimers()` in afterEach triggered React 18 act-warning**

- **Found during:** Task 2 (Splash test run; tests passed but emitted noisy `console.error`).
- **Issue:** Jest `afterEach` calls `jest.runOnlyPendingTimers()` to flush leftover timers (defensive). Under React 18, the timer callbacks contain `setPhase(...)` calls which re-render the component — but they're not wrapped in `act()`, so React logs an "update inside a test was not wrapped in act(...)" warning.
- **Fix:** Wrapped `jest.runOnlyPendingTimers()` in `act(() => { ... })` inside afterEach.
- **Files modified:** `app/components/EmberGlass/__tests__/Splash.test.tsx`
- **Commit:** 7771e443

**3. [Rule 1 — Bug] Untagged hex literals in JSDoc + inline gradient**

- **Found during:** Task 2 acceptance gate (DS-02 grep check).
- **Issue:** The acceptance gate `grep -E '#[0-9a-fA-F]{3,8}\b' Splash.tsx | grep -v AUDIT-EXCEPTION` returned 2 hits: (a) JSDoc continuation line listing `#6aa86a` without re-tagging the line, (b) the gradient line itself had its `// AUDIT-EXCEPTION` tag on the LINE ABOVE the hex literals, so the per-line grep filter missed it.
- **Fix:** (a) Re-stamped `AUDIT-EXCEPTION (DS-02)` inline on each JSDoc continuation line containing hex; (b) moved the gradient AUDIT-EXCEPTION tag to a trailing comment on the same line as the hex literals.
- **Files modified:** `app/components/EmberGlass/Splash.tsx`
- **Commit:** 7771e443
- **After fix:** `grep -E '#[0-9a-fA-F]{3,8}\b' Splash.tsx | grep -v AUDIT-EXCEPTION | wc -l` returns `0`.

### Architectural Changes

None.

### Authentication Gates

None.

## Verification Results

| Gate | Command | Result |
|------|---------|--------|
| 1. useReducedMotion tests | `npm run test:components -- lib/hooks/__tests__/useReducedMotion.test.ts` | PASS (4/4) |
| 2. Splash tests | `npm run test:components -- app/components/EmberGlass/__tests__/Splash.test.tsx` | PASS (13/13) |
| 3. FlameViz no-regression | `npm run test:components -- app/components/EmberGlass/__tests__/FlameViz.test.tsx` | PASS (4/4) |
| 4. Splash exports in barrel | `grep -E '^export.*Splash' app/components/EmberGlass/index.ts \| wc -l` | 2 |
| 5. DS-02 grep gate | `grep -E '#[0-9a-fA-F]{3,8}\b' Splash.tsx \| grep -v AUDIT-EXCEPTION \| wc -l` | 0 |
| 6. No three-period ellipsis | `grep -F 'gateway...' Splash.tsx` | (empty) |
| 7. Unicode codepoints | python3 `'…' in src` and `'·' in src` | True / True |
| 8. useReducedMotion exported | `grep -q 'export function useReducedMotion' lib/hooks/useReducedMotion.ts` | OK |
| 9. Test file declares jsdom env | `grep -q '@jest-environment jsdom' lib/hooks/__tests__/useReducedMotion.test.ts` | OK |

All 9 gates green.

## Threat Model Compliance

| Threat ID | Disposition | Status |
|-----------|-------------|--------|
| T-176-02-01 (DOM injection) | accept | OK — all copy is JSX text (React-escaped); no `dangerouslySetInnerHTML`. |
| T-176-02-02 (matchMedia info disclosure) | accept | OK — public browser API; single boolean read. |
| T-176-02-03 (timer cleanup) | mitigate | Mitigated — Test 4 ("all timers cleared on unmount") verifies cleanup explicitly. |
| T-176-02-04 (inline hex literals) | accept | OK — all tagged AUDIT-EXCEPTION; no secrets. |
| T-176-02-05 (matchMedia listener leak) | mitigate | Mitigated — useReducedMotion test 4 ("removes the change listener on unmount") asserts same-handler-reference cleanup. |

No new threat surface introduced.

## Commits

| Hash | Task | Message |
|------|------|---------|
| 6c7102f7 | Task 1 | feat(176-02): add useReducedMotion SSR-safe matchMedia hook |
| 7771e443 | Task 2 | feat(176-02): add &lt;Splash&gt; presentational overlay (SPLASH-02 + SPLASH-03) |
| 0c079915 | Task 3 | feat(176-02): export Splash + SplashProps from EmberGlass barrel |

## Self-Check: PASSED

Files exist:
- FOUND: app/components/EmberGlass/Splash.tsx
- FOUND: app/components/EmberGlass/__tests__/Splash.test.tsx
- FOUND: lib/hooks/useReducedMotion.ts
- FOUND: lib/hooks/__tests__/useReducedMotion.test.ts
- FOUND: app/components/EmberGlass/index.ts (modified)

Commits exist (verified via `git log --oneline | grep <hash>`):
- FOUND: 6c7102f7 (Task 1)
- FOUND: 7771e443 (Task 2)
- FOUND: 0c079915 (Task 3)
