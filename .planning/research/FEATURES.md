# Feature Research: Performance Optimization

**Domain:** Next.js 15 PWA — Smart Home Dashboard Performance
**Researched:** 2026-02-18
**Confidence:** HIGH (Core Web Vitals targets and Next.js optimization APIs verified via official docs; project-specific gaps identified by inspecting actual source files)

---

## Context: What Already Exists

These optimizations are ALREADY implemented. Do not re-build them.

| Already Built | Location |
|---------------|----------|
| Adaptive polling (pauses when tab hidden via Page Visibility API) | `lib/hooks/useAdaptivePolling.ts`, `useVisibility.ts`, `useNetworkQuality.ts` |
| Network-quality-aware polling rate adjustment | `lib/hooks/useNetworkQuality.ts` |
| Error boundaries (global + per-device card) | `app/components/ErrorBoundary/` |
| Retry client with exponential backoff | `lib/hooks/useRetryableCommand.ts` |
| Service worker with offline support (Serwist) | `app/sw.ts`, `@serwist/next` |
| Staleness tracking per device | `lib/hooks/useDeviceStaleness.ts` |
| Skeleton loading within cards | `app/components/ui/Skeleton` (used in ThermostatCard) |
| Orchestrator pattern (thin card + hooks + presentational) | StoveCard, LightsCard, NetworkCard, stove/page |
| HLS.js dynamic import (already lazy-loaded) | `app/components/devices/camera/HlsPlayer.tsx` line 177 |
| Masonry flexbox layout | `app/page.tsx` |
| GDPR consent gating for analytics | `app/components/analytics/ConsentBanner.tsx` |

---

## Performance Metrics Targets

"Fast" for this dashboard means:

| Metric | Target (Good) | Acceptable | Current State |
|--------|--------------|------------|---------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 4.0s | Unknown — no measurement baseline |
| **FCP** (First Contentful Paint) | < 1.8s | < 3.0s | Likely poor: Google Fonts via external CDN, all cards eager-loaded |
| **INP** (Interaction to Next Paint) | < 200ms | < 500ms | Unknown |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.25 | Risk: cards render with varying heights, skeleton gaps |
| **TTI** (Time to Interactive) | < 3.8s | < 7.3s | Likely poor: 6 client components + multiple polling hooks bootstrap simultaneously |
| **JS Bundle (First Load)** | < 200KB gzipped | < 400KB | Unknown — no bundle analysis ever done |
| **Font Load** | Self-hosted, no external request | preconnect hint | Currently external Google Fonts CDN — network round-trip on every cold load |

