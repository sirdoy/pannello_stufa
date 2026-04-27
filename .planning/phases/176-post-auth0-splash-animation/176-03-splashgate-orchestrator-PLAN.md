---
phase: 176
plan: 03
plan_id: 176-03
slug: splashgate-orchestrator
type: execute
wave: 3
depends_on:
  - 176-01
  - 176-02
files_modified:
  - app/components/EmberGlass/SplashGate.tsx
  - app/components/EmberGlass/__tests__/SplashGate.test.tsx
  - app/components/EmberGlass/index.ts
  - app/components/ClientProviders.tsx
autonomous: true
requirements:
  - SPLASH-01
  - SPLASH-04
  - SPLASH-05
commit_strategy: per_task
must_haves:
  truths:
    - "SplashGate always renders {children} wrapped in <div data-testid='dashboard-wrapper'> (children mount immediately during splash window — SPLASH-05)."
    - "SplashGate consults useUser() + sessionStorage('ember-glass-splash-shown') + useReducedMotion() to compute shouldShowSplash."
    - "When user is truthy, isLoading is false, sessionStorage flag is unset, and ready is false: <Splash> mounts as a sibling overlay."
    - "On Splash.onDone: setReady(true), setShownThisSession(true), AND sessionStorage.setItem('ember-glass-splash-shown', 'true') (try/catch wrapped — incognito graceful no-op)."
    - "Subsequent renders within the same session (sessionStorage flag set) MUST NOT re-mount <Splash> (SPLASH-04)."
    - "Dashboard wrapper applies opacity/transform animation when ready flips true (full-motion: scale 0.97→1 + opacity 0→1 over 600ms; reduced-motion: opacity-only over 200ms, NO transform)."
    - "ClientProviders wraps {children} with <SplashGate> after <OfflineBanner> and before <InstallPrompt>."
    - "forceShow prop bypasses sessionStorage gate (dev-only escape hatch for /debug/design-system-v2 and tests)."
  artifacts:
    - path: app/components/EmberGlass/SplashGate.tsx
      provides: "Orchestrator: useUser() + sessionStorage + useReducedMotion + ready state; mounts {children} sibling + conditional <Splash>"
      exports: ["SplashGate", "SplashGateProps"]
      contains: 'data-testid="dashboard-wrapper"'
    - path: app/components/EmberGlass/__tests__/SplashGate.test.tsx
      provides: "Jest tests with mocked useUser + mocked useReducedMotion + sessionStorage state matrix (8+ tests)"
    - path: app/components/EmberGlass/index.ts
      provides: "Barrel adds SplashGate + SplashGateProps re-exports"
    - path: app/components/ClientProviders.tsx
      provides: "<SplashGate> wraps {children} between <OfflineBanner> and <InstallPrompt>"
      contains: "<SplashGate>{children}</SplashGate>"
  key_links:
    - from: app/components/EmberGlass/SplashGate.tsx
      to: app/components/EmberGlass/Splash.tsx
      via: "<Splash reducedMotion={...} onDone={...} /> (sibling overlay render)"
      pattern: "<Splash"
    - from: app/components/EmberGlass/SplashGate.tsx
      to: lib/hooks/useReducedMotion.ts
      via: "useReducedMotion() hook call"
      pattern: "useReducedMotion"
    - from: app/components/EmberGlass/SplashGate.tsx
      to: "@auth0/nextjs-auth0/client"
      via: "useUser() hook call"
      pattern: "useUser"
    - from: app/components/ClientProviders.tsx
      to: app/components/EmberGlass/SplashGate.tsx
      via: "<SplashGate>{children}</SplashGate>"
      pattern: "SplashGate"
---

<objective>
Ship `<SplashGate>` — the Phase 176 orchestrator that owns ALL integration concerns (Auth0 `useUser()`, `sessionStorage` persistence, `useReducedMotion()` media query, dashboard-wrapper crossfade animation, `ready` lifecycle) — and wire it into `<ClientProviders>` so the splash covers the entire dashboard tree on session entry.

Per CONTEXT.md D-02: "<SplashGate> is the only integration point. The presentational <Splash> does NOT touch sessionStorage, Auth0, or matchMedia."

