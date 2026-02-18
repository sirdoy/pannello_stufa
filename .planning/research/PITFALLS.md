# Pitfalls Research

**Domain:** Performance optimization for existing Next.js 15.5 + React 19 PWA (smart home dashboard)
**Researched:** 2026-02-18
**Confidence:** HIGH for pitfalls 1-7 (verified with official docs + community issues); MEDIUM for React Compiler section (new feature, limited production data)

---

## Critical Pitfalls

### Pitfall 1: `next/dynamic` with `ssr: false` Breaking the PWA Offline Shell

**What goes wrong:**
Lazy-loading device cards with `dynamic(() => import(...), { ssr: false })` excludes those components from the server-rendered HTML. When a user visits the dashboard offline, the service worker serves the cached HTML shell, but the dynamically imported JS chunks for the cards may not be in Serwist's precache manifest. The result is a blank dashboard with `ChunkLoadError` failures that crash error boundaries — irrecoverably in some cases.

**Why it happens:**
Serwist precaches the JS chunks listed in `__SW_MANIFEST` at build time. When code-splitting via `next/dynamic` is added after a PWA is already deployed, the new chunk filenames (hashed) may not be automatically added to the precache manifest. The existing `StaleWhileRevalidate` rule for `request.destination === 'script'` only fires for previously-fetched scripts — not for chunks the user has never loaded before going offline. Developers assume the SW covers all JS, but it only covers what has been fetched at least once.

**How to avoid:**
- Keep all six device card components (StoveCard, ThermostatCard, LightsCard, etc.) as static imports in `app/page.tsx`. The dashboard page is already `force-dynamic` with Auth0 session gating — static chunk precaching is the right trade-off here.
- Apply `next/dynamic` only to components that appear on user interaction (modals, analytics panels, PidAutomationPanel, scheduler page) or on sub-pages that are not dashboard entry points.
- After any code-split introduction, run `next build --webpack` locally and open `public/sw.js` — verify that the new chunk names appear in the precache array.
- Add a Playwright test that: loads dashboard, goes offline (DevTools Network → Offline), hard-refreshes, asserts all six cards render without error.

**Warning signs:**
- Deployed build shows blank cards in offline mode after optimization changes
- Console shows `ChunkLoadError: Loading chunk X failed` in service worker context
- Lighthouse PWA audit fails "Works offline" criterion post-optimization
- `public/sw.js` precache array shrinks in entry count after adding `next/dynamic`

**Phase to address:** First phase that introduces code splitting. Must be verified before any other optimization phases proceed.

---

### Pitfall 2: `next/dynamic` Not Reducing First Load JS for Already-Client Components

**What goes wrong:**
Every device card is already a Client Component (`'use client'`). Wrapping them with `next/dynamic` from `app/page.tsx` (a Server Component) does not split them out of the initial JS bundle. Next.js includes Client Component chunks in the initial payload regardless of how they are imported. Developers apply `next/dynamic` expecting bundle size reduction, measure nothing, conclude "optimization didn't work," and waste multiple days chasing a non-existent win.

