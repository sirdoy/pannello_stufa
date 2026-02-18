# Project Research Summary

**Project:** Pannello Stufa — Performance Optimization Milestone
**Domain:** Next.js 16.1 PWA (smart home dashboard) — bundle analysis, code splitting, interaction optimization
**Researched:** 2026-02-18
**Confidence:** HIGH (primary sources: Next.js 16.1.6 official docs, React docs, verified npm registry versions)

## Executive Summary

This milestone targets measurable performance improvements on an already well-engineered Next.js 16.1 + React 19 PWA smart home dashboard. The codebase is mature (v1.77.0, 322+ plans, 575 TypeScript files, strict mode, 3034 tests) with strong foundations already in place: adaptive polling, error boundaries, orchestrator component pattern, service worker with offline support, and LTTB-decimated bandwidth charts. The optimization work is additive, not structural. The biggest wins come from four specific changes: font self-hosting via `next/font`, measuring baseline with `@next/bundle-analyzer`, enabling React Compiler (`reactCompiler: true`), and lazy-loading Recharts chart components on sub-pages.

The most important finding from combined research is a critical constraint inversion: the obvious approach of applying `next/dynamic` to all six device cards will NOT reduce First Load JS in Next.js App Router because device cards are already Client Components — App Router includes all Client Component chunks in the initial payload regardless of `next/dynamic` usage (confirmed by vercel/next.js #49454 and #61066). `next/dynamic` only splits components that are NOT in the initial render path. This means dynamic imports are useful for Recharts charts on sub-pages, conditional modals, and consent-gated panels — not for always-visible dashboard cards. Every phase must measure bundle size before and after, not assume improvement.

The secondary critical risk is the PWA offline shell. Any code splitting introduced via `next/dynamic` creates new hashed chunk filenames that must appear in Serwist's `__SW_MANIFEST` precache or the offline experience will break with `ChunkLoadError`. Additionally, React Compiler (stable since October 2025) offers automatic memoization but requires health-checking the codebase first (`npx react-compiler-healthcheck`) because it silently bails out on Rules of React violations without warning. These risks are fully avoidable with the verification steps documented in PITFALLS.md.

## Key Findings

### Recommended Stack

Full details: `.planning/research/STACK.md`

The minimal install surface is two packages: `@next/bundle-analyzer` (devDependency) and `web-vitals@5.1.0` (runtime, 3KB gzipped). Everything else — `next/dynamic`, `React.lazy`, `useTransition`, `useDeferredValue`, React Compiler — is built into the already-installed Next.js 16.1.3 and React 19.2.3. The project uses webpack for production builds (required by Serwist) and Turbopack for development, so `@next/bundle-analyzer` targets the webpack production artifact correctly.

**Core technologies:**
- `@next/bundle-analyzer@16.1.6`: Production bundle analysis — generates `client.html`, `server.html`, `edge.html` reports. Run with `ANALYZE=true npm run build -- --webpack`. Identifies actual large chunks (current build has 4 chunks over 399 KB each).
- `web-vitals@5.1.0`: Real User Monitoring — `onLCP`, `onINP`, `onCLS`, `onFCP`, `onTTFB`. INP replaces FID (March 2024). Attribution build provides INP breakdown. Integrates with `useReportWebVitals` in `app/layout.tsx`.
- `next/dynamic` (built-in): Code splitting — only effective for components NOT in the initial Client Component render path. Useful for Recharts charts on sub-pages, conditional panels. `ssr: false` requires `'use client'` context.
- `useTransition` / `useDeferredValue` (React 19 built-in): Interaction optimization — wrap polling `setState` calls to avoid blocking user interactions (INP impact); defer Recharts renders during data updates.
- `babel-plugin-react-compiler` (devDependency): Required by `reactCompiler: true` in `next.config.ts`. Stable as of October 2025, fully supported by Next.js 16.

**Critical version note:** `lucide-react`, `recharts`, and `date-fns` are already in Next.js's default `optimizePackageImports` list. Adding them explicitly to `next.config.ts` would be redundant — no config change needed.

**Critical constraint (confirmed HIGH confidence):** `ssr: false` in `dynamic()` is NOT supported in Server Components. `app/page.tsx` is a Server Component — omit `ssr` entirely when calling `dynamic()` from there. Only Client Component pages (`app/network/page.tsx`, `app/analytics/page.tsx`) can use `{ ssr: false }`.

### Expected Features

Full details: `.planning/research/FEATURES.md`

**Must have (table stakes — without these optimization work is blind or broken):**
- Baseline measurement (bundle analyzer + Lighthouse) — cannot optimize what you cannot measure; must be Phase 1
- Font self-hosting via `next/font/google` — Google Fonts CDN adds 1-3 RTT on every cold load; eliminates the most impactful single external network request
- Resource hints (preconnect to Firebase RTDB, Auth0, Netatmo API) — eliminates DNS+TLS handshake on first API call; zero JS change
- React Compiler (`reactCompiler: true`) — auto-memoization of all components; replaces 60 existing manual `useMemo`/`useCallback` calls with safer compile-time memoization
- Recharts lazy loading on analytics/network sub-pages — Recharts is ~40KB gzipped; can be fully deferred with `dynamic({ ssr: false })` on pages where it is NOT in initial render
- Core Web Vitals measurement (`web-vitals` + `useReportWebVitals`) — production pipeline to validate optimization impact

**Should have (high value-to-effort ratio):**
- Suspense streaming per card — dashboard shell renders immediately while each card streams independently; first card visible ~300ms instead of waiting for all 6
- Polling stagger via `initialDelay` in `useAdaptivePolling` — prevents thundering herd: all 6 cards currently fire initial fetches within 100ms; priority order: stove (delay=0, safety-critical) → thermostat (50ms) → lights (100ms) → weather (250ms) → camera (400ms) → network (500ms)
- Recharts animation disabled on updates (`isAnimationActive={false}`) — animations restart on every poll tick causing visible chart flicker every 30s
- Debounced Firebase writes for thermostat setpoint — `useDebounce` hook already exists; 500ms window reduces rapid-click API calls by 50-80%

**Defer to later (low value or high complexity):**
- Lightweight SVG sparkline replacing Recharts in NetworkBandwidth card — HIGH complexity; `next/dynamic` wrapper achieves similar goal at lower cost
- ThermostatCard orchestrator refactor (897 LOC) — HIGH risk; React Compiler handles it partially without refactoring; separate milestone
- Service Worker API response pre-caching — dangerous for IoT data (stale "stove is off" could mask a safety state)
- Virtualization of dashboard cards — 6 cards max; TanStack Virtual is for 100+ item lists
- React Query/SWR migration — rewrites all 60+ polling hooks; high regression risk, zero user-visible benefit
- Manual `useMemo`/`useCallback` audit and additions — React Compiler makes this counterproductive; compiler handles memoization automatically

**Already built — do not rebuild:**
Adaptive polling (`useAdaptivePolling`, `useVisibility`, `useNetworkQuality`), error boundaries, retry client, service worker offline support, LTTB decimation, orchestrator pattern, GDPR consent gating, staleness indicators, skeleton loading states.

### Architecture Approach

Full details: `.planning/research/ARCHITECTURE-performance-optimization.md`

The optimization architecture has four distinct layers: bundle optimization (config-level), code splitting (import-site changes only), render optimization (React Compiler + targeted memoization), and the already-complete polling efficiency layer. No new directories or components are needed. All changes are configuration modifications and import-site changes in existing files. The server/client boundary in `app/page.tsx` (Server Component) already provides correct architecture — client JS for page orchestration is zero, and the masonry layout + column assignment (`splitIntoColumns`) runs server-side at zero client cost.

**Major components and their optimization status:**

| File | Action | Rationale |
|------|--------|-----------|
| `next.config.ts` | MODIFY: chain `withBundleAnalyzer`, add `reactCompiler: true` | Bundle analysis + auto-memoization |
| `app/layout.tsx` | MODIFY: add `next/font` declarations, `useReportWebVitals`, preconnect hints | Font self-hosting + Web Vitals + API domain preconnect |
| `app/page.tsx` (Server Component) | MODIFY: `dynamic()` for below-fold cards | Code splitting — omit `ssr: false` (Server Component constraint) |
| `app/network/page.tsx` (`'use client'`) | MODIFY: `dynamic({ ssr: false })` for BandwidthChart, BandwidthCorrelationChart | Recharts deferred on sub-page |
| `app/analytics/page.tsx` (`'use client'`) | MODIFY: `dynamic({ ssr: false })` for UsageChart, ConsumptionChart, WeatherCorrelation | Recharts deferred on sub-page |
| `app/components/ui/Skeleton.tsx` | MODIFY if needed: ensure named skeleton variants exist for lazy-loaded components | Loading fallbacks for dynamic() |
| No new components or directories | | Optimizations are config + import-site changes |

**Current build state (from `.next/static/chunks/` observed):** 4 chunks over 399 KB each (total static JS ~5.9 MB uncompressed). Contents of large chunks are unknown without running the bundle analyzer — this is the first deliverable of Phase 1.

### Critical Pitfalls

Full details: `.planning/research/PITFALLS.md`

1. **`next/dynamic` does not reduce First Load JS for Client Components** — App Router bundles all Client Component chunks into the initial payload. Measure with `@next/bundle-analyzer` before adding any `dynamic()` wrappers; if `First Load JS` does not decrease, the optimization did nothing. Target `next/dynamic` only for components absent from initial render: Recharts charts on sub-pages, consent-gated panels, conditional modals.

2. **PWA offline shell broken by code splitting** — New `next/dynamic` calls create new hashed chunk filenames that may not appear in Serwist's `__SW_MANIFEST` precache. After any build that adds code splitting, open `public/sw.js` and verify new chunk names are in the precache array. Test explicitly: load dashboard, DevTools Network → Offline, hard-refresh, assert all 6 cards render without `ChunkLoadError`.

3. **Recharts SVG re-renders on every polling tick** — Recharts is not memoized by default. The `data` array creates a new reference on every poll tick (spread/concat), so `React.memo` alone provides no benefit. Must also stabilize `data` with `useMemo` keyed on `lastTimestamp + length`. Set `isAnimationActive={false}` on all series — animation restarts on every re-render and causes visible chart flicker every 30s.

4. **React Compiler silently bails out on Rules of React violations** — Compiler skips optimizing non-compliant components without any warning. Run `npx react-compiler-healthcheck` before enabling. ThermostatCard (897 LOC, 15+ `useState` calls) is highest-risk — use `"use no memo"` directive as escape hatch. Do not enable React Compiler in the same phase as other optimizations; it must be isolated to attribute any regressions.

5. **Thundering herd on dashboard load** — All 6 device cards fire initial fetches within ~100ms of mount (no stagger in current implementation). Add `initialDelay` parameter to `useAdaptivePolling`. Keep stove at delay=0 (safety-critical; uses Firebase RTDB listener as primary path — verify this is not accidentally converted to polling during optimization work).

6. **Stale JS chunks after deployment** — `StaleWhileRevalidate` for scripts serves old cached chunks when new deployment changes chunk filenames. Implement `controllerchange` listener + toast: "Una nuova versione dell'app è disponibile" with reload button. Never change script cache strategy to `CacheFirst`.

7. **`force-dynamic` conflict with ISR** — `app/page.tsx` exports `force-dynamic` for Auth0 session. Do not add `revalidate` exports to any component in the dashboard import tree. Map current route rendering modes with `next build` before any optimization; use as baseline to detect unexpected changes.

## Implications for Roadmap

Based on combined research, the natural phase structure follows a measure-first discipline: you cannot know which optimizations are worth doing until you have the bundle analyzer output and a Lighthouse baseline. The ordering is informed by dependencies — measurement enables everything, React Compiler must be isolated, sub-page code splitting is safe and confirmed effective, runtime optimization addresses a different axis than bundle size.

### Phase 1: Measurement Baseline + Zero-Risk Quick Wins

**Rationale:** All other optimization decisions depend on what the bundle analyzer reveals. Font self-hosting and resource hints are zero-risk, high-impact changes that require no measurement to justify. Establish the baseline, then apply the three changes that are unconditionally correct regardless of what the analysis shows.
**Delivers:** Bundle analyzer infrastructure (`@next/bundle-analyzer`), Lighthouse baseline metrics captured, self-hosted fonts via `next/font/google` eliminating external CDN request from every cold load, preconnect hints for Firebase RTDB/Auth0/Netatmo API domains, `web-vitals` measurement pipeline in production, route rendering mode baseline from `next build` output.
**Addresses:** Baseline measurement (P1), font self-hosting (P1), resource hints (P1), `web-vitals` setup (P1)
**Avoids:** Pitfall 2 (measure before adding `next/dynamic` to avoid chasing non-existent wins), Pitfall 7 (map route rendering modes before any changes so unexpected changes are caught)
**Research flag:** Standard patterns — skip research-phase. `@next/bundle-analyzer`, `next/font`, and `useReportWebVitals` are all official Next.js patterns with direct docs references and no ambiguity.

### Phase 2: React Compiler

**Rationale:** Must be a dedicated phase with before/after measurement. The compiler is a cross-cutting optimization touching all components — enabling it alongside other changes would make it impossible to attribute regressions. Run `npx react-compiler-healthcheck` first; results determine scope.
**Delivers:** Automatic memoization of all compliant components and hooks; reduced re-render overhead for orchestrator hooks (`useStoveData`, `useNetworkData`); stable function references from all polling hooks. If ThermostatCard causes issues, `"use no memo"` isolates it without blocking the rest.
**Uses:** `babel-plugin-react-compiler` (devDependency), `reactCompiler: true` in `next.config.ts`
**Implements:** Render optimization layer — compile-time auto-memoization
**Avoids:** Pitfall 4 (run healthcheck first, isolate in dedicated phase, keep all 3034 tests green)
**Research flag:** Standard patterns for config change. However, the healthcheck output for this specific codebase is unknown — treat the first run as a discovery step. If healthcheck reports violations in critical hooks, a plan to fix those violations may be needed before enabling the compiler.

### Phase 3: Recharts Lazy Loading on Sub-pages

**Rationale:** Sub-pages (`/network`, `/analytics`) are `'use client'` files. `dynamic({ ssr: false })` is valid here and IS a real code split that reduces First Load JS for those routes — sub-pages are not in the initial dashboard render path. The consent-gated `BandwidthCorrelationChart` is the ideal candidate: its JS never downloads if consent is denied, eliminating a network request unconditionally.
**Delivers:** Recharts deferred on network and analytics pages; consent-gated chart chunk never loaded without consent; BandwidthChart and correlation chart show Skeleton while chunks download; verified `public/sw.js` manifest contains new chunk names.
**Uses:** `next/dynamic` with `ssr: false` in `'use client'` page files; existing `Skeleton` components as loading fallbacks
**Implements:** Code splitting layer for sub-pages
**Avoids:** Pitfall 1 (confirmed real code splits on sub-pages — not dashboard cards where dynamic() doesn't help), Pitfall 5 (verify new chunk names in `public/sw.js` manifest after build)
**Research flag:** Standard patterns — well-documented Next.js lazy loading pattern for Client Component pages. No additional research needed.

### Phase 4: Runtime Render Optimization

**Rationale:** Addresses the runtime performance issues that persist regardless of bundle size: Recharts re-rendering on every poll tick, all 6 cards firing API calls simultaneously on mount, and visible chart flicker. These require profiling to confirm impact (React DevTools Profiler + Chrome Network tab) and then targeted fixes. Comes after Phase 1 so Lighthouse baseline and profiling targets are known.
**Delivers:** Recharts chart components absent from poll-tick flame graph; `isAnimationActive={false}` eliminating 30s visible chart refresh; `initialDelay` staggering in `useAdaptivePolling` reducing simultaneous initial API calls; debounced thermostat setpoint writes using existing `useDebounce` hook.
**Uses:** `useMemo` for stable Recharts data references, `React.memo` on chart components, existing `useDebounce` hook, `initialDelay` parameter addition to `useAdaptivePolling`
**Implements:** Polling efficiency layer improvements; Recharts render optimization
**Avoids:** Pitfall 3 (stabilize data reference + disable animation), Pitfall 6 (stagger initial fetches; stove delay stays at 0)
**Research flag:** Needs file inspection before planning — read `useAdaptivePolling` hook API before designing `initialDelay` parameter; confirm stove hook uses Firebase RTDB listener as primary path (not polling) to avoid breaking safety-critical behavior.

### Phase 5: Suspense Streaming (Conditional)

**Rationale:** This phase should only be planned if Phase 1 baseline shows poor LCP/TTI metrics that Phases 2-4 did not resolve. Suspense streaming enables the dashboard shell to render immediately while each card streams independently. The dependency conflict between `page.tsx`'s `deviceConfig` server-fetch pattern and per-card Suspense boundaries requires careful planning.
**Delivers:** Dashboard shell visible in <500ms; each card streams independently; first card visible ~300ms instead of waiting for all 6. Perceived performance improvement even without bundle size change.
**Uses:** Suspense boundaries wrapping existing card components (can reuse `DeviceCardErrorBoundary` as combined Suspense+error boundary)
**Implements:** Suspense streaming pattern from Next.js App Router
**Avoids:** Pitfall 2 (no `next/dynamic` on dashboard cards — use Suspense wrapping on Server Component instead; cards remain static imports), Pitfall 1 (static imports, not dynamic, so SW precache is unaffected)
**Research flag:** Needs research-phase — the interaction between `deviceConfig` server-fetch and per-card Suspense boundaries requires careful planning. The current pattern of passing `deviceConfig` through the `CARD_COMPONENTS` registry conflicts with independent per-card streaming; this conflict must be resolved in research before planning.

### Phase Ordering Rationale

- **Phase 1 must be first:** All other phases depend on knowing which chunks are actually large and what the Lighthouse baseline is. Skipping this produces blind optimization that may yield no user-visible improvement.
- **Phase 2 (React Compiler) is second:** It is a cross-cutting change. Running it before code-splitting changes means any test failures are attributable to the compiler alone. Requires the Phase 1 bundle baseline for before/after comparison.
- **Phase 3 (Recharts sub-pages) is third:** Confirmed real code splits — sub-pages are route-split by Next.js App Router; adding `dynamic({ ssr: false })` for Recharts on those pages produces measurable bundle reduction for those routes. Independent of Phase 2.
- **Phase 4 (runtime optimization) is fourth:** Addresses a different axis than bundle size — rendering behavior during polling. Requires Phase 1 profiling data to target correctly. Independent of Phase 3.
- **Phase 5 (Suspense streaming) is conditional:** Only plan this if Phase 1-4 results show TTI/LCP still needs improvement. High complexity, high value if needed.

### Research Flags

Phases likely needing deeper research or file inspection during planning:
- **Phase 5 (Suspense streaming):** The `deviceConfig` server-fetch conflict with per-card Suspense boundaries is complex. How `auth0.getSession()` interacts with Suspense boundaries in App Router needs verification before planning. Use `/gsd:research-phase` for this phase.
- **Phase 4 (polling stagger):** Read `lib/hooks/useAdaptivePolling.ts` and `lib/hooks/useStoveData.ts` (or equivalent stove hook) before planning. Confirm `initialDelay` is achievable without architectural changes and that the stove hook uses Firebase RTDB listener as primary path.

Phases with standard patterns (skip research-phase):
- **Phase 1:** `@next/bundle-analyzer`, `next/font`, `web-vitals`, `useReportWebVitals`, preconnect — all official Next.js patterns with direct docs references.
- **Phase 2:** `reactCompiler: true` — Next.js 16 first-class support, official docs cover the exact config. The discovery element is the healthcheck output, not the pattern itself.
- **Phase 3:** `dynamic({ ssr: false })` in Client Component pages — textbook Next.js lazy loading pattern with no ambiguity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified from npm registry 2026-02-18. `package.json` inspected directly. The `next/dynamic` App Router limitation (no bundle reduction for Client Components) confirmed by official GitHub issues #49454 and #61066. |
| Features | HIGH | Table stakes features verified via official Next.js docs. Anti-features strongly justified (react-query migration risk, virtualization overhead at 6 cards). The "already built" inventory confirmed by inspecting actual source files in the codebase. |
| Architecture | HIGH | Official docs for all patterns. `ssr: false` restriction in Server Components confirmed by Next.js docs with explicit build-time error message. All changes are import-site-only — no structural changes needed. |
| Pitfalls | HIGH (1-6) / MEDIUM (React Compiler) | Critical pitfalls 1-2, 5-7 verified with official GitHub issues and docs. Pitfall 3 (Recharts re-renders) verified with Recharts GitHub issues. React Compiler (Pitfall 4) real-world data is limited — single published study showing "fixed only 1 of 8 re-render cases" is not a systematic benchmark. |

**Overall confidence:** HIGH

### Gaps to Address

- **Actual chunk composition:** Research identified 4 chunks over 399 KB in the existing `.next/` build, but without running the bundle analyzer it is unknown whether these contain Recharts, Firebase SDK, Auth0, or application code. This gap resolves itself in Phase 1, Plan 1.
- **React Compiler healthcheck result:** Unknown how many components violate Rules of React. ThermostatCard (897 LOC) is highest-risk. Healthcheck run in Phase 2, Plan 1 reveals actual scope.
- **Actual LCP/INP/CLS metrics:** No Lighthouse baseline exists. Current state is "likely poor" for FCP (external Google Fonts CDN) but "unknown" for INP and CLS. Phase 1, Plan 2 establishes this baseline.
- **`useAdaptivePolling` stagger API:** Whether the hook can accept `initialDelay` without architectural changes needs file inspection before Phase 4 planning. Read `lib/hooks/useAdaptivePolling.ts` directly.
- **Stove data hook primary path:** Must confirm the stove hook uses Firebase RTDB listener (not polling) as primary data path before adding `initialDelay` to polling hooks. Safety-critical — cannot risk accidentally converting the stove to polling-only.

## Sources

### Primary (HIGH confidence)
- Next.js 16.1 official docs (v16.1.6, verified 2026-02-11): Lazy Loading, Package Bundling, `optimizePackageImports`, `reactCompiler`, Font Optimization, `@next/bundle-analyzer`
- Next.js 16.1 release blog (2025-12-18): `next experimental-analyze`, Turbopack file system caching stable, `next dev --inspect`
- React Compiler v1.0 blog post (react.dev, October 2025): stable release, auto-memoization behavior, opt-out pattern (`"use no memo"`)
- React docs (current): `useTransition`, `useDeferredValue`, `React.memo`
- npm registry (verified 2026-02-18): `web-vitals@5.1.0`, `@next/bundle-analyzer@16.1.6`
- vercel/next.js GitHub issues: #49454, #61066 (Client Component dynamic import limitations in App Router), #63918 (ChunkLoadError irrecoverable), #47173 (ChunkLoadError on next/dynamic deployment)
- Serwist Next.js getting started docs
- Vercel blog: "How we optimized package imports in Next.js"
- Project codebase (directly inspected 2026-02-18): `next.config.ts`, `package.json`, `app/page.tsx`, `NetworkBandwidth.tsx`, `app/hooks/`

### Secondary (MEDIUM confidence)
- Core Web Vitals 2025 targets (uxify.com) — consistent with Google's published thresholds but third-party source
- Recharts bundle size from bundlephobia — not versioned to exact installed version; directionally correct
- React 19 `useMemo`/`useCallback` in React Compiler context (stevekinney.com)
- Next.js App Router lazy loading vs React.lazy community discussion (WebSearch 2025)

### Tertiary (LOW confidence)
- developerway.com React Compiler real-world test ("fixed only 1 of 8 re-render cases") — single study, not systematic benchmark; treat React Compiler impact as optimistic-but-uncertain

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE-performance-optimization.md, PITFALLS.md*