Per CONTEXT.md D-04: "Mount <SplashGate> inside app/components/ClientProviders.tsx, wrapping {children} directly (after <OfflineBanner>, before <InstallPrompt>)."

Per CONTEXT.md D-05 (SPLASH-05 satisfaction): "<SplashGate> always renders {children} (the dashboard tree), and conditionally renders <Splash> as a sibling overlay. Children mount immediately, so React Suspense, dashboard data hooks, and any useEffect fetches start during the splash window."

Per CONTEXT.md D-09 (SPLASH-04 satisfaction): sessionStorage key `'ember-glass-splash-shown'` literal `'true'` value gates re-renders within a tab.

Output:
- New file `app/components/EmberGlass/SplashGate.tsx` (~80 LOC)
- New file `app/components/EmberGlass/__tests__/SplashGate.test.tsx` (~180 LOC; 8+ tests with mocked Auth0 + sessionStorage matrix)
- Modified `app/components/EmberGlass/index.ts` (append SplashGate + SplashGateProps exports)
- Modified `app/components/ClientProviders.tsx` (single edit: wrap children with `<SplashGate>`)
</objective>

<implements_decisions>
## Truths (Implements Decisions)

This plan explicitly implements the following CONTEXT.md decisions (citations for the decision-coverage gate):

- D-02: `<SplashGate>` is the SOLE integration point — owns Auth0 `useUser()`, `sessionStorage`, `useReducedMotion()`, and the `ready` state.
- D-04: `<SplashGate>` mounted inside `app/components/ClientProviders.tsx`, wrapping `{children}` between `<OfflineBanner>` and `<InstallPrompt>`.
- D-05: Sibling-overlay render strategy — `{children}` always render inside `<div data-testid="dashboard-wrapper">`; `<Splash>` is a sibling, not a parent. Children mount immediately during the splash window (SPLASH-05).
- D-07: `onDone` callback writes `sessionStorage.setItem('ember-glass-splash-shown', 'true')` at phase 3.
- D-08: Trigger predicate: `hydrated && !shownThisSession && !isLoading && !!user && !ready` (all four conditions must hold).
- D-09: sessionStorage key literal `'ember-glass-splash-shown'`, value literal `'true'` (constant `SPLASH_FLAG_KEY`).
- D-10: `isLoading` gate prevents flicker during Auth0 hydration race.
- D-11: `forceShow` prop bypasses sessionStorage gate (used by `/debug/design-system-v2` Replay button per Plan 04 + BYPASS_AUTH dev path).
- D-12: Logout coordination — when `user` becomes `null`, `shouldShowSplash` is false (logged-out state; middleware redirects to Auth0).
- D-16: Dashboard wrapper applies opacity/transform crossfade when `ready` flips true (full-motion: scale 0.97→1 + opacity 0→1 over 600ms).
- D-17: Consumes `useReducedMotion()` hook from `lib/hooks/`; forwards to `<Splash>` AND removes `transform` from dashboard-wrapper transition under reduced-motion.
- D-20: Non-blocking dashboard data fetches — guaranteed by sibling-overlay render (children mount immediately, useEffect fetches start during splash window).
- D-21: No new prefetch logic introduced; relies on existing dashboard data hooks already wired in `{children}`.
- D-29: SplashGate Jest test at `app/components/EmberGlass/__tests__/SplashGate.test.tsx` (9 tests covering full state matrix).
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

@.planning/phases/176-post-auth0-splash-animation/176-01-SUMMARY.md
@.planning/phases/176-post-auth0-splash-animation/176-02-SUMMARY.md

@app/components/ClientProviders.tsx
@app/components/EmberGlass/AmbientBg.tsx
@app/components/EmberGlass/Splash.tsx
@app/components/EmberGlass/__tests__/Sheet.test.tsx
@__tests__/stove/StovePage.test.tsx
@lib/hooks/useReducedMotion.ts

<interfaces>
<!-- Splash API (consumed by SplashGate; from Plan 02): -->

```ts
export interface SplashProps {
  onDone: () => void;
  reducedMotion?: boolean;
}
export function Splash(props: SplashProps): React.ReactElement | null;
```

<!-- useReducedMotion API (from Plan 02): -->

