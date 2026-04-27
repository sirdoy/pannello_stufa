# Phase 176: Post-Auth0 Splash Animation - Research

**Researched:** 2026-04-27
**Domain:** Client-side React overlay + Auth0 v4 session gate + reduced-motion + non-blocking React tree mount
**Confidence:** HIGH

## Summary

Phase 176 ports a verbatim ~2.1s splash animation from `splash.jsx` (design bundle) into three new TSX files inside the existing `app/components/EmberGlass/` namespace. The work is mostly mechanical — the CONTEXT.md (D-01..D-29) has already locked component boundaries, mount location, gating rules, animation timer values, reduced-motion strategy, z-index, and test surface. Research focused on **verification, not invention**: confirming `useUser()` shape under the installed `@auth0/nextjs-auth0@^4.13.1`, auditing `app/globals.css` for the keyframes the bundle assumes (`pulse`, `flamePulse`), and mapping the existing Playwright/Jest conventions established by Phases 174 + 175 so the new specs slot in cleanly.

Two concrete codebase findings change the plan shape:

1. **Both `pulse` and `flamePulse` keyframes are missing from `app/globals.css`.** Phase 174 shipped `pulse-ember`, `glow-pulse`, `ambientA/B/C` and ~30 others, but neither the bundle's bottom-status-dot `pulse 1.6s infinite` (splash badge) nor the FlameViz inner-flame `flamePulse 1.8s ease-in-out infinite` exist. Both must be added in this phase or the splash and FlameViz primitive will render statically (badge dot won't pulse, flame body will be still). Bundle assumed they would already exist; CONTEXT.md D-14 hedges ("if a `pulse`/equivalent already exists, reuse" — answer: it does NOT).
2. **`useUser()` from `@auth0/nextjs-auth0@4.13.1` returns a discriminated union of three shapes**, not a flat `{ user, isLoading, error }`. Verified from `node_modules/@auth0/nextjs-auth0/dist/client/hooks/use-user.d.ts`: `{ user: null, isLoading, error: Error, ... } | { user: User, isLoading, error: null, ... } | { user: undefined, isLoading, error: undefined, ... }`. The CONTEXT.md gating predicate `user truthy && !isLoading` works correctly across all three branches because `null` and `undefined` are both falsy. No discriminator switch needed — the predicate is sound as-stated.

**Primary recommendation:** Implement exactly the file plan in CONTEXT.md D-01..D-29. Add two keyframes to `app/globals.css` early (Wave 1 prerequisite). Use the verified `useUser()` truthy-check pattern. Mirror Phase 175's Jest + Playwright conventions character-for-character — they are now project-locked.

## User Constraints (from CONTEXT.md)

> CONTEXT.md is comprehensive (D-01..D-29) and supersedes any contradictory finding in this research. The full text lives at `.planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md`. Locked decisions reproduced here verbatim for downstream agents.

### Locked Decisions (D-01..D-29 — abbreviated reproduction)

**Architecture & namespace (D-01..D-03):**
- Three new files under `app/components/EmberGlass/`:
  - `Splash.tsx` — pure presentational overlay, accepts `onDone` + optional `reducedMotion?: boolean`.
  - `SplashGate.tsx` — `'use client'` orchestrator: reads `useUser()`, sessionStorage, reduced-motion media query.
  - `FlameViz.tsx` — pure presentational, ported verbatim from bundle `cards.jsx:109-129`.
- Update `app/components/EmberGlass/index.ts` barrel: re-export `Splash`, `SplashGate`, `FlameViz`, plus their props types.
- `<Splash>` is dumb (no Auth0/sessionStorage/matchMedia); `<SplashGate>` owns all integration. `<FlameViz>` ships now (Phase 177 StoveCard re-imports). No other v20.0 phase may redefine FlameViz.

**Mount & rendering (D-04..D-07):**
- `<SplashGate>` mounts inside `app/components/ClientProviders.tsx` wrapping `{children}` after `<OfflineBanner>` and before `<InstallPrompt>`. `app/layout.tsx` stays Server Component.
- `<SplashGate>` ALWAYS renders `{children}` (dashboard tree) so React/Suspense fetches start immediately. Splash is a sibling overlay at `position: fixed; inset: 0; z-index: 1000`.
- z-index = **1000** verbatim from bundle. Below legacy `BottomSheet.tsx` (8999), above Phase 175 Sheet stack (200/201). Comment this convention at top of `Splash.tsx`.
- On phase 3 completion: `<Splash>` returns `null`, orchestrator flips `ready` true, sessionStorage flag is written.

**Trigger / gating (D-08..D-12):**
- Splash mounts when ALL: (1) hydrated, (2) `sessionStorage['ember-glass-splash-shown'] !== 'true'`, (3) `useUser()` returns truthy `user` with `isLoading: false`, (4) bypass mode passes through normally.
- `sessionStorage` (per-tab, survives reload, clears on tab close) — key: `ember-glass-splash-shown`, value: `'true'`.
- During `isLoading: true`: render `null` (no flicker, no spinner). The existing `app/loading.tsx` Suspense skeleton covers data-not-ready underneath.
- Bypass mode: `Auth0Provider` initialized with `MOCK_USER` (already wired in `ClientProviders.tsx:28-36`). Splash plays normally — good for dev iteration.
- Logout: natural sessionStorage lifecycle handles it. Optional belt-and-suspenders `removeItem` on logout click (Claude's discretion).

**Animation sequence (D-13..D-16):**
- Phase state machine `phase=0..3` with timer values `t1=600`, `t2=1500`, `t3=2100` (ms). All cleared on unmount.
- Wordmark literal: `Home` (NOT "Pannello Stufa"). Caption literal: `Connessione al gateway…` (U+2026 ellipsis). Badge literal: `Autenticato · Auth0` (U+00B7 middle dot).
- AppShell scale-in: dashboard wrapper `transform: scale(0.97 → 1)`, `opacity: 0 → 1`, `transition: opacity .6s cubic-bezier(.22,1,.36,1) .1s, transform .7s cubic-bezier(.22,1,.36,1) .1s`. `ready` flips at phase 3 (overlaps splash 550ms fade with dashboard 600ms fade-in = the "crossing" SC).

**Reduced-motion (D-17..D-19):**
- Detection: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` + `change` listener in `<SplashGate>`. Inline ~10 LOC `useReducedMotion()` hook (or extract to `lib/hooks/useReducedMotion.ts` — discretion).
- When `reducedMotion === true`: ONE simplified tree, opacity-only, no scale/transform anywhere (splash root, flame, wordmark, badge, dashboard wrapper). Two-phase state: `phase=0` (0–200ms, opacity 1) → `phase=1` (200ms+, opacity 0 → unmount). Single timer at `t=200`.
- Total reduced-motion duration: exactly 200ms.

**Non-blocking fetches (D-20..D-22):**
- Achieved by D-05 rendering strategy. No new prefetch hooks. Existing polling hooks fire on mount during splash window.
- `pointerEvents: 'none'` on splash root once phase 2+ (so taps fall through during fade).

**Token / primitive reuse (D-23..D-26):**
- `var(--accent)`, `var(--text-2)`, `var(--font-display)` for variable values. Hardcoded `#1c1917`, `#0a0908`, `#6aa86a`, `#fff` ONLY where the bundle hardcodes them.
- Do NOT consume `<Pressable>` or `<Sheet>` (splash is non-interactive).
- `<AmbientBg>` keeps running underneath at z-index 0 — no toggling.

**Smoke / verification surface (D-27..D-29):**
- Playwright spec: `tests/smoke/splash.spec.ts` — five tests: SPLASH-01 appears post-Auth0, SPLASH-02 sequence beats, SPLASH-03 reduced-motion collapse, SPLASH-04 no re-trigger on route change, SPLASH-05 fetches during splash. Reuse `collectConsoleErrors` from Phase 97/175 pattern.
- VersionEnforcer overlay handling: planner must address (no working pattern in repo yet — see Risks).
- Jest unit specs: `app/components/EmberGlass/__tests__/Splash.test.tsx`, `SplashGate.test.tsx`, `FlameViz.test.tsx` — colocated per Phase 174/175 convention.

### Claude's Discretion (4 items)

- **`useReducedMotion()` location:** Inline in `SplashGate.tsx` OR extracted to `lib/hooks/useReducedMotion.ts`. **Recommend extract** — Phase 177+ glass cards may want it, and `lib/hooks/` is the established hooks home.
- **`data-testid` attributes:** Add `data-testid="splash-overlay"`, `splash-flame`, `splash-wordmark`, `splash-badge`, `dashboard-wrapper`. **Recommend yes** — SPLASH-02 timeline assertions need stable selectors mid-animation; CSS-class selection is fragile under inline transforms.
- **`pulse` keyframe location:** Add to `app/globals.css` (declarative). Matches existing `flamePulse`/`ambientA-C`/`pulse-ember` convention.
- **`<SplashGate forceShow>` test prop + `/debug/design-system-v2` "Replay splash" button:** **Recommend yes** for visual regression iteration. Bonus, not gated on SC.

### Deferred Ideas (OUT OF SCOPE — do NOT plan tasks for these)

- Apple PWA static splash images (`AppleSplashScreens.tsx`) — separate iOS launch-image plumbing.
- Light-mode splash variant — dark-first per Phase 174.
- Real connection diagnostics during splash (caption is decorative).
- Skip / abort UX, telemetry Web Vital, animated logo morph, light-mode, accent-themed splash.
- Migration of `app/loading.tsx` skeleton — stays as Suspense fallback.
- Reusable `<SessionOnceOverlay>` generalization — wait for second consumer.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPLASH-01 | After successful Auth0 sign-in (or session restore), the app renders a splash screen before mounting the dashboard | Verified `useUser()` discriminated union from installed Auth0 v4.13.1 type defs; truthy-user + `!isLoading` predicate is sound. `<SplashGate>` mount inside `ClientProviders` (after `Auth0Provider`) gives it ancestor context. Bypass-mode `MOCK_USER` (`ClientProviders.tsx:28-36`) plays normally. |
| SPLASH-02 | ~2s sequence: flame logo scale-in → "Home" + "Connessione al gateway…" → "Autenticato · Auth0" badge → fade-out crossing into dashboard scale-in | Bundle `splash.jsx:5-18, 22-91, 94-108` provides verbatim port: timers `t1=600`, `t2=1500`, `t3=2100`; transforms `scale(0.4) → scale(1) → scale(1.08)`; AppShell crossfade `opacity .6s + transform .7s` with `.1s` delay. Italian copy with U+2026 / U+00B7. |
| SPLASH-03 | `prefers-reduced-motion: reduce` → 200ms opacity fade only, no scale/transform on either layer | `window.matchMedia` API confirmed (no SDK needed); pattern is `useEffect` mount + `change` listener for late preference flips. Phase 175 D-15 explicitly deferred reduced-motion to here; we deliver. Two-phase 200ms state machine is unambiguous. |
| SPLASH-04 | In-session route changes never re-trigger splash | `sessionStorage` (per-tab, survives reload, clears on tab close) is exactly the right scope. Flag write at phase 3 → predicate at next mount returns false → splash short-circuits to children-only render. |
| SPLASH-05 | Dashboard first device-data fetches start during splash window (non-blocking) | Achieved by rendering strategy: `<SplashGate>` always renders `{children}` (sibling pattern). React mounts the dashboard immediately; Suspense + `app/loading.tsx` skeleton render behind splash; existing polling hooks (`useStoveData`, `useThermostatData`, etc.) fire `useEffect` on mount. Smoke verifies via Playwright network capture. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Splash overlay paint + animation | Browser / Client | — | Pure visual overlay tied to client React state machine; no server data dependency. `'use client'`. |
| Auth0 session detection | Browser / Client | Frontend Server (SSR) | `useUser()` is client-side SWR over `/auth/profile`. Server already hydrates session via cookie; client reads via hook in `ClientProviders.tsx` (already wired). |
| sessionStorage per-tab gating | Browser / Client | — | sessionStorage is browser-only by definition. Must be SSR-guarded (read inside `useEffect`/event handler, never during render). |
| `prefers-reduced-motion` detection | Browser / Client | — | `window.matchMedia` is browser-only. Must be SSR-guarded; default to `false` during SSR + first render to avoid hydration mismatch. |
| FlameViz primitive (animated gradient) | Browser / Client | — | Pure CSS animation via `flamePulse` keyframe; renders in client components only because consumers (Splash, future StoveCard) are `'use client'`. |
| Dashboard mount during splash | Browser / Client | — | React tree renders behind splash overlay; Suspense + existing polling hooks handle their own data fetches without splash coordination. |

[VERIFIED: codebase grep] All capabilities are client-tier; no API/CDN/Database work in this phase.

## Standard Stack

### Core (already installed — NO new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@auth0/nextjs-auth0` | `^4.13.1` | `useUser()` hook for client-side session detection | [VERIFIED: `package.json:29`] Already wired in `ClientProviders.tsx:51`; project standard. |
| `react` | `^19` | `useState`, `useEffect`, `useRef` for splash state machine | [VERIFIED: codebase] Project standard, React Compiler enabled (Phase 71). |
| `next` | `^15.5` | App Router, `'use client'` directive, font CSS variables | [VERIFIED: codebase] Phase 174 wired Outfit/Inter via `next/font`. |

### NOT Needed (explicitly out — confirms zero new deps)

| Library | Why excluded |
|---------|--------------|
| `@radix-ui/react-dialog` | Splash is non-interactive overlay (no focus trap, no ESC dismiss, no role=dialog needed). Phase 175 Sheet uses Radix; this does not. |
| `framer-motion` / `motion` | Inline-style + CSS keyframes match Phase 174/175 convention. Bundle uses inline transitions verbatim — no animation lib needed. |
| `react-use` / similar reduced-motion hook libraries | A 10-LOC `useReducedMotion()` is cheaper than a dependency. Single consumer. |
| `swr` revalidation customization | `useUser()` already wraps SWR with sensible defaults; no override needed. |

**Installation:** None. `npm install` is a project-blocked command (CLAUDE.md rule 4); confirmed not required. [VERIFIED: `package.json` audit]

**Version verification:** Skipped — only existing deps consumed. The Auth0 v4.13.1 type definition was read directly from `node_modules/@auth0/nextjs-auth0/dist/client/hooks/use-user.d.ts` to lock the `useUser()` return shape (see Pitfall 1).

### `useUser()` Return Shape (verified)

[VERIFIED: `node_modules/@auth0/nextjs-auth0/dist/client/hooks/use-user.d.ts`]

```ts
export declare function useUser(): {
    user: null;
    isLoading: boolean;
    error: Error;
    invalidate: () => Promise<User | undefined>;
} | {
    user: User;
    isLoading: boolean;
    error: null;
    invalidate: () => Promise<User | undefined>;
} | {
    user: undefined;
    isLoading: boolean;
    error: undefined;
    invalidate: () => Promise<User | undefined>;
};
```

**Implication for SplashGate:**

```ts
const { user, isLoading } = useUser();
// CONTEXT.md D-08 predicate works directly:
const authReady = !isLoading && !!user;
// `user` can be User | null | undefined — boolean coercion handles all three branches.
// No type narrowing needed; we only need the predicate truth value.
```

### Bypass Mode Behavior

[VERIFIED: `app/components/ClientProviders.tsx:28-36, 51`]

When `NEXT_PUBLIC_BYPASS_AUTH=true`, `Auth0Provider user={MOCK_USER}` is the SWR initial fallback. `useUser()` returns the second-branch shape (`{ user: User, isLoading: false, error: null, ... }`) on first render — splash plays without delay. Confirmed at `lib/auth0.ts:77-81` server-side and `ClientProviders.tsx:51` client-side.

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ app/layout.tsx (Server Component)                                │
│   <html data-ambient="?">  ← inline pre-paint script             │
│   <body>                                                         │
│     <AmbientBg/>     ← z-index: 0  (Phase 174)                   │
│     <ClientProviders>     'use client'                           │
│       <Auth0Provider user={MOCK_USER?}>                          │
│         <…other providers…>                                      │
│           <OfflineBanner/>                                       │
│           ┌─────────────────────────────────────────────────┐    │
│           │ <SplashGate>     'use client'  (NEW)            │    │
│           │   reads useUser(), sessionStorage, matchMedia   │    │
│           │   ┌────────────────────────────────────────┐    │    │
│           │   │ dashboard-wrapper div                  │    │    │
│           │   │   transform/opacity transition         │    │    │
│           │   │   {children}  ← Navbar/main/Footer     │    │    │
│           │   │     • app/page.tsx + Suspense          │    │    │
│           │   │     • polling hooks fire on mount ─────┼────┼─→ /api/* (during splash)
│           │   └────────────────────────────────────────┘    │    │
│           │   ┌────────────────────────────────────────┐    │    │
│           │   │ <Splash>     z-index: 1000  (NEW)      │    │    │
│           │   │   phase 0 → 1 → 2 → 3 (timers)         │    │    │
│           │   │   <FlameViz on intensity={0.95}/>  (NEW)│   │    │
│           │   │   wordmark, caption, badge             │    │    │
│           │   │   onDone() → SplashGate.setReady(true) │    │    │
│           │   └────────────────────────────────────────┘    │    │
│           └─────────────────────────────────────────────────┘    │
│           <InstallPrompt/>                                       │
└──────────────────────────────────────────────────────────────────┘

  State machine (full-motion):                Reduced-motion branch:
    t=0    phase=0  flame at scale(0.4)         t=0   phase=0  full opacity tree
    t=600  phase=1  flame scale(1) + text         (no transform on anything)
    t=1500 phase=2  fade-out (550ms)            t=200 phase=1  opacity → 0
    t=2100 phase=3  unmount + onDone()                  unmount + onDone()
```

### Component Responsibilities

| File | Responsibility | LOC est. |
|------|---------------|----------|
| `app/components/EmberGlass/Splash.tsx` | Pure presentational overlay. Owns timers + phase state. Renders flame/wordmark/caption/badge or reduced-motion variant. Calls `onDone` at unmount. | ~120 |
| `app/components/EmberGlass/SplashGate.tsx` | Reads `useUser()`, sessionStorage, reduced-motion. Decides `shouldShowSplash`. Wraps `{children}` in dashboard-wrapper (with crossfade transform/opacity tied to `ready` state). Renders `<Splash>` overlay or returns children-only after dismissal. Writes sessionStorage flag at phase 3. | ~80 |
| `app/components/EmberGlass/FlameViz.tsx` | Pure presentational primitive. Two stacked gradient divs with `flamePulse` animation. `on: boolean`, `intensity?: number = 0.6` props. | ~30 |
| `app/components/EmberGlass/index.ts` | Add `Splash`, `SplashGate`, `FlameViz` re-exports + `SplashProps`, `SplashGateProps`, `FlameVizProps` types. | +6 lines |
| `app/components/ClientProviders.tsx` | Single edit: wrap `{children}` with `<SplashGate>`. | +2 lines |
| `app/globals.css` | Add `@keyframes pulse` and `@keyframes flamePulse` (both currently MISSING). | ~20 lines |
| `lib/hooks/useReducedMotion.ts` | (Discretion: extract) `~10 LOC` hook returning boolean from `matchMedia('(prefers-reduced-motion: reduce)').matches` + change listener. SSR-safe (returns false during SSR/first render). | ~20 |
| `app/components/EmberGlass/__tests__/Splash.test.tsx` | Phase state machine timer tests (`jest.useFakeTimers`); reduced-motion branch tree assertion; `onDone` called at t=2100; cleanup. | ~150 |
| `app/components/EmberGlass/__tests__/SplashGate.test.tsx` | sessionStorage flag respected; `useUser()` mocked across all four cases (loading, no user, user, bypass); reduced-motion mocked → prop pass-through; sessionStorage written at `onDone`; `ready` flip enables children fade-in. | ~180 |
| `app/components/EmberGlass/__tests__/FlameViz.test.tsx` | `on={true}` adds glow box-shadow + animation; `on={false}` removes them; `intensity` scales body+tip heights. | ~60 |
| `tests/smoke/splash.spec.ts` | 5 specs: SPLASH-01 appearance post-auth, SPLASH-02 sequence beats, SPLASH-03 reduced-motion collapse, SPLASH-04 no re-trigger on nav, SPLASH-05 fetches during splash. | ~200 |

### Recommended Project Structure

```
app/components/EmberGlass/
├── AmbientBg.tsx                  (existing, Phase 174)
├── Pressable.tsx                  (existing, Phase 175)
├── Sheet.tsx                      (existing, Phase 175)
├── Splash.tsx                     ★ NEW
├── SplashGate.tsx                 ★ NEW
├── FlameViz.tsx                   ★ NEW
├── index.ts                       (existing, +3 exports)
└── __tests__/
    ├── AmbientBg.test.tsx         (existing)
    ├── Pressable.test.tsx         (existing)
    ├── Sheet.test.tsx             (existing)
    ├── Splash.test.tsx            ★ NEW
    ├── SplashGate.test.tsx        ★ NEW
    └── FlameViz.test.tsx          ★ NEW

lib/hooks/
└── useReducedMotion.ts            ★ NEW (Claude's discretion: extract)

tests/smoke/
└── splash.spec.ts                 ★ NEW

app/components/ClientProviders.tsx  (modify: wrap {children} in <SplashGate>)
app/globals.css                    (modify: add @keyframes pulse + flamePulse)
```

### Pattern 1: SSR-Safe sessionStorage Read

[CITED: MDN Web Storage; project Phase 174 AmbientBg.tsx pattern at line 23-27]

```ts
// SplashGate.tsx — guard sessionStorage access
const [hydrated, setHydrated] = useState(false);
const [shownThisSession, setShownThisSession] = useState(false);

useEffect(() => {
  // Runs only on client after hydration. SSR pass uses initial state.
  setHydrated(true);
  try {
    setShownThisSession(sessionStorage.getItem('ember-glass-splash-shown') === 'true');
  } catch {
    // Incognito or sessionStorage disabled — graceful no-op (splash plays).
  }
}, []);

const shouldShowSplash = hydrated && !shownThisSession && !isLoading && !!user && !ready;
```

The `hydrated` guard is the same pattern AmbientBg.tsx uses (line 24: `if (typeof document === 'undefined') return false`); the explicit two-state approach here separates "have we hydrated" from "what did sessionStorage say" so we can distinguish "splash not yet decided" from "splash already shown" on first render.

### Pattern 2: SSR-Safe matchMedia Detection

[CITED: MDN Window.matchMedia; verified API shape]

```ts
// lib/hooks/useReducedMotion.ts (or inline in SplashGate.tsx)
'use client';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false); // SSR-safe default

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Modern browsers: addEventListener('change', ...). Safari <14 used addListener
    // (deprecated). Project targets evergreen browsers per Next.js 15 baseline; addEventListener is fine.
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
```

The `useState(false)` SSR default means: during SSR + first client render, full-motion is assumed. After hydration's `useEffect`, the real value is read and the splash re-renders with the correct branch. **For a 200ms reduced-motion fade vs 2100ms full-motion, this single re-render at t≈0ms is acceptable** — both branches are functionally `null` at the very first paint (phase 0 has flame at opacity 0 in full-motion; reduced has flame at opacity 1 already, so worst case is one frame of "fade-in starts immediately" instead of "starts already visible"). Verified non-issue.

### Pattern 3: Phase State Machine With Cleanup

[CITED: bundle `splash.jsx:12-17` (verbatim port) + React `useEffect` cleanup contract]

```ts
// Splash.tsx — full-motion branch
useEffect(() => {
  if (reducedMotion) return; // separate branch handles its own timer
  const t1 = setTimeout(() => setPhase(1), 600);
  const t2 = setTimeout(() => setPhase(2), 1500);
  const t3 = setTimeout(() => {
    setPhase(3);
    onDone?.();
  }, 2100);
  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
  };
}, [reducedMotion, onDone]);
```

The cleanup is critical for two reasons: (1) React 18 strict-mode double-mount in dev — without cleanup, two timer chains fire and `onDone` is called twice; (2) unmount during animation (e.g., user navigates away mid-splash) leaves dangling timers that call `setPhase` on an unmounted component. **`onDone` must be stable** — wrap in `useCallback` at the call site (`SplashGate.tsx`) or accept the re-mount cost. Phase 175 Sheet.tsx uses the same lockedScrollY ref pattern (line 46) for similar reasons.

### Pattern 4: Sibling Overlay (Non-Blocking Children Mount)

[CITED: bundle `splash.jsx:94-108` AppShell verbatim port]

```tsx
// SplashGate.tsx — render shape
return (
  <>
    <div
      data-testid="dashboard-wrapper"
      style={{
        opacity: ready ? 1 : 0,
        transform: reducedMotion
          ? undefined
          : ready ? 'scale(1)' : 'scale(0.97)',
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
          try { sessionStorage.setItem('ember-glass-splash-shown', 'true'); } catch {}
        }}
      />
    )}
  </>
);
```

The wrapper div is ALWAYS mounted with `{children}` inside, satisfying SPLASH-05. `ready` flips at `onDone`, kicking off the 600ms scale-in that overlaps the splash's 550ms fade-out (the "crossing" SC).

### Anti-Patterns to Avoid

- **Conditional `{children}` rendering** (e.g., `{ready && children}` or `<Suspense fallback={<Splash/>}>`). Violates SPLASH-05: dashboard tree would not mount during splash window. Children must mount immediately.
- **Wrapping splash in Radix Dialog / focus trap.** Splash is non-interactive — zero accessibility benefit, adds focus-trap surprise + ESC-to-dismiss UX users do not want.
- **Reading sessionStorage during render** (e.g., `useState(() => sessionStorage.getItem(...))`). SSR will throw `ReferenceError: sessionStorage is not defined`. Always inside `useEffect` or event handler.
- **Reading `matchMedia` during render.** Same SSR issue. Always inside `useEffect`.
- **Hardcoding `Math.random()` keys, datestamps, or `Date.now()` in render.** Hydration mismatch. Splash has no need for these — flagged proactively.
- **`localStorage` instead of `sessionStorage` for the splash flag.** Persists across tab close, breaks "splash plays once per session" intent.
- **Timer cleanup omission.** React 18 strict-mode double-mount fires `onDone` twice → sessionStorage write race + `ready` set twice. Always `clearTimeout` in cleanup.
- **Calling `onDone` synchronously inside `setPhase` callback.** State update batching may execute `onDone` before the parent has the new ref. Project React 19 + Compiler — `onDone?.()` after `setPhase(3)` in same tick is fine (verified by bundle's identical pattern).
- **Using Tailwind classes for the splash visual values.** Bundle uses inline styles for timing-critical animation values (transitions are precise to 10ms); Phase 174/175 EmberGlass convention is inline style. Stay consistent.
- **Accent-coloring the green status dot (`#6aa86a`).** It's a literal "auth OK" semaphore color, not theme accent — bundle line 83. Keep verbatim.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session detection | Custom `/api/auth/profile` fetch | `useUser()` from `@auth0/nextjs-auth0/client` | Already wired in `ClientProviders.tsx:51`; SWR-revalidated; bypass-mode-aware. [VERIFIED: codebase] |
| Reduced-motion media query subscription | Custom event listener tangle | The 10-LOC `useReducedMotion()` hook (Pattern 2) | Single source of truth, SSR-safe, future Phase 177+ can re-import. |
| Z-index policy | Inventing new tier | z-index: 1000 verbatim from bundle | Already balanced against Phase 175 Sheet (200/201) and legacy BottomSheet (8999). [VERIFIED: bundle + 175-CONTEXT.md D-13] |
| Splash skip / dismiss UX | Adding skip button + escape handler | Nothing — splash is non-interactive | SC-#2 ~2s wall time is fast enough; CONTEXT.md "Specifics" line 211 explicitly forbids. |
| Italian copy editing | Translating "Connecting to gateway…" | Use literal `Connessione al gateway…` (U+2026) and `Autenticato · Auth0` (U+00B7) | Locked by SC-#2 + CONTEXT.md D-15. |
| Real-vs-mock Auth0 fork in `<SplashGate>` | Branching on `BYPASS_AUTH` env | Trust `useUser()` to return mock user identically in bypass mode | `Auth0Provider user={MOCK_USER}` already short-circuits via SWR fallback. No special case needed. [VERIFIED: `ClientProviders.tsx:28-51`] |
| `pulse` keyframe | Inventing yet another pulse animation in inline styles | Add `@keyframes pulse` to `app/globals.css` (declarative, mirrors `pulse-ember`/`flamePulse` convention) | Phase 174 D-12 / `globals.css:347-355` established the convention. [VERIFIED: globals.css grep] |
| FlameViz primitive | Inlining the gradient + animation in StoveCard later | Define `<FlameViz>` here once; Phase 177 imports it | CONTEXT.md D-03: "No other v20.0 phase is allowed to redefine FlameViz." |

**Key insight:** This phase is overwhelmingly a **port** — the design bundle's `splash.jsx` and `cards.jsx::FlameViz` are the source of truth. Custom code surfaces only in (a) the SSR-guarded sessionStorage/matchMedia plumbing inside `<SplashGate>` and (b) the small dispatch logic for the reduced-motion branch. Everything else is verbatim port + token substitution.

## Common Pitfalls

### Pitfall 1: `useUser()` discriminated-union destructure trap
**What goes wrong:** TypeScript may infer `user` as `User | null | undefined` after destructure, and a careless `if (user)` followed by `user.email` is fine — but `if (user !== null)` would NOT narrow `undefined` away.
**Why it happens:** The Auth0 v4 hook returns three union branches, not a single optional shape.
**How to avoid:** Use truthy boolean coercion (`!!user`) or `if (user)` — both correctly narrow across all three branches. Avoid `=== null` or `=== undefined` checks; they leave a sibling case unhandled.
**Warning signs:** TS errors like "Object is possibly 'undefined'" inside an `if (user !== null)` block.

### Pitfall 2: `flamePulse` keyframe missing — silent visual regression
**What goes wrong:** FlameViz renders but the inner-flame and tip never animate. Splash looks dead-still even in full-motion mode.
**Why it happens:** Bundle assumes `@keyframes flamePulse` is defined globally (cards.jsx line 120, 126: `animation: on ? 'flamePulse 1.8s ...' : 'none'`). Phase 174 did NOT add it. [VERIFIED: `globals.css` grep — only `ambientA/B/C`, `pulse-ember`, `glow-pulse`, `shimmer`, etc.; NO `flamePulse`, NO `pulse`].
**How to avoid:** Add both keyframes in this phase. Suggested definitions (research-derived from bundle visual intent):
```css
/* For Splash status-dot — a soft radial pulse */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.4); opacity: 0.6; }
}
/* For FlameViz inner flame body + tip — gentle scale flicker */
@keyframes flamePulse {
  0%, 100% { transform: translateX(-50%) scaleY(1); }
  50%      { transform: translateX(-50%) scaleY(1.06); }
}
```
**Warning signs:** Static green dot in splash badge; static flame body in FlameViz; no console errors (CSS animation-name without keyframe just no-ops). Catch with a Jest assertion that computed `animation-name` matches.

### Pitfall 3: SSR `sessionStorage`/`window.matchMedia` ReferenceError
**What goes wrong:** Build crashes during static rendering, or hydration mismatch warning floods console.
**Why it happens:** Both APIs are browser-only. Touching them in render or `useState` initializer runs during SSR.
**How to avoid:** Always inside `useEffect` or event handler. Default state to a SSR-safe value. Phase 174 AmbientBg.tsx pattern (line 24) is `if (typeof document === 'undefined') return false` — adopt the same shape OR use the `hydrated` flag in Pattern 1.
**Warning signs:** "ReferenceError: sessionStorage is not defined" during build; "Hydration failed because the initial UI does not match what was rendered on the server" in browser console.

### Pitfall 4: React 18 Strict-Mode double-mount fires timers twice
**What goes wrong:** In dev, `useEffect` runs twice. Without cleanup, three timers become six, `onDone` is called twice, sessionStorage is written twice (idempotent so it survives), but `setReady(true)` is called twice (idempotent in this case, also survives). Still, dev users see glitchy behavior.
**Why it happens:** React 18+ strict-mode intentionally double-invokes effects to surface cleanup bugs.
**How to avoid:** Always return `clearTimeout` cleanup. The bundle's `splash.jsx:16` already does this; preserve the pattern. Verify in Jest with `jest.useFakeTimers()` + assertion that timers are cleared on unmount.
**Warning signs:** `onDone` called >1 in unit tests; jittery animation on dev hot-reload.

### Pitfall 5: Stale `onDone` closure
**What goes wrong:** `<SplashGate>` re-renders (maybe ready toggled), passes a new `onDone`, but the inner `setTimeout` captured the old one.
**Why it happens:** `useEffect` ran on mount, captured `onDone` in closure. New renders update the prop but not the captured reference.
**How to avoid:** Either (a) include `onDone` in the dep array (causes effect re-run if parent doesn't memoize — fine if `<SplashGate>` defines `onDone` once with `useCallback`), or (b) put `onDone` in a `ref` and call `onDoneRef.current?.()` from the timer.
**Warning signs:** Splash never calls `onDone` even after t=2100; or calls a stale callback.
**Recommendation:** Wrap `onDone` in `useCallback` at the `<SplashGate>` site (it's defined inline anyway — make it stable):
```ts
const handleDone = useCallback(() => {
  setReady(true);
  try { sessionStorage.setItem('ember-glass-splash-shown', 'true'); } catch {}
}, []);
```

### Pitfall 6: VersionEnforcer overlay blocks Playwright
**What goes wrong:** Phase 175 plan 03 explicitly noted the Playwright runtime is blocked by a pre-existing `VersionEnforcer` overlay that intercepts clicks and shows a "new version available" banner mid-test. Phase 175 specs were AUTHORED but not RUN at merge time. Phase 176 splash spec faces the same blocker.
**Why it happens:** `<VersionEnforcer/>` is mounted in `app/layout.tsx:71` and queries a version endpoint. In test env it may return mismatched values.
**How to avoid:** Three options for the spec — pick one in the plan:
  1. **Mock the version endpoint** — add `page.route('**/api/version*', route => route.fulfill({ json: { version: <expected> } }))` before goto. Cleanest, no production code change.
  2. **Dismiss the overlay** in a beforeEach — locate the close button (if any) and click it.
  3. **Gate VersionEnforcer behind an env flag** — invasive, requires production code change. Avoid.
**Warning signs:** Playwright test sees an unexpected overlay covering the splash, splash assertions fail with "element is not visible" or "intercepted click".
**Recommendation:** Option 1 (route-mock). [ASSUMED: the version endpoint shape — planner should confirm by reading `VersionEnforcer.tsx` and the matching API route.]

### Pitfall 7: Hot-module reload preserves sessionStorage → splash never replays in dev
**What goes wrong:** Dev iterating on splash visuals sees splash once, then never again until they `sessionStorage.clear()` manually.
**Why it happens:** sessionStorage survives HMR.
**How to avoid:** Implement the discretion-recommended `<SplashGate forceShow>` test prop AND the `/debug/design-system-v2` "Replay splash" button (clears the flag + remounts the gate via key change). Adds zero UX cost in production.
**Warning signs:** Dev complains "splash only plays once per browser tab".

### Pitfall 8: Italian special characters mangled in source files
**What goes wrong:** `Connessione al gateway…` becomes `Connessione al gateway???` or `Connessione al gateway...` (three dots) on copy-paste through bad encoding.
**Why it happens:** U+2026 (`…`) and U+00B7 (`·`) are non-ASCII; some editors / clipboard pipelines transcode.
**How to avoid:** Verify literals in code review. CONTEXT.md "Specifics" line 205 calls this out explicitly.
**Warning signs:** Visible difference in rendered glyph width; literal three-period sequence in source.

## Code Examples

### Example 1: FlameViz primitive (verbatim port)

```tsx
// app/components/EmberGlass/FlameViz.tsx
// Source: .planning/inbox/ember-glass-design/project/components/cards.jsx:109-129 (verbatim)
'use client';

export interface FlameVizProps {
  on: boolean;
  intensity?: number;
}

export function FlameViz({ on, intensity = 0.6 }: FlameVizProps): React.ReactElement {
  return (
    <div
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
          background:
            'radial-gradient(ellipse at 50% 80%, color-mix(in oklab, var(--accent) 80%, white) 0%, var(--accent) 40%, color-mix(in oklab, var(--accent) 60%, #6a1a00) 90%)',
          filter: 'blur(0.5px)',
          boxShadow: on
            ? '0 0 40px color-mix(in oklab, var(--accent) 70%, transparent), 0 0 80px color-mix(in oklab, var(--accent) 40%, transparent)'
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
          background: 'radial-gradient(ellipse at 50% 90%, #fff5c0 0%, #ffd27a 50%, transparent 75%)',
          animation: on ? 'flamePulse 1.4s ease-in-out infinite alternate' : 'none',
        }}
      />
    </div>
  );
}
```

### Example 2: Splash phase state machine (full + reduced branches)

```tsx
// app/components/EmberGlass/Splash.tsx
'use client';
/**
 * Z-INDEX CONVENTION: 1000 (above Phase 175 Sheet stack at 200/201, below legacy
 * BottomSheet at 8999). Bundle splash.jsx:23. Downstream phases 178-181 must
 * keep in-session UI below this layer.
 *
 * Source: .planning/inbox/ember-glass-design/project/components/splash.jsx:1-91 (verbatim port).
 */
import { useEffect, useState } from 'react';
import { FlameViz } from './FlameViz';

export interface SplashProps {
  onDone?: () => void;
  reducedMotion?: boolean;
}

export function Splash({ onDone, reducedMotion = false }: SplashProps): React.ReactElement | null {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => {
        setPhase(1);
        onDone?.();
      }, 200);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => {
      setPhase(3);
      onDone?.();
    }, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [reducedMotion, onDone]);

  // Reduced-motion: phase 1 = unmount.
  // Full-motion:    phase 3 = unmount.
  if (reducedMotion ? phase === 1 : phase === 3) return null;

  // ... render full or reduced tree based on `reducedMotion`.
  // Full tree: per bundle splash.jsx:22-89 verbatim, with `flame` opacity/transform tied to phase.
  // Reduced tree: same DOM but no scale/transform on any layer; opacity-only transition.
}
```

### Example 3: SplashGate orchestrator skeleton

```tsx
// app/components/EmberGlass/SplashGate.tsx
'use client';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { Splash } from './Splash';

const SESSION_KEY = 'ember-glass-splash-shown';

export interface SplashGateProps {
  children: ReactNode;
  forceShow?: boolean; // dev/debug: bypass sessionStorage flag for replay
}

export function SplashGate({ children, forceShow = false }: SplashGateProps): React.ReactElement {
  const { user, isLoading } = useUser();
  const reducedMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [alreadyShown, setAlreadyShown] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      setAlreadyShown(sessionStorage.getItem(SESSION_KEY) === 'true');
    } catch { /* incognito — no-op */ }
  }, []);

  const handleDone = useCallback(() => {
    setReady(true);
    try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch {}
  }, []);

  const shouldShow = hydrated && !ready && (forceShow || (!alreadyShown && !isLoading && !!user));

  // If we already know the splash will not render (e.g., re-entered after dismiss),
  // skip the wrapper transition and render children directly to avoid an unnecessary
  // opacity-0 → opacity-1 fade on every nav.
  if (hydrated && (alreadyShown || ready) && !forceShow) {
    return <>{children}</>;
  }

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
      {shouldShow && <Splash reducedMotion={reducedMotion} onDone={handleDone} />}
    </>
  );
}
```

### Example 4: Jest fake-timer pattern for splash state machine

```tsx
// app/components/EmberGlass/__tests__/Splash.test.tsx
import { act, render } from '@testing-library/react';
import { Splash } from '../Splash';

describe('Splash', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('full-motion sequence: phase 0 → 1 at 600ms → 2 at 1500ms → onDone at 2100ms', () => {
    const onDone = jest.fn();
    const { container } = render(<Splash onDone={onDone} />);
    expect(container.querySelector('[data-testid="splash-overlay"]')).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(599); });
    expect(onDone).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(1); }); // t=600 → phase 1
    // assert wordmark/caption opacity 1 by reading rendered styles or testid presence

    act(() => { jest.advanceTimersByTime(900); }); // t=1500 → phase 2
    // assert root opacity transition to 0

    act(() => { jest.advanceTimersByTime(600); }); // t=2100 → phase 3 + onDone
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="splash-overlay"]')).not.toBeInTheDocument();
  });

  it('reduced-motion: single 200ms fade, onDone at t=200', () => {
    const onDone = jest.fn();
    render(<Splash onDone={onDone} reducedMotion />);
    act(() => { jest.advanceTimersByTime(199); });
    expect(onDone).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(1); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('clears timers on unmount (no late onDone)', () => {
    const onDone = jest.fn();
    const { unmount } = render(<Splash onDone={onDone} />);
    unmount();
    act(() => { jest.advanceTimersByTime(3000); });
    expect(onDone).not.toHaveBeenCalled();
  });
});
```

### Example 5: Playwright SPLASH-05 fetch-during-splash assertion

```ts
// tests/smoke/splash.spec.ts (excerpt)
test('SPLASH-05 — device API request fires while splash is visible', async ({ page }) => {
  const apiHits: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (/\/api\/(stove|thermostat|lights|network|sonos|dirigera|raspi)\b/.test(url)) {
      apiHits.push(url);
    }
  });

  // Mock VersionEnforcer endpoint to prevent overlay blocker (Pitfall 6)
  await page.route('**/api/version', (r) => r.fulfill({ json: { version: 'test' } }));

  await page.goto('/');
  // Splash should be visible briefly
  const splash = page.getByTestId('splash-overlay');
  await expect(splash).toBeVisible({ timeout: 1000 });

  // While splash still visible, at least one polling-hook request should have fired
  await page.waitForFunction(() => true, { timeout: 800 });
  const hitsBeforeUnmount = apiHits.length;
  expect(hitsBeforeUnmount).toBeGreaterThan(0);

  await expect(splash).toBeHidden({ timeout: 2500 });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-paint native splash via blocking `<script>` | Client-mounted overlay sibling to React tree | This phase | Allows React/Suspense fetches to start during splash window (SC-#5). |
| Auth0 v3 `useUser()` flat shape `{ user, error, isLoading }` | Auth0 v4.13 discriminated union with `invalidate()` method | Auth0 v4 release (2024) | Truthy coerce works across all branches; no destructure regression. [VERIFIED: type defs] |
| Conditional `{children}` rendering during splash | Always-mounted children + sibling overlay | This phase | Non-blocking fetches; no hydration repaint. |
| `:active` CSS pseudo for press feel | Pointer-event-driven JS `usePressed()` (Phase 175) | Phase 175 | Touch-device reliability; not consumed by splash but reaffirms inline-style convention. |

**Deprecated/outdated:**
- React `MediaQueryList.addListener` / `removeListener` (deprecated in favor of `addEventListener('change', ...)`). Project targets evergreen browsers; safe to use modern API only.

## Environment Availability

> Phase has no external service/runtime dependencies beyond what is already installed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@auth0/nextjs-auth0` | `useUser()` in SplashGate | ✓ | `^4.13.1` | — |
| `react` / `react-dom` | All components | ✓ | `^19` | — |
| `next` | App Router, fonts, build | ✓ | `^15.5` | — |
| Jest + jsdom | Unit tests | ✓ | per `jest.config.ts` | — |
| Playwright | E2E smoke (`tests/smoke/splash.spec.ts`) | ✓ | per `playwright.config.ts` | — |
| Real Auth0 test user | SPLASH-01 sign-in via `signIn` helper | ✓ | `tests/helpers/auth.helpers.ts` + `tests/.auth/user.json` storageState | — |
| `sessionStorage` (browser API) | Per-tab gating | ✓ (browser) | — | Try/catch wraps writes; incognito with sessionStorage disabled → splash plays every nav (graceful degradation). |
| `window.matchMedia` (browser API) | Reduced-motion detection | ✓ (browser) | — | SSR default = `false` (full-motion); first `useEffect` corrects after hydration. |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None; all browser-API edge cases handled in code.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | Jest `^29` with jsdom + `@testing-library/react` (per `jest.config.ts`) |
| E2E framework | Playwright `^1.x` (per `playwright.config.ts`) — single `chromium` project + `setup` for real Auth0 storage state |
| Unit config | `jest.config.ts` — testMatch `**/__tests__/**/*.[jt]s?(x)` |
| E2E config | `playwright.config.ts` — testDir `./tests`, `webServer: npm run dev`, baseURL `http://localhost:3000` |
| Quick run command (changed) | `npm run test:changed` |
| Quick run (component subset) | `npm run test:components` (resolves to `__tests__/app/components` — note: EmberGlass tests live IN `app/components/EmberGlass/__tests__/` and are picked up by the `**/__tests__/**` glob, NOT `test:components` script. Verify pickup path with planner.) |
| Full suite command (release-only, NEVER from agents per CLAUDE.md rule 8) | `npm test` |
| E2E run | `npx playwright test tests/smoke/splash.spec.ts` |

> **CLAUDE.md rule 8 reminder:** PLAN.md `<verify><automated>` blocks MUST use scoped subsets — `npm test -- app/components/EmberGlass/__tests__/Splash.test.tsx` (etc.), `npm run test:changed`, or `npm run test:quick`. Bare `npm test` is forbidden.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPLASH-01 | Splash appears post-Auth0 sign-in / session restore | E2E | `npx playwright test tests/smoke/splash.spec.ts -g "SPLASH-01"` | ❌ Wave 0 |
| SPLASH-02 | ~2s sequence beats (flame scale, wordmark, caption, badge, fade) | unit + E2E | `npm test -- app/components/EmberGlass/__tests__/Splash.test.tsx` AND `npx playwright test -g "SPLASH-02"` | ❌ Wave 0 |
| SPLASH-03 | Reduced-motion 200ms opacity-only fade | unit + E2E | `npm test -- app/components/EmberGlass/__tests__/Splash.test.tsx -t "reduced"` AND `npx playwright test -g "SPLASH-03"` | ❌ Wave 0 |
| SPLASH-04 | No re-trigger on in-session route change | unit + E2E | `npm test -- app/components/EmberGlass/__tests__/SplashGate.test.tsx -t "session"` AND `npx playwright test -g "SPLASH-04"` | ❌ Wave 0 |
| SPLASH-05 | Device fetches start during splash window | E2E only (network capture) | `npx playwright test -g "SPLASH-05"` | ❌ Wave 0 |
| (SC-secondary) | FlameViz primitive renders correctly | unit | `npm test -- app/components/EmberGlass/__tests__/FlameViz.test.tsx` | ❌ Wave 0 |
| (SC-secondary) | SplashGate sessionStorage flag respected | unit | `npm test -- app/components/EmberGlass/__tests__/SplashGate.test.tsx` | ❌ Wave 0 |
| (SC-secondary) | Zero console errors during splash window | E2E | `collectConsoleErrors` helper (in spec file, no separate command) | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:changed -- --bail`
- **Per wave merge:** `npm test -- app/components/EmberGlass/__tests__/` (scoped Jest run for the namespace) + `npx playwright test tests/smoke/splash.spec.ts` (full splash spec)
- **Phase gate:** Same scoped commands above must be green before `/gsd-verify-work`. Full `npm test` runs in CI only.

### Wave 0 Gaps

- [ ] `app/components/EmberGlass/__tests__/Splash.test.tsx` — covers SPLASH-02 (sequence), SPLASH-03 (reduced-motion).
- [ ] `app/components/EmberGlass/__tests__/SplashGate.test.tsx` — covers SPLASH-01 (predicate), SPLASH-04 (sessionStorage).
- [ ] `app/components/EmberGlass/__tests__/FlameViz.test.tsx` — covers FlameViz primitive contract.
- [ ] `tests/smoke/splash.spec.ts` — covers SPLASH-01..SPLASH-05 end-to-end (5 specs).
- [ ] (No Jest config edits needed — testMatch glob already picks up `app/components/EmberGlass/__tests__/`.)
- [ ] (No Playwright config edits needed — `testDir: './tests'` already includes `tests/smoke/`.)

**Conftest / fixtures:** None new. Existing patterns:
- `collectConsoleErrors` helper is **inlined** in `tests/smoke/page-loads.spec.ts:7-20` — copy the same shape into `splash.spec.ts` (or extract to `tests/helpers/console-errors.ts` if planner wants to dedupe).
- Real-Auth0 sign-in helper at `tests/helpers/auth.helpers.ts:21-42` (`signIn(page, email, password)`) plus `storageState: 'tests/.auth/user.json'` configured in the chromium project (sets up cached session). Splash spec can either:
  - Use the cached storageState (default in chromium project) — splash WILL replay because sessionStorage is per-tab, but the user IS authenticated → splash plays for SPLASH-01 cleanly.
  - Or `test.use({ storageState: { cookies: [], origins: [] } })` to force a fresh sign-in (slower; only needed if the spec specifically wants to assert the post-sign-in moment).
- VersionEnforcer mock route is NOT yet a shared helper. Add `await page.route('**/api/version', r => r.fulfill({ json: { version: 'test' } }))` in `beforeEach` of the splash spec.

## Test Strategy (combined)

### Jest Unit Layer (3 specs)

**`Splash.test.tsx`:**
- `jest.useFakeTimers()` + `jest.advanceTimersByTime()` for the four phase boundaries.
- Assert phase-tagged DOM via `data-testid` attributes (`splash-overlay`, `splash-flame`, `splash-wordmark`, `splash-badge`).
- Reduced-motion branch: assert NO `transform: scale(...)` on splash root or flame across ALL sample timestamps; only `opacity` transitions.
- Cleanup: unmount mid-animation; advance timers; assert `onDone` not called.
- Strict-mode safety: optional second-mount test that asserts `onDone` called exactly once.

**`SplashGate.test.tsx`:**
- Mock `useUser` from `@auth0/nextjs-auth0/client` (jest auto-mock or `jest.mock('@auth0/nextjs-auth0/client', () => ({ useUser: jest.fn() }))`).
  - Branch 1: `{ user: null, isLoading: false, error: new Error() }` → no splash.
  - Branch 2: `{ user: undefined, isLoading: true, error: undefined }` → no splash (loading).
  - Branch 3: `{ user: <valid>, isLoading: false, error: null }` → splash mounts.
- Mock `window.matchMedia` (jsdom does NOT polyfill it — must add stub):
  ```ts
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((q) => ({
      matches: q === '(prefers-reduced-motion: reduce)' ? false : false,
      media: q, onchange: null,
      addEventListener: jest.fn(), removeEventListener: jest.fn(),
      addListener: jest.fn(), removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  ```
  This stub may already exist in `jest.setup.ts` — planner should grep before re-adding.
- sessionStorage flag: pre-set `'true'` → splash never mounts; unset → splash mounts.
- After splash `onDone`: assert `sessionStorage.getItem(SESSION_KEY) === 'true'` and `dashboard-wrapper` has `opacity: 1` style.
- Children render assertion: stub a sentinel child `<div data-testid="child-sentinel"/>` and assert it is in the document EVEN WHILE the splash is visible (proves SC-#5 mount-during-splash).

**`FlameViz.test.tsx`:**
- `on={true}`: assert inline style includes `boxShadow` substring `color-mix` AND `animation` matches `flamePulse 1.8s ease-in-out infinite`.
- `on={false}`: assert `boxShadow: 'none'` and `animation: 'none'`.
- `intensity={0.95}`: outer body `height === 64 * (0.5 + 0.95 * 0.5)` ≈ 62.4; tip `height === 40 * 0.975` = 39.
- `intensity={0.3}`: confirm linear scaling.

### Playwright E2E Layer (5 specs in `tests/smoke/splash.spec.ts`)

**Pattern reuse:**
- `collectConsoleErrors(page)` — inline helper from `page-loads.spec.ts:7-20`.
- `signIn(page, ...)` from `tests/helpers/auth.helpers.ts` for SPLASH-01 (or rely on cached storageState; see below).
- `await page.route('**/api/version', r => r.fulfill({ json: { version: 'test' } }))` in `beforeEach` to dodge VersionEnforcer.

**Spec outlines:**

1. **`SPLASH-01 splash appears post-Auth0`**
   - Use cached storageState (chromium project default). On `await page.goto('/')`, splash should be visible inside 1s (already authenticated).
   - Assertions: `getByTestId('splash-overlay')` visible within 1000ms; disappears within 2500ms.

2. **`SPLASH-02 sequence beats`**
   - Sample DOM at t≈100ms, ≈800ms, ≈1700ms, ≈2200ms via `page.waitForTimeout` + `page.evaluate(getComputedStyle)`.
   - Assertions: at t=100, flame computed `transform.match(/matrix\((0\.4|0.4)/)` (scale 0.4); at t=800, scale ≈ 1; at t=1700, splash root `opacity < 1`; at t=2200, splash unmounted.
   - Tradeoff: timing-based assertions are flake-prone in CI. Mitigation: use generous tolerances (e.g., t=800 → assert "scale > 0.95" not "scale === 1"); rely on data-testid presence/absence over precise transform matrices where possible.

3. **`SPLASH-03 reduced-motion collapse`**
   - `test.use({ contextOptions: { reducedMotion: 'reduce' } })` (Playwright API).
   - Assert at t=100ms, splash flame `transform === 'none'` (no scale); at t=250ms, splash unmounted.

4. **`SPLASH-04 no re-trigger on route change`**
   - Wait for splash to dismiss (storage flag now 'true').
   - Click in-app nav link to `/rooms` (Stanze) → assert splash never re-mounts.
   - Navigate to `/automations` → assert same.
   - Navigate back to `/` → assert same.

5. **`SPLASH-05 fetches start during splash`**
   - Network listener on `page.on('request')` filtering for `/api/(stove|thermostat|lights|network|sonos|dirigera|raspi)\b`.
   - Assert at least 1 hit BEFORE splash unmount event.
   - Acceptable matcher (any one device API).

**Console-error gate:** Wrap each spec body in `collectConsoleErrors(page)` and assert `errors` is empty after the test action — same shape as Phase 174/175 specs.

**Storage state caveat:** sessionStorage is NOT preserved by Playwright's `storageState` (only cookies + localStorage). So on every fresh chromium context, sessionStorage is empty → splash plays. That's exactly what SPLASH-01..03 want. SPLASH-04 explicitly waits for the flag to be set within the test session, then asserts no re-mount. No special teardown required.

## Risks & Pitfalls

(Detailed pitfalls in the **Common Pitfalls** section above. This is the executive risk register.)

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | `flamePulse` keyframe missing → static FlameViz | HIGH (verified absent) | HIGH (visual regression) | Add `@keyframes flamePulse` to `app/globals.css` in Wave 1 (FlameViz task prerequisite). |
| R2 | `pulse` keyframe missing → static badge dot | HIGH (verified absent) | MEDIUM (subtle UX miss) | Add `@keyframes pulse` to `app/globals.css` alongside `flamePulse`. |
| R3 | VersionEnforcer overlay blocks Playwright | HIGH (Phase 175 hit it) | HIGH (E2E can't run) | `page.route('**/api/version', ...)` mock in `beforeEach`. Document fallback if route name differs. |
| R4 | jsdom missing `matchMedia` polyfill → SplashGate test crashes | MEDIUM | MEDIUM | Stub `window.matchMedia` in spec setup (or in `jest.setup.ts` if not already). Check existing setup file first. |
| R5 | React 18+ Strict-mode double-mount fires `onDone` twice | MEDIUM | LOW (idempotent ops) | Always `clearTimeout` in cleanup; `useCallback`-wrap `onDone`; Jest unmount test asserts no late call. |
| R6 | `storageState` chromium project authenticates → SPLASH-01 finds user already logged in (no fresh sign-in to assert) | LOW | LOW | Acceptable for SPLASH-01 (the spec asserts splash on session-restore landing, which is what cached storageState gives us). For a "first-ever sign-in" assertion, override with `test.use({ storageState: { cookies: [], origins: [] } })` and call `signIn`. |
| R7 | Hydration mismatch from sessionStorage/matchMedia read in initial state | MEDIUM | HIGH (Next.js will warn loudly + flicker) | Both reads are inside `useEffect`; `useState` defaults are SSR-safe (false). Pattern verified in Phase 174 AmbientBg.tsx:24. |
| R8 | Italian U+2026 / U+00B7 chars mangled on save | LOW | MEDIUM (visible glyph diff) | Verify in code review. Consider explicit `'…'` / `'·'` escapes if editor is suspect. |
| R9 | Splash plays during dev HMR every save → annoying | MEDIUM | LOW (dev-only) | Implement `forceShow` prop + `/debug/design-system-v2` "Replay splash" button (recommended discretion item) for opt-in dev UX. |
| R10 | `onDone` stale closure | LOW | MEDIUM | Wrap in `useCallback([])` at SplashGate; deps include `onDone` in Splash useEffect. |
| R11 | `<SplashGate>` mount inside `<Auth0Provider>` ordering — if tree rearranged later, `useUser()` would throw | LOW | HIGH | Add a TS test or a runtime guard? The actual `useUser()` throws an error if no provider, surfacing immediately. Document the ordering invariant in a comment at the top of `SplashGate.tsx`. |

## Recommended File Breakdown (planner-ready)

### CREATE (8 new files)

| File | Type | Purpose | Approx LOC |
|------|------|---------|-----------|
| `app/components/EmberGlass/Splash.tsx` | component | Phase state machine + presentational overlay | 120 |
| `app/components/EmberGlass/SplashGate.tsx` | component | Auth/sessionStorage/reduced-motion orchestrator | 80 |
| `app/components/EmberGlass/FlameViz.tsx` | component | Verbatim port of bundle FlameViz | 35 |
| `lib/hooks/useReducedMotion.ts` | hook | SSR-safe reduced-motion detection | 25 |
| `app/components/EmberGlass/__tests__/Splash.test.tsx` | unit test | State-machine + reduced-motion + cleanup | 150 |
| `app/components/EmberGlass/__tests__/SplashGate.test.tsx` | unit test | Auth/sessionStorage/matchMedia branches + children mount | 180 |
| `app/components/EmberGlass/__tests__/FlameViz.test.tsx` | unit test | Props → style/animation contract | 60 |
| `tests/smoke/splash.spec.ts` | E2E test | SPLASH-01..05 | 200 |

### MODIFY (3 existing files)

| File | Change | Approx delta |
|------|--------|-------------|
| `app/components/ClientProviders.tsx` | Wrap `{children}` with `<SplashGate>` (after `<OfflineBanner>`, before `<InstallPrompt>`). Add import. | +3 lines |
| `app/components/EmberGlass/index.ts` | Export `Splash`, `SplashGate`, `FlameViz` + their props types. | +6 lines |
| `app/globals.css` | Add `@keyframes pulse` and `@keyframes flamePulse` (both currently missing). Place near existing `@keyframes ambientA/B/C` block (~line 347) for keyframe-locality. | +20 lines |

### NOT TOUCHED (verify by audit)

- `app/layout.tsx` — Server Component; splash logic stays in Client tier.
- `app/page.tsx` — splash sits over the whole tree, not coupled to dashboard route.
- `app/loading.tsx` — Suspense fallback unchanged; renders behind splash.
- `app/components/Navbar.tsx` — no splash-coordination signal needed.
- Any device hook (`useStoveData`, etc.) — splash is non-blocking, hooks fire normally.
- Any API route — pure client-tier feature.
- `package.json` — zero new deps.

### Optional (Claude's discretion)

- `app/debug/design-system-v2/page.tsx` — Add "Replay splash" button (clears sessionStorage + key-remounts SplashGate). ~10 LOC. **Strong recommend** — dev UX win.
- `tests/helpers/console-errors.ts` — Extract `collectConsoleErrors` from inlined copies in `page-loads.spec.ts` and the new splash spec. Mild refactor; only do if planner already touches the helper.

## Project Constraints (from CLAUDE.md)

| Directive | Where it applies in Phase 176 |
|-----------|-------------------------------|
| Rule 1: NEVER break existing functionality | `<SplashGate>` is purely additive; it always renders `{children}`. The existing dashboard tree is untouched in mount path. Smoke tests must verify Navbar / dashboard / settings / rooms / automations all still render (Phase 97 page-loads spec coverage already exists). |
| Rule 2: WAIT for user confirmation before version updates | No new deps; no version bumps. |
| Rule 3: PREFER editing existing files over creating new | The splash is a new feature surface — three new component files are unavoidable. We DO modify `ClientProviders.tsx`, `index.ts`, `globals.css` rather than wrapping at a new boundary. |
| Rule 4: NEVER execute `npm run build` or `npm install` | Confirmed — zero new deps; Next.js dev server (`npm run dev`) is already running per Playwright config. |
| Rule 5: ALWAYS create/update unit tests | Three new Jest specs colocated in `app/components/EmberGlass/__tests__/`. |
| Rule 6: USE design system → `/debug/design-system` | Discretionary `/debug/design-system-v2` "Replay splash" button. Keeps splash demoable. |
| Rule 7: NEVER commit/push without explicit request | Plan tasks must use the `<commit>` block; `commit_docs: true` in config means the planner can auto-commit per existing GSD conventions. |
| Rule 8: USE scoped test subsets in verification | All `<verify><automated>` blocks in PLAN.md MUST use scoped Jest commands (`npm test -- <path>`, `npm run test:changed`, etc.) and explicit Playwright spec paths. NEVER bare `npm test`. |
| Pattern: `'use client'` for state-bearing components | All three new components start with `'use client'`. |
| Pattern: variant props only on UI components | N/A — no `<Heading>`/`<Button>` etc. in splash; pure presentational. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `pulse` and `flamePulse` keyframe definitions proposed (Pitfall 2) match the bundle's intended visual feel | Pitfalls / Code Examples | Visual subtlety only — animation will play but tuning may differ from bundle's mental model. Tweakable in code review. |
| A2 | VersionEnforcer mock-route shape `**/api/version` returning `{ version: 'test' }` will satisfy the overlay | Risks / Test Strategy | If endpoint name or response shape differs, overlay fires anyway → Playwright fails. Planner should grep `app/components/VersionEnforcer.tsx` to confirm. |
| A3 | `jest.setup.ts` (or equivalent) MAY already polyfill `window.matchMedia` for jsdom | Test Strategy | If absent, SplashGate jest tests crash on `matchMedia is not a function`. Planner should grep before deciding to add stub locally vs globally. |
| A4 | Playwright `contextOptions: { reducedMotion: 'reduce' }` is supported in the current Playwright version | Test Strategy | Supported since Playwright 1.18 (2021); project is on `^1.x` per recent test files. Considered safe assumption. |
| A5 | Storage state `tests/.auth/user.json` has a valid Auth0 session at test runtime | Test Strategy | If expired, SPLASH-01 spec fails at goto. Setup project (`tests/auth.setup.ts`) refreshes it; assumed working per existing Phase 51 + Phase 97 pattern. |

**Note:** No `[ASSUMED]` claims about user-locked decisions — all CONTEXT.md decisions are reproduced as-is.

## Open Questions

1. **Is `useReducedMotion()` extracted to `lib/hooks/` or kept inline?**
   - What we know: CONTEXT.md flags it as Claude's discretion; only consumer in this phase is SplashGate.
   - What's unclear: Phase 177+ may want it, but cannot guarantee at this point.
   - Recommendation: **Extract.** `lib/hooks/useReducedMotion.ts` is 20 LOC, future-proofs Phase 177-181 polish work, and matches the project's `lib/hooks/` convention (e.g., `useAdaptivePolling`, `useNetworkQuality`).

2. **Should `<SplashGate>` accept a `forceShow` prop in production code?**
   - What we know: enables dev "Replay splash" UX without touching sessionStorage logic.
   - What's unclear: small API surface increase; not strictly needed for SC.
   - Recommendation: **Yes** — `forceShow?: boolean` defaulting to `false`. Zero production-runtime cost.

3. **Should the `data-testid` attributes ship in production?**
   - What we know: Playwright needs them for SPLASH-02 timeline assertions.
   - What's unclear: project does not have a strict "no test attrs in prod" rule (verified — `data-testid` appears in shipped Phase 174/175 components).
   - Recommendation: **Ship them.** Trivial bytes; consistent with existing convention.

4. **Will the `tests/smoke/splash.spec.ts` use cached storageState or fresh `signIn`?**
   - What we know: cached storageState is faster + matches "session-restore" path.
   - What's unclear: SPLASH-01 wording "after successful Auth0 sign-in (or session restore)" — both are valid.
   - Recommendation: **Cached storageState** for the 5 specs. Add ONE additional spec under `tests/features/` (or a clearly-named test) that exercises the FRESH-sign-in path via `signIn(page, ...)` if planner deems coverage needed; otherwise skip.

## Sources

### Primary (HIGH confidence)
- `node_modules/@auth0/nextjs-auth0/dist/client/hooks/use-user.d.ts` — `useUser()` discriminated union shape; verified directly in installed package.
- `package.json` — `@auth0/nextjs-auth0@^4.13.1`, no other splash-relevant deps.
- `app/components/ClientProviders.tsx:28-71` — Auth0Provider mock-user wiring + provider ordering.
- `app/components/EmberGlass/AmbientBg.tsx:23-96` — namespace + inline-style + SSR-guard convention.
- `app/components/EmberGlass/Pressable.tsx`, `Sheet.tsx` — Phase 175 inline-style + `forwardRef` + `data-testid` convention.
- `app/globals.css` (full file via grep) — confirmed missing `pulse` and `flamePulse` keyframes.
- `app/layout.tsx:35-83` — Server Component + AmbientBg + ClientProviders mount.
- `app/loading.tsx:1-54` — Suspense skeleton co-existence with splash.
- `lib/auth0.ts:1-122` — server-side Auth0 client + BYPASS_AUTH MOCK_SESSION.
- `playwright.config.ts:1-48` — single-project + storageState wiring.
- `tests/smoke/sheet-primitive.spec.ts`, `press-primitive.spec.ts`, `auth-flows.spec.ts`, `page-loads.spec.ts` — Phase 174/175 spec conventions; `collectConsoleErrors` helper shape.
- `tests/helpers/auth.helpers.ts:21-52` — Phase 51 real-Auth0 sign-in helper.
- `.planning/inbox/ember-glass-design/project/components/splash.jsx` (full file) — bundle source of truth for animation.
- `.planning/inbox/ember-glass-design/project/components/cards.jsx:109-129` — bundle source of truth for FlameViz.
- `.planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md` (full file) — locked decisions D-01..D-29.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` — z-index policy, VersionEnforcer blocker, deferred reduced-motion.
- `.planning/REQUIREMENTS.md:32-36` — SPLASH-01..SPLASH-05 acceptance criteria.
- `.planning/ROADMAP.md:84-95` — Phase 176 goal + 5 success criteria.

### Secondary (MEDIUM confidence)
- MDN `Window.matchMedia` documentation — `addEventListener('change', ...)` API contract (`addListener` deprecated). Cross-verified with React community convention.
- MDN `Web Storage API` — `sessionStorage` per-tab semantics; survives reload, clears on tab close.
- Playwright `contextOptions.reducedMotion` — documented since v1.18, project on `^1.x`.

### Tertiary (LOW confidence)
- (None — every claim in this research is grounded in either installed code, project files, or the bundle.)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — installed deps verified; no new packages.
- Architecture: HIGH — CONTEXT.md fully locks shape; bundle is verbatim port.
- Pitfalls: HIGH — keyframe absence verified by grep; Auth0 union verified by type defs; VersionEnforcer blocker confirmed by Phase 175 history.
- Test strategy: MEDIUM-HIGH — Jest + Playwright conventions copied from Phase 174/175 specs; one open question on storageState choice (recommended cached).
- VersionEnforcer mock route shape: MEDIUM — assumed `**/api/version` endpoint; planner should grep `VersionEnforcer.tsx` to confirm.

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days; nothing fast-moving in scope — Auth0 v4 is stable, Next.js 15 stable, project conventions locked through Phase 175).