**Why it happens:**
This is a documented behavior (vercel/next.js #49454). In the App Router, `next/dynamic` / `React.lazy` achieve code splitting by deferring the import until render time. But all Client Component modules that a Server Component tree references are bundled into the initial client payload — Next.js pre-fetches the entire client tree via the RSC payload. `next/dynamic` on a `'use client'` component simply does not split it.

**How to avoid:**
- Run `@next/bundle-analyzer` before any lazy-loading changes. Record baseline `First Load JS` per route from the build output (`next build --webpack`). Any optimization that does not produce a measurable reduction in this number is not helping.
- Target `next/dynamic` only for components not present in the initial render: modals, expanded views, PidAutomationPanel (which appears conditionally), the SandboxPanel (already present — verify it's hidden by env var and conditionally rendered).
- Analytics chart components (ConsumptionChart, UsageChart, WeatherCorrelation, BandwidthCorrelationChart) live on sub-pages (`/analytics`, `/network`) — they are already naturally split by route. Do not add extra `next/dynamic` wrappers.

**Warning signs:**
- `next build` output shows `First Load JS` unchanged after adding `next/dynamic` wrappers
- Bundle analyzer shows device card chunks still in the main dashboard bundle entry
- Time spent adding `next/dynamic` calls across 20+ components with no measurable result

**Phase to address:** Bundle analysis phase (measure first, then target). Do this before any lazy-loading implementation.

---

### Pitfall 3: Recharts Causing Full Chart Re-Renders on Every Polling Tick

**What goes wrong:**
Every 30 seconds, `useNetworkData` appends new points to the sparkline buffer, triggering a state update in `NetworkCard`, which re-renders `NetworkBandwidth` (containing Recharts `AreaChart`). Since Recharts renders as SVG with a DOM node per data point, and `ResponsiveContainer` recalculates dimensions on each render, the entire chart SVG is torn down and rebuilt. With 120 data points (1h at 30s intervals), each poll causes significant SVG reconciliation work — visually manifesting as chart flicker and jank in the rest of the card.

**Why it happens:**
Recharts components are not memoized by default. When the parent state changes, Recharts re-renders even if only one new point was appended and all other props are unchanged. The `data` array is a new reference on every poll tick (any array spread/concat creates a new object), so `React.memo` on the chart component provides no benefit without also stabilizing the data reference. Recharts also has a known animation system that restarts on every re-render, which is what causes the visible flicker.

**How to avoid:**
- Wrap chart components in `React.memo` AND stabilize `data` with `useMemo`, keyed on a stable value (array length + last data point timestamp), not the array reference itself.
- Set `isAnimationActive={false}` on all Recharts series elements (`Area`, `Line`, `Bar`) — animation restarts on every re-render and is the primary source of the visible flicker. If initial mount animation is desired, use a `useRef` one-shot flag.
- Import only needed Recharts components directly: `import { AreaChart, Area, ResponsiveContainer } from 'recharts'` — Recharts does not tree-shake well from sub-path imports in v2.x. The barrel import pulls the full library.
- Consider using a circular buffer ref pattern for sparkline data: maintain the array in a `useRef` (mutable, no re-render), and push to React state only on a debounced schedule (not every single poll tick).

**Warning signs:**
- React DevTools Profiler shows chart components in every poll-tick flame graph
- Visible chart "flash" or "reboot" visible every 30s in NetworkCard
- Chrome Performance tab shows a long task (>50ms) triggered by a polling state update
- Recharts appears in flame graph even when user has not scrolled to the chart section

**Phase to address:** Rendering optimization phase (after bundle analysis). Address chart-specific memoization before a global memoization sweep.

---

### Pitfall 4: Manual Memoization Conflicting with React Compiler (If Enabled)

**What goes wrong:**
React Compiler (`babel-plugin-react-compiler`, GA since October 2025) performs automatic memoization. If enabled on this codebase, it may conflict with existing manual `useMemo`/`useCallback` calls. More critically: the compiler skips optimizing components that violate the Rules of React (mutations in render, missing deps). With 106K lines accumulated over 12 milestones, there will be edge-case violations — and the compiler bails out silently on affected components, leaving them unoptimized without any warning.

**Why it happens:**
The React Compiler is opt-in and requires strictly Rules-of-React-compliant code. Real-world production codebases have subtle violations. When the compiler bails out on a component, it gets zero automatic optimization but there is no visible error — only silence. Real-world testing has shown the compiler fixed only 1 of 8 identified re-render cases in existing codebases. It is not a silver bullet for pre-existing re-render problems.

**How to avoid:**
- Do not enable the React Compiler in the same phase that introduces other optimizations. Treat it as a separate, late-phase addition with dedicated before/after measurement.
- Run `npx react-compiler-healthcheck` before enabling the compiler. It reports which components have Rules of React violations that cause bail-outs.
- Preserve existing `useCallback`/`useMemo` wrappers around callbacks passed to `useAdaptivePolling` — these are at integration boundaries where reference identity stability matters regardless of the compiler.
- The compiler does not fix the Recharts re-render issue (Pitfall 3) — SVG DOM reconciliation work happens regardless of memoization level.
- Do not enable React Compiler to avoid fixing real performance problems; it is a complement to, not a substitute for, correct memoization design.

**Warning signs:**
- After enabling the compiler, React DevTools Profiler shows components re-rendering at the same rate as before — the compiler bailed out silently
- `react-compiler-healthcheck` reports violations in device card hooks or utility functions
- Test suite failures after enabling compiler due to changed effect timing or reference semantics

**Phase to address:** Late phase, only after manual optimization impact has been measured and validated. Not phase 1.

---

### Pitfall 5: Service Worker Serving Stale JS Chunks After Deployment

**What goes wrong:**
The Serwist config uses `StaleWhileRevalidate` for `request.destination === 'script'`. After a new deployment (new hashed chunk filenames), users with the installed PWA continue to receive the old JS chunks from the `static-resources` cache. When the new `sw.js` activates (via `skipWaiting: true`), it tries to run new page code using old cached component chunks — causing hydration mismatches or runtime errors. Users must manually clear site data or wait for the SW update cycle to complete cleanly.

**Why it happens:**
`StaleWhileRevalidate` serves the cached version immediately and updates in background. If a user navigates before the background update completes, they get stale JS executing against a fresh HTML shell from the server. This is amplified by `skipWaiting: true` — the new SW activates immediately without waiting for old clients to be released, creating a window where new SW + old cached JS coexist.

**How to avoid:**
- Do not add new runtime caching rules for JS chunks during this optimization milestone. The existing `StaleWhileRevalidate` is already aggressive for scripts.
- If code splitting is added, newly split chunks should appear in Serwist's precache (in `__SW_MANIFEST`) rather than relying on runtime caching.
- After any build that changes the chunk graph (new `next/dynamic` calls), verify the generated `public/sw.js` manifest includes the new chunk names.
- Implement a `controllerchange` listener + toast: when the SW updates, show "Una nuova versione dell'app e disponibile" with a reload button. This mitigates the stale chunk problem without removing `skipWaiting`.
- Never change script cache strategy to `CacheFirst` — this would make stale chunk problems catastrophic (zero background update).

**Warning signs:**
- Console errors: `Uncaught SyntaxError: Unexpected token '<'` (HTML served instead of JS for a missing chunk)
- Hydration mismatch errors in production after deployment: `Text content does not match server-rendered HTML`
- Users report broken dashboard that resolves after hard refresh
- Error boundary shows unrecoverable crash shortly after a new deploy

**Phase to address:** Any phase that introduces code splitting. Must validate SW manifest after every build.

---

### Pitfall 6: Independent Polling Hooks Creating a "Thundering Herd" on Dashboard Load

**What goes wrong:**
All six device cards mount simultaneously on the dashboard. Each card's data hook fires its initial `fetch` immediately on mount (`immediate: true` is the default in `useAdaptivePolling`). This results in 6+ concurrent API calls firing within the same ~100ms window. On Vercel's serverless infrastructure, this can trigger 6 cold starts simultaneously, saturate the Firebase RTDB rate limiter, and create visible loading jank as all cards enter loading states and resolve at random times.

**Why it happens:**
The `immediate: true` default in `useAdaptivePolling` is correct for data freshness, but there is no stagger or priority ordering between cards. The masonry layout renders all cards in a single React pass, so all `useEffect` hooks run in the same browser task queue flush. Each card acts independently — none knows the others are also initializing.

**How to avoid:**
- Add a configurable `initialDelay` parameter to `useAdaptivePolling`. Non-critical cards below the fold can be delayed without user-visible impact.
- Priority order: stove (safety-critical, delay=0) → thermostat (50ms) → lights (100ms) → weather (250ms) → camera (400ms) → network (500ms).
- The stove hook uses Firebase RTDB listeners (not polling) as the primary data path — verify this behavior is maintained and not accidentally converted to pure polling during optimization work.
- For Vercel cold starts: consider adding a warmup ping to the most-called API routes on SW registration (after dashboard load settles), not on initial load.

**Warning signs:**
- Chrome Network tab shows 6+ parallel API requests firing within <100ms of page load
- Vercel function logs show simultaneous cold starts from the same user session
- Firebase RTDB console shows rate limit warnings during initial load
- All cards show skeleton states simultaneously and resolve at random, unpredictable times

**Phase to address:** Rendering optimization phase (after bundle analysis). Requires testing with DevTools Network throttling to observe.

---

### Pitfall 7: `force-dynamic` Conflict with ISR or Static Segment Optimization

**What goes wrong:**
`app/page.tsx` exports `export const dynamic = 'force-dynamic'` because it reads the Auth0 session. This is correct. If optimization work attempts to introduce `revalidate` exports to any Server Component in the dashboard import chain, Next.js throws `app/ Static to Dynamic Error` — a runtime error that occurs when a page initially generated statically tries to switch to dynamic at request time. This error appears only in production, not in development.

**Why it happens:**
`force-dynamic` is a page-level opt-out of static generation. The App Router propagates this through the segment. If any component or utility imported by the dashboard adds `export const revalidate = 60`, there is a conflict. Next.js 15's caching model has undergone multiple revisions and the correct behavior is not always obvious.

**How to avoid:**
- Do not add `revalidate` exports to any component or segment imported by `app/page.tsx`.
- Performance optimization for dashboard server-side work should target `getUnifiedDeviceConfigAdmin` and `getVisibleDashboardCards` specifically — use React's `cache()` function to memoize per-request if called more than once in the request tree.
- Sub-routes (`/stove`, `/thermostat`, `/lights`, `/network`) can independently use ISR if they do not call `auth0.getSession()` in their root — verify this before adding `revalidate`.
- Before any optimization changes, run `next build --webpack` and record which routes show `●` (dynamic) vs `○` (static). Use this baseline to catch unexpected changes.

**Warning signs:**
- Production deployment shows `Error: Static generation failed` for previously working routes
- `next build` output shows route rendering modes changing unexpectedly after optimization changes
- Server logs show `app/ Static to Dynamic Error` only in production (never in dev)

**Phase to address:** Bundle analysis / inventory phase (first). Map which routes are currently dynamic vs. static before any optimization begins.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Wrap all device card components in `React.memo` globally | Feels like quick render reduction | Memo comparison cost can exceed render cost for simple components; hides actual root causes | Never as first step — profile first, target specifically |
| Add `isAnimationActive={false}` to Recharts without memoizing data | Removes visible chart flicker | Data still creates new array references on every poll, causing full SVG re-render | Acceptable as partial fix while full memoization is implemented |
| Use `next/dynamic` on every heavy-looking component | Feels like optimization | Adds Suspense fallback complexity, potential ChunkLoadError offline, no bundle benefit for always-visible Client Components | Only for components NOT in the initial render path |
| Enable React Compiler org-wide immediately | Automatic memoization everywhere | Compiler bails out silently on Rules of React violations; fixes fewer re-renders than expected in production codebases | Only after running `react-compiler-healthcheck` and validating on a subset |
| Disable service worker in DevTools during performance testing | Eliminates SW as variable | Produces measurements that don't reflect production PWA behavior (SW adds latency, stale chunk risk) | Acceptable for isolated JS bundle size measurement only |

---

## Integration Gotchas

Common mistakes when connecting components within this specific stack.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Recharts + `React.memo`** | Wrapping chart in `React.memo` but passing `data={chartPoints}` where `chartPoints` is a new array reference every render | Memoize the data array with `useMemo` keyed on a stable value (last timestamp + length), then wrap chart in `React.memo` |
| **Serwist + `next/dynamic`** | Assuming `StaleWhileRevalidate` for scripts covers newly-split chunks | New chunks must appear in Serwist's `__SW_MANIFEST` precache; verify `public/sw.js` contains new chunk names after build |
| **Firebase RTDB + dashboard mount** | All 6 cards attaching Firebase listeners and firing initial fetches simultaneously | Stagger non-critical initial fetches with `initialDelay`; keep stove listener at delay=0 (safety-critical) |
| **Auth0 `getSession` + Server Component optimization** | Calling `auth0.getSession()` in multiple Server Components within the same request tree | Use React's `cache()` function to memoize `auth0.getSession()` per request — call once, reuse across the tree |
| **`useAdaptivePolling` + inline `callback`** | Passing an inline arrow function as `callback` without `useCallback` wrapping | The hook uses a ref internally to avoid stale closures, but still creates a new closure on every render if the callback is not stabilized — use `useCallback` |
| **`next/dynamic` + `ssr: false` on sub-page charts** | Using `ssr: false` for analytics charts on sub-pages where it is not needed | Charts on sub-pages are Client Components already; `ssr: false` adds complexity without benefit. Only use it for browser-API-dependent code that cannot run on the server |
| **Vercel serverless + Firebase Admin** | Firebase Admin SDK cold-starting on every API call | Firebase Admin uses a module-level singleton (`getApps().length` check); verify `lib/firebase-admin.ts` follows this pattern throughout — do not import Admin SDK inside route handler bodies |

---

## Performance Traps

Patterns that look fine but create specific failure modes in this stack.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Recharts SVG DOM node count** | Chart renders slow; CPU usage spikes during poll | Use LTTB decimation (already implemented for bandwidth charts) for all time-series; set `isAnimationActive={false}` | Immediately with 120-point sparklines; bad with 1h+ data accumulation |
| **6 simultaneous cold starts on load** | P95 LCP >3s on fresh session; Vercel function logs show burst cold starts | Stagger initial fetch calls with `initialDelay` parameter | Always present on initial load; worse with new deployments that flush the function warm pool |
| **`ResponsiveContainer` resize observer** | Chart dimensions recalculate on every window resize causing cascading re-renders | Wrap chart container in a stable-height div; avoid nesting `ResponsiveContainer` inside dynamically-sized flex containers | Immediately visible on any window resize |
| **Multiple `useEffect` polling loops accumulating** | Memory usage grows over long sessions; polling frequency doubles | Ensure every polling `useEffect` has a proper cleanup; `useAdaptivePolling` already handles this — verify any new data hooks follow the same pattern | Long sessions (>30 min active use in a single tab) |
| **Service worker fetch interceptor overhead** | The `fetch` listener in `sw.ts` clones and parses response bodies for `/api/stove/status` and `/api/netatmo/status` on every call | Ensure JSON.parse errors are swallowed (they are); add timing to verify SW overhead stays below 5ms | Always present; becomes visible if response clone logic grows in scope |

---

## UX Pitfalls

Common user experience mistakes when adding performance optimizations.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Lazy loading cards with Suspense causing layout shifts** | If skeleton dimensions don't match final card dimensions, layout shifts (CLS score penalty) | Dashboard cards already have `Skeleton.StovePanel` and equivalents — use these exact skeletons as Suspense fallbacks if lazy loading is ever introduced for cards |
| **Chart animation on every data update** | Users perceive charts as "broken" or "refreshing" — disorienting at 30-second intervals | Set `isAnimationActive={false}` for all chart series elements; keep animation only on initial mount using a one-shot `useRef` flag |
| **Optimizing for bundle size metrics while ignoring user experience** | Smaller bundle reports but slower Time to Interactive | Measure Core Web Vitals (LCP, INP, CLS) in production, not just bundle size. A 20KB reduction that adds a 200ms Suspense waterfall is a regression |
| **No notification when PWA updates** | Users stuck on old version after deployment; UI behaves unexpectedly | Implement `controllerchange` listener + toast: "Una nuova versione e disponibile — Aggiorna" with a reload button. This project already has `reloadOnOnline: true` — extend the pattern to cover SW updates |
| **Showing loading skeletons for cached/fast data** | Cards that resolve in <100ms still flash a skeleton, making the app feel slower | Add a minimum skeleton display time threshold (100ms) — show skeleton only if data has not resolved within that window |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical verification.

- [ ] **Code splitting:** After adding any `next/dynamic`, test offline mode explicitly — load dashboard, go DevTools Network → Offline, hard-refresh, verify all six device cards render from SW cache without error
- [ ] **Recharts memoization:** Run React DevTools Profiler for 2 polling cycles — chart components must not appear in the flame graph if data has not changed
- [ ] **Bundle size:** Compare `First Load JS` per route in `next build` output before and after optimization — any change that does not reduce this number is not helping
- [ ] **Service worker manifest:** Open `public/sw.js` after each build, search for new chunk filenames — confirm they appear in the precache array
- [ ] **Polling stagger:** Chrome Network tab on initial dashboard load — no more than 2 parallel API requests should fire in the first 100ms
- [ ] **React Compiler (if enabled):** Run `npx react-compiler-healthcheck` — zero violations before enabling compiler in production; all existing 3000+ tests must remain green
- [ ] **`force-dynamic` not broken:** Run `next build --webpack` after any Server Component changes — route rendering modes must not change from the pre-optimization baseline

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| PWA offline broken by code splitting | HIGH | Revert `next/dynamic` changes, deploy, validate offline mode. Re-introduce with explicit Serwist precache configuration covering new chunks |
| Stale chunk error after deployment | MEDIUM | Deploy SW update notification (toast + reload button); for immediate relief use `Cache-Control: no-cache` header on the SW registration endpoint |
| Recharts re-renders not fixed by `React.memo` | LOW | Remove `React.memo` wrappers, fix the data reference stability at source (circular buffer or `useMemo` on stable key) — this is the root cause, not the symptom |
| React Compiler breaks existing tests | MEDIUM | Disable compiler (`babel-plugin-react-compiler` removal from babel config), re-run full test suite to confirm 3000+ tests pass, investigate violations with healthcheck tool before re-enabling |
| Thundering herd cold starts | LOW | Add `initialDelay` to non-critical `useAdaptivePolling` calls; immediately deployable without structural changes |
| `force-dynamic` conflict with ISR | HIGH | Remove `revalidate` exports from any component in the dashboard import tree; run `next build` to verify route modes return to baseline |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| PWA offline broken by code splitting (Pitfall 1) | Phase that introduces `next/dynamic` | Playwright test: load dashboard → go offline → assert all 6 cards render |
| `next/dynamic` no bundle reduction (Pitfall 2) | Bundle analysis phase (Phase 1 of any perf milestone) | `next build` output: `First Load JS` must decrease after optimization |
| Recharts re-renders on every poll (Pitfall 3) | Rendering optimization phase | React DevTools Profiler: chart components absent from poll-tick flame graph |
| React Compiler conflicts (Pitfall 4) | Late optimization phase (last) | `react-compiler-healthcheck` passes; all 3000+ existing tests remain green |
| Stale JS chunks after deployment (Pitfall 5) | Code splitting phase | `public/sw.js` manifest contains new chunk names after build |
| Thundering herd on page load (Pitfall 6) | Rendering optimization phase | Chrome Network tab: fewer than 3 parallel API calls in first 100ms |
| `force-dynamic` conflict with ISR (Pitfall 7) | Bundle analysis / inventory phase (Phase 1) | `next build` route table: no unexpected changes to `○` (static) vs `●` (dynamic) |

---

## Sources

- [Next.js Lazy Loading — official docs](https://nextjs.org/docs/app/guides/lazy-loading)
- [vercel/next.js #49454 — React lazy / next/dynamic don't reduce First Load JS in App Router](https://github.com/vercel/next.js/issues/49454)
- [vercel/next.js #61066 — Dynamic Import of Client Component from Server Component Not Code Split](https://github.com/vercel/next.js/issues/61066)
- [vercel/next.js #63918 — App crashes on dynamic import failure (ChunkLoadError irrecoverable)](https://github.com/vercel/next.js/issues/63918)
- [vercel/next.js #47173 — ChunkLoadError on deployment with next/dynamic since Next 13.2.4](https://github.com/vercel/next.js/issues/47173)
- [Recharts performance issues with large data — recharts #1146](https://github.com/recharts/recharts/issues/1146)
- [Recharts code splitting — recharts #1260](https://github.com/recharts/recharts/issues/1260)
- [React Compiler v1.0 release blog (October 2025)](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React Compiler — real-world testing: fixed only 1 of 8 re-render cases](https://www.developerway.com/posts/i-tried-react-compiler)
- [Serwist with Next.js — getting started](https://serwist.pages.dev/docs/next/getting-started)
- [Next.js PWA offline support with dynamic routes — Discussion #82498](https://github.com/vercel/next.js/discussions/82498)
- [Vercel cold starts — official guidance](https://vercel.com/kb/guide/how-can-i-improve-serverless-function-lambda-cold-start-performance-on-vercel)
- [Vercel Fluid compute — solves cold starts](https://vercel.com/blog/scale-to-one-how-fluid-solves-cold-starts)
- [Next.js App Static to Dynamic Error — official docs](https://nextjs.org/docs/messages/app-static-to-dynamic-error)
- [React memo — react.dev reference](https://react.dev/reference/react/memo)
- [Efficient polling in React with visibility awareness](https://medium.com/@atulbanwar/efficient-polling-in-react-5f8c51c8fb1a)
- [Firebase RTDB optimize performance — official](https://firebase.google.com/docs/database/usage/optimize)
- [Auth0 nextjs-auth0 v4 — client-side session cache refresh issue #1937](https://github.com/auth0/nextjs-auth0/issues/1937)
- [React Compiler migration guide](https://stevekinney.com/courses/react-performance/react-compiler-migration-guide)
- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Recharts performance guide — official](https://recharts.github.io/en-US/guide/performance/)

---
*Pitfalls research for: Performance optimization of existing Next.js 15.5 + React 19 PWA (pannello-stufa v1.77.0)*
*Researched: 2026-02-18*