```ts
export function useReducedMotion(): boolean;
```

<!-- @auth0/nextjs-auth0/client useUser shape (from RESEARCH §"useUser() Return Shape (verified)"): -->

```ts
type UseUserReturn = {
  user: User | null | undefined;
  isLoading: boolean;
  error: Error | undefined;
};
import { useUser } from '@auth0/nextjs-auth0/client';
const { user, isLoading } = useUser();
```

<!-- ClientProviders.tsx — relevant section (lines 56-63 currently): -->

```tsx
<CommandPaletteProvider>
  <AxeDevtools />
  <PWAInitializer />
  <OfflineBanner fixed showPendingCount />
  {children}
  <InstallPrompt />
</CommandPaletteProvider>
```

<!-- Auth0 mock pattern (from __tests__/stove/StovePage.test.tsx:20-22, canonical analog): -->

```tsx
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'user-123' } }),
}));
```

<!-- Bundle source: .planning/inbox/ember-glass-design/project/components/splash.jsx:94-108 (AppShell — sibling overlay shape) -->
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true" id="176-03-01">
  <name>Task 1: Create &lt;SplashGate&gt; orchestrator + Jest unit tests with mocked Auth0/sessionStorage matrix</name>
  <files>app/components/EmberGlass/SplashGate.tsx, app/components/EmberGlass/__tests__/SplashGate.test.tsx</files>

  <read_first>
    - .planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md (D-04 mount location; D-05 sibling-overlay rendering; D-08 trigger condition; D-09 session marker; D-10 race; D-11 BYPASS_AUTH; D-12 logout coordination; D-16 dashboard scale-in; D-20 non-blocking fetches; D-29 unit tests)
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"<SplashGate> (orchestrator)" (full block) + §"Verification Mapping" (SPLASH-01/04/05 rows) + §"Component Inventory" (SplashGate row)
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md "app/components/EmberGlass/SplashGate.tsx" pattern block (full code excerpts including SSR-safe hydration + sibling-overlay render) AND "app/components/EmberGlass/__tests__/SplashGate.test.tsx" pattern block (Auth0 mock + 7 test scaffolds)
    - .planning/phases/176-post-auth0-splash-animation/176-RESEARCH.md §"Pattern 1: SSR-Safe sessionStorage Read" + §"Pattern 4: Sibling Overlay (Non-Blocking Children Mount)" + §"Pitfall 1: useUser() discriminated-union destructure trap" + §"Pitfall 5: Stale onDone closure"
    - app/components/EmberGlass/Splash.tsx (Plan 02 output — interface + behavior contract)
    - app/components/EmberGlass/AmbientBg.tsx (canonical 'use client' + JSDoc + inline-style convention; mount-effect convention)
    - __tests__/stove/StovePage.test.tsx lines 1-30 (canonical Auth0 useUser mock pattern)
    - app/components/EmberGlass/__tests__/Sheet.test.tsx (Jest test structure analog: describe blocks + beforeEach mock cleanup + rerender pattern)
    - lib/hooks/useReducedMotion.ts (Plan 02 output — for the import + jest mock target)
  </read_first>

  <behavior>
    Mocked context (`mockUseUser` + `mockUseReducedMotion` jest.fn() instances; sessionStorage cleared in beforeEach):

    - Test 1 — children always rendered inside dashboard-wrapper: render `<SplashGate><div>dashboard content</div></SplashGate>`; assert `getByTestId('dashboard-wrapper')` is in document AND `getByText('dashboard content')` is in document. (Verifies SPLASH-05: children mount immediately so fetches start during splash window.)
    - Test 2 — user truthy + sessionStorage unset + isLoading false → splash mounts: `mockUseUser.mockReturnValue({ user: { sub: 'u1' }, isLoading: false })`; assert `getByTestId('splash-overlay')` in document. (SPLASH-01.)
    - Test 3 — sessionStorage already 'true' → splash does NOT mount: `sessionStorage.setItem('ember-glass-splash-shown', 'true')`; assert `queryByTestId('splash-overlay')` is null. (SPLASH-04.)
    - Test 4 — isLoading true → splash does NOT mount (no flicker): `mockUseUser.mockReturnValue({ user: undefined, isLoading: true })`; assert `queryByTestId('splash-overlay')` is null. (D-10.)
    - Test 5 — user null + isLoading false → splash does NOT mount: `mockUseUser.mockReturnValue({ user: null, isLoading: false, error: new Error('logged out') })`; assert `queryByTestId('splash-overlay')` is null. (Logged-out state; middleware will redirect.)
    - Test 6 — reducedMotion=true → reducedMotion prop forwarded to <Splash>: `mockUseReducedMotion.mockReturnValue(true)`; assert dashboard-wrapper style.transition does NOT include 'transform' (UI-SPEC reduced-motion contract: opacity-only).
    - Test 7 — onDone callback writes sessionStorage and flips ready: render with user/no-flag → splash mounts → simulate Splash calling onDone (use a custom mock <Splash> via jest.mock module, OR use act() + jest.useFakeTimers() to advance the real Splash to t=2100). Verify `sessionStorage.getItem('ember-glass-splash-shown') === 'true'` AFTER onDone fires. Verify dashboard-wrapper style.opacity transitions toward 1 (e.g., the inline style includes `opacity: 1`).
    - Test 8 — forceShow=true bypasses sessionStorage gate: `sessionStorage.setItem('ember-glass-splash-shown', 'true')`; render `<SplashGate forceShow><div /></SplashGate>`; assert `getByTestId('splash-overlay')` in document.
    - Test 9 — incognito sessionStorage failure does NOT crash: stub `sessionStorage.setItem` to throw; render with user/no-flag → splash mounts → onDone fires → assert no throw, splash unmounts cleanly. (Try/catch wrapping per UI-SPEC §"<SplashGate> ... SSR safety".)
  </behavior>

  <action>
