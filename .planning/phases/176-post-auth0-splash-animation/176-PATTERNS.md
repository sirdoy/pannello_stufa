# Phase 176: Post-Auth0 Splash Animation - Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 11 (5 new prod + 1 hook + 2 modified + 3 unit tests + 1 smoke spec)
**Analogs found:** 11 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/components/EmberGlass/Splash.tsx` (new) | component (presentational primitive) | event-driven (timer state machine) | bundle `splash.jsx:1-91` + `app/components/EmberGlass/AmbientBg.tsx` | exact (bundle verbatim) |
| `app/components/EmberGlass/SplashGate.tsx` (new) | component (orchestrator / provider) | request-response (auth gate + sessionStorage) | bundle `splash.jsx:94-108` (AppShell) + `app/components/EmberGlass/AmbientBg.tsx` (event-driven mount/effect convention) | role-match |
| `app/components/EmberGlass/FlameViz.tsx` (new) | component (presentational primitive) | (none — pure render) | bundle `cards.jsx:109-129` + `app/components/EmberGlass/AmbientBg.tsx` (inline-style convention) | exact (bundle verbatim) |
| `lib/hooks/useReducedMotion.ts` (new) | utility (client hook) | event-driven (matchMedia change listener) | `lib/hooks/useVisibility.ts` | exact (visibilitychange ↔ matchMedia change is the same SSR-guarded mount-effect shape) |
| `app/components/EmberGlass/index.ts` (modify) | config (barrel re-export) | (none) | existing `app/components/EmberGlass/index.ts` lines 1-5 | exact |
| `app/components/ClientProviders.tsx` (modify) | config (provider wiring, single insertion) | (none) | existing `<OfflineBanner>` / `{children}` / `<InstallPrompt>` block at lines 60-62 | exact |
| `app/globals.css` (modify) | config (CSS keyframes append) | (none) | existing `@keyframes ambientA/B/C` block at lines 346-358 | exact |
| `app/components/EmberGlass/__tests__/Splash.test.tsx` (new) | test (Jest/RTL unit) | event-driven (fake timers) | `app/components/EmberGlass/__tests__/Sheet.test.tsx` (rendering / behavior tests) + `Pressable.test.tsx` (inline-style assertions) | exact |
| `app/components/EmberGlass/__tests__/SplashGate.test.tsx` (new) | test (Jest/RTL unit with mocked Auth0) | request-response (mocked useUser + sessionStorage) | `__tests__/stove/StovePage.test.tsx:20-22` (`jest.mock('@auth0/nextjs-auth0/client', ...)`) + `Sheet.test.tsx` (rerender pattern) + `AmbientBg.test.tsx` (event-driven re-render) | role-match (Auth0 mock pattern is the load-bearing reuse) |
| `app/components/EmberGlass/__tests__/FlameViz.test.tsx` (new) | test (Jest/RTL pure-presentational) | (none) | `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` (presentational render-and-assert) + `Pressable.test.tsx` lines 37-44 (inline-style assertion shape) | exact |
| `tests/smoke/splash.spec.ts` (new) | test (Playwright smoke) | event-driven (timer assertions, network capture) | `tests/smoke/sheet-primitive.spec.ts` (waitForFunction-on-getComputedStyle pattern) + `tests/smoke/page-loads.spec.ts:1-20` (`collectConsoleErrors`) + `tests/smoke/auth-flows.spec.ts` (real-Auth0 sign-in via `signIn()` helper) | exact (combine all three) |

---

## Pattern Assignments

### `app/components/EmberGlass/Splash.tsx` (component, event-driven)

**Primary analog:** `.planning/inbox/ember-glass-design/project/components/splash.jsx` lines 1-91 (bundle, port verbatim)
**Secondary analog:** `app/components/EmberGlass/AmbientBg.tsx` (TS port conventions: `'use client'`, file-top JSDoc with bundle source, `React.ReactElement | null` return, inline `style={...}` with `// AUDIT-EXCEPTION` comments)

**`'use client'` + JSDoc header pattern** (from `AmbientBg.tsx:1-22`):

```tsx
'use client';

import { useEffect, useState } from 'react';

/**
 * Splash — Phase 176 (SPLASH-01..05)
 *
 * Z-INDEX RESERVATION: 1000 (lifted verbatim from bundle splash.jsx:23).
 * Phases 178-181 in-session UI MUST stay below 1000.
 *
 * Bundle source (PRIMARY visual + behavior contract):
 *   .planning/inbox/ember-glass-design/project/components/splash.jsx:1-91
 *
 * AUDIT-EXCEPTION (DS-02): #1c1917→#0a0908 splash gradient, #fff wordmark,
 * #6aa86a status dot are intentional non-token literals (UI-SPEC §Color).
 */
export function Splash(props: SplashProps): React.ReactElement | null {
```

**Phase state machine + cleanup pattern** (port verbatim from bundle `splash.jsx:5-17`):

```tsx
const [phase, setPhase] = useState(0);
useEffect(() => {
  if (reducedMotion) return; // separate branch handles its own timer
  const t1 = setTimeout(() => setPhase(1), 600);
  const t2 = setTimeout(() => setPhase(2), 1500);
  const t3 = setTimeout(() => { setPhase(3); onDone(); }, 2100);
  return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
}, [reducedMotion, onDone]);

if (phase === 3) return null;
```

**Inline-style + AUDIT-EXCEPTION pattern** (from `AmbientBg.tsx:42-95`, applied to bundle `splash.jsx:22-89`):

```tsx
return (
  <div
    data-testid="splash-overlay"
    aria-hidden="true"
    style={{
      position: 'fixed', // AUDIT-EXCEPTION: deliberate divergence from bundle's 'absolute' (UI-SPEC §Position resolution)
      inset: 0,
      zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1c1917 0%, #0a0908 70%)', // AUDIT-EXCEPTION (DS-02): bundle splash.jsx:25
      opacity: phase >= 2 ? 0 : 1,
      transition: 'opacity .55s cubic-bezier(.4,0,.2,1)',
      pointerEvents: phase >= 2 ? 'none' : 'auto',
    }}
  >
```

**Reduced-motion separate timer branch** (D-17..D-19, mirror full-motion shape):

```tsx
useEffect(() => {
  if (!reducedMotion) return;
  const t = setTimeout(() => { setPhase(1); onDone(); }, 200);
  return () => clearTimeout(t);
}, [reducedMotion, onDone]);
```

---

### `app/components/EmberGlass/SplashGate.tsx` (component, orchestrator)

**Primary analog:** `app/components/EmberGlass/AmbientBg.tsx` (provider/orchestrator pattern: `'use client'`, mounted from `app/layout.tsx`/`ClientProviders.tsx`, owns its own client effects)
**Secondary analog:** bundle `splash.jsx:94-108` (AppShell — sibling overlay shape) + `__tests__/stove/StovePage.test.tsx:20-22` (consumed `useUser` shape)

**SSR-safe sessionStorage hydration pattern** (RESEARCH §Pattern 1, mirrors `AmbientBg.tsx:23-38` two-state effect convention):

```tsx
'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { Splash } from './Splash';

const SPLASH_FLAG_KEY = 'ember-glass-splash-shown';

export interface SplashGateProps {
  children: ReactNode;
  /** @internal — for /debug/design-system-v2 visual regression only. */
  forceShow?: boolean;
}

export function SplashGate({ children, forceShow = false }: SplashGateProps) {
  const { user, isLoading } = useUser();
  const reducedMotion = useReducedMotion();

  const [hydrated, setHydrated] = useState(false);
  const [shownThisSession, setShownThisSession] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      setShownThisSession(sessionStorage.getItem(SPLASH_FLAG_KEY) === 'true');
    } catch {
      // Incognito or sessionStorage disabled — graceful no-op (splash plays).
    }
  }, []);

  const shouldShowSplash = forceShow ||
    (hydrated && !shownThisSession && !isLoading && !!user && !ready);
```

**Sibling overlay render pattern** (port from bundle `splash.jsx:94-108`):

```tsx
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
          try { sessionStorage.setItem(SPLASH_FLAG_KEY, 'true'); } catch {}
        }}
      />
    )}
  </>
);
```

**`useUser` integration** (verified from RESEARCH; `Navbar.tsx:138-167` shows the project's "fetch on mount" convention but for the splash we use the SDK hook directly — the discriminated union is handled by truthy-check):

```tsx
const { user, isLoading } = useUser();
const authReady = !isLoading && !!user;
// `user` can be User | null | undefined — boolean coercion handles all three branches.
```

---

### `app/components/EmberGlass/FlameViz.tsx` (component, pure presentational)

**Primary analog:** `.planning/inbox/ember-glass-design/project/components/cards.jsx:109-129` (bundle, port verbatim)
**Secondary analog:** `app/components/EmberGlass/AmbientBg.tsx` (inline-style + AUDIT-EXCEPTION convention)

**Pure-presentational TS port pattern** (bundle `cards.jsx:109-129` → TS):

```tsx
'use client';

/**
 * FlameViz — Phase 176 (DS-03)
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:109-129
 *
 * Phase 176 ships ONLY the primitive + splash usage (D-03).
 * Phase 177 will additionally import it from <StoveCard>.
 * No other v20.0 phase may redefine FlameViz.
 *
 * AUDIT-EXCEPTION (DS-02): #6a1a00 mix-target, #fff5c0/#ffd27a tip gradient
 * are intentional non-token literals (UI-SPEC §Color, bundle cards.jsx:117, 125).
 */

export interface FlameVizProps {
  on: boolean;
  /** Default 0.6. Splash uses 0.95. Stovecard (Phase 177) will pass dynamic stove power. */
  intensity?: number;
}

export function FlameViz({ on, intensity = 0.6 }: FlameVizProps): React.ReactElement {
  return (
    <div
      data-flame-viz="true"
      style={{
        width: 64, height: 80, position: 'relative',
        opacity: on ? 1 : 0.25,
        transition: 'opacity .4s',
      }}
    >
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 48, height: 64 * (0.5 + intensity * 0.5),
        borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
        background: `radial-gradient(ellipse at 50% 80%, color-mix(in oklab, var(--accent) 80%, white) 0%, var(--accent) 40%, color-mix(in oklab, var(--accent) 60%, #6a1a00) 90%)`, // AUDIT-EXCEPTION (DS-02): bundle cards.jsx:117
        filter: 'blur(0.5px)',
        boxShadow: on
          ? `0 0 40px color-mix(in oklab, var(--accent) 70%, transparent), 0 0 80px color-mix(in oklab, var(--accent) 40%, transparent)`
          : 'none',
        animation: on ? 'flamePulse 1.8s ease-in-out infinite' : 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
        width: 28, height: 40 * (0.5 + intensity * 0.5),
        borderRadius: '50% 50% 40% 40%',
        background: `radial-gradient(ellipse at 50% 90%, #fff5c0 0%, #ffd27a 50%, transparent 75%)`, // AUDIT-EXCEPTION (DS-02): bundle cards.jsx:125
        animation: on ? 'flamePulse 1.4s ease-in-out infinite alternate' : 'none',
      }} />
    </div>
  );
}
```

`data-flame-viz="true"` enables the global reduced-motion override `[data-flame-viz="true"] > div { animation: none }` (UI-SPEC §CSS Keyframes).

---

### `lib/hooks/useReducedMotion.ts` (utility, client hook)

**Primary analog:** `lib/hooks/useVisibility.ts` (full file)

**SSR-safe matchMedia hook pattern** (mirror `useVisibility.ts:1-37` shape, swap `document.hidden`/`visibilitychange` for `matchMedia('(prefers-reduced-motion: reduce)')` + `change`):

Existing `useVisibility.ts:1-37`:

```tsx
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that tracks the Page Visibility API state.
 * Returns true when the page is visible, false when hidden.
 * SSR-safe: assumes visible on server/initial mount.
 */
export function useVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') {
      return true;
    }
    return !document.hidden;
  });

  useEffect(() => {
    setIsVisible(!document.hidden);
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
```

**New `useReducedMotion.ts`** — same SSR-safe lazy initializer + mount effect + cleanup shape, with matchMedia:

```tsx
'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe `prefers-reduced-motion: reduce` detection.
 * Returns false during SSR + first client render (full-motion default per
 * UI-SPEC §Pattern 2); flips to true after mount if user prefers reduced motion.
 * Subscribes to the `change` event so a runtime toggle is honored.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false); // SSR-safe default
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

---

### `app/components/EmberGlass/index.ts` (modify, barrel re-export)

**Analog:** existing file lines 1-5 (the established re-export shape).

Existing content:

```ts
export { Pressable, usePressed } from './Pressable';
export type { PressableProps, PointerHandlers } from './Pressable';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { default as AmbientBg } from './AmbientBg';
```

**Append** (named exports — Splash/SplashGate/FlameViz are all named, NOT default, matching Pressable/Sheet convention; AmbientBg's `default as` aliasing is a one-off):

```ts
export { Splash } from './Splash';
export type { SplashProps } from './Splash';
export { SplashGate } from './SplashGate';
export type { SplashGateProps } from './SplashGate';
export { FlameViz } from './FlameViz';
export type { FlameVizProps } from './FlameViz';
```

---

### `app/components/ClientProviders.tsx` (modify, single-line wiring)

**Analog:** existing lines 56-63 (the `CommandPaletteProvider` body where `<OfflineBanner>`, `{children}`, `<InstallPrompt>` already sit).

**Existing block** (lines 56-63):

```tsx
<CommandPaletteProvider>
  <AxeDevtools />
  <PWAInitializer />
  <OfflineBanner fixed showPendingCount />
  {children}
  <InstallPrompt />
</CommandPaletteProvider>
```

**Modified block** — wrap `{children}` with `<SplashGate>` (D-04):

```tsx
<CommandPaletteProvider>
  <AxeDevtools />
  <PWAInitializer />
  <OfflineBanner fixed showPendingCount />
  <SplashGate>{children}</SplashGate>
  <InstallPrompt />
</CommandPaletteProvider>
```

Add import alongside existing imports (line ~11):

```tsx
import { SplashGate } from '@/app/components/EmberGlass';
```

---

### `app/globals.css` (modify, append keyframes)

**Analog:** existing `@keyframes ambientA/B/C` block at lines 346-358 plus the reduced-motion guard at lines 360-363 (the established Phase 174 keyframes-and-guard convention).

**Existing pattern** (lines 346-363):

```css
/* Ambient keyframes (DS-05) — transforms canonical from .planning/inbox/ember-glass-design/project/Pannello Stufa - Redesign.html:46-57 */
@keyframes ambientA {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(40px, 30px) scale(1.15); }
}
@keyframes ambientB { /* ... */ }
@keyframes ambientC { /* ... */ }

/* Reduced-motion guard (UI-SPEC §"Reduced-motion contract") */
@media (prefers-reduced-motion: reduce) {
  .ember-ambient-blob { animation: none !important; }
}
```

**New append** (after existing reduced-motion guard, mirror identical shape) — UI-SPEC §CSS Keyframes:

```css
/* Phase 176 — Splash badge status dot pulse (bundle splash.jsx:85). */
@keyframes pulse {
  0%   { transform: scale(1);   opacity: 1; }
  50%  { transform: scale(1.4); opacity: 0.6; }
  100% { transform: scale(1);   opacity: 1; }
}

/* Phase 176 — FlameViz inner-flame breathing (bundle cards.jsx:120, 126). */
@keyframes flamePulse {
  0%, 100% { transform: translateX(-50%) scaleY(1);    opacity: 1;    }
  50%      { transform: translateX(-50%) scaleY(1.05); opacity: 0.92; }
}

/* Phase 176 — extend reduced-motion guard for splash + flame animations. */
@media (prefers-reduced-motion: reduce) {
  [data-testid="splash-badge"] > div:first-child { animation: none !important; }
  [data-flame-viz="true"] > div { animation: none !important; }
}
```

---

### `app/components/EmberGlass/__tests__/Splash.test.tsx` (test, Jest unit)

**Primary analog:** `app/components/EmberGlass/__tests__/Sheet.test.tsx` (full file structure: `describe('Sheet (EmberGlass primitive)', …)` → `Rendering`, `Dismissal vectors`, etc.)
**Secondary analog:** `Pressable.test.tsx:37-44` (inline-style assertion shape: `expect(el.style.transform).toContain('scale(0.97)')`)

**Fake-timers + cleanup pattern** (project convention; new for Phase 176 — no existing analog uses `jest.useFakeTimers` for state-machine timing, but the `beforeEach`/`afterEach` mock-cleanup shape comes from `Sheet.test.tsx:23-37`):

```tsx
import { act, render, screen } from '@testing-library/react';
import { Splash } from '../Splash';

describe('Splash (EmberGlass primitive — Phase 176)', () => {
  const onDoneMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    onDoneMock.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Full-motion phase state machine', () => {
    test('phase 0 → 1 at t=600ms (flame scale flips from 0.4 to 1)', () => {
      render(<Splash onDone={onDoneMock} />);
      const flame = screen.getByTestId('splash-flame');
      expect(flame.style.transform).toContain('scale(0.4)');
      act(() => { jest.advanceTimersByTime(600); });
      expect(flame.style.transform).toContain('scale(1)');
    });

    test('onDone called exactly once at t=2100ms', () => {
      render(<Splash onDone={onDoneMock} />);
      act(() => { jest.advanceTimersByTime(2099); });
      expect(onDoneMock).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(1); });
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });

    test('all timers cleared on unmount (no setState-after-unmount)', () => {
      const { unmount } = render(<Splash onDone={onDoneMock} />);
      unmount();
      act(() => { jest.advanceTimersByTime(3000); });
      expect(onDoneMock).not.toHaveBeenCalled();
    });
  });

  describe('Reduced-motion branch', () => {
    test('opacity-only fade with no transform on root or flame', () => {
      const { container } = render(<Splash onDone={onDoneMock} reducedMotion />);
      const overlay = container.querySelector('[data-testid="splash-overlay"]') as HTMLElement;
      expect(overlay.style.transition).toContain('opacity');
      expect(overlay.style.transition).not.toContain('transform');
    });

    test('onDone called at t=200ms (reduced-motion timer)', () => {
      render(<Splash onDone={onDoneMock} reducedMotion />);
      act(() => { jest.advanceTimersByTime(200); });
      expect(onDoneMock).toHaveBeenCalledTimes(1);
    });
  });
});
```

---

### `app/components/EmberGlass/__tests__/SplashGate.test.tsx` (test, Jest unit with mocked Auth0)

**Primary analog:** `__tests__/stove/StovePage.test.tsx:20-22` (the load-bearing Auth0 mock pattern)
**Secondary analog:** `Sheet.test.tsx:141-186` (rerender pattern for state transitions) + `AmbientBg.test.tsx:23-31` (event-driven render assertion)

**Auth0 mock pattern** (lifted verbatim from `__tests__/stove/StovePage.test.tsx:20-22`):

```tsx
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'user-123' } }),
}));
```

**Per-test useUser override pattern** (tests need different user states — loading/no-user/user; use `jest.mock` with a swappable mock function):

```tsx
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

  test('renders children inside dashboard-wrapper always', () => {
    const { getByTestId, getByText } = render(
      <SplashGate><div>dashboard content</div></SplashGate>
    );
    expect(getByTestId('dashboard-wrapper')).toBeInTheDocument();
    expect(getByText('dashboard content')).toBeInTheDocument();
  });

  test('user truthy + sessionStorage unset → splash mounts', () => {
    const { getByTestId } = render(<SplashGate><div /></SplashGate>);
    expect(getByTestId('splash-overlay')).toBeInTheDocument();
  });

  test('sessionStorage already true → splash does NOT mount', () => {
    sessionStorage.setItem('ember-glass-splash-shown', 'true');
    const { queryByTestId } = render(<SplashGate><div /></SplashGate>);
    expect(queryByTestId('splash-overlay')).toBeNull();
  });

  test('isLoading=true → splash does NOT mount (no flicker)', () => {
    mockUseUser.mockReturnValue({ user: undefined, isLoading: true });
    const { queryByTestId } = render(<SplashGate><div /></SplashGate>);
    expect(queryByTestId('splash-overlay')).toBeNull();
  });

  test('user falsy + isLoading=false → splash does NOT mount', () => {
    mockUseUser.mockReturnValue({ user: null, isLoading: false, error: new Error('x') });
    const { queryByTestId } = render(<SplashGate><div /></SplashGate>);
    expect(queryByTestId('splash-overlay')).toBeNull();
  });

  test('reducedMotion=true → reducedMotion prop forwarded to Splash', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { getByTestId } = render(<SplashGate><div /></SplashGate>);
    const overlay = getByTestId('splash-overlay');
    // Reduced-motion contract: opacity-only transition, no 'transform' in transition string.
    expect(overlay.style.transition).not.toContain('transform');
  });

  test('forceShow=true bypasses sessionStorage gate', () => {
    sessionStorage.setItem('ember-glass-splash-shown', 'true');
    const { getByTestId } = render(<SplashGate forceShow><div /></SplashGate>);
    expect(getByTestId('splash-overlay')).toBeInTheDocument();
  });
});
```

---

### `app/components/EmberGlass/__tests__/FlameViz.test.tsx` (test, pure-presentational)

**Primary analog:** `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` lines 14-21 (render-and-assert structure)
**Secondary analog:** `Pressable.test.tsx:37-44` (inline-style assertion shape)

**Render-and-style-assert pattern** (combine the two):

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
    const { container: c1 } = render(<FlameViz on intensity={0.6} />);
    const body1 = c1.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    // height = 64 * (0.5 + 0.6 * 0.5) = 64 * 0.8 = 51.2
    expect(body1.style.height).toMatch(/51\.2px/);

    const { container: c2 } = render(<FlameViz on intensity={0.95} />);
    const body2 = c2.querySelector('[data-flame-viz="true"] > div') as HTMLElement;
    // height = 64 * (0.5 + 0.95 * 0.5) = 64 * 0.975 = 62.4
    expect(body2.style.height).toMatch(/62\.4px/);
  });

  test('data-flame-viz="true" attribute applied to wrapper', () => {
    const { container } = render(<FlameViz on />);
    expect(container.querySelector('[data-flame-viz="true"]')).not.toBeNull();
  });
});
```

---

### `tests/smoke/splash.spec.ts` (test, Playwright smoke)

**Primary analog:** `tests/smoke/sheet-primitive.spec.ts` (waitForFunction-on-getComputedStyle pattern for animation timing assertions)
**Secondary analogs:**
- `tests/smoke/page-loads.spec.ts:1-20` (`collectConsoleErrors` helper — copy verbatim)
- `tests/smoke/auth-flows.spec.ts:1-17` (real-Auth0 sign-in via `signIn(page, TEST_USER.email, TEST_USER.password)` from `helpers/auth.helpers.ts`)

**Imports + console-errors collector** (copy verbatim from `page-loads.spec.ts:1-20` and `auth-flows.spec.ts:1-7`):

```ts
import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';
import { signIn } from '../helpers/auth.helpers';
import { TEST_USER } from '../helpers/test-context';

function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Fix any of the following')) return;
      errors.push(text);
    }
  };
  page.on('console', handler);
  const cleanup = () => page.off('console', handler);
  return { errors, cleanup };
}
```

**SPLASH-01 spec** (combine `auth-flows.spec.ts:9-17` sign-in + `sheet-primitive.spec.ts` toBeVisible + timeout assertion):

```ts
test.describe('SPLASH-01..05 — splash overlay', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('SPLASH-01 splash appears within 100ms of dashboard landing post-Auth0', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });
    // Splash must dismiss within ~2.3s (2.1s phase 3 + jitter).
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });
    cleanup();
    expect(errors, `Console errors during splash: ${errors.join(', ')}`).toHaveLength(0);
  });
```

**SPLASH-02 sequence beats** (mirror `sheet-primitive.spec.ts:25-33` `waitForFunction` shape for transform assertions mid-animation):

```ts
  test('SPLASH-02 sequence beats: flame scale(0.4) → scale(1) → fade-out', async ({ page }) => {
    await signIn(page, TEST_USER.email, TEST_USER.password);
    // t≈100ms: flame at scale(0.4)
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="splash-flame"]') as HTMLElement | null;
      return !!el && el.style.transform.includes('scale(0.4)');
    }, { timeout: 200 });
    // t≈800ms: flame at scale(1)
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="splash-flame"]') as HTMLElement | null;
      return !!el && el.style.transform.includes('scale(1)');
    }, { timeout: 1200 });
  });
```

**SPLASH-03 reduced-motion** (Playwright `prefersReducedMotion: 'reduce'` context option):

```ts
  test.describe('SPLASH-03 reduced-motion', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('reduces to opacity-only fade, no transform on flame or wrapper', async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await signIn(page, TEST_USER.email, TEST_USER.password);
      await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 500 });
      const flameTransform = await page.getByTestId('splash-flame').evaluate(el => getComputedStyle(el).transform);
      expect(flameTransform === 'none' || flameTransform === 'matrix(1, 0, 0, 1, 0, 0)').toBeTruthy();
      await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 400 });
      await ctx.close();
    });
  });
```

**SPLASH-05 network capture** (Playwright `page.on('request', ...)`):

```ts
  test('SPLASH-05 fetches start during splash window', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) apiRequests.push(req.url());
    });
    await signIn(page, TEST_USER.email, TEST_USER.password);
    // Capture at the splash-visible moment.
    await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });
    // Wait for splash to dismiss; by then ≥1 device API call should have fired.
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });
    expect(apiRequests.some(u => /\/api\/(stove|thermostat|lights|network|sonos|dirigera|raspi)/.test(u))).toBe(true);
  });
});
```

---

## Shared Patterns

### `'use client'` + JSDoc-with-bundle-source header
**Source:** `app/components/EmberGlass/AmbientBg.tsx:1-22`, `Sheet.tsx:1-29`, `Pressable.tsx:1-35`
**Apply to:** `Splash.tsx`, `SplashGate.tsx`, `FlameViz.tsx`

Every EmberGlass primitive starts with `'use client';` and a multi-line JSDoc that:
1. Names the phase + requirement (`Phase 176 (SPLASH-01..05)`)
2. Cites the bundle source path with line numbers
3. Calls out z-index reservation (if applicable)
4. Lists AUDIT-EXCEPTION literals up-front

### Inline-style with `// AUDIT-EXCEPTION` tags
**Source:** `AmbientBg.tsx:56,72,75,90`; `Sheet.tsx:81-82,102-107,158-159`
**Apply to:** `Splash.tsx`, `FlameViz.tsx`

Every hardcoded color/blur literal MUST carry an inline `// AUDIT-EXCEPTION (DS-02): bundle <file>.jsx:<line>` comment. The Phase 174 DS-02 grep gate scans for these.

### Timer cleanup contract
**Source:** bundle `splash.jsx:16` + RESEARCH §Pattern 3
**Apply to:** `Splash.tsx` (both full-motion + reduced-motion branches)

```tsx
useEffect(() => {
  const t1 = setTimeout(...);
  const t2 = setTimeout(...);
  return () => { clearTimeout(t1); clearTimeout(t2); };
}, [onDone]);
```

Critical for React 18 strict-mode double-mount in dev (without cleanup, two timer chains fire and `onDone` is called twice).

### SSR-safe browser-API hook
**Source:** `lib/hooks/useVisibility.ts` (full file) + `app/components/EmberGlass/AmbientBg.tsx:24-27`
**Apply to:** `lib/hooks/useReducedMotion.ts`, `SplashGate.tsx` (sessionStorage read)

Two flavors of the same convention:
1. `useState(() => typeof document === 'undefined' ? <default> : <browserRead>)` — for synchronous SSR-safe initial state (AmbientBg uses this).
2. `useState(<default>)` + `useEffect(() => { setX(<browserRead>) }, [])` — for two-state hydration (SplashGate uses this for sessionStorage; useReducedMotion uses this for matchMedia).

### `data-testid` for animation/state-machine selectors
**Source:** `Sheet.tsx:74` (`data-sheet-backdrop="true"`), `Pressable.tsx:112` (`data-pressable-focusable`); existing test usage in `tests/smoke/press-primitive.spec.ts:16` (`page.getByTestId('press-card-demo')`)
**Apply to:** `Splash.tsx` (`splash-overlay`, `splash-flame`, `splash-wordmark`, `splash-badge`); `SplashGate.tsx` (`dashboard-wrapper`)

CSS-class selectors are fragile mid-animation; `data-testid` gives deterministic Playwright + RTL targets.

### Auth0 useUser mock for unit tests
**Source:** `__tests__/stove/StovePage.test.tsx:20-22`
**Apply to:** `SplashGate.test.tsx`

```tsx
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'user-123' } }),
}));
```

For per-test variation, wrap the return in a `mockUseUser = jest.fn()` and set `.mockReturnValue(...)` in `beforeEach`.

### Playwright `collectConsoleErrors` helper
**Source:** `tests/smoke/page-loads.spec.ts:1-20`
**Apply to:** `tests/smoke/splash.spec.ts`

Copy the helper verbatim. Establish-and-cleanup pattern around `signIn()` + assertions.

### Playwright sign-in helper
**Source:** `tests/helpers/auth.helpers.ts` (full file) + `tests/smoke/auth-flows.spec.ts:1-17`
**Apply to:** `tests/smoke/splash.spec.ts`

```ts
import { signIn } from '../helpers/auth.helpers';
import { TEST_USER } from '../helpers/test-context';
test.use({ storageState: { cookies: [], origins: [] } }); // force fresh sign-in
await signIn(page, TEST_USER.email, TEST_USER.password);
```

### CSS keyframe append + reduced-motion guard
**Source:** `app/globals.css:346-363` (ambient keyframes + reduced-motion guard pair)
**Apply to:** `app/globals.css` Phase 176 append (`pulse`, `flamePulse`, extended `@media (prefers-reduced-motion: reduce)` block)

Mirror the structure: keyframes block + companion reduced-motion `@media` block. The Phase 174 reduced-motion guard at lines 360-363 is the canonical shape.

---

## No Analog Found

None — every Phase 176 file maps cleanly to a sibling Phase 174/175 EmberGlass primitive, an existing `lib/hooks/` SSR-safe hook, an existing test file, or a verbatim port from the bundle. Phase 176 is overwhelmingly a port + token substitution; the patterns above cover 100% of the deliverable surface.

---

## Metadata

**Analog search scope:**
- `app/components/EmberGlass/` (all files including `__tests__/`)
- `app/components/ClientProviders.tsx`, `app/components/Navbar.tsx`
- `lib/hooks/` (full directory)
- `__tests__/stove/` (Auth0 mock pattern)
- `tests/smoke/` (full directory) + `tests/helpers/` (auth helpers)
- `app/globals.css` (keyframes + reduced-motion guard pattern)
- `.planning/inbox/ember-glass-design/project/components/splash.jsx` + `cards.jsx` (bundle source of truth)

**Files scanned:** 18 (focused — high analog match per file, early stop after Auth0 mock + Playwright auth helper located)

**Pattern extraction date:** 2026-04-27
