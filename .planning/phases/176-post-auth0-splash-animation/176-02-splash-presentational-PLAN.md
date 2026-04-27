---
phase: 176
plan: 02
plan_id: 176-02
slug: splash-presentational
type: execute
wave: 2
depends_on:
  - 176-01
files_modified:
  - app/components/EmberGlass/Splash.tsx
  - app/components/EmberGlass/__tests__/Splash.test.tsx
  - lib/hooks/useReducedMotion.ts
  - lib/hooks/__tests__/useReducedMotion.test.ts
  - app/components/EmberGlass/index.ts
autonomous: true
requirements:
  - SPLASH-02
  - SPLASH-03
commit_strategy: per_task
must_haves:
  truths:
    - "Splash overlay renders with z-index 1000 and is fixed-positioned (covers viewport regardless of scroll)."
    - "Full-motion phase state machine fires timers at exactly 600ms (phase 0→1), 1500ms (phase 1→2), 2100ms (phase 2→3 → onDone + return null)."
    - "Reduced-motion branch fires a single 200ms timer; calls onDone exactly once at t=200ms."
    - "Reduced-motion branch renders the splash with `transition: 'opacity .2s linear'` and ZERO transform values on overlay or flame."
    - "All timers are cleared on unmount (no setState-after-unmount; React 18 strict-mode safe)."
    - "data-testid attrs splash-overlay, splash-flame, splash-wordmark, splash-badge present in DOM."
    - "Wordmark literal is 'Home'; caption literal is 'Connessione al gateway…' (U+2026); badge literal is 'Autenticato · Auth0' (U+00B7)."
    - "useReducedMotion() hook returns false during SSR/first render; flips to true after mount when matchMedia matches."
    - "useReducedMotion() hook is exercised by a dedicated unit test covering SSR-safe default, post-mount sync to matchMedia.matches, response to 'change' events, and listener cleanup on unmount."
  artifacts:
    - path: app/components/EmberGlass/Splash.tsx
      provides: "Pure presentational splash overlay; 4-phase state machine + reduced-motion 2-phase variant; bundle-verbatim inline styles"
      exports: ["Splash", "SplashProps"]
      contains: 'data-testid="splash-overlay"'
    - path: app/components/EmberGlass/__tests__/Splash.test.tsx
      provides: "Jest fake-timer tests for both phase state machines + cleanup + DOM structure"
    - path: lib/hooks/useReducedMotion.ts
      provides: "SSR-safe matchMedia('(prefers-reduced-motion: reduce)') hook"
      exports: ["useReducedMotion"]
    - path: lib/hooks/__tests__/useReducedMotion.test.ts
      provides: "Dedicated unit test for the matchMedia hook (SSR default, mount sync, change-event response, unmount cleanup) — mirrors useVisibility.test.ts analog"
    - path: app/components/EmberGlass/index.ts
      provides: "Barrel adds Splash + SplashProps re-exports"
  key_links:
    - from: app/components/EmberGlass/Splash.tsx
      to: app/components/EmberGlass/FlameViz.tsx
      via: "<FlameViz on intensity={0.95} />"
      pattern: "FlameViz"
    - from: app/components/EmberGlass/Splash.tsx
      to: app/globals.css
      via: 'animation: "pulse 1.6s infinite"'
      pattern: "pulse"
    - from: app/components/EmberGlass/Splash.tsx
      to: lib/hooks/useReducedMotion.ts (consumed by SplashGate, NOT Splash directly)
      via: "props.reducedMotion forwarded by SplashGate"
      pattern: "reducedMotion"
    - from: lib/hooks/__tests__/useReducedMotion.test.ts
      to: lib/hooks/useReducedMotion.ts
      via: "renderHook(() => useReducedMotion()) + matchMedia mock"
      pattern: "useReducedMotion"
---