Create `app/components/EmberGlass/SplashGate.tsx` per UI-SPEC §"<SplashGate> (orchestrator)" + PATTERNS.md verbatim. Target ~80 LOC.

KEY CONSTANTS (locked):
- sessionStorage key: literal string `'ember-glass-splash-shown'` (per CONTEXT.md D-09).
- sessionStorage value on write: literal string `'true'`.
- Dashboard wrapper data-testid: `'dashboard-wrapper'`.
- Mount location: inside `<ClientProviders>` between `<OfflineBanner>` and `<InstallPrompt>` (Task 2).

JSDoc HEADER + IMPORTS (top of SplashGate.tsx):

```tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { Splash } from './Splash';

const SPLASH_FLAG_KEY = 'ember-glass-splash-shown';

/**
 * SplashGate — Phase 176 (SPLASH-01, SPLASH-04, SPLASH-05)
 *
 * Orchestrator that gates the post-Auth0 splash animation:
 *   1. Reads useUser() from @auth0/nextjs-auth0/client.
 *   2. Reads sessionStorage[SPLASH_FLAG_KEY] to enforce session-once (SPLASH-04).
 *   3. Reads useReducedMotion() to honor prefers-reduced-motion: reduce.
 *   4. Mounts <Splash> as a sibling overlay over {children}, NOT a wrapper —
 *      so {children} mount immediately and dashboard data fetches start during
 *      the splash window (SPLASH-05; D-05 / D-20 / D-21).
 *
 * <Splash> is purely presentational; this orchestrator owns ALL integration
 * concerns. <Splash> never touches sessionStorage / Auth0 / matchMedia.
 *
 * Mount: inside ClientProviders, wrapping {children} between <OfflineBanner>
 * and <InstallPrompt> (CONTEXT.md D-04).
 */

export interface SplashGateProps {
  children: ReactNode;
  /**
   * @internal — for /debug/design-system-v2 visual regression and unit tests only.
   * Bypasses sessionStorage + useUser predicates and forces the splash to render.
   */
  forceShow?: boolean;
}

export function SplashGate({ children, forceShow = false }: SplashGateProps) {
  const { user, isLoading } = useUser();
  const reducedMotion = useReducedMotion();

  const [hydrated, setHydrated] = useState(false);
  const [shownThisSession, setShownThisSession] = useState(false);
  const [ready, setReady] = useState(false);

  // SSR-safe sessionStorage hydration (RESEARCH §"Pattern 1"; UI-SPEC §"<SplashGate> ... SSR safety").
  useEffect(() => {
    setHydrated(true);
    try {
      setShownThisSession(sessionStorage.getItem(SPLASH_FLAG_KEY) === 'true');
    } catch {
      // Incognito or sessionStorage disabled — graceful no-op (splash plays).
    }
  }, []);

  // SPLASH-01 trigger predicate (CONTEXT.md D-08): all four conditions hold OR forceShow.
  const shouldShowSplash =
    forceShow ||
    (hydrated && !shownThisSession && !isLoading && !!user && !ready);

  return (
    <>
      <div
        data-testid="dashboard-wrapper"
        style={{
          opacity: ready ? 1 : 0,
          transform: reducedMotion ? undefined : ready ? 'scale(1)' : 'scale(0.97)',
          transition: reducedMotion
            ? 'opacity .2s linear'
            : 'opacity .6s cubic-bezier(.22,1,.36,1) .1s, transform .7s cubic-bezier(.22,1,.36,1) .1s',
        }}
      >
        {children}
      </div>
      {shouldShowSplash && (
        <Splash
          reducedMotion={reducedMotion}
          onDone={() => {
            setReady(true);
            setShownThisSession(true);
            try {
              sessionStorage.setItem(SPLASH_FLAG_KEY, 'true');
            } catch {
              // Incognito write failure — graceful no-op (splash already played).
            }
          }}
        />
      )}
    </>
  );
}
```

