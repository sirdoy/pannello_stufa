# Architecture Research: Performance Optimization

**Domain:** Next.js 15.5 App Router + React 19 performance optimization
**Researched:** 2026-02-18
**Confidence:** HIGH (Next.js official docs) / MEDIUM (build-time data from existing .next/ output)

## Standard Architecture

### System Overview: Performance Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BUNDLE OPTIMIZATION LAYER                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  next.config.ts: optimizePackageImports (lucide-react,       │    │
│  │  recharts, date-fns already auto-optimized) + reactCompiler  │    │
│  └──────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│                        CODE SPLITTING LAYER                          │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────────┐   │
│  │  Dashboard   │  │  Network Page │  │  Analytics Page         │   │
│  │  (Server)    │  │  ('use client'│  │  ('use client')         │   │
│  │  6 cards     │  │  Recharts x2) │  │  Recharts x3)           │   │
│  │  dynamic()   │  │  dynamic()    │  │  dynamic()              │   │
│  └──────┬───────┘  └──────┬────────┘  └──────────┬──────────────┘   │
│         │                 │                       │                  │
├─────────┴─────────────────┴───────────────────────┴──────────────────┤
│                        RENDER OPTIMIZATION LAYER                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  React Compiler (auto-memoization) - via babel-plugin        │    │
│  │  Orchestrator hooks (stable refs, no inline callbacks)       │    │
│  │  Existing: useAdaptivePolling + useVisibility (tab-pause)    │    │
│  └──────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│                        POLLING EFFICIENCY LAYER                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  useNetworkQuality → adaptive intervals (existing)           │    │
│  │  useVisibility → pause when tab hidden (existing)            │    │
│  │  DeviceCardErrorBoundary → isolate card failures             │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Current Build State (Observed)

From `.next/static/chunks/` (build from ~9 Feb 2026):

| Chunk | Size | Likely Contents |
|-------|------|-----------------|
| `2151-...js` | 620 KB | Large shared chunk (Recharts + firebase?) |
| `5ffe...js` | 550 KB | Unknown large dependency |
| `a463...js` | 498 KB | Unknown large dependency |
| `6197-...js` | 399 KB | Unknown large dependency |
| `framework-...js` | 185 KB | React runtime (expected) |
| `main-...js` | 136 KB | App bootstrap |
| `polyfills-...js` | 109 KB | Browser polyfills (expected) |

Total static JS: ~5.9 MB (uncompressed). Top 4 chunks sum to ~2 MB — significant candidates for lazy-splitting.

### Component Responsibilities

| Component | Responsibility | Performance Status |
|-----------|----------------|---------------------|
| `app/page.tsx` (Server) | Dashboard server component, fetches device config, renders card grid | Already server-rendered — no client JS for orchestration itself |
| `StoveCard` ('use client') | Stove state + commands, 188 LOC | Loaded eagerly on dashboard |
| `ThermostatCard` ('use client') | Thermostat + schedule management, 897 LOC — largest card | Loaded eagerly; biggest split candidate |
| `LightsCard` ('use client') | Hue lights control, 185 LOC | Loaded eagerly |
| `NetworkCard` ('use client') | Fritz!Box summary card, 141 LOC | Loaded eagerly |
| `CameraCard` ('use client') | Netatmo camera, 371 LOC | Loaded eagerly; HlsPlayer dynamically imports hls.js |
| `WeatherCardWrapper` ('use client') | Weather display, 131 LOC | Loaded eagerly |
| `HlsPlayer` ('use client') | HLS video, 301 LOC | Already uses `await import('hls.js')` dynamically — CORRECT |
| `BandwidthChart` | Recharts on network page, 219 LOC | Not on dashboard; network page loads eagerly |
| `BandwidthCorrelationChart` | Recharts on network page, 218 LOC | Consent-gated but imported eagerly |
| `UsageChart` | Recharts on analytics page | Analytics page loads all charts eagerly |
| `ThermostatCard` thermostat page | Full thermostat management, 897 LOC | Largest client file in codebase |

## Recommended Project Structure Changes

No new directories needed. Changes are additive within existing structure:

```
app/
├── page.tsx                    # MODIFY: Wrap card imports with dynamic()
├── components/devices/
│   ├── stove/StoveCard.tsx     # NO CHANGE (188 LOC, acceptable)
│   ├── thermostat/
│   │   └── ThermostatCard.tsx  # NO CHANGE (split happens at dashboard level)
│   ├── lights/LightsCard.tsx   # NO CHANGE
│   ├── network/NetworkCard.tsx  # NO CHANGE
│   ├── camera/
│   │   ├── CameraCard.tsx      # NO CHANGE (dynamic HLS already correct)
│   │   └── HlsPlayer.tsx       # NO CHANGE (already uses await import('hls.js'))
│   └── weather/WeatherCardWrapper.tsx  # NO CHANGE
├── network/
│   ├── page.tsx                # MODIFY: dynamic() for Recharts components
│   └── components/
│       ├── BandwidthChart.tsx          # NO CHANGE (component itself unchanged)
│       └── BandwidthCorrelationChart.tsx  # NO CHANGE
└── analytics/
    └── page.tsx                # MODIFY: dynamic() for chart components
next.config.ts                  # MODIFY: Add reactCompiler: true
```

### Structure Rationale

- **No new folders:** Dynamic imports don't need co-located loading files; the existing `Skeleton.*` namespace provides loading states that serve as fallbacks.
- **Modify pages, not components:** The split boundary is at the page/card level (import site), not inside individual components.
- **Skeleton components already exist:** `Skeleton.StovePanel`, `Skeleton.NetworkCard`, etc. — use these as dynamic() `loading` fallbacks.

## Architectural Patterns

### Pattern 1: Dashboard Card Lazy Loading (Server Component → dynamic())

**What:** The dashboard `app/page.tsx` is a Server Component that currently imports all 6 card components statically. Replace static imports with `dynamic()` so each card loads as a separate chunk.

**When to use:** Any card that is not visible above-the-fold on initial load. The masonry layout means cards lower in the page (positions 3-6) can defer.

**Trade-offs:**
- Pro: Each card becomes an independent JS chunk — cache busting is per-card
- Pro: Dashboard HTML renders server-side immediately; card JS loads in parallel
- Pro: Disabled/hidden cards never load their JS
- Con: First card renders slightly later (one more network round-trip for the chunk)
- Con: `ssr: false` cannot be used from a Server Component — do NOT add it

**Implementation:**

```typescript
// app/page.tsx (Server Component) — CORRECT pattern
import dynamic from 'next/dynamic';
import Skeleton from './components/ui/Skeleton';

// Server Components: dynamic() gives automatic code splitting only
// ssr: false is NOT allowed here (Server Component constraint)
const StoveCard = dynamic(
  () => import('./components/devices/stove/StoveCard'),
  { loading: () => <Skeleton.StovePanel /> }
);

const ThermostatCard = dynamic(
  () => import('./components/devices/thermostat/ThermostatCard'),
  { loading: () => <Skeleton className="h-64 rounded-2xl" /> }
);

const LightsCard = dynamic(
  () => import('./components/devices/lights/LightsCard'),
  { loading: () => <Skeleton className="h-48 rounded-2xl" /> }
);

// ... same for NetworkCard, WeatherCardWrapper, CameraCard
```

**Important constraint (HIGH confidence, official docs):** `ssr: false` in `dynamic()` is NOT supported in Server Components. It triggers a build-time error in Next.js 15. The dashboard `page.tsx` is a Server Component (`async function Home()`), so omit `ssr` entirely — the default (SSR enabled) is correct for cards that need to hydrate.

### Pattern 2: Client Component Recharts Lazy Loading (ssr: false)

**What:** On `app/network/page.tsx` and `app/analytics/page.tsx` (both `'use client'`), Recharts chart components can use `dynamic()` with `ssr: false` because Recharts uses browser-only APIs.

**When to use:** Chart components that appear below the fold and use browser-only APIs (Recharts, canvas-based, SVG animations). The `BandwidthCorrelationChart` is also consent-gated, making it a perfect lazy-load candidate.

**Trade-offs:**
- Pro: Recharts (~400 KB minified) deferred until needed
- Pro: `ssr: false` avoids hydration mismatches for SVG/canvas
- Con: Chart appears later on first load (user sees skeleton)
- Con: Must ensure chart parent has explicit height to prevent layout shift

**Implementation:**

```typescript
// app/network/page.tsx ('use client') — CORRECT pattern
import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/ui/Skeleton';

const BandwidthChart = dynamic(
  () => import('./components/BandwidthChart'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[380px] rounded-2xl" />,
  }
);

const BandwidthCorrelationChart = dynamic(
  () => import('./components/BandwidthCorrelationChart'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] rounded-2xl" />,
  }
);

// CorrelationInsight is consent-gated — only import if hasConsent
// Already conditionally rendered: {hasConsent && <BandwidthCorrelationChart />}
// The dynamic() ensures its JS never loads until hasConsent is true
```

### Pattern 3: React Compiler (Automatic Memoization)

**What:** Enable `reactCompiler: true` in `next.config.ts`. The compiler automatically memoizes components and hooks using Babel plugin under the hood, replacing the need for manual `useMemo`/`useCallback` in most cases.

**When to use:** All components. The compiler uses opt-out (`"use no memo"`) rather than opt-in, so it applies broadly.

**Trade-offs:**
- Pro: Eliminates manual memoization bugs (stale closure from missing deps)
- Pro: Handles ThermostatCard's complex state without refactoring (897 LOC)
- Pro: Orchestrator hooks (useStoveData, useNetworkData) automatically get stable function references
- Con: Requires installing `babel-plugin-react-compiler` as devDependency
- Con: Slightly slower builds (SWC selectively runs Babel only on JSX/hooks files)
- Con: Does NOT replace `ssr: false` or dynamic imports — different optimization axis

**Important status (HIGH confidence, React blog Oct 2025):** React Compiler v1.0 released stable October 2025. Next.js 16 marks it stable with built-in integration. The project is on Next.js 16.x (`"next": "^16.1.0"` in package.json), so this is fully supported.

```typescript
// next.config.ts — add reactCompiler
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({ /* existing config */ });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,  // ADD THIS
  // ... existing config
};

export default withSerwist(nextConfig);
```

```bash
# Install required package
npm install -D babel-plugin-react-compiler
```

### Pattern 4: optimizePackageImports (Already Handled)

**What:** Next.js already optimizes `lucide-react`, `recharts`, and `date-fns` by default in the `experimental.optimizePackageImports` list.

**Status:** No action needed. These packages are in the default list as of Next.js 15+ (confirmed: official docs, version 16.1.6, 2026-02-11). Adding them explicitly to the config would be redundant.

**Verification:** The project uses `lucide-react` in ~dozens of components and `recharts` in 7 files. These imports are already tree-shaken to only the icons/components actually used.

### Pattern 5: Server Component Card Preloading (Advanced)

**What:** For the dashboard, Next.js App Router already handles the most important optimization: `app/page.tsx` is a Server Component, so the HTML for the card shells arrives from the server with no client JS overhead for the page orchestration itself. The client JS per-card only hydrates interactivity.

**Implication:** The masonry layout, column assignment (`splitIntoColumns`), and animation delays are already computed server-side at zero client cost. This pattern is correct and should be preserved.

## Data Flow

### Dashboard Load Flow (Current + Optimized)

```
Browser requests /
    ↓
Next.js Server renders app/page.tsx
  - auth0.getSession() (server)
  - getUnifiedDeviceConfigAdmin() (server)
  - splitIntoColumns() (server)
  - HTML with card placeholders
    ↓
Browser receives HTML immediately (streaming)
    ↓
Browser downloads JS chunks (parallel):
  [framework.js] [main.js] [StoveCard.chunk.js]
  [ThermostatCard.chunk.js] [LightsCard.chunk.js]
  [NetworkCard.chunk.js] ...
    ↓
Each card hydrates independently
    ↓
Each card's useXxxData hook starts polling
  - useAdaptivePolling pauses when tab hidden (existing)
  - useNetworkQuality adjusts intervals (existing)
```

With `dynamic()`, each card chunk downloads independently rather than in one large bundle, enabling:
- Parallel downloads (browsers allow 6+ concurrent requests)
- Independent cache invalidation (card A update doesn't bust card B cache)
- Disabled cards (visibleCards excludes them) never load their chunk

### Recharts Data Flow (Network Page)

```
Network Page mounts
    ↓
useNetworkData starts polling (30s interval)
    ↓
BandwidthChart (dynamic, ssr: false)
  ← Renders only after chunk loads
  ← Shows Skeleton while chunk downloads
    ↓
bandwidthHistory.addDataPoint() feeds chart
    ↓
BandwidthCorrelationChart (dynamic, consent-gated)
  ← Only loads if hasConsent === true
  ← Chunk never downloaded if consent denied
```

## Scaling Considerations

This is a single-user PWA (personal smart home), so scaling is not a concern. Performance goals are:

| Goal | Metric | Current | Target |
|------|--------|---------|--------|
| Initial JS per page | First Load JS | Unknown (no analyzer) | Dashboard < 200 KB gzipped above-fold |
| Card hydration | TTI after HTML | Unknown | Each card independent |
| Recharts on Network page | Chunk deferral | Eagerly loaded | Deferred until render |
| React re-renders | Manual memoization | Sparse | Auto via compiler |

## Anti-Patterns

### Anti-Pattern 1: ssr: false in Server Components

**What people do:** Add `dynamic(import(...), { ssr: false })` in a file without `'use client'`.

**Why it's wrong:** Next.js 15 throws a build-time error: "ssr: false is not allowed with next/dynamic in Server Components."

**Do this instead:** Omit `ssr` when calling `dynamic()` from a Server Component. For chart components that need `ssr: false`, move the `dynamic()` call into the Client Component page file (which already has `'use client'`).

**Affected files:** `app/page.tsx` is a Server Component — cannot use `ssr: false`. `app/network/page.tsx` and `app/analytics/page.tsx` have `'use client'` — can use `ssr: false`.

### Anti-Pattern 2: Dynamic Importing at Component Level Instead of Import Site

**What people do:** Inside `StoveCard.tsx`, wrapping sub-components (`StoveBanners`, `StoveAdjustments`) with `dynamic()`.

**Why it's wrong:** The sub-components are already co-located, small, and share state with their parent. The split granularity is too fine — each dynamic boundary adds a network waterfall. The orchestrator pattern means sub-components have no standalone value.

**Do this instead:** Split at the card level (e.g., `dynamic(() => import('./StoveCard'))`), not at the sub-component level. One card = one chunk boundary.

### Anti-Pattern 3: React Compiler with Non-Standard Patterns

**What people do:** Enable `reactCompiler: true` on code that uses non-standard patterns incompatible with the compiler.

**Why it's wrong:** The compiler cannot optimize components that mutate state without `setState`, use non-standard hooks, or have complex conditional hook calls.

**Specific risk in this codebase:** `ThermostatCard.tsx` is 897 LOC with complex state (15+ useState calls, multiple useEffect, inline handlers). The compiler may not fully optimize it. Use `"use no memo"` at the top of ThermostatCard if the compiler produces incorrect behavior, then refactor ThermostatCard to the orchestrator pattern (like StoveCard) as a separate phase.

**Detection:** Run `NEXT_PUBLIC_TEST_MODE=true npm run build` and watch for compiler warnings, or annotate with `compilationMode: 'annotation'` initially and opt-in `"use memo"` per-file.

### Anti-Pattern 4: Lazy Loading Components That Are Always Visible

**What people do:** Wrapping `StoveCard` or `NetworkCard` with `dynamic()` and expecting load-time savings, but these cards are always in the viewport on desktop.

**Why it's wrong:** The network round-trip for the chunk introduces latency without benefit if the card is immediately visible. The skeleton flashes for no reason.

**Do this instead:** Priority-load the first 2 cards (stove, thermostat — always visible). Lazy-load cards 3-6 (weather, lights, camera, network — may be below fold). In practice, `dynamic()` without `ssr: false` on a Server Component still splits the chunk, so all cards can use it — the browser downloads them in parallel.

### Anti-Pattern 5: Bundle Analyzer Not Set Up

**What people do:** Optimize by guessing which chunks are large.

**Why it's wrong:** The current build shows 4 chunks over 400 KB but without the analyzer it's impossible to know if these contain Recharts, Firebase SDK, Auth0, or application code.

**Do this instead:** Add `@next/bundle-analyzer` as a devDependency first. Run `ANALYZE=true npm run build --webpack` to identify actual culprits before adding dynamic imports. The build uses `--webpack` flag (not Turbopack) for PWA compatibility, so the analyzer works as-is.

```typescript
// next.config.ts with analyzer
import withBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Wrap the final export:
export default withBundleAnalyzerConfig(withSerwist(nextConfig));
```

## Integration Points

### New vs Modified Components

| File | Action | Rationale |
|------|--------|-----------|
| `next.config.ts` | MODIFY: add `reactCompiler: true` | Enables auto-memoization |
| `package.json` | MODIFY: add `babel-plugin-react-compiler` to devDependencies | Required by React Compiler |
| `app/page.tsx` | MODIFY: replace static imports with `dynamic()` | Splits each card into its own chunk |
| `app/network/page.tsx` | MODIFY: replace Recharts component imports with `dynamic({ ssr: false })` | Defers large chart chunks |
| `app/analytics/page.tsx` | MODIFY: replace chart imports with `dynamic({ ssr: false })` | Defers Recharts for consent-gated page |
| `app/components/ui/Skeleton.tsx` | MODIFY: ensure adequate named skeleton variants exist for all lazy-loaded cards | Provides loading fallbacks |
| NO new components | | All optimizations are configuration + import-site changes |

### Internal Boundaries

| Boundary | Communication | Performance Note |
|----------|---------------|-----------------|
| Server Component (page.tsx) → Client Components (cards) | `dynamic()` import | Split point; chunk loaded after HTML |
| Card orchestrator → sub-components | Direct import (same chunk) | No split needed; co-located |
| Network/Analytics page → Recharts | `dynamic({ ssr: false })` | Chart chunk deferred |
| useAdaptivePolling → poll callbacks | ref pattern (existing) | Stable — compiler-friendly |
| ClientProviders → all client state | Context (existing) | Not a performance concern at this scale |

## Suggested Build Order

Based on dependency analysis and risk:

1. **Phase A — Bundle Analysis (no code change)**
   - Add `@next/bundle-analyzer` to devDependencies
   - Run `ANALYZE=true npm run build --webpack`
   - Identify actual large chunks (verify Recharts vs Firebase vs application code)
   - Produces: data to prioritize Phase B/C

2. **Phase B — React Compiler**
   - Install `babel-plugin-react-compiler`
   - Add `reactCompiler: true` to `next.config.ts`
   - Run full test suite (3034 tests must pass)
   - If ThermostatCard causes compiler issues, add `"use no memo"` directive temporarily
   - Risk: LOW (opt-out available; build-time only change)

3. **Phase C — Dashboard Card Code Splitting**
   - Modify `app/page.tsx`: replace 6 static card imports with `dynamic()`
   - Add `Skeleton.*` loading fallbacks for any missing card skeletons
   - Run visual test to verify no card flashes or layout shifts
   - Risk: LOW (Server Component dynamic() is well-supported; no ssr: false needed)

4. **Phase D — Recharts Lazy Loading**
   - Modify `app/network/page.tsx`: dynamic({ ssr: false }) for BandwidthChart, BandwidthCorrelationChart
   - Modify `app/analytics/page.tsx`: dynamic({ ssr: false }) for UsageChart, ConsumptionChart, WeatherCorrelation
   - Verify consent-gated BandwidthCorrelationChart loads only when hasConsent === true
   - Risk: MEDIUM (ssr: false changes hydration behavior — test on mobile PWA)

5. **Phase E — ThermostatCard Orchestrator Refactor (optional)**
   - ThermostatCard is 897 LOC — not following the orchestrator pattern
   - Extract sub-components and hooks (like StoveCard did in Phase 58/59)
   - This enables the React Compiler to optimize it fully
   - Risk: HIGH (large refactor; regression risk for thermostat features)
   - Note: Can be deferred — React Compiler handles monolithic components partially

## Sources

- [Next.js Lazy Loading — Official Docs](https://nextjs.org/docs/app/guides/lazy-loading) (v16.1.6, 2026-02-11) — HIGH confidence
- [Next.js optimizePackageImports — Official Docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports) (v16.1.6, 2026-02-11) — HIGH confidence; lucide-react, recharts, date-fns confirmed in default list
- [Next.js reactCompiler — Official Docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler) (v16.1.6, 2026-02-11) — HIGH confidence
- [React Compiler v1.0 Blog Post](https://react.dev/blog/2025/10/07/react-compiler-1) — HIGH confidence; stable release October 2025
- [React 19 useMemo/useCallback in React Compiler context](https://stevekinney.com/courses/react-performance/usememo-usecallback-in-react-19) — MEDIUM confidence
- [@next/bundle-analyzer npm](https://www.npmjs.com/package/@next/bundle-analyzer) — HIGH confidence
- [Vercel: How we optimized package imports in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) — HIGH confidence

---
*Architecture research for: Performance optimization of Next.js 15.5 PWA smart home dashboard*
*Researched: 2026-02-18*