Source: [Core Web Vitals 2025 Guide](https://uxify.com/blog/post/core-web-vitals), [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)

---

## Table Stakes

Features users expect. Missing = dashboard feels slow or broken. These directly address reported symptoms: "slow page loads, sluggish interactions, large bundle size."

| Feature | Why Expected | Complexity | Dependency on Existing Arch | Notes |
|---------|--------------|------------|-----------------------------|-------|
| **Baseline measurement (bundle analyzer + Lighthouse)** | Cannot optimize what you cannot measure. All other optimizations are blind without this. | LOW | None — pure tooling | Add `@next/bundle-analyzer`. Run Lighthouse on dashboard. Captures baseline before any changes. Must be Phase 1. |
| **Font self-hosting via next/font** | Google Fonts on external CDN adds 1-3 RTT on cold load, blocks FCP. next/font eliminates external request, ships fonts with app, zero layout shift via `size-adjust` | LOW | globals.css currently imports from `fonts.googleapis.com` — must replace both CSS import and CSS var declarations | Migrate Outfit + Space Grotesk to `next/font/google`. Removes external network dependency. HIGH confidence: official Next.js docs. |
| **Dynamic imports for heavy device cards** | Dashboard loads all 6 cards synchronously. Cards not in first viewport (below fold on mobile) block initial parse. next/dynamic with Suspense enables progressive rendering | MEDIUM | page.tsx has static imports; all cards are 'use client'. Cards already have error boundaries that can double as Suspense boundaries | ThermostatCard (897 LOC), NetworkCard, WeatherCard are candidates. StoveCard is always above the fold — keep static or prioritize. |
| **optimizePackageImports for icon/UI libraries** | lucide-react ships 1000+ icons; Radix UI has many primitives. Without barrel-file optimization, importing any named export loads the full barrel. Next.js has this built-in for lucide-react but not all Radix packages | LOW | next.config.ts — single config change | Add `@radix-ui/*` packages to `optimizePackageImports`. lucide-react is already optimized by default in Next.js 16. Confirmed via [Next.js docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports). |
| **React Compiler (auto-memoization)** | 60 manual `useCallback/useMemo/React.memo` calls in device components. React Compiler (stable in Next.js 16 via `reactCompiler: true`) auto-memoizes at compile time, eliminating defensive memoization bugs and reducing re-renders by 25-40% | MEDIUM | next.config.ts — one config flag. Project runs Next 16.1.0 + React 19.2.0 — both support stable compiler. Build time increases; must validate no regressions | Verify test suite passes with compiler enabled. If breakage: use `"use no memo"` directive in specific files as escape hatch. Source: [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1). |
| **Recharts dynamic import** | Recharts is ~40KB gzipped. It's used in 7 chart components across analytics, network, and debug pages — none of which are on the dashboard homepage. Yet Recharts loads on every page because it's statically imported in components bundled with layout. | MEDIUM | NetworkBandwidth.tsx is on the dashboard (homepage) — must stay or get a lightweight fallback. Analytics + debug pages can fully defer Recharts. | Wrap Recharts-heavy analytics/debug pages in next/dynamic. NetworkBandwidth uses only `ResponsiveContainer + AreaChart + Area` — consider a CSS-only sparkline instead for the dashboard card, deferring full Recharts to /network page. |

---

## Differentiators

Features that noticeably improve the experience beyond baseline. Not minimum, but high value-to-effort ratio for this dashboard.

| Feature | Value Proposition | Complexity | Dependency on Existing Arch | Notes |
|---------|-------------------|------------|-----------------------------|-------|
| **Suspense streaming per card (loading.tsx shell)** | Dashboard renders a static shell immediately (header, layout structure) while each card streams in independently. First card appears in ~300ms instead of waiting for all 6. Matches Next.js 15 streaming model | MEDIUM | page.tsx currently has no Suspense wrapping. Each DeviceCardErrorBoundary is already a boundary — it can also serve as a Suspense boundary with a skeleton fallback | Move data fetching inside each card with Suspense. This conflicts with current pattern of server-side auth + config fetch in page.tsx — deviceConfig must still be fetched server-side, but card data can move into each card's own fetch. |
| **Staggered card entrance with prefers-reduced-motion** | animate-spring-in with 100ms delay per card already exists. Adding `@media (prefers-reduced-motion: reduce)` to disable animation avoids forcing animation-related compositing on low-power devices. Also resolves potential CLS from delayed card appearance | LOW | globals.css — add media query. Already have `useReducedMotion` hook in `app/hooks/useReducedMotion.ts` | Add CSS: `@media (prefers-reduced-motion: reduce) { .animate-spring-in { animation: none; } }`. Zero JS change required. |
| **Lightweight sparkline for NetworkBandwidth card** | Recharts on the dashboard homepage for a 5-point mini area chart is heavyweight. A 200-byte SVG sparkline (pure CSS/SVG path) renders faster, removes Recharts from the critical path for the main dashboard, and achieves the same visual goal | HIGH | Replaces `ResponsiveContainer + AreaChart + Area` in NetworkBandwidth.tsx. Recharts stays for /network page charts (correlation, full bandwidth history). Requires implementing a small SVG path calculation utility | Alternative: dynamic import NetworkBandwidth with ssr:false in a 'use client' wrapper — simpler, still removes from critical path. |
| **Debounced/batched Firebase writes on rapid user actions** | ThermostatCard setpoint adjustments fire API calls on every +/- click. Rapid clicking causes multiple Firebase RTDB writes + API calls. Debouncing (already have useDebounce hook) gives 50-80% reduction in API calls during quick adjustments | LOW | useDebounce hook already exists in `app/hooks/useDebounce.ts`. Apply in ThermostatCard's calibration and setpoint handlers | Scope: ThermostatCard temperature adjustments. Debounce window: 500ms. Uses existing hook — minimal code change. |
| **Resource hints for API domains** | Add `<link rel="preconnect">` in layout.tsx for Firebase RTDB, Auth0, and Netatmo API domains. Eliminates DNS + TLS handshake time on first API call. 100-300ms saving on cold load | LOW | layout.tsx head section — add 3-4 link tags | Confirmed domains from API routes: Firebase RTDB (`*.firebaseio.com`), Auth0 domain (`*.auth0.com`), Netatmo (`api.netatmo.com`). Zero JS change. |

---

## Anti-Features

Features to explicitly NOT build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full server-side rendering for device cards** | Device cards poll live IoT data (stove state, Netatmo temp, Hue lights). SSR would require server-side polling infrastructure, invalidation strategy, and adds complexity without meaningful user benefit. Users visit dashboard after auth — cold SSR is not the bottleneck. | Keep cards as 'use client' with client-side polling. Optimize the client-side startup cost instead (dynamic imports + React Compiler). |
| **React Query / SWR for data fetching** | Project already has working retry client + adaptive polling hooks (60+ usages). Migrating data fetching to SWR or TanStack Query would rewrite ALL device hooks — massive scope, high regression risk, 0 benefit to end-user performance. | Use existing patterns. If deduplication is needed for shared data (e.g., multiple cards reading same Firebase key), add a lightweight in-memory cache in the existing service layer. |
| **Virtualization of dashboard cards** | TanStack Virtual makes sense for 100+ items. Dashboard has a maximum of 6 cards. Virtualization overhead (ResizeObserver, scroll listeners, absolute positioning) adds more cost than it saves at 6 items. | Simple static layout. Already built the masonry layout — no further layout work needed. |
| **WebAssembly for chart calculations** | LTTB decimation for bandwidth charts (already in network hooks) is the only compute-heavy operation. It runs on thousands of points but still completes in <2ms on any modern device. WASM optimization is engineering theater at this scale. | Keep LTTB in TypeScript as-is. |
| **Service worker pre-caching of API responses** | Stale smart home data is dangerous: a cached "stove is off" response when the stove is actually on could mask a safety state. Service worker already handles offline fallback appropriately. Aggressively pre-caching IoT data inverts this safety guarantee. | Service worker caches static assets (JS, CSS, fonts) only. API responses remain network-first or cache-with-staleness-indicator (already implemented via useDeviceStaleness). |
| **Separate chunk per device card** | Code-splitting each of 6 cards into its own JS chunk creates 6 HTTP requests instead of 1. At current card sizes (188-897 LOC), the chunk overhead exceeds the parse savings. HTTP/2 mitigates this slightly, but chunking 6 small files is net negative. | Use next/dynamic to lazy-load cards that are below the fold or rarely seen — but group them into 1-2 logical chunks, not 6 individual ones. |
| **Manual useMemo/useCallback audit and addition** | There are 60 existing memoization calls. Adding more is counter-productive: React Compiler (already enabled in this milestone) handles memoization automatically. Adding manual memos creates stale closure bugs and conflicts with compiler output. | Enable React Compiler, remove unnecessary manual memos where compiler flags them. |
| **Font subsetting / self-hosting custom WOFF2 files** | next/font/google handles subsetting automatically based on `subsets` parameter. Manual WOFF2 generation and hosting adds build pipeline complexity with no benefit over next/font's built-in handling. | Use `next/font/google` with `subsets: ['latin']`. Done. |

---

## Feature Dependencies

```
Baseline Measurement (Phase 1)
    └──informs──> All optimization phases (prioritization depends on what's actually slow)

Font Self-Hosting
    └──requires──> Remove @import from globals.css
    └──requires──> Add next/font declarations to layout.tsx
    └──conflicts──> CSS variable declarations (must be renamed or updated)

optimizePackageImports
    └──requires──> next.config.ts change only
    └──no conflicts

React Compiler
    └──requires──> reactCompiler: true in next.config.ts
    └──requires──> Test suite validation (60 memoization calls may conflict)
    └──enhances──> All client components (automatic memoization)
    └──conflicts with──> Manual useMemo/useCallback (compiler may warn about conflicts)

Dynamic Imports (card lazy loading)
    └──requires──> 'use client' wrapper for ssr:false usage
    └──requires──> Skeleton fallback for Suspense boundary
    └──enhances──> Suspense streaming per card
    └──conflicts──> Static imports in page.tsx (must be removed)

Suspense Streaming per Card
    └──requires──> Dynamic imports OR Suspense wrapping of existing cards
    └──requires──> Skeleton components per card type (some already exist)
    └──conflicts with──> page.tsx's current pattern of passing server-fetched deviceConfig to CARD_COMPONENTS registry

Recharts Dynamic Import
    └──requires──> next/dynamic in analytics + debug pages
    └──NetworkBandwidth dashboard sparkline: independent (alternative approach)
    └──no conflict with /network page charts (stays static there)

Resource Hints (preconnect)
    └──requires──> layout.tsx head update only
    └──no conflicts
```

### Dependency Notes

- **Baseline measurement must be Phase 1:** All other optimizations are prioritized by what the bundle analyzer and Lighthouse reveal. If fonts aren't actually blocking LCP, font optimization drops in priority.
- **React Compiler conflicts with defensive memoization:** Enabling compiler with existing `useMemo/useCallback` calls is safe (compiler skips opted-out code), but may produce console warnings. The 60 existing calls should be audited — some may be removable, which improves readability without changing behavior.
- **Dynamic imports conflict with page.tsx CARD_COMPONENTS registry:** The current pattern maps card IDs to static component references. Converting to dynamic imports requires changing values in the registry from `StoveCard` to `dynamic(() => import('./StoveCard'))`. This is a surgical change to one file.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase Recommendation |
|---------|------------|---------------------|----------|---------------------|
| Baseline measurement | HIGH (enables everything else) | LOW | P1 | Phase 1, Plan 1 |
| Font self-hosting (next/font) | HIGH (FCP improvement, removes external request) | LOW | P1 | Phase 1, Plan 2 |
| optimizePackageImports | MEDIUM (bundle size, build speed) | LOW | P1 | Phase 1, Plan 2 (same plan as font) |
| Resource hints (preconnect) | MEDIUM (cold load API latency) | LOW | P1 | Phase 1, Plan 2 |
| React Compiler | HIGH (automatic re-render reduction) | MEDIUM (validation needed) | P1 | Phase 2 |
| Dynamic imports for heavy cards | HIGH (initial JS parse reduction) | MEDIUM | P1 | Phase 2 |
| Recharts dynamic import | MEDIUM-HIGH (40KB off critical path) | MEDIUM | P2 | Phase 2 or 3 |
| Suspense streaming per card | HIGH (perceived performance, progressive reveal) | HIGH | P2 | Phase 3 |
| Debounced Firebase writes | LOW-MEDIUM (API efficiency, not user-visible) | LOW | P2 | Phase 3 |
| prefers-reduced-motion CSS | LOW-MEDIUM (accessibility + performance on low-power) | LOW | P2 | Phase 3 |
| Lightweight sparkline for NetworkBandwidth | MEDIUM (removes Recharts from critical path) | HIGH | P3 | Phase 4 (if needed after bundle analysis) |

**Priority key:**
- P1: High impact, low effort — ship first
- P2: High impact, higher effort — ship after P1 validates direction
- P3: Nice to have — defer until baseline metrics prove it's needed

---

## "Fast" for a Smart Home Dashboard

Real-world expectations for a dashboard used daily by one household, accessed primarily via Safari on iOS (PWA installed to home screen):

- **Cold load (first visit after closing app):** User expects the layout shell to appear in <1s, with card skeletons in place. Real data within 2-3s. Currently: all 6 card components block initial render simultaneously.
- **Warm load (app re-opened from recents):** Service worker serves shell instantly. Cached stale data shows immediately with staleness indicator (already implemented). Re-validation happens in background.
- **Interactions (button presses, setpoint changes):** Response must feel <200ms (INP target). Current: no known issues, but React Compiler will reduce re-render overhead.
- **Navigation (dashboard → stove page → back):** Page transition already implemented. Re-entry to cached dashboard should not re-fetch everything.
- **Battery/network efficiency:** Polling pauses when tab hidden (already done). Font loading from CDN adds 1 external request on every cold load — eliminating it with next/font is the most impactful single change.

---

## Sources

- [Next.js optimizePackageImports](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports) — HIGH confidence
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/app/guides/lazy-loading) — HIGH confidence
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) — HIGH confidence
- [React Compiler v1.0 Release](https://react.dev/blog/2025/10/07/react-compiler-1) — HIGH confidence
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16) — HIGH confidence (reactCompiler: true stable)
- [Core Web Vitals Targets 2025](https://uxify.com/blog/post/core-web-vitals) — MEDIUM confidence (third party, but consistent with Google's published thresholds)
- [Recharts bundle size ~40KB gzipped](https://bundlephobia.com/package/recharts) — MEDIUM confidence (bundlephobia, not versioned to exact installed version)
- [Vercel: How we optimized package imports in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) — HIGH confidence

---

*Feature research for: Next.js 15.5 PWA — Performance Optimization milestone*
*Researched: 2026-02-18*