KEY INVARIANTS to verify in code:
- `shouldShowSplash` is a derived boolean, NOT stored in state (deterministic from inputs).
- The `Splash` is a SIBLING of `dashboard-wrapper`, NOT a parent — so `{children}` mount immediately (SPLASH-05).
- Both sessionStorage reads (effect) and writes (onDone) are wrapped in try/catch (incognito graceful no-op per UI-SPEC §"SSR safety").
- The `useUser()` destructuring uses ONLY `{ user, isLoading }` — `error` is intentionally not destructured (RESEARCH Pitfall 1: discriminated-union shape — boolean coercion of `user` handles all branches; no need to inspect `error`).
- The dashboard wrapper's `transform` field is `undefined` (NOT `'none'` and NOT a `'scale(...)'` value) when `reducedMotion === true` — so React doesn't render a `transform` style at all, satisfying SPLASH-03's "NO scale/transform on either layer" rule.

Then create `app/components/EmberGlass/__tests__/SplashGate.test.tsx` with the 9 tests defined in `<behavior>`. Mirror PATTERNS.md scaffold:

```tsx
import { render, act } from '@testing-library/react';
import { SplashGate } from '../SplashGate';

const mockUseUser = jest.fn();
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => mockUseUser(),
}));

const mockUseReducedMotion = jest.fn(() => false);
jest.mock('@/lib/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

describe('SplashGate (EmberGlass orchestrator — Phase 176)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockUseUser.mockReturnValue({ user: { sub: 'u1' }, isLoading: false });
    mockUseReducedMotion.mockReturnValue(false);
  });

  // ... 9 tests covering each behavior in <behavior> ...
});
```

For Test 7 (onDone callback writes sessionStorage), use real timers + act() to advance the Splash state machine to t=2100, OR use a per-test `jest.mock('../Splash', ...)` returning a stub that calls onDone synchronously on mount. Per PATTERNS.md SplashGate test scaffold, no Splash mock is needed — the real Splash can be exercised. Either approach is acceptable; choose the one that keeps the test deterministic and < 1s runtime.

For Test 9 (sessionStorage write throws), use:
```tsx
const original = Storage.prototype.setItem;
Storage.prototype.setItem = jest.fn(() => { throw new Error('quota exceeded'); });
// ... render + onDone trigger ...
Storage.prototype.setItem = original;
```

Per CLAUDE.md rule 5: tests are mandatory.
  </action>

  <verify>
    <automated>npm run test:components -- app/components/EmberGlass/__tests__/SplashGate.test.tsx</automated>
  </verify>

  <acceptance_criteria>
    - File `app/components/EmberGlass/SplashGate.tsx` exists.
    - File `app/components/EmberGlass/__tests__/SplashGate.test.tsx` exists.
    - `grep -q "'use client'" app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -q "export function SplashGate" app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -q "export interface SplashGateProps" app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -q "from '@auth0/nextjs-auth0/client'" app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -q "from '@/lib/hooks/useReducedMotion'" app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -q "from './Splash'" app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -q "'ember-glass-splash-shown'" app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -q 'data-testid="dashboard-wrapper"' app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -c 'try {' app/components/EmberGlass/SplashGate.tsx` returns ≥ 2 (one for read, one for write — both incognito-safe).
    - `grep -q 'sessionStorage.setItem' app/components/EmberGlass/SplashGate.tsx` returns 0.
    - `grep -q 'sessionStorage.getItem' app/components/EmberGlass/SplashGate.tsx` returns 0.
    - All 9 SplashGate tests pass: `npm run test:components -- app/components/EmberGlass/__tests__/SplashGate.test.tsx` exits 0.
    - SplashGate test mocks Auth0: `grep -q "jest.mock('@auth0/nextjs-auth0/client'" app/components/EmberGlass/__tests__/SplashGate.test.tsx` returns 0.
    - SplashGate test mocks useReducedMotion: `grep -q "jest.mock.*useReducedMotion" app/components/EmberGlass/__tests__/SplashGate.test.tsx` returns 0.
  </acceptance_criteria>

  <done>SplashGate.tsx exists with the full orchestrator (Auth0 + sessionStorage + reduced-motion + ready + sibling-overlay render), and 9 unit tests cover the full state matrix (user/loading/no-user/sessionStorage flag/reducedMotion/forceShow/incognito-write-failure).</done>
</task>

<task type="auto" id="176-03-02">
  <name>Task 2: Wire &lt;SplashGate&gt; into ClientProviders + add SplashGate to barrel</name>
  <files>app/components/ClientProviders.tsx, app/components/EmberGlass/index.ts</files>

  <read_first>
    - app/components/ClientProviders.tsx (lines 1-71 currently — full file)
    - app/components/EmberGlass/index.ts (current state after Plan 02 — should have FlameViz + Splash lines)
    - .planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md D-04 (exact mount location)
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md "app/components/ClientProviders.tsx (modify, single-line wiring)" pattern block (before/after diff)
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"Component Inventory" (SplashGate wiring row)
  </read_first>

  <action>
Two file edits — atomic commit.

**Edit 1: `app/components/EmberGlass/index.ts` — append SplashGate exports.**

Final state of the file MUST be:

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
export { SplashGate } from './SplashGate';
export type { SplashGateProps } from './SplashGate';
```

**Edit 2: `app/components/ClientProviders.tsx` — wrap children with `<SplashGate>`.**

First, add the import. Locate the existing import block at the top of the file. Add this line alongside the other component imports (group with other `@/app/components/EmberGlass/*` imports if any, or with the closest neighbor):

```tsx
import { SplashGate } from '@/app/components/EmberGlass';
```

Then locate the existing block (around lines 56-63):

```tsx
<CommandPaletteProvider>
  <AxeDevtools />
  <PWAInitializer />
  <OfflineBanner fixed showPendingCount />
  {children}
  <InstallPrompt />
</CommandPaletteProvider>
```

Modify it to wrap `{children}` with `<SplashGate>`:

```tsx
<CommandPaletteProvider>
  <AxeDevtools />
  <PWAInitializer />
  <OfflineBanner fixed showPendingCount />
  <SplashGate>{children}</SplashGate>
  <InstallPrompt />
</CommandPaletteProvider>
```

This is a SINGLE-LINE EDIT inside the existing CommandPaletteProvider. Do NOT change indentation of surrounding lines. Do NOT touch `<AxeDevtools />`, `<PWAInitializer />`, `<OfflineBanner ... />`, or `<InstallPrompt />`. Do NOT add any other change to ClientProviders.tsx.

VALIDATION: After the edit, the relative ordering MUST be: `<OfflineBanner>` → `<SplashGate>{children}</SplashGate>` → `<InstallPrompt />`. Reordering is forbidden (per CONTEXT.md D-04 lock).

This task does NOT add a new test for ClientProviders — the existing test (if any) plus the SplashGate unit tests already cover SplashGate behavior. The integration smoke is owned by Plan 04 Playwright spec.
  </action>

  <verify>
    <automated>grep -q "^export { SplashGate } from './SplashGate';" app/components/EmberGlass/index.ts &amp;&amp; grep -q "^export type { SplashGateProps } from './SplashGate';" app/components/EmberGlass/index.ts &amp;&amp; grep -q "import { SplashGate } from '@/app/components/EmberGlass';" app/components/ClientProviders.tsx &amp;&amp; grep -q "<SplashGate>{children}</SplashGate>" app/components/ClientProviders.tsx &amp;&amp; npm run test:components -- app/components/EmberGlass/__tests__/SplashGate.test.tsx app/components/EmberGlass/__tests__/Splash.test.tsx app/components/EmberGlass/__tests__/FlameViz.test.tsx</automated>
  </verify>

  <acceptance_criteria>
    - `grep -q "^export { SplashGate } from './SplashGate';" app/components/EmberGlass/index.ts` returns 0.
    - `grep -q "^export type { SplashGateProps } from './SplashGate';" app/components/EmberGlass/index.ts` returns 0.
    - Barrel is now exactly 11 lines (5 from Phase 174/175 + 2 FlameViz + 2 Splash + 2 SplashGate).
    - `grep -q "import { SplashGate } from '@/app/components/EmberGlass';" app/components/ClientProviders.tsx` returns 0.
    - `grep -q "<SplashGate>{children}</SplashGate>" app/components/ClientProviders.tsx` returns 0.
    - The line `<SplashGate>{children}</SplashGate>` appears AFTER `<OfflineBanner` and BEFORE `<InstallPrompt` in `app/components/ClientProviders.tsx` (verify via line numbers: `grep -n 'OfflineBanner\|SplashGate\|InstallPrompt' app/components/ClientProviders.tsx | head -3` shows OfflineBanner < SplashGate < InstallPrompt).
    - The original `{children}` line WITHOUT a SplashGate wrapper is GONE (no bare `{children}` in the CommandPaletteProvider body): `grep -E '^\s*\{children\}\s*$' app/components/ClientProviders.tsx` returns nothing (exit 1).
    - All EmberGlass primitive tests still pass: `npm run test:components -- app/components/EmberGlass/__tests__/SplashGate.test.tsx app/components/EmberGlass/__tests__/Splash.test.tsx app/components/EmberGlass/__tests__/FlameViz.test.tsx` exits 0.
  </acceptance_criteria>

  <done>SplashGate is exported from the EmberGlass barrel AND wired into ClientProviders between OfflineBanner and InstallPrompt. The phase's runtime integration is now complete; downstream Plan 04 will validate end-to-end via Playwright.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser sessionStorage ↔ JS runtime | The orchestrator reads/writes a single literal flag (`'ember-glass-splash-shown'` = `'true'`). No untrusted input crosses this boundary. |
| Auth0 client SDK ↔ React tree | `useUser()` returns a typed shape from `@auth0/nextjs-auth0/client`; the orchestrator only reads `user` (boolean coerced) and `isLoading` (boolean). No claims, tokens, or PII are persisted. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-176-03-01 | Tampering | sessionStorage flag could be set by malicious script to suppress splash on subsequent loads | accept | Splash is a UX flourish, not a security control. Suppression has zero security impact. The flag is per-tab and discarded on tab close. ASVS L1 V8.3.1 (sensitive data classification) — flag is not sensitive. |
| T-176-03-02 | Information Disclosure | sessionStorage write attempt in incognito → exception | mitigate | Both reads and writes wrapped in try/catch; failure path is graceful no-op (splash plays again next time, no console error). Tested by SplashGate Test 9. |
| T-176-03-03 | Spoofing | useUser() could return a forged user object if Auth0Provider is misconfigured | accept | Out of scope: Auth0Provider configuration is outside Phase 176 boundary (locked by v17.0+ wiring in ClientProviders.tsx:51). Phase 176 only consumes the typed return; falsifying it requires compromising the Auth0 SDK itself. |
| T-176-03-04 | Denial of Service | Splash mounting blocks dashboard hydration | mitigate by design | SPLASH-05 contract: <SplashGate> always renders {children} as a sibling of <Splash>. Children mount immediately; Splash is a visual overlay only. Verified by Test 1 + Plan 04 SPLASH-05 Playwright network-capture spec. |
| T-176-03-05 | Tampering / XSS | Italian copy literals embedded in JSX | accept | All copy is hard-coded text node; React escapes by default. No `dangerouslySetInnerHTML`, no props-derived strings rendered. Equivalent to T-176-02-01. |
| T-176-03-06 | Repudiation | sessionStorage write is silent (no telemetry) | accept | Phase 176 explicitly defers telemetry ("splash duration" Web Vital is a v9.0 follow-up per CONTEXT.md `<deferred>`). No audit trail required for a UX flourish. |

ASVS L1 applicable controls:
- V8.3 (browser storage handling): flag is not sensitive; no PII stored. Acceptable.
- V11.1 (input validation): sessionStorage value is a literal string compared to `'true'` — no parsing, no injection vector.
- V14.2 (dependency vulnerabilities): `@auth0/nextjs-auth0 ^4.13.1` already audited via existing project tooling (no new dep added by Phase 176).

No `high` severity threats. Phase explicitly declared minimal threat surface in planning_context (no auth boundary changes, no network, no user input).
</threat_model>

<verification>
After both tasks complete:
1. `npm run test:components -- app/components/EmberGlass/__tests__/SplashGate.test.tsx app/components/EmberGlass/__tests__/Splash.test.tsx app/components/EmberGlass/__tests__/FlameViz.test.tsx` — all 26 tests green (4 FlameViz + 13 Splash + 9 SplashGate).
2. `grep -E '^export.*SplashGate' app/components/EmberGlass/index.ts | wc -l` returns `2` (SplashGate + SplashGateProps).
3. `grep -n 'OfflineBanner\|SplashGate\|InstallPrompt' app/components/ClientProviders.tsx | head -5` shows OfflineBanner line number < SplashGate line number < InstallPrompt line number.
4. SplashGate sessionStorage hygiene: `grep -c 'try {' app/components/EmberGlass/SplashGate.tsx` ≥ 2 (incognito-safe reads + writes).
5. SplashGate sessionStorage key invariant: `grep -q "'ember-glass-splash-shown'" app/components/EmberGlass/SplashGate.tsx` returns 0 (literal appears at the `SPLASH_FLAG_KEY` constant declaration; all subsequent uses reference the constant — ≥1 occurrence is the correct invariant, NOT ≥2).
6. Sibling-overlay render verified by SplashGate Test 1 (children always present in dashboard-wrapper).
</verification>

<success_criteria>
- `<SplashGate>` is importable as `import { SplashGate } from '@/app/components/EmberGlass';`.
- `<SplashGate>` is wired into `<ClientProviders>` between `<OfflineBanner>` and `<InstallPrompt>`.
- On a fresh session with a logged-in user, `<Splash>` renders as a sibling overlay to the dashboard tree (verified by Test 2).
- On a session where sessionStorage flag is already `'true'`, `<Splash>` does NOT render (verified by Test 3 → SPLASH-04).
- `{children}` always render inside `dashboard-wrapper`, regardless of splash state (verified by Test 1 → SPLASH-05).
- Reduced-motion preference forwards to `<Splash>` AND removes `transform` from dashboard-wrapper transition (verified by Test 6 → SPLASH-03).
- sessionStorage write failure (incognito) does not crash (verified by Test 9).
- All 26 EmberGlass primitive tests pass (FlameViz + Splash + SplashGate).
- No regressions in existing ClientProviders behavior (manual smoke; full E2E via Plan 04 Playwright).
</success_criteria>

<output>
After completion, create `.planning/phases/176-post-auth0-splash-animation/176-03-SUMMARY.md` per template. Document: 2 commits (SplashGate + tests; barrel update + ClientProviders wiring); the file ownership boundary between Plans 02 and 03 (both touch index.ts but at different append positions); how Plan 04 will validate the integration end-to-end via Playwright (sign-in → splash visible → splash dismisses → no re-trigger on route change → fetches captured during splash window); any deviations from PATTERNS.md observed during execution.
</output>
