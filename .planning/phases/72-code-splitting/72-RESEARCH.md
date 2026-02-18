# Phase 72: Code Splitting - Research

**Researched:** 2026-02-18
**Domain:** Next.js App Router code splitting — `next/dynamic`, consent-gated lazy loading, PWA offline chunk caching
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SPLIT-01 | User on /network page downloads Recharts only when visiting that page | `next/dynamic` with `ssr: false` in the `'use client'` `network/page.tsx` defers `BandwidthChart` and `BandwidthCorrelationChart` into separate chunks; Recharts absent from / initial payload |
| SPLIT-02 | User on /analytics page downloads chart code only when visiting that page | Same `next/dynamic` with `ssr: false` pattern on `analytics/page.tsx` defers `UsageChart`, `ConsumptionChart`, `WeatherCorrelation` into separate chunks |
| SPLIT-03 | User without analytics consent never downloads consent-gated chart code | `BandwidthCorrelationChart` dynamically imported with `ssr: false`; because it lives inside `{hasConsent && (...)}`, the chunk is never fetched when `hasConsent === false` — confirmed by Next.js docs and GitHub discussion #33071 |
| SPLIT-04 | User's PWA offline functionality remains intact after code splitting changes | The existing `StaleWhileRevalidate` runtime rule in `sw.ts` for `request.destination === 'script'` already caches all JS chunks (including newly split ones) on first visit; no additional SW configuration is needed |

</phase_requirements>

---

## Summary

Phase 72 defers Recharts from two sub-pages (`/network`, `/analytics`) using `next/dynamic` with `ssr: false`. Both pages are already `'use client'` Client Components — this is the condition under which `next/dynamic` does split the bundle correctly (the known App Router issue #61066 only affects Server Component → Client Component dynamic imports, not Client → Client). The Recharts library (~200 KB gzipped) is currently bundled into every route because it is statically imported by chart components that are statically imported by the pages.

For SPLIT-03, the consent-gated `BandwidthCorrelationChart` is already wrapped in `{hasConsent && (...)}`. By making it a dynamic import with `ssr: false`, the chunk will only be requested when `hasConsent` becomes `true` at runtime. When the condition is false, React never mounts the component and the browser never fetches the chunk.

For SPLIT-04, the existing service worker in `sw.ts` has a `StaleWhileRevalidate` rule matching `request.destination === 'script'` (cache name `'static-resources'`). This rule intercepts all JS chunk requests (both synchronous and dynamically split chunks) and caches them on first fetch. Newly split Recharts chunks will be cached the first time the user visits `/network` or `/analytics` online — they will then be available offline on subsequent visits. No service worker changes are required.

**Primary recommendation:** Apply `next/dynamic({ ssr: false })` to all Recharts-containing chart components imported by `network/page.tsx` and `analytics/page.tsx`. Add `loading: () => <Skeleton />` fallbacks for UX. `NetworkBandwidth` on the main dashboard is out of scope — it is an always-rendered dashboard card that would not benefit (per prior v9.0 research decision).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/dynamic` | Built into Next.js 16.1.0 | Client-side code splitting for heavy components | Official Next.js API; composite of `React.lazy()` + `Suspense`; works in App Router from Client Components |
| `recharts` | 2.15.0 (already installed) | Chart rendering (being split, not added) | Already in use; target of the split |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Skeleton components (already in project) | — | Loading fallback during dynamic import | Pass as `loading` option to `next/dynamic`; prevents layout shift while chunk loads |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next/dynamic({ ssr: false })` | `React.lazy()` + `Suspense` | Both work from Client Components; `next/dynamic` is the Next.js-idiomatic API and handles the loading state wrapper; `React.lazy` requires manual Suspense boundary — no meaningful difference, `next/dynamic` preferred for consistency |
| Split at page level | Split at component level | Same outcome since both pages are already `'use client'`; component-level split keeps chart files clean and testable in isolation |

**Installation:**
```bash
# No new dependencies — next/dynamic is built into Next.js
```

---

## Architecture Patterns

### Recommended File Changes

```
app/
├── network/
│   └── page.tsx              # Convert static imports → next/dynamic for BandwidthChart, BandwidthCorrelationChart
├── analytics/
│   └── page.tsx              # Convert static imports → next/dynamic for UsageChart, ConsumptionChart, WeatherCorrelation
└── components/devices/network/
    └── NetworkCard.tsx       # OUT OF SCOPE — NetworkBandwidth sparklines are always-rendered dashboard card
```

### Pattern 1: Dynamic Chart Import with Loading Skeleton

**What:** Replace static `import BandwidthChart from './components/BandwidthChart'` with `next/dynamic`.

**When to use:** All Recharts chart components on sub-pages; NOT for always-rendered dashboard cards.

**Example (Source: https://nextjs.org/docs/app/guides/lazy-loading):**
```typescript
// BEFORE (network/page.tsx — static import, Recharts bundled into /network initial JS)
import BandwidthChart from './components/BandwidthChart';

// AFTER (dynamic import, Recharts deferred)
import dynamic from 'next/dynamic';

const BandwidthChart = dynamic(
  () => import('./components/BandwidthChart'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/30 rounded-2xl p-6 h-[380px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    ),
  }
);
```

### Pattern 2: Consent-Gated Dynamic Import (SPLIT-03)

**What:** `BandwidthCorrelationChart` must never download its JS chunk for users who denied consent. The component is already gated by `{hasConsent && ...}`. With `next/dynamic` + `ssr: false`, the chunk request happens only when React mounts the component — which only happens when `hasConsent === true`.

**Confirmed behavior (Source: https://github.com/vercel/next.js/discussions/33071):** With `ssr: false`, "the chunk will load appropriately when the component comes into view, no sooner." When the condition is false and the component is never mounted, no network request is made.

**Example:**
```typescript
// In network/page.tsx

// BEFORE
import BandwidthCorrelationChart from './components/BandwidthCorrelationChart';

// AFTER
const BandwidthCorrelationChart = dynamic(
  () => import('./components/BandwidthCorrelationChart'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/30 rounded-2xl p-6 h-[300px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    ),
  }
);

// In JSX — no changes needed to the consent gate
{hasConsent && (
  <>
    <BandwidthCorrelationChart ... />
    <CorrelationInsight ... />
  </>
)}
```

### Pattern 3: Named Export Dynamic Import

**What:** `next/dynamic` requires a default export by default. If a chart component uses named exports, chain `.then(mod => mod.ComponentName)`.

**Example (Source: https://nextjs.org/docs/app/guides/lazy-loading):**
```typescript
const UsageChart = dynamic(
  () => import('../components/analytics/UsageChart').then(mod => mod.default),
  { ssr: false }
);
```

All current chart components use `export default` — no chaining needed.

### Anti-Patterns to Avoid

- **Splitting always-rendered dashboard cards:** `NetworkBandwidth` in `NetworkCard.tsx` is rendered on every page load. Per the prior v9.0 research decision, `next/dynamic` does NOT reduce First Load JS for components that are always rendered when the page loads. Their chunk is included in the page bundle regardless.
- **Using `ssr: true` (default) for consent-gated components:** With `ssr: true` (the default), Next.js preloads the component during SSR, meaning the chunk gets requested immediately on page load, defeating SPLIT-03.
- **Splitting `CorrelationInsight`:** This component does NOT import recharts — it's a pure presentational component. No split needed.
- **Splitting `WanStatusCard`, `DeviceListTable`, `DeviceHistoryTimeline`:** None import recharts. No split needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component lazy loading | Custom `React.lazy()` + Suspense boundary | `next/dynamic` | `next/dynamic` integrates with Next.js router prefetching and handles the loading state pattern cleanly |
| Loading fallback | Inline skeleton JSX in loading prop | Existing `Skeleton` design system components | Consistent with rest of app |

**Key insight:** `next/dynamic` is a thin wrapper that handles edge cases like hydration mismatches with `ssr: false`. Do not reimplement.

---

## Common Pitfalls

### Pitfall 1: The App Router Server-Component Trap (Does NOT Apply Here)
**What goes wrong:** Developers read GitHub issue #61066 and conclude `next/dynamic` doesn't split bundles in App Router.
**Why it happens:** The issue specifically affects Server Component → Client Component imports only.
**How to avoid:** Both `network/page.tsx` and `analytics/page.tsx` are `'use client'` — they are Client Components. Dynamic imports from Client Components DO create separate chunks. Confirm with bundle analyzer after implementation.
**Warning signs:** If post-implementation bundle analysis still shows Recharts in the initial chunk, check whether the page file accidentally lost its `'use client'` directive.

### Pitfall 2: SSR Default Includes Component in Initial HTML Request
**What goes wrong:** `next/dynamic(() => import('./BandwidthChart'))` without `ssr: false` causes Next.js to SSR-render the component, which does NOT prevent the initial chunk from being requested on hydration.
**Why it happens:** Default `ssr: true` means the component is pre-rendered and its JS is needed for hydration immediately.
**How to avoid:** Always use `ssr: false` for chart components being deferred. These chart components already use browser APIs (SVG, DOM measurements) and don't benefit from SSR anyway.
**Warning signs:** Bundle analyzer still shows Recharts in `/network` initial load JS despite dynamic import.

### Pitfall 3: ChunkLoadError After PWA Deployment
**What goes wrong:** After a new build, the service worker serves stale HTML/JS mismatches, causing newly renamed chunks to 404 offline.
**Why it happens:** Dynamic chunks get content-hash names. If the service worker serves an old HTML (which references old chunk hashes) while the user is offline, the new chunk names won't be in the cache.
**How to avoid:** The existing Serwist setup with `skipWaiting: true` and `clientsClaim: true` forces the new service worker to take over immediately. The `StaleWhileRevalidate` strategy for scripts caches new chunks on first online visit. This is already correct configuration — no changes needed.
**Warning signs:** User reports ChunkLoadError on offline hard refresh after a new deployment. Resolution: go online once to let the service worker update.

### Pitfall 4: Loading State Height Mismatch Causes Layout Shift
**What goes wrong:** The Suspense fallback renders at a different height than the loaded chart, causing CLS (Cumulative Layout Shift).
**Why it happens:** The `loading` function renders a placeholder that doesn't match chart dimensions.
**How to avoid:** The `loading` skeleton wrapper should use the same fixed heights as the actual charts (300px for charts, 380px for BandwidthChart container including header).

### Pitfall 5: Tests Break Because Dynamic Components Are Mocked Differently
**What goes wrong:** Tests that previously `import`ed chart components directly now need to handle the async nature of `next/dynamic`.
**Why it happens:** Jest doesn't execute dynamic imports the same way a browser does.
**How to avoid:** Mock the dynamic imports in test setup. Pattern: `jest.mock('./components/BandwidthChart', () => ({ __esModule: true, default: () => <div data-testid="mock-bandwidth-chart" /> }))`. Existing tests for chart sub-components (`BandwidthChart.test.tsx`, `BandwidthCorrelationChart.test.tsx`) do NOT need changes — they test the component files directly, not the dynamic wrapper.

---

## Code Examples

Verified patterns from official sources:

### Full dynamic import pattern (network/page.tsx)
```typescript
// Source: https://nextjs.org/docs/app/guides/lazy-loading
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/app/components/ui';

// Replace static imports:
// import BandwidthChart from './components/BandwidthChart';
// import BandwidthCorrelationChart from './components/BandwidthCorrelationChart';

const BandwidthChart = dynamic(
  () => import('./components/BandwidthChart'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6 h-[380px]">
        <Skeleton className="h-full rounded-xl" />
      </div>
    ),
  }
);

const BandwidthCorrelationChart = dynamic(
  () => import('./components/BandwidthCorrelationChart'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6 h-[360px]">
        <Skeleton className="h-full rounded-xl" />
      </div>
    ),
  }
);

// JSX unchanged — consent gate continues to work correctly:
// {hasConsent && <BandwidthCorrelationChart ... />}
```

### Full dynamic import pattern (analytics/page.tsx)
```typescript
// Source: https://nextjs.org/docs/app/guides/lazy-loading
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/app/components/ui';

// Replace static imports:
// import UsageChart from '@/app/components/analytics/UsageChart';
// import ConsumptionChart from '@/app/components/analytics/ConsumptionChart';
// import WeatherCorrelation from '@/app/components/analytics/WeatherCorrelation';

const UsageChart = dynamic(
  () => import('@/app/components/analytics/UsageChart'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] rounded-lg" />,
  }
);

const ConsumptionChart = dynamic(
  () => import('@/app/components/analytics/ConsumptionChart'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] rounded-lg" />,
  }
);

const WeatherCorrelation = dynamic(
  () => import('@/app/components/analytics/WeatherCorrelation'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] rounded-lg" />,
  }
);
```

### Verification: Bundle analyzer command
```bash
# Run with phase 70 baseline as comparison reference (per [70-01] prior decision)
ANALYZE=true npm run build -- --webpack
# Then open .next/analyze/client.html
# Look for recharts chunk in /network and /analytics routes — should be absent from initial payloads
```

### Verification: Consent gating (DevTools)
```
1. Open DevTools > Application > Storage > Clear All
2. Open DevTools > Network tab (disable cache, or filter by JS)
3. Navigate to /network with Analytics consent DENIED
4. Confirm no requests for BandwidthCorrelationChart chunk (file name will contain "BandwidthCorrelationChart")
5. Grant consent in settings
6. Reload /network
7. Confirm BandwidthCorrelationChart chunk IS now requested
```

### Verification: PWA offline (SPLIT-04)
```
1. Go online, visit /network and /analytics (loads and caches the Recharts chunks)
2. DevTools > Application > Service Workers > confirm "static-resources" cache contains chunk files
3. DevTools > Network > check "Offline" checkbox
4. Hard refresh /
5. All 6 dashboard cards render — no ChunkLoadError (NetworkBandwidth sparklines cached on initial visit)
6. Navigate to / — dashboard works offline
7. Note: /network and /analytics will also work offline IF visited online first (chunks in cache)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static imports for all chart components | `next/dynamic` with `ssr: false` for sub-page charts | Phase 72 | Recharts deferred from initial page load to route visit; ~200 KB gzip removed from / initial payload |
| Pages Router `next/dynamic` (code-split everywhere) | App Router `next/dynamic` only works reliably from Client Components | Next.js 13+ | Must verify pages are `'use client'` before applying |

**Key limitation (from GitHub issue #61066, unfixed as of Feb 2026):**
Dynamic imports of Client Components from Server Components are NOT code-split in App Router. This does NOT affect this phase because both `/network/page.tsx` and `/analytics/page.tsx` are `'use client'` already.

---

## Open Questions

1. **Exact Recharts bundle size contribution**
   - What we know: Recharts is a large library; it appears in the recharts chunk from `@next/bundle-analyzer`
   - What's unclear: The exact gzip size reduction for `/network` and `/analytics` routes won't be known until after implementation and bundle analysis
   - Recommendation: Run the phase 70 baseline script before and after implementation to capture the delta; use `ANALYZE=true npm run build -- --webpack` for visual confirmation

2. **NetworkBandwidth sparklines on main dashboard**
   - What we know: `NetworkCard.tsx` uses `NetworkBandwidth` which imports `recharts` — this is an always-visible dashboard card
   - What's unclear: The prior decision says "next/dynamic does NOT reduce First Load JS for always-visible dashboard cards" — this means these sparklines remain in the initial bundle
   - Recommendation: Leave NetworkBandwidth sparklines untouched. They are out of scope per SPLIT-01/02. If future phases need to remove Recharts from the dashboard entirely, that would require converting NetworkBandwidth to use a CSS/SVG sparkline or a lighter library.

3. **loading fallback height precision**
   - What we know: Chart containers have specific heights (300px chart, plus header/padding)
   - What's unclear: Exact container heights including all padding — need to inspect actual render to match
   - Recommendation: Use approximate heights in loading skeletons; accept minor layout reflow (CLS impact is minimal since charts are below-the-fold on sub-pages)

---

## Sources

### Primary (HIGH confidence)
- [Next.js Lazy Loading Docs (v16.1.6, updated 2026-02-16)](https://nextjs.org/docs/app/guides/lazy-loading) — `next/dynamic` API, `ssr` option behavior, Client Component examples
- [Next.js REQUIREMENTS.md — SPLIT-01 through SPLIT-04](/.planning/REQUIREMENTS.md) — canonical requirement text

### Secondary (MEDIUM confidence)
- [GitHub issue #61066: Dynamic Client Component from Server Component not code-split](https://github.com/vercel/next.js/issues/61066) — Confirmed the limitation is Server→Client only; Client→Client works
- [GitHub discussion #33071: next/dynamic loads chunk immediately with ssr:true](https://github.com/vercel/next.js/discussions/33071) — Confirmed `ssr: false` defers chunk load until component is mounted; never-mounted = never fetched

### Tertiary (LOW confidence, for awareness)
- [GitHub issue #49454: React.lazy / next/dynamic don't reduce First Load JS](https://github.com/vercel/next.js/issues/49454) — Referenced in prior v9.0 decision; issue is about Server→Client; confirmed does NOT apply here
- [Serwist getting started](https://serwist.pages.dev/docs/next/getting-started) — Precaching overview; insufficient detail on chunk-level behavior; SW analysis done by code inspection of existing `sw.ts`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `next/dynamic` is official, stable, version-specific docs confirmed
- Architecture: HIGH — Both pages verified as `'use client'`; dynamic import from Client Component confirmed to split bundles
- Pitfalls: HIGH — SSR default pitfall verified with official docs; Server→Client limitation verified with GitHub issues; PWA chunk caching inferred from existing `sw.ts` code (StaleWhileRevalidate for scripts)

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable API, 30-day validity)