<objective>
Ship the `<Splash>` presentational overlay (Phase 176's animated centerpiece) AND the SSR-safe `useReducedMotion()` hook that the Plan 03 orchestrator will consume.

`<Splash>` is pure presentational: it owns the phase timer state machine and renders the bundle-verbatim DOM (ambient glow + flame + wordmark + caption + badge), but it does NOT touch `useUser()`, sessionStorage, or `matchMedia` — those concerns belong to `<SplashGate>` (Plan 03). This separation keeps `<Splash>` unit-testable via `jest.useFakeTimers()` and `<SplashGate>` unit-testable via mocked auth + storage.

Per CONTEXT.md D-02: "<Splash> is dumb. <SplashGate> owns all integration."
Per CONTEXT.md D-17: useReducedMotion is extracted to lib/hooks/ for Phase 177+ reuse.

Per CLAUDE.md Rule 5 ("ALWAYS create/update unit tests"): the `useReducedMotion` hook ships with its own dedicated unit test in this plan. Plan 03 mocks the entire module via `jest.mock`, so without this dedicated test the hook's matchMedia subscription, change listener, and cleanup paths would have zero direct coverage.

Purpose: deliver SPLASH-02 (animation sequence) and SPLASH-03 (reduced-motion contract) at the primitive layer.

Output:
- New file `app/components/EmberGlass/Splash.tsx` (~120 LOC; bundle verbatim port)
- New file `app/components/EmberGlass/__tests__/Splash.test.tsx` (~150 LOC; fake-timer tests)
- New file `lib/hooks/useReducedMotion.ts` (~20 LOC; SSR-safe matchMedia hook)
- New file `lib/hooks/__tests__/useReducedMotion.test.ts` (~80 LOC; dedicated hook unit test mirroring useVisibility.test.ts)
- Modified `app/components/EmberGlass/index.ts` (append Splash + SplashProps exports)
</objective>

<implements_decisions>
## Truths (Implements Decisions)

This plan explicitly implements the following CONTEXT.md decisions (citations for the decision-coverage gate):

- D-01: `<Splash>` lives in `app/components/EmberGlass/` namespace; `useReducedMotion` lives in `lib/hooks/`.
- D-02: `<Splash>` is dumb (pure presentational; owns ONLY phase-timer state); all integration concerns deferred to `<SplashGate>` (Plan 03).
- D-06: z-index 1000 reserved for splash overlay (documented in JSDoc; reserved against Phase 178-181 in-session UI).
- D-07: `<Splash>` returns `null` once phase 3 is reached (full-motion) or phase 1 (reduced-motion).
- D-13: Phase state machine timers fire at exactly 600ms (phase 0→1), 1500ms (phase 1→2), 2100ms (phase 2→3 → onDone).
- D-14: Authenticato badge dot consumes `pulse` keyframe (defined in Plan 01).
- D-15: Wordmark literal `'Home'`; caption `'Connessione al gateway…'` (U+2026); badge `'Autenticato · Auth0'` (U+00B7).
- D-16: AppShell scale-in is driven by `<SplashGate>` (Plan 03); `<Splash>` exposes the `onDone` callback that triggers it.
- D-17: `useReducedMotion` extracted to `lib/hooks/useReducedMotion.ts` for Phase 177+ reuse; uses `matchMedia` + `change` listener.
- D-18: Reduced-motion branch collapses to a single 200ms opacity-only fade.
- D-19: Reduced-motion branch has ZERO `transform: scale(...)` on overlay or any child.
- D-22: `pointerEvents: 'none'` flips at phase ≥ 2 (full-motion) or phase ≥ 1 (reduced-motion) — overlay becomes click-through during fade.
- D-23: Splash reuses Phase 174 tokens (`var(--text-2)`, `color-mix(in oklab, var(--accent) 40%, transparent)`) for non-AUDIT-EXCEPTION colors.
- D-24: `<Splash>` does NOT consume `<Pressable>` or `<Sheet>` (no interactive surfaces inside the splash).
- D-26: Wordmark uses `fontFamily: 'var(--font-display)'` — Outfit display font from Phase 174.
- D-29: `<Splash>` and `useReducedMotion` Jest tests colocated under `__tests__/` directories.
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

@.planning/phases/176-post-auth0-splash-animation/176-01-SUMMARY.md

@app/components/EmberGlass/AmbientBg.tsx
@app/components/EmberGlass/FlameViz.tsx
@app/components/EmberGlass/__tests__/Sheet.test.tsx
@lib/hooks/useVisibility.ts
@lib/hooks/__tests__/useVisibility.test.ts

<interfaces>
<!-- FlameViz API (consumed by Splash; from Plan 01): -->

```ts
export interface FlameVizProps {
  on: boolean;
  intensity?: number; // default 0.6; splash uses 0.95
}
export function FlameViz(props: FlameVizProps): React.ReactElement;
```

<!-- Existing useVisibility hook shape (canonical SSR-safe matchMedia/visibility analog): -->

```tsx
// lib/hooks/useVisibility.ts
'use client';
import { useState, useEffect } from 'react';
export function useVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });
  useEffect(() => {
    setIsVisible(!document.hidden);
    const handler = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  return isVisible;
}
```

<!-- Existing useVisibility unit test shape (canonical analog for the new useReducedMotion test): -->

```tsx
// lib/hooks/__tests__/useVisibility.test.ts
/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useVisibility } from '../useVisibility';

describe('useVisibility', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'hidden', { writable: true, configurable: true, value: false });
  });

  it('returns true initially when tab is visible', () => {
    const { result } = renderHook(() => useVisibility());
    expect(result.current).toBe(true);
  });

  it('flips on visibilitychange', () => { /* ... act + dispatchEvent ... */ });

  it('cleans up event listener on unmount', () => {
    const spy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useVisibility());
    unmount();
    expect(spy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    spy.mockRestore();
  });
});
```

<!-- Existing barrel after Plan 01 commit: -->

```ts
export { Pressable, usePressed } from './Pressable';
export type { PressableProps, PointerHandlers } from './Pressable';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { default as AmbientBg } from './AmbientBg';
export { FlameViz } from './FlameViz';
export type { FlameVizProps } from './FlameViz';
```

<!-- Bundle source: .planning/inbox/ember-glass-design/project/components/splash.jsx:1-91 -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true" id="176-02-01">
  <name>Task 1: Create lib/hooks/useReducedMotion.ts (SSR-safe matchMedia hook) AND its dedicated unit test</name>
  <files>lib/hooks/useReducedMotion.ts, lib/hooks/__tests__/useReducedMotion.test.ts</files>

  <read_first>
    - lib/hooks/useVisibility.ts (canonical SSR-safe browser-API hook shape — full file)
    - lib/hooks/__tests__/useVisibility.test.ts (canonical hook-test shape — full file; this is THE analog for the new useReducedMotion test)
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md "lib/hooks/useReducedMotion.ts" pattern block
    - .planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md D-17 (matchMedia + change listener; runtime toggle honored)
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"Claude's Discretion" row "useReducedMotion() location" (lock: extract to lib/hooks/)
  </read_first>

  <behavior>
    The dedicated unit test at `lib/hooks/__tests__/useReducedMotion.test.ts` MUST cover the four bullets per CLAUDE.md Rule 5 + revision-feedback fix_hint. Mirror `useVisibility.test.ts` shape: `@jest-environment jsdom` directive at the top, `renderHook` + `act` from `@testing-library/react`, `beforeEach` to install the matchMedia mock, `mockRestore`/cleanup in afterEach.

    - Test 1 — SSR-safe default: on first render (before any matchMedia interaction), `result.current === false`. Implementation note: `useState(false)` provides this — the test simply asserts the initial value.
    - Test 2 — flips to true post-mount when `matchMedia.matches === true`: install a matchMedia mock whose `matches` property is `true`; render the hook; assert `result.current === true` after the mount effect fires (RTL automatically flushes effects). Mirrors useVisibility.test.ts:40-62 "returns true again when..." shape.
    - Test 3 — responds to `change` events on the media query: install a matchMedia mock that captures the registered change listener; render with `matches: false`; assert `result.current === false`; then `act(() => { listener({ matches: true }); })`; assert `result.current === true`.
    - Test 4 — cleanup on unmount: install a matchMedia mock with `removeEventListener` spied; render the hook; call `unmount()`; assert the spy was called with `'change'` + the same handler that was registered. Mirrors useVisibility.test.ts:64-76 cleanup test verbatim.
  </behavior>

  <action>
**Edit 1: Create `lib/hooks/useReducedMotion.ts`** mirroring the `useVisibility.ts` SSR-safe shape, with `matchMedia('(prefers-reduced-motion: reduce)')` swapped in for the document.hidden API:

```ts
'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe `prefers-reduced-motion: reduce` detection.
 *
 * Returns `false` during SSR + first client render (full-motion default per
 * Phase 176 UI-SPEC §"Reduced-motion contract"); flips to `true` after mount
 * if the user prefers reduced motion. Subscribes to the `change` event so a
 * runtime toggle (rare but cheap) is honored mid-session.
 *
 * Phase 176 consumer: `<SplashGate>`. Phase 177+ glass-card consumers may use
 * this same hook for their own motion-aware visual effects.
 *
 * Pattern source: lib/hooks/useVisibility.ts (sibling SSR-safe browser-API hook).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false); // SSR-safe default — full motion

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
```

Use `addEventListener('change', ...)` and `removeEventListener('change', ...)` — NOT the deprecated `addListener`/`removeListener` (per RESEARCH §"Common Pitfalls" Pitfall 3 + UI-SPEC §"Component Inventory" useReducedMotion row "addEventListener not deprecated addListener"). All modern browsers (Safari 14+, Chrome 90+) support the `addEventListener` API.

**Edit 2: Create `lib/hooks/__tests__/useReducedMotion.test.ts`** mirroring `useVisibility.test.ts` verbatim shape. Per CLAUDE.md Rule 5 ("ALWAYS create/update unit tests") + the planner-revision feedback: this is mandatory because Plan 03 mocks the hook module wholesale (`jest.mock('@/lib/hooks/useReducedMotion', ...)`), so without this dedicated test the hook's actual code paths (matchMedia subscription, change listener, cleanup, SSR-safe default) have ZERO direct coverage.

Recommended test shape (follow this scaffold):

```ts
/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../useReducedMotion';

type Listener = (e: { matches: boolean }) => void;

interface MqMock {
  matches: boolean;
  addEventListener: jest.Mock<void, ['change', Listener]>;
  removeEventListener: jest.Mock<void, ['change', Listener]>;
  // Capture the registered handler so tests can dispatch synthetic 'change' events.
  _emit: (matches: boolean) => void;
}

function installMatchMediaMock(initialMatches: boolean): MqMock {
  let registered: Listener | null = null;
  const addEventListener = jest.fn<void, ['change', Listener]>((_event, l) => {
    registered = l;
  });
  const removeEventListener = jest.fn<void, ['change', Listener]>();
  const mq: MqMock = {
    matches: initialMatches,
    addEventListener,
    removeEventListener,
    _emit: (matches: boolean) => {
      if (registered) registered({ matches });
    },
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => {
      // Defensive: hook only queries '(prefers-reduced-motion: reduce)'.
      expect(query).toBe('(prefers-reduced-motion: reduce)');
      return mq;
    }),
  });
  return mq;
}

describe('useReducedMotion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false on first render (SSR-safe default)', () => {
    // matchMedia is intentionally NOT mocked yet for the initial-value check —
    // useState(false) governs the very first synchronous render. We mock it to
    // a no-op so the post-mount effect doesn't crash.
    installMatchMediaMock(false);
    const { result } = renderHook(() => useReducedMotion());
    // After mount the effect runs and syncs to matchMedia.matches (false here),
    // so result is still false. The SSR default is the same value as the mock,
    // which is exactly the production guarantee: no flicker between SSR and CSR.
    expect(result.current).toBe(false);
  });

  it('flips to true after mount when matchMedia.matches is true', () => {
    installMatchMediaMock(true);
    const { result } = renderHook(() => useReducedMotion());
    // RTL flushes the mount effect synchronously; result reflects mq.matches.
    expect(result.current).toBe(true);
  });

  it('responds to "change" events on the media query', () => {
    const mq = installMatchMediaMock(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      mq._emit(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      mq._emit(false);
    });
    expect(result.current).toBe(false);
  });

  it('removes the change listener on unmount', () => {
    const mq = installMatchMediaMock(false);
    const { unmount } = renderHook(() => useReducedMotion());
    expect(mq.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(mq.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    // Same handler reference passed to add and remove (cleanup correctness).
    const addedHandler = mq.addEventListener.mock.calls[0]?.[1];
    const removedHandler = mq.removeEventListener.mock.calls[0]?.[1];
    expect(removedHandler).toBe(addedHandler);
  });
});
```

NOTE on the SSR-safe default test: jsdom always provides a defined `window`, so the hook ALWAYS runs the mount effect. The "SSR-safe default" guarantee in production is that `useState(false)` is the value rendered on the server; in jsdom we verify the analogous invariant — that when `matchMedia.matches === false`, the hook returns `false` both at first render and after the effect (no flicker). This is the same coverage shape `useVisibility.test.ts:18-21` uses for its own SSR default.

Per CLAUDE.md Rule 5: tests are mandatory. Per CLAUDE.md Rule 8: never call bare `npm test`; the verify command uses the scoped `test:components` runner targeting only this file.
  </action>

  <verify>
    <automated>npm run test:components -- lib/hooks/__tests__/useReducedMotion.test.ts</automated>
  </verify>

  <acceptance_criteria>
    - File `lib/hooks/useReducedMotion.ts` exists.
    - File `lib/hooks/__tests__/useReducedMotion.test.ts` exists.
    - `grep -q "'use client'" lib/hooks/useReducedMotion.ts` returns 0.
    - `grep -q "export function useReducedMotion(): boolean" lib/hooks/useReducedMotion.ts` returns 0.
    - `grep -q "useState(false)" lib/hooks/useReducedMotion.ts` returns 0 (SSR-safe default).
    - `grep -q "matchMedia('(prefers-reduced-motion: reduce)')" lib/hooks/useReducedMotion.ts` returns 0.
    - `grep -q "addEventListener('change'" lib/hooks/useReducedMotion.ts` returns 0.
    - `! grep -q 'addListener\b' lib/hooks/useReducedMotion.ts` (deprecated API NOT used).
    - Test file declares `@jest-environment jsdom`: `grep -q "@jest-environment jsdom" lib/hooks/__tests__/useReducedMotion.test.ts` returns 0.
    - Test file imports `renderHook` from `@testing-library/react`: `grep -q "renderHook" lib/hooks/__tests__/useReducedMotion.test.ts` returns 0.
    - Test file mocks `window.matchMedia`: `grep -q "matchMedia" lib/hooks/__tests__/useReducedMotion.test.ts` returns 0.
    - Test file covers all four behaviors: `grep -c "^\s*it(" lib/hooks/__tests__/useReducedMotion.test.ts` returns ≥ 4 (SSR default, post-mount sync, change-event response, unmount cleanup).
    - All useReducedMotion tests pass: `npm run test:components -- lib/hooks/__tests__/useReducedMotion.test.ts` exits 0.
    - The hook file compiles cleanly under TypeScript strict mode (signal provided by ts-jest during the test run; no separate tsc invocation needed — this avoids the previous broken `|| true` pipeline that swallowed errors).
  </acceptance_criteria>

  <done>useReducedMotion hook exists, is SSR-safe, uses modern matchMedia event listener API, AND has a dedicated unit test that exercises all four code paths (SSR default, post-mount matchMedia sync, change-event response, listener cleanup) — mirroring the useVisibility.test.ts analog. Plan 03 may continue to mock the module wholesale; the hook itself now has direct coverage per CLAUDE.md Rule 5.</done>
</task>

<task type="auto" tdd="true" id="176-02-02">
  <name>Task 2: Create &lt;Splash&gt; presentational component (verbatim bundle port) + Jest fake-timer tests</name>
  <files>app/components/EmberGlass/Splash.tsx, app/components/EmberGlass/__tests__/Splash.test.tsx</files>

  <read_first>
    - .planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md (D-02, D-05, D-06, D-13..D-22; ALL animation timing values)
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"Animation Sequence (SPLASH-02 — locked verbatim from bundle)" + §"<Splash> (presentational overlay)" §"Component API + Variants" + §"Internal DOM" + §"Accessibility"
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md "app/components/EmberGlass/Splash.tsx" pattern block (full code excerpts) + "app/components/EmberGlass/__tests__/Splash.test.tsx" pattern block
    - .planning/inbox/ember-glass-design/project/components/splash.jsx (bundle source — lines 1-91 are the verbatim port target)
    - app/components/EmberGlass/AmbientBg.tsx (canonical 'use client' + JSDoc + AUDIT-EXCEPTION inline-style convention)
    - app/components/EmberGlass/__tests__/Sheet.test.tsx (Jest test structure analog: describe blocks + beforeEach/afterEach mock cleanup)
    - app/components/EmberGlass/FlameViz.tsx (consumed via `<FlameViz on intensity={0.95} />`)
  </read_first>

  <behavior>
    Full-motion branch (`reducedMotion` is undefined or false):
    - Test 1 — phase 0 → 1 at t=600ms: `splash-flame` data-testid element style.transform contains `'scale(0.4)'` initially; after `jest.advanceTimersByTime(600)` it contains `'scale(1)'`.
    - Test 2 — onDone exactly once at t=2100ms: at t=2099 NOT called; at t=2100 called once.
    - Test 3 — splash returns `null` after phase 3: at t=2100, `queryByTestId('splash-overlay')` returns null.
    - Test 4 — all timers cleared on unmount: render → unmount → advance fake timers by 3000ms → onDone NEVER called.
    - Test 5 — pointerEvents flips to 'none' once phase ≥ 2: at t=1500, splash overlay style.pointerEvents === 'none'.

    Reduced-motion branch (`reducedMotion={true}`):
    - Test 6 — opacity-only fade with no transform on root: overlay style.transition contains 'opacity', does NOT contain 'transform'.
    - Test 7 — onDone called at t=200ms (single timer).
    - Test 8 — flame element does NOT have a `scale(...)` transform applied (transform is `'none'` or omitted).

    DOM structure (both branches):
    - Test 9 — overlay has `aria-hidden="true"` attribute.
    - Test 10 — wordmark text === `'Home'`.
    - Test 11 — caption text === `'Connessione al gateway…'` (with U+2026 ellipsis, NOT three periods).
    - Test 12 — badge text contains `'Autenticato · Auth0'` (with U+00B7 middle dot).
    - Test 13 — z-index === 1000.
  </behavior>

  <action>
Create `app/components/EmberGlass/Splash.tsx` per UI-SPEC §"<Splash> (presentational overlay)" + §"Internal DOM" + §"Animation Sequence" verbatim. The file is ~120 LOC.

KEY TIMING CONSTANTS (lifted from bundle splash.jsx:5-91, locked per UI-SPEC):
- Full-motion timers: `t1=600`, `t2=1500`, `t3=2100` (ms).
- Reduced-motion timer: `t=200` (ms).
- Splash root opacity transition (full-motion phase ≥ 2): `'opacity .55s cubic-bezier(.4,0,.2,1)'`.
- Flame transform transition: `'opacity .5s, transform .7s cubic-bezier(.22,1.2,.36,1)'`.
- Wordmark/caption transitions: `'opacity .5s .15s, transform .6s .15s cubic-bezier(.22,1,.36,1)'` (wordmark) and `'opacity .5s .3s, transform .6s .3s cubic-bezier(.22,1,.36,1)'` (caption).
- Badge transition: `'opacity .5s .4s'`.
- Ambient glow transition: `'opacity 1s, transform 1.2s cubic-bezier(.22,1,.36,1)'`.

KEY VISUAL CONSTANTS (locked AUDIT-EXCEPTION literals, copy verbatim with inline `// AUDIT-EXCEPTION` tags):
- Splash root background: `'radial-gradient(ellipse at center, #1c1917 0%, #0a0908 70%)'` // bundle splash.jsx:25
- Wordmark color: `'#fff'` // bundle splash.jsx:55
- Status dot bg: `'#6aa86a'` // bundle splash.jsx:83
- Status dot glow: `'0 0 8px #6aa86a'` // bundle splash.jsx:84
- Position: `'fixed'` (NOT bundle's `'absolute'`) — UI-SPEC §"Position resolution" lock with AUDIT-EXCEPTION tag.
- z-index: `1000` (bundle splash.jsx:23 verbatim; reserved per CONTEXT.md D-06).

KEY COPY (Italian, verbatim, with U+2026 + U+00B7):
- Wordmark: `'Home'` (bundle splash.jsx:62)
- Caption: `'Connessione al gateway…'` (U+2026 ellipsis — NEVER three periods)
- Badge: `'Autenticato · Auth0'` (U+00B7 middle dot — NEVER hyphen or full stop)

KEY TYPOGRAPHY (locked per UI-SPEC §"Typography"):
- Wordmark: `fontFamily: 'var(--font-display)'`, `fontSize: 28`, `fontWeight: 600`, `letterSpacing: -0.8`, `color: '#fff'` (AUDIT-EXCEPTION).
- Caption: `fontSize: 12`, `fontWeight: 500`, `letterSpacing: 0.3`, `color: 'var(--text-2)'`.
- Badge: `fontSize: 11`, `color: 'var(--text-2)'`, opacity `0.7` once visible (phase ≥ 1).

KEY LAYOUT (locked per UI-SPEC §"Spacing Scale"):
- Wordmark `marginTop: 26` (AUDIT-EXCEPTION non-4-multiple, bundle splash.jsx:52).
- Caption `marginTop: 6` (AUDIT-EXCEPTION non-4-multiple, bundle splash.jsx:66).
- Badge `bottom: 40, left: 0, right: 0`.
- Badge dot/label `gap: 6` (AUDIT-EXCEPTION non-4-multiple, bundle splash.jsx:80).
- Flame logo container: `width: 88, height: 96` (bundle splash.jsx:42); inside, render `<FlameViz on intensity={0.95} />`.
- Ambient glow blob: `width: 400, height: 400, borderRadius: 999, filter: 'blur(60px)'`, `background: 'color-mix(in oklab, var(--accent) 40%, transparent)'`.

KEY DATA-TESTID ATTRS (locked per UI-SPEC §"Component API + Variants"):
- `data-testid="splash-overlay"` on the root.
- `data-testid="splash-flame"` on the flame container (88x96 wrapper holding `<FlameViz>`).
- `data-testid="splash-wordmark"` on the wordmark div.
- `data-testid="splash-badge"` on the badge container.

KEY ARIA: `aria-hidden="true"` on the splash root (UI-SPEC §"Accessibility": role=none, aria-hidden=true).

REDUCED-MOTION BRANCH RULES (locked per CONTEXT.md D-17/D-18/D-19 + UI-SPEC §"Reduced-motion timeline"):
- Single tree (no separate component); flag-driven inline-style switch.
- Splash root: `transition: 'opacity .2s linear'` (NOT including `transform`).
- ALL children render at `opacity: 1` from t=0.
- NO `transform: scale(...)` on overlay, flame container, or any child.
- Badge dot's `pulse` keyframe animation: set `animation: 'none'` when reducedMotion (suppress per UI-SPEC §"<Splash> ... Reduced-motion DOM" — "for strict compliance, suppress it").
- Single `setTimeout` at t=200; on fire: `setPhase(1)` AND `onDone()`.
- Returns null when phase === 1 in reduced-motion mode.

PHASE STATE MACHINE (full-motion):

```tsx
const [phase, setPhase] = useState(0);

useEffect(() => {
  if (reducedMotion) return; // separate effect handles reduced-motion
  const t1 = setTimeout(() => setPhase(1), 600);
  const t2 = setTimeout(() => setPhase(2), 1500);
  const t3 = setTimeout(() => { setPhase(3); onDone(); }, 2100);
  return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
}, [reducedMotion, onDone]);

useEffect(() => {
  if (!reducedMotion) return;
  const t = setTimeout(() => { setPhase(1); onDone(); }, 200);
  return () => clearTimeout(t);
}, [reducedMotion, onDone]);

if (reducedMotion) {
  if (phase === 1) return null;
} else {
  if (phase === 3) return null;
}
```

NOTE on stale closure (RESEARCH Pitfall 5): the `onDone` dependency in `useEffect` deps array is correct ONLY if the parent (SplashGate) memoizes the callback. Since SplashGate uses `setReady(true)` etc. inside an inline arrow function, in practice the timer captures the freshest `onDone`. Acceptable risk — SplashGate test (Plan 03) verifies `setReady` flips and sessionStorage is written.

DOM STRUCTURE (per UI-SPEC §"Internal DOM"):

```tsx
return (
  <div
    data-testid="splash-overlay"
    aria-hidden="true"
    style={{
      position: 'fixed', // AUDIT-EXCEPTION: deliberate divergence from bundle's 'absolute' (UI-SPEC §"Position resolution")
      inset: 0,
      zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:25
      background: 'radial-gradient(ellipse at center, #1c1917 0%, #0a0908 70%)',
      opacity: reducedMotion ? (phase >= 1 ? 0 : 1) : (phase >= 2 ? 0 : 1),
      transition: reducedMotion ? 'opacity .2s linear' : 'opacity .55s cubic-bezier(.4,0,.2,1)',
      pointerEvents: (reducedMotion ? phase >= 1 : phase >= 2) ? 'none' : 'auto',
    }}
  >
    {/* Ambient glow blob — visible from phase ≥ 1 in full-motion; from t=0 in reduced-motion */}
    <div style={{
      position: 'absolute',
      width: 400, height: 400,
      borderRadius: 999,
      // Phase 174 token consumption — 30% secondary in 60/30/10 split (UI-SPEC §Color)
      background: 'color-mix(in oklab, var(--accent) 40%, transparent)',
      filter: 'blur(60px)',
      opacity: reducedMotion ? 0.7 : (phase >= 1 ? 0.7 : 0),
      transform: reducedMotion ? 'none' : (phase >= 1 ? 'scale(1.2)' : 'scale(0.6)'),
      transition: reducedMotion ? undefined : 'opacity 1s, transform 1.2s cubic-bezier(.22,1,.36,1)',
    }} />

    {/* Flame container */}
    <div
      data-testid="splash-flame"
      style={{
        position: 'relative', width: 88, height: 96,
        opacity: reducedMotion ? 1 : (phase >= 1 ? 1 : 0),
        transform: reducedMotion ? 'none' : (
          phase >= 2 ? 'scale(1.08)' : (phase >= 1 ? 'scale(1)' : 'scale(0.4)')
        ),
        transition: reducedMotion ? undefined : 'opacity .5s, transform .7s cubic-bezier(.22,1.2,.36,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <FlameViz on intensity={0.95} />
    </div>

    {/* Wordmark — AUDIT-EXCEPTION marginTop:26 (bundle splash.jsx:52); color #fff (bundle splash.jsx:55) */}
    <div
      data-testid="splash-wordmark"
      style={{
        marginTop: 26, // AUDIT-EXCEPTION: non-4-multiple, bundle splash.jsx:52
        fontFamily: 'var(--font-display)',
        fontSize: 28, fontWeight: 600, letterSpacing: -0.8,
        color: '#fff', // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:55
        opacity: reducedMotion ? 1 : (phase >= 1 ? 1 : 0),
        transform: reducedMotion ? 'none' : (phase >= 1 ? 'translateY(0)' : 'translateY(12px)'),
        transition: reducedMotion ? undefined : 'opacity .5s .15s, transform .6s .15s cubic-bezier(.22,1,.36,1)',
      }}
    >
      Home
    </div>

    {/* Caption — AUDIT-EXCEPTION marginTop:6 (bundle splash.jsx:66) */}
    <div
      style={{
        marginTop: 6, // AUDIT-EXCEPTION: non-4-multiple, bundle splash.jsx:66
        fontSize: 12, fontWeight: 500, letterSpacing: 0.3,
        color: 'var(--text-2)',
        opacity: reducedMotion ? 1 : (phase >= 1 ? 1 : 0),
        transform: reducedMotion ? 'none' : (phase >= 1 ? 'translateY(0)' : 'translateY(8px)'),
        transition: reducedMotion ? undefined : 'opacity .5s .3s, transform .6s .3s cubic-bezier(.22,1,.36,1)',
      }}
    >
      Connessione al gateway…
    </div>

    {/* Badge — green dot + label */}
    <div
      data-testid="splash-badge"
      style={{
        position: 'absolute',
        bottom: 40, left: 0, right: 0,
        textAlign: 'center',
        fontSize: 11, color: 'var(--text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, // AUDIT-EXCEPTION: non-4-multiple, bundle splash.jsx:80
        opacity: reducedMotion ? 0.7 : (phase >= 1 ? 0.7 : 0),
        transition: reducedMotion ? undefined : 'opacity .5s .4s',
      }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: 999,
        background: '#6aa86a', // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:83
        boxShadow: '0 0 8px #6aa86a', // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:84
        animation: reducedMotion ? 'none' : 'pulse 1.6s infinite',
      }} />
      Autenticato · Auth0
    </div>
  </div>
);
```

JSDoc HEADER (top of Splash.tsx — copy verbatim):

```tsx
'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import { FlameViz } from './FlameViz';

/**
 * Splash — Phase 176 (SPLASH-02, SPLASH-03)
 *
 * Z-INDEX RESERVATION: 1000 (lifted verbatim from bundle splash.jsx:23).
 * Phases 178-181 in-session UI MUST stay below 1000.
 *
 * Bundle source (PRIMARY visual + behavior contract):
 *   .planning/inbox/ember-glass-design/project/components/splash.jsx:1-91
 *
 * Pure presentational. Owns the 4-phase timer state machine (full-motion) and the
 * 2-phase variant (reduced-motion). Does NOT touch sessionStorage, Auth0, or
 * matchMedia — those concerns are owned by <SplashGate>.
 *
 * AUDIT-EXCEPTION (DS-02): #1c1917→#0a0908 splash gradient, #fff wordmark,
 * #6aa86a status dot, position:'fixed' (vs bundle 'absolute' — UI-SPEC §"Position
 * resolution"), and three non-4-multiple offsets (marginTop:26, marginTop:6,
 * gap:6) are intentional bundle-fidelity literals (UI-SPEC §Color §Spacing).
 */
export interface SplashProps {
  /** Called once when splash transition completes (full-motion: t=2100; reduced-motion: t=200). */
  onDone: () => void;
  /** When true, collapses to a 200ms opacity-only fade with no scale/transform. Default: false. */
  reducedMotion?: boolean;
}

export function Splash({ onDone, reducedMotion = false }: SplashProps): React.ReactElement | null {
  // ... state machine + return JSX ...
}
```

Then create `app/components/EmberGlass/__tests__/Splash.test.tsx` covering all 13 test cases listed in `<behavior>`, mirroring `Sheet.test.tsx` structure (describe blocks: "Full-motion phase state machine", "Reduced-motion branch", "DOM structure"). Use `jest.useFakeTimers()` per PATTERNS.md code excerpt. Use `act()` to wrap timer advances. After each test, call `jest.useRealTimers()` in afterEach.

CRITICAL: Test 11 (caption text) MUST verify the actual U+2026 character. Use:
```tsx
expect(screen.getByText('Connessione al gateway…')).toBeInTheDocument();
// or equivalently:
expect(screen.getByText(/Connessione al gateway…/)).toBeInTheDocument();
```

Do NOT add `<Splash>` to the barrel index in this task — Task 3 owns that change for clean commit boundaries.

Per CLAUDE.md rule 5: tests are mandatory. Per CLAUDE.md rule 8: never call bare `npm test`.
  </action>

  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/__tests__/Splash.test.tsx</automated>
  </verify>

  <acceptance_criteria>
    - File `app/components/EmberGlass/Splash.tsx` exists.
    - File `app/components/EmberGlass/__tests__/Splash.test.tsx` exists.
    - `grep -q "export function Splash" app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q "export interface SplashProps" app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q "'use client'" app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q 'data-testid="splash-overlay"' app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q 'data-testid="splash-flame"' app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q 'data-testid="splash-wordmark"' app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q 'data-testid="splash-badge"' app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q 'aria-hidden="true"' app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q 'zIndex: 1000' app/components/EmberGlass/Splash.tsx` returns 0.
    - `grep -q "position: 'fixed'" app/components/EmberGlass/Splash.tsx` returns 0.
    - U+2026 ellipsis present: `python3 -c "print(open('app/components/EmberGlass/Splash.tsx').read().find('Connessione al gateway…'))"` returns ≥ 0 (equivalently: `grep -P 'Connessione al gateway\xe2\x80\xa6' app/components/EmberGlass/Splash.tsx` matches at least once).
    - U+00B7 middle dot present in 'Autenticato · Auth0' string: `grep -P 'Autenticato \xc2\xb7 Auth0' app/components/EmberGlass/Splash.tsx` matches.
    - NO three-period ellipsis: `grep -F 'gateway...' app/components/EmberGlass/Splash.tsx` returns nothing (exit code 1).
    - Timer constants present: `grep -q ', 600' app/components/EmberGlass/Splash.tsx`, `grep -q ', 1500' app/components/EmberGlass/Splash.tsx`, `grep -q ', 2100' app/components/EmberGlass/Splash.tsx`, `grep -q ', 200' app/components/EmberGlass/Splash.tsx` all return 0.
    - AUDIT-EXCEPTION count: `grep -c 'AUDIT-EXCEPTION' app/components/EmberGlass/Splash.tsx` returns ≥ 5 (gradient, wordmark color, dot bg, dot glow, position:fixed; the three margin/gap exceptions may or may not be inline-tagged but at least 5 are mandatory).
    - All 13 Splash tests pass: `npm run test:components -- app/components/EmberGlass/__tests__/Splash.test.tsx` exits 0.
    - Bundle hex literal hygiene: `grep -E '#[0-9a-fA-F]{3,8}\b' app/components/EmberGlass/Splash.tsx | grep -v 'AUDIT-EXCEPTION'` returns 0 hits (every hex literal is AUDIT-EXCEPTION-tagged).
  </acceptance_criteria>

  <done>Splash.tsx exists with the full bundle-verbatim port, both phase state machines, all data-testid attrs, all literal Italian copy with proper Unicode, and AUDIT-EXCEPTION inline tags; 13 Jest tests pass under fake timers.</done>
</task>

<task type="auto" id="176-02-03">
  <name>Task 3: Add Splash + SplashProps exports to EmberGlass barrel</name>
  <files>app/components/EmberGlass/index.ts</files>

  <read_first>
    - app/components/EmberGlass/index.ts (current state after Plan 01 — should have FlameViz lines)
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md "app/components/EmberGlass/index.ts (modify, barrel re-export)" pattern block
  </read_first>

  <action>
Append two lines to `app/components/EmberGlass/index.ts` (preserve the 7 lines from Plan 01; do NOT add SplashGate exports — Plan 03 owns that line). Final state of the file MUST be:

```ts
export { Pressable, usePressed } from './Pressable';
export type { PressableProps, PointerHandlers } from './Pressable';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { default as AmbientBg } from './AmbientBg';
export { FlameViz } from './FlameViz';
export type { FlameVizProps } from './FlameViz';
export { Splash } from './Splash';
export type { SplashProps } from './Splash';
```
  </action>

  <verify>
    <automated>grep -q "^export { Splash } from './Splash';" app/components/EmberGlass/index.ts &amp;&amp; grep -q "^export type { SplashProps } from './Splash';" app/components/EmberGlass/index.ts &amp;&amp; npm run test:components -- app/components/EmberGlass/__tests__/Splash.test.tsx app/components/EmberGlass/__tests__/FlameViz.test.tsx</automated>
  </verify>

  <acceptance_criteria>
    - `grep -q "^export { Splash } from './Splash';" app/components/EmberGlass/index.ts` returns 0.
    - `grep -q "^export type { SplashProps } from './Splash';" app/components/EmberGlass/index.ts` returns 0.
    - The 7 prior export lines (`Pressable`/`Sheet`/`AmbientBg`/`FlameViz`) are preserved.
    - File is exactly 9 lines; no `SplashGate` line yet.
    - Splash + FlameViz tests still pass: `npm run test:components -- app/components/EmberGlass/__tests__/Splash.test.tsx app/components/EmberGlass/__tests__/FlameViz.test.tsx` exits 0.
  </acceptance_criteria>

  <done>Barrel re-exports Splash + SplashProps; downstream Plan 03 can append SplashGate without conflict.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none) | Phase 176-02 ships pure presentational React + a read-only matchMedia hook. No network, no input, no auth, no storage, no eval. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-176-02-01 | Tampering / DOM injection | `<Splash>` renders Italian literal copy via JSX text nodes (no `dangerouslySetInnerHTML`) | accept | All copy is hard-coded literal text in JSX; React escapes by default. No user input or props-derived strings rendered. |
| T-176-02-02 | Information Disclosure | `useReducedMotion` reads `window.matchMedia` (a public browser preference) | accept | Public browser API; no fingerprinting concerns at this granularity (single boolean). Aligns with WCAG accessibility expectations. |
| T-176-02-03 | Denial of Service | Timer-driven re-renders in `<Splash>` if cleanup fails (React 18 strict-mode double-mount) | mitigate | All `setTimeout` IDs cleared in `useEffect` cleanup; tested via Test 4 ("all timers cleared on unmount"). RESEARCH Pitfall 4 explicitly addressed. |
| T-176-02-04 | Information Disclosure | Inline hex literals in source (#1c1917, #fff, #6aa86a etc.) | accept | Public visual constants tagged AUDIT-EXCEPTION for Phase 174 DS-02 grep gate. No secrets. |
| T-176-02-05 | Denial of Service | `useReducedMotion` matchMedia listener leak if cleanup fails | mitigate | Cleanup verified by dedicated unit test in `lib/hooks/__tests__/useReducedMotion.test.ts` (Test 4 — `removeEventListener` called with same handler reference on unmount). |

ASVS L1 applicable controls: V14.4 (no exposure of sensitive resources via static assets) — N/A. V11.1 (input validation) — N/A (no input). No `high` severity threats. Phase explicitly declared minimal threat surface in planning_context.
</threat_model>

<verification>
After all 3 tasks complete:
1. `npm run test:components -- lib/hooks/__tests__/useReducedMotion.test.ts` — all 4 hook tests green (SSR default, post-mount sync, change-event response, unmount cleanup).
2. `npm run test:components -- app/components/EmberGlass/__tests__/Splash.test.tsx` — all 13 tests green.
3. `npm run test:components -- app/components/EmberGlass/__tests__/FlameViz.test.tsx` — all 4 tests still green (no regression from barrel change).
4. `grep -E '^export.*Splash' app/components/EmberGlass/index.ts | wc -l` returns `2` (Splash + SplashProps).
5. AUDIT-EXCEPTION grep gate (Phase 174 DS-02 inheritance):
   `grep -E '#[0-9a-fA-F]{3,8}\b' app/components/EmberGlass/Splash.tsx | grep -v AUDIT-EXCEPTION | wc -l` returns `0`.
6. Italian copy invariant (CLAUDE.md typographic rule + UI-SPEC §"Copywriting Contract"):
   - `grep -F 'gateway...' app/components/EmberGlass/Splash.tsx` returns nothing.
   - The `…` (U+2026) and `·` (U+00B7) characters are present in the source file.
7. `useReducedMotion` is exported from `lib/hooks/useReducedMotion.ts` (`grep -q 'export function useReducedMotion' lib/hooks/useReducedMotion.ts` returns 0).
8. `useReducedMotion` test file exists and declares jsdom env: `grep -q '@jest-environment jsdom' lib/hooks/__tests__/useReducedMotion.test.ts` returns 0.
</verification>

<success_criteria>
- `<Splash>` is importable as `import { Splash } from '@/app/components/EmberGlass';` and renders the bundle-verbatim DOM.
- Full-motion timeline matches bundle exactly (t=600/1500/2100ms phase transitions; onDone called once).
- Reduced-motion timeline collapses to a single 200ms opacity-only fade with no transforms (SPLASH-03).
- All timers are cleared on unmount (no setState-after-unmount under React 18 strict mode).
- DOM contains all required `data-testid` attrs for downstream Playwright assertions (Plan 04).
- Italian copy uses correct Unicode characters (U+2026 ellipsis, U+00B7 middle dot).
- `useReducedMotion()` is SSR-safe and consumable from `lib/hooks/`.
- `useReducedMotion()` ships with a dedicated unit test covering SSR default, post-mount matchMedia sync, change-event response, and unmount cleanup (per CLAUDE.md Rule 5).
- All 13 Splash + 4 FlameViz + 4 useReducedMotion Jest tests pass.
</success_criteria>

<output>
After completion, create `.planning/phases/176-post-auth0-splash-animation/176-02-SUMMARY.md` per template. Document: 3 commits (useReducedMotion hook + dedicated unit test; Splash component + tests; barrel update); files created; how Plan 03 will consume `<Splash>` (sibling overlay) and `useReducedMotion()` (orchestrator-level integration); any deviations from PATTERNS.md observed during execution.
</output>
</content>
</invoke>