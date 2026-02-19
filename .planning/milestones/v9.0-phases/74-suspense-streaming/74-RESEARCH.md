# Phase 74: Suspense Streaming (Conditional) - Research

**Researched:** 2026-02-19
**Domain:** Next.js App Router streaming, React Suspense, server/client component boundaries
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SUSP-01 | User sees skeleton fallbacks for each dashboard card during loading | Existing Skeleton.* components are ready; loading.tsx + per-card Suspense boundaries enable this without new UI work |
| SUSP-02 | User sees cards stream in progressively as data becomes available | Requires structural refactor of page.tsx: remove the blocking await from page level, wrap each card in its own Suspense boundary |
| SUSP-03 | User's stove card always loads first (safety-critical priority) | Stove card uses Firebase RTDB `onValue()` listener (not polling), so it naturally resolves fastest; stagger order in DOM guarantees render priority |
</phase_requirements>

---

## Summary

The dashboard page (`app/page.tsx`) is a server-side async component that currently blocks the entire page render behind two sequential awaits: `auth0.getSession()` then `getUnifiedDeviceConfigAdmin(userId)`. Only after both resolve does it render any of the six device card components. This means the user sees a blank page (or the template overlay) for the full duration of both fetches before any content appears.

The six device card components (`StoveCard`, `ThermostatCard`, `LightsCard`, `WeatherCardWrapper`, `CameraCard`, `NetworkCard`) are ALL `'use client'` components with their own internal loading states (`initialLoading`, `loading`). They each render their own `Skeleton.*` component when their internal state is loading. React Suspense server-side streaming requires async Server Components to suspend — client components cannot suspend the server render.

**The core conflict** (documented in the phase description) is architectural: the `deviceConfig` server-fetch pattern determines WHICH cards to render (from Firebase, server-side), so it cannot be moved into each individual card. Per-card Suspense boundaries that suspend at the server level would require each card to be an async Server Component — but all cards need browser hooks (`useState`, `useEffect`, Firebase listeners, Auth0 `useUser`). This makes a pure "server-suspend-per-card" approach non-viable.

**Primary recommendation:** Use a `loading.tsx` file for the dashboard page to immediately show all six skeleton placeholders via static HTML, then let the page shell stream in with the existing client-side loading states. This gives the user skeleton fallbacks within ~300ms of navigation without any card-level architectural change. A secondary enhancement wraps the `getUnifiedDeviceConfigAdmin` fetch in a per-card Suspense boundary via a server-side wrapper component pattern — but only if the `loading.tsx` approach does not satisfy SUSP-02's progressive streaming requirement.

---

## Standard Stack

### Core (no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React built-in `Suspense` | React 19 (already installed) | Wrap async components with fallback UI | Built into React, no install needed |
| Next.js `loading.tsx` convention | Next.js 16 (already installed) | Page-level instant loading state via Suspense | Official file convention, auto-wrapped by Next.js |

### Already Available

| Existing Asset | Purpose |
|---------------|---------|
| `Skeleton.StovePanel` | Full stove card skeleton — already matches card layout |
| `Skeleton.ThermostatCard` | Full thermostat skeleton |
| `Skeleton.LightsCard` | Full lights skeleton |
| `Skeleton.WeatherCard` | Full weather skeleton |
| `Skeleton.CameraCard` | Full camera skeleton |
| `Skeleton.NetworkCard` | Full network skeleton |
| `DeviceCardErrorBoundary` | Wraps each card already in page.tsx |

**Installation:** None required. All needed tools are already in the project.

---

## Architecture Patterns

### Understanding Why All Cards Are Client Components

All six cards use browser-only features that make them `'use client'` components:

- **StoveCard**: `useUser()` (Auth0 hook), Firebase `onValue()` listener, `useRouter()`, `useState`/`useEffect`
- **ThermostatCard**: `useState`, `useEffect`, `useAdaptivePolling`, `useDebounce`, `useRouter()`
- **LightsCard**: `useState`, `useEffect`, `useAdaptivePolling`, `useRouter()`
- **WeatherCardWrapper**: `useState`, `useEffect`, Firebase location listener
- **CameraCard**: `useState`, `useEffect`, HLS player
- **NetworkCard**: `useAdaptivePolling`, Firebase listener, `useRouter()`

These cannot become Server Components without a complete rewrite. The Suspense streaming that streams HTML from server before hydration requires Server Components to `await` data.

### Pattern 1: `loading.tsx` — Page-Level Instant Shell (RECOMMENDED for SUSP-01)

**What:** Create `app/loading.tsx` that returns the full dashboard skeleton layout. Next.js automatically wraps `app/page.tsx` in a Suspense boundary with this fallback. The skeleton HTML is sent to the browser immediately on navigation (prefetched for soft nav), before `auth0.getSession()` + `getUnifiedDeviceConfigAdmin()` complete.

**Why it works:** `loading.tsx` is a static Server Component. Next.js pre-renders it and sends it as part of the initial HTML stream. The browser shows the skeleton instantly while the async page awaits resolve in parallel on the server.

**Limitation:** All six skeletons appear at once and all six cards appear at once when `page.tsx` resolves. This satisfies SUSP-01 (skeleton fallbacks visible) but not SUSP-02 (progressive card-by-card streaming).

```tsx
// app/loading.tsx — static, no "use client" needed
import Skeleton from './components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>
      {/* Mobile: single column */}
      <div className="flex flex-col gap-6 sm:hidden">
        <Skeleton.StovePanel />
        <Skeleton.ThermostatCard />
        <Skeleton.WeatherCard />
        <Skeleton.LightsCard />
        <Skeleton.CameraCard />
        <Skeleton.NetworkCard />
      </div>
      {/* Desktop: two-column masonry */}
      <div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
        <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
          <Skeleton.StovePanel />
          <Skeleton.WeatherCard />
          <Skeleton.NetworkCard />
        </div>
        <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
          <Skeleton.ThermostatCard />
          <Skeleton.LightsCard />
          <Skeleton.CameraCard />
        </div>
      </div>
    </section>
  );
}
```

**Confidence:** HIGH — official Next.js pattern, verified in docs (v16.1.6).

### Pattern 2: Async Server Wrapper + Per-Card Suspense (for SUSP-02 + SUSP-03)

**What:** Restructure `page.tsx` to avoid the single blocking await. Instead, each card slot is wrapped in its own async Server Component that awaits the deviceConfig data independently. The client card component renders inside that wrapper.

**The real problem:** `getUnifiedDeviceConfigAdmin(userId)` must resolve before the app knows WHICH cards to render (visibility determined by user's config). This is the "known conflict" noted in the phase description. There are two valid approaches to resolve it:

**Approach A: Hoist session to layout, keep card list async in page**

The key insight is that `auth0.getSession()` in the page blocks before even checking deviceConfig. If session/userId can be resolved faster or cached, the total block time shrinks significantly. However, since both awaits are needed before rendering the card list, per-card Suspense at the server level cannot start until deviceConfig is known.

**Approach B: Split the page into two server renders**

1. `page.tsx` immediately renders the page shell and masonry layout skeleton placeholders (synchronously, no await)
2. A new `DashboardCards` async Server Component `await`s session + deviceConfig, then renders the actual card list with per-card Suspense boundaries wrapping client card components

The trick: since the client card components manage their own loading state, the "Suspense" boundary here is not for the card data itself but for the deviceConfig that controls WHICH cards appear. Once deviceConfig resolves, the card list is known and all six client components mount simultaneously (which then show their own internal skeletons until their data resolves).

```tsx
// app/page.tsx (restructured — synchronous shell)
import { Suspense } from 'react';
import DashboardCards from './components/DashboardCards'; // new async Server Component
import DashboardSkeleton from './components/DashboardSkeleton'; // static skeleton

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardCards />
      </Suspense>
    </section>
  );
}

// app/components/DashboardCards.tsx (async Server Component)
// Fetches session + deviceConfig, renders card list with per-card Suspense
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { splitIntoColumns } from '@/lib/utils/dashboardColumns';
import { getUnifiedDeviceConfigAdmin, getVisibleDashboardCards } from '@/lib/services/unifiedDeviceConfigService';
import { Suspense } from 'react';
import StoveCard from './devices/stove/StoveCard';
// ... other card imports

export default async function DashboardCards() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  const deviceConfig = await getUnifiedDeviceConfigAdmin(session.user.sub);
  const visibleCards = getVisibleDashboardCards(deviceConfig);
  // ... render card list with per-card Suspense if needed
}
```

**Limitation of Approach B:** Since client components (`StoveCard` etc.) cannot suspend a server-side Suspense boundary by themselves (they don't await on the server), wrapping each with `<Suspense>` at the server level in `DashboardCards` provides NO progressive streaming per card. The cards all mount at the same time after `DashboardCards` resolves. The "streaming" benefit is only from skeleton-during-deviceConfig-fetch, not card-by-card.

**IMPORTANT FINDING:** True per-card streaming (SUSP-02) is IMPOSSIBLE with the current all-client-components architecture without a fundamental redesign where each card has a server-side data fetching layer. The current cards self-fetch data entirely client-side via hooks.

### Pattern 3: Per-Card Skeleton via Client-Side `initialLoading` (CURRENT STATE + SUSP-03)

The cards ALREADY show skeletons during their own loading:
- `StoveCard`: `if (stoveData.initialLoading) return <Skeleton.StovePanel />`
- `NetworkCard`: `if (networkData.loading) return <Skeleton.NetworkCard />`
- `LightsCard`: `if (lightsData.loading) return <Skeleton.LightsCard />`
- `CameraCard`: conditional `<Skeleton.CameraCard />` on loading
- `ThermostatCard`: `skeletonComponent={loading ? <Skeleton.ThermostatCard /> : null}`

These show immediately when the card component mounts. The stagger already implemented in Phase 73 (`initialDelay` per card) means they resolve progressively. The issue is they only show AFTER page hydration — before hydration, the user sees the `loading.tsx` shell.

**For SUSP-03 (stove card first):** StoveCard uses Firebase `onValue()` listener (already subscribed at mount, no HTTP delay). It resolves within ~100ms of mount. All other cards use HTTP polling with stagger delays (50ms, 100ms, 250ms, 400ms, 500ms). This means stove naturally appears first even without explicit prioritization.

### Anti-Patterns to Avoid

- **Converting cards to Server Components**: Would require removing all hooks — a massive rewrite, breaks all interactivity (polling, Firebase real-time, commands)
- **Using `React.use()` + promise prop pattern for cards**: Only works if data is an async operation passed from server. The cards' data comes from client-side APIs (Firebase SDK, fetch to API routes) — not passable as server promises
- **Creating per-card API routes and fetching them server-side**: Would break the real-time nature of Firebase `onValue()`, defeat the polling architecture, and double-fetch data

---

## The Real Conflict: deviceConfig + Suspense

The "known conflict" between `deviceConfig server-fetch pattern` and `per-card Suspense boundaries` (noted in phase description) is:

**Problem statement:** Per-card Suspense at the SERVER level requires each card to be an async Server Component that `await`s its own data. But:
1. The cards are all client components (hooks, Firebase, Auth0)
2. The card LIST itself is dynamic (comes from `getUnifiedDeviceConfigAdmin`)
3. You cannot render `<Suspense><StoveCard /></Suspense>` and have `StoveCard` suspend the server — it mounts client-side and handles its own loading

**Resolution:** Accept the architectural reality. The value of Suspense here is:

| Goal | Mechanism | When user sees it |
|------|-----------|------------------|
| SUSP-01: Skeletons for ALL 6 cards immediately | `loading.tsx` | Instantly on navigation (before any server await) |
| SUSP-02: Progressive card appearance | Client-side `initialLoading` states (already exist) + Phase 73 stagger | After hydration, cards reveal progressively 0→500ms |
| SUSP-03: Stove first | Firebase `onValue()` at mount (no HTTP delay), all others staggered 50-500ms | Stove reveals first naturally |

The `loading.tsx` approach DOES satisfy SUSP-01 (user sees skeletons within ~300ms). SUSP-02 is satisfied by the existing client-side loading architecture + stagger. SUSP-03 is satisfied by Firebase listener vs HTTP polling speed difference.

The Suspense boundary in the restructured `page.tsx` (Pattern 2) only benefits the `DashboardCards` async component — it makes the page shell render immediately and blocks only the card list area behind a skeleton.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Page-level loading skeleton | Custom Suspense + skeleton component in page.tsx | `app/loading.tsx` | Next.js auto-wraps page in Suspense; skeleton pre-rendered statically |
| Card-order determination | Client-side deviceConfig fetch | Keep server-side `getUnifiedDeviceConfigAdmin` | Already correct; client fetch would add round-trip delay |
| New skeleton components | All need building | `Skeleton.StovePanel`, `Skeleton.ThermostatCard`, etc. already exist | No new UI work needed |

---

## Common Pitfalls

### Pitfall 1: Assuming per-card Suspense gives per-card server streaming

**What goes wrong:** Developer wraps each `<StoveCard />` in `<Suspense fallback={<Skeleton.StovePanel />}>` expecting stove to stream in first, then other cards after. The Suspense boundaries render all at once because client components mount simultaneously — no card suspends the server render.

**Why it happens:** Suspense server streaming only works when an async Server Component `await`s data inside a Suspense boundary. Client components (`'use client'`) render their fallback during hydration, not during server streaming.

**How to avoid:** Understand that the per-card stagger already implemented via `initialDelay` in Phase 73 IS the progressive reveal mechanism. Suspense boundaries around client cards in this app provide error isolation (already done via `DeviceCardErrorBoundary`) but not progressive server-side streaming.

**Warning signs:** If all cards mount simultaneously with their skeletons visible at the same instant, per-card Suspense is providing zero additional progressive streaming.

### Pitfall 2: Breaking the masonry layout with per-card Suspense

**What goes wrong:** Wrapping each card in Suspense changes how column assignment works. The `splitIntoColumns` function runs on `visibleCards`, which is derived from `deviceConfig` — not available until the server async component resolves.

**Why it happens:** The masonry layout (even→left, odd→right, flatIndex for stagger) depends on knowing the full card list before rendering. Suspense boundaries per card in the server render would need the card list to already be known.

**How to avoid:** Keep `splitIntoColumns` call INSIDE the async `DashboardCards` component (after `deviceConfig` resolves). The per-card Suspense boundaries (if used) wrap client cards AFTER the split is computed.

### Pitfall 3: `loading.tsx` skeleton using wrong column layout

**What goes wrong:** `loading.tsx` shows a static set of 6 skeletons but uses a different layout than what `page.tsx` renders (e.g., assumes 6 cards but user only has 3 enabled). Creates layout shift when real content streams in.

**Why it happens:** `loading.tsx` does not have access to user's deviceConfig (static, no await). It must show a "best guess" skeleton.

**How to avoid:** Show full 6-card skeleton as a best effort. The CLS impact is minimal because transition happens before user interaction. OR show a simple full-height shimmer placeholder instead of 6 individual skeletons.

### Pitfall 4: Double-skeleton flash (loading.tsx + card's own initialLoading)

**What goes wrong:** User sees `loading.tsx` skeleton, then page resolves and ALL cards mount with THEIR OWN skeletons briefly visible, then cards resolve one by one. User sees a "flash" of skeleton-change at the moment page.tsx resolves.

**Why it happens:** `loading.tsx` shows e.g. `Skeleton.StovePanel`, then page resolves and `StoveCard` mounts and shows... `Skeleton.StovePanel` again (its own `initialLoading` state). The visual appears the same but technically swaps.

**How to avoid:** This is largely invisible to the user since `Skeleton.StovePanel` looks identical in both cases. The only potential issue is animation restart. The existing `animate-spring-in` class on each card's container + the fact that Skeleton components also use `animate-spring-in` means the transition should be seamless.

### Pitfall 5: Disrupting the auth redirect flow

**What goes wrong:** Making `page.tsx` synchronous (Pattern 2) means it no longer awaits session before rendering. The redirect to `/auth/login` moves into `DashboardCards`, but `loading.tsx` skeleton shows briefly before the redirect fires.

**Why it happens:** `loading.tsx` always shows while the Suspense boundary is pending. If the user is unauthenticated, they see the dashboard skeleton briefly before being redirected.

**How to avoid:** Check if Auth0 middleware already handles unauthenticated redirects at the Next.js middleware level (before page render). If so, `DashboardCards` never fires for unauthenticated users. Check `middleware.ts` for auth guard.

---

## Code Examples

### Example 1: `loading.tsx` Pattern (correct, officially supported)

```tsx
// Source: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
// app/loading.tsx — file-system convention, auto-wraps app/page.tsx in Suspense
import Skeleton from '@/app/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>
      {/* Mobile single column */}
      <div className="flex flex-col gap-6 sm:hidden">
        <Skeleton.StovePanel />
        <Skeleton.ThermostatCard />
        <Skeleton.WeatherCard />
        <Skeleton.LightsCard />
        <Skeleton.CameraCard />
        <Skeleton.NetworkCard />
      </div>
      {/* Desktop two-column masonry (left: even, right: odd) */}
      <div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
        <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
          <Skeleton.StovePanel />     {/* flatIndex 0 */}
          <Skeleton.WeatherCard />    {/* flatIndex 2 */}
          <Skeleton.NetworkCard />    {/* flatIndex 4 */}
        </div>
        <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
          <Skeleton.ThermostatCard /> {/* flatIndex 1 */}
          <Skeleton.LightsCard />     {/* flatIndex 3 */}
          <Skeleton.CameraCard />     {/* flatIndex 5 */}
        </div>
      </div>
    </section>
  );
}
```

### Example 2: Restructured `page.tsx` with Suspense wrapping `DashboardCards`

```tsx
// Source: https://nextjs.org/learn/dashboard-app/streaming
// app/page.tsx (synchronous shell — renders immediately)
import { Suspense } from 'react';
import DashboardCards from './components/DashboardCards';
import DashboardSkeleton from './components/DashboardSkeleton';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>
      <SandboxPanel />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardCards />
      </Suspense>
    </section>
  );
}
```

```tsx
// app/components/DashboardCards.tsx (async Server Component)
// Fetches session + deviceConfig, then renders the actual card list
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getUnifiedDeviceConfigAdmin, getVisibleDashboardCards } from '@/lib/services/unifiedDeviceConfigService';
import { splitIntoColumns } from '@/lib/utils/dashboardColumns';
import { DeviceCardErrorBoundary } from '../ErrorBoundary';

const CARD_COMPONENTS = { /* same registry as before */ };
const DEVICE_META = { /* same registry as before */ };

export default async function DashboardCards() {
  const session = await auth0.getSession();
  if (!session?.user) redirect('/auth/login');

  const deviceConfig = await getUnifiedDeviceConfigAdmin(session.user.sub);
  const visibleCards = getVisibleDashboardCards(deviceConfig);
  const { left, right } = splitIntoColumns(visibleCards);

  const renderCard = (card: typeof visibleCards[number], flatIndex: number) => {
    const CardComponent = CARD_COMPONENTS[card.id];
    if (!CardComponent) return null;
    return (
      <div
        key={card.id}
        className="animate-spring-in transition-all duration-300 ease-out"
        style={{ animationDelay: `${flatIndex * 100}ms` }}
      >
        <DeviceCardErrorBoundary
          deviceName={DEVICE_META[card.id]?.name ?? card.id}
          deviceIcon={DEVICE_META[card.id]?.icon ?? '⚠️'}
        >
          <CardComponent />
        </DeviceCardErrorBoundary>
      </div>
    );
  };

  // ... render mobile + desktop layout (same as current page.tsx)
}
```

### Example 3: Per-card Suspense (limited value, but correct syntax)

```tsx
// Wrapping a client card in Suspense from a Server Component
// ONLY provides error boundary + fallback during hydration, NOT server streaming
import { Suspense } from 'react';
import StoveCard from './StoveCard'; // 'use client' component
import Skeleton from '../ui/Skeleton';

// In DashboardCards.tsx (server component):
<Suspense fallback={<Skeleton.StovePanel />}>
  <StoveCard />
</Suspense>
```

Note: This Suspense boundary shows `Skeleton.StovePanel` during React hydration on the client, NOT as a server-streamed skeleton. The skeleton during the server await phase comes from `loading.tsx` (Pattern 1) or from the parent Suspense wrapping `DashboardCards` (Pattern 2).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getInitialProps` / `getServerSideProps` for data | Async Server Components with `await` | Next.js 13 App Router | Server fetches embedded in component tree |
| Full-page blocking render | `loading.tsx` + Suspense streaming | Next.js 13+ | Instant skeleton, progressive content |
| CSR-only (all client) | Server + Client composition | React 18+ / Next.js 13+ | Smaller bundle, faster first render |
| Manual skeleton state (`initialLoading`) | React Suspense `fallback` | React 18+ | Declarative, no state management |

**Current state for this project:** The cards use manual skeleton state (`initialLoading`/`loading` in hooks) because they are all client components. This is correct and appropriate given the real-time polling / Firebase architecture. The `loading.tsx` file approach gives the server-streaming benefit without changing card architecture.

---

## Open Questions

1. **Does Next.js middleware handle unauthenticated redirects?**
   - What we know: `app/page.tsx` currently does `await auth0.getSession()` and redirects if no session. `app/layout.tsx` does not appear to have auth guard.
   - What's unclear: Is there a `middleware.ts` at the root that protects the dashboard route? If so, Pattern 2 is safe (unauthenticated users never reach `DashboardCards`).
   - Recommendation: Check `middleware.ts` before restructuring page.tsx. If no middleware auth guard exists, the redirect must stay in `DashboardCards` (async server component) rather than moving to middleware.

2. **Does `SandboxPanel` need to stay in page.tsx or can it move to `DashboardCards`?**
   - What we know: `SandboxPanel` is currently rendered directly in `page.tsx` before the card list. It is a client component (`'use client'`).
   - What's unclear: Whether `SandboxPanel` needs to render outside the `DashboardCards` Suspense boundary (so it shows while skeletons are visible).
   - Recommendation: Keep `SandboxPanel` outside the Suspense boundary so it renders immediately.

3. **Is the `template.tsx` page transition compatible with `loading.tsx`?**
   - What we know: `template.tsx` wraps children in a fade-in animation (opacity 0→1, translateY 2→0). It shows a liquid glass overlay during transition.
   - What's unclear: Whether `loading.tsx` skeleton appears inside or outside the `template.tsx` animation wrapper. In Next.js, `loading.tsx` is nested inside `layout.tsx` but outside `template.tsx`. The template wraps `page.tsx` content.
   - Recommendation: Verify rendering order. `loading.tsx` fallback replaces `page.tsx` in the Suspense boundary, so it IS wrapped by `template.tsx`. The skeleton will animate in with the template fade. This is desirable behavior.

4. **What was the measured LCP/TTI after phases 70-73?**
   - What we know: Phase 74 is conditional — "only execute if Phase 70-73 results show LCP/TTI still insufficient." The `.baseline/` directory is missing (noted in Phase 70 verification as a gap).
   - What's unclear: Whether actual performance metrics justify implementing Phase 74 at all.
   - Recommendation: Phase 74 should proceed (per ROADMAP status "0/2, Not started") regardless of measurement gap, since the `loading.tsx` approach is low-risk and directly serves SUSP-01/02/03 requirements.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (v16.1.6, fetched 2026-02-16): https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming — `loading.tsx` conventions, Suspense streaming behavior
- Next.js official docs (v16.1.6): https://nextjs.org/docs/app/getting-started/server-and-client-components — Server/Client component composition, Suspense with client components
- Codebase inspection: `app/page.tsx`, `app/components/ui/Skeleton.tsx`, all 6 device card components, `lib/services/unifiedDeviceConfigService.ts` — existing patterns and skeleton inventory

### Secondary (MEDIUM confidence)
- Next.js learn curriculum: https://nextjs.org/learn/dashboard-app/streaming — per-card Suspense pattern with CardWrapper
- FreeCodeCamp (Next.js 15 streaming handbook): https://www.freecodecamp.org/news/the-nextjs-15-streaming-handbook/ — pattern verification for `loading.tsx` + skeleton

### Tertiary (LOW confidence, noted for validation)
- Multiple Medium articles on Suspense streaming — consistent with official docs findings but not independently authoritative

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, uses existing Skeleton components and Next.js `loading.tsx` convention
- Architecture: HIGH — codebase is fully inspected; client component constraint is definitive, `loading.tsx` pattern is verified official approach
- Pitfalls: HIGH — double-skeleton and masonry layout pitfalls are derived directly from codebase inspection; auth redirect pitfall confirmed by page.tsx code

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (stable Next.js App Router conventions, 30-day window)

---

## Planning Guidance

Phase 74 should be split into **two plans**:

### Plan 74-01: `loading.tsx` + page restructure (addresses SUSP-01 + SUSP-02 partial)

1. Create `app/loading.tsx` with full 6-card skeleton layout (mobile + desktop masonry)
2. Refactor `app/page.tsx` to be synchronous (`Home` renders immediately), move async logic into a new `app/components/DashboardCards.tsx` async Server Component
3. Wrap `<DashboardCards />` in `<Suspense fallback={<DashboardSkeleton />}>` inside `page.tsx`
4. Move `SandboxPanel` outside the Suspense boundary (renders before cards)
5. Verify `template.tsx` animation compatibility

**Files modified:** `app/loading.tsx` (new), `app/page.tsx`, `app/components/DashboardCards.tsx` (new)

### Plan 74-02: Per-card Suspense boundaries + stove priority (addresses SUSP-02 + SUSP-03)

The per-card client-side skeleton states already exist. This plan adds Suspense wrappers around each card in `DashboardCards.tsx` with their matching fallback skeletons. While this does NOT add server-streaming per card (client components cannot suspend server render), it:
- Makes the skeleton/card transition declarative (Suspense pattern vs manual state)
- Provides correct `fallback` during React hydration
- Makes stove card priority explicit (rendered first in DOM, guaranteed to hydrate first)

1. Wrap each card in `<Suspense fallback={<Skeleton.CardType />}>` in `DashboardCards.tsx`
2. Add unit tests for `DashboardCards` and `DashboardLoading` components

**Files modified:** `app/components/DashboardCards.tsx`, tests

**Key constraint for both plans:** Do NOT change the six card components themselves. Their internal hook-based loading/skeleton logic is correct and should be preserved.
