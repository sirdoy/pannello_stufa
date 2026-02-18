# Stack Research

**Domain:** Next.js 16.1 PWA — Performance auditing, bundle analysis, code splitting, lazy loading, interaction optimization
**Researched:** 2026-02-18
**Confidence:** HIGH (primary sources: Next.js 16.1.6 official docs, npm registry versions verified 2026-02-18)

---

## Context: Actual Installed Versions

Package.json says `^16.1.0` but installed versions are:
- `next@16.1.3` (not 15.5 as the milestone context states — already upgraded)
- `react@19.2.3`
- Build: `npm run build -- --webpack` (Serwist/PWA requires webpack for production)
- Dev: Turbopack (configured via `turbopack: {}` in next.config.ts)

This split matters because **bundle analysis tooling differs between Turbopack dev and webpack production**.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@next/bundle-analyzer` | 16.1.6 | Webpack production bundle analysis | Production build uses `--webpack`. This plugin wraps webpack-bundle-analyzer and generates 3 HTML reports (client.html, server.html, edge.html) in `.next/analyze/`. Env-flagged so zero cost on normal builds. The correct tool for the actual production artifact. |
| `next experimental-analyze` | Built-in (v16.1+) | Turbopack dev bundle inspection | Zero install. Interactive UI with route filtering, import chain tracing, RSC boundary analysis. Use to explore module graph during development. Command: `npx next experimental-analyze`. |
| `web-vitals` | 5.1.0 | Real User Monitoring in production | v5 is current stable (v4 was beta, now superseded). Provides `onLCP`, `onINP`, `onCLS`, `onFCP`, `onTTFB`. INP replaced FID in March 2024. Attribution build provides INP breakdown (inputDelay, processingTime, presentationDelay). Integrates with Next.js `useReportWebVitals`. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/dynamic` | Built-in | Client Component lazy loading with SSR control | Use `ssr: false` for device cards — they fetch data on mount and need no server HTML. MUST be called from a Client Component, not directly from the Server Component `app/page.tsx`. |
| `React.lazy` + `Suspense` | Built-in React 19 | Lazy loading for sub-components inside existing Client Components | Preferred over `next/dynamic` for components nested inside already-client files. Fewer hydration flicker issues. |
| `startTransition` / `useTransition` | Built-in React 19 | Mark polling state updates as non-urgent | Wrap `setState` calls inside polling callbacks so frequent Firebase/fetch updates don't block user interactions (INP impact). React 19 improves scheduling over React 18. Zero install. |
| `useDeferredValue` | Built-in React 19 | Defer expensive Recharts renders | Use when you cannot access the setState call — pass deferred bandwidth history to Recharts components. Recharts re-renders with stale data while new data processes. Zero install. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Chrome DevTools Performance tab | Long Task detection, INP root cause analysis | Zero install. "Interactions" track shows exactly which handler causes INP issues. "Show layout shifts" for CLS. |
| React DevTools Profiler | Component render timing, re-render identification | Browser extension. Use to find which device card sub-components re-render on every polling tick. |
| Chrome DevTools Lighthouse | Initial performance baseline audit | Built into Chrome. Run against localhost with throttling. Cannot automate for this PWA (Auth0 gate). |
| `next dev --inspect` | Node.js debugger for server-side profiling | New in Next.js 16.1. `next dev --inspect` attaches debugger only to the correct process (not all spawned processes as `NODE_OPTIONS=--inspect` did). |

---

## Installation

```bash
# Dev dependencies — zero runtime cost
npm install -D @next/bundle-analyzer

# Runtime — small (3KB gzipped), production-safe
npm install web-vitals
```

That is the complete installation surface. Every other tool is built into Next.js 16.1, React 19.2, or the browser.

---

## Next.js Config Changes (Zero Install)

### Bundle Analyzer Integration

```typescript
// next.config.ts — add bundle analyzer
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import withBundleAnalyzerInit from '@next/bundle-analyzer';

const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
});

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ... existing config
  turbopack: {},
};

// Chain: bundle analyzer → serwist → base config
export default withBundleAnalyzer(withSerwist(nextConfig));
```

Usage:
```bash
ANALYZE=true npm run build -- --webpack
# Opens client.html, server.html, edge.html in browser
```

### NO Changes Needed for optimizePackageImports

Next.js 16.1 already auto-optimizes these packages from this project:
- `lucide-react` — auto-optimized (in Next.js default list)
- `recharts` — auto-optimized (in Next.js default list)
- `date-fns` — auto-optimized (in Next.js default list)
- `@radix-ui/react-*` — direct sub-path imports, no barrel to optimize

Adding these to `experimental.optimizePackageImports` would be redundant. No config change needed.

---

## Code Splitting Architecture (Key Constraint)

**Critical finding from Next.js 16.1 docs:** "When a Server Component dynamically imports a Client Component, automatic code splitting is currently **not** supported."

`app/page.tsx` is a Server Component. Its current static imports:

```typescript
// CURRENT (no code splitting — all 6 cards in initial bundle)
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import CameraCard from './components/devices/camera/CameraCard';
import LightsCard from './components/devices/lights/LightsCard';
import WeatherCardWrapper from './components/devices/weather/WeatherCardWrapper';
import NetworkCard from './components/devices/network/NetworkCard';
```

**Required pattern:** A thin Client Component wrapper must host the `next/dynamic` calls.

```typescript
// app/components/DashboardCardLoader.tsx — NEW 'use client' file
'use client';

import dynamic from 'next/dynamic';
import Skeleton from './ui/Skeleton';

const CARD_LOADERS = {
  stove: dynamic(() => import('./devices/stove/StoveCard'), {
    ssr: false,
    loading: () => <Skeleton className="h-48" />,
  }),
  thermostat: dynamic(() => import('./devices/thermostat/ThermostatCard'), {
    ssr: false,
    loading: () => <Skeleton className="h-48" />,
  }),
  // ... etc
};

export function DashboardCardLoader({ cardId }: { cardId: string }) {
  const Card = CARD_LOADERS[cardId as keyof typeof CARD_LOADERS];
  return Card ? <Card /> : null;
}
```

Then `app/page.tsx` (Server Component) imports only `DashboardCardLoader` — not the 6 heavy cards.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `@next/bundle-analyzer` | `webpack-bundle-analyzer` directly | Never for Next.js — Next.js config integration requires the wrapper |
| `next experimental-analyze` | Third-party bundle visualizers | If the experimental UI is insufficient; currently it provides route-level + RSC boundary tracing that third-party tools lack |
| `web-vitals@5.1.0` | Vercel Analytics | If you're on Vercel Pro plan and want dashboard UI — but `web-vitals` is free and provides same data |
| `useTransition` (built-in) | `react-query` concurrent mode | react-query is 13KB and requires rewriting all polling hooks from Phase 55-60; `useTransition` is zero-cost |
| `next/dynamic` with Client wrapper | React.lazy directly in page.tsx | Not possible — page.tsx is a Server Component; React.lazy requires Client context |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@lhci/cli` (Lighthouse CI) | This PWA is behind Auth0 — CI cannot authenticate to test real pages. Automation produces misleading results on the login redirect. | Manual Chrome DevTools Lighthouse runs in authenticated session |
| `bundlesize` or `size-limit` | CI bundle budget tools designed for library distribution and public apps. This is a private PWA where bundle size matters less than render performance. | `@next/bundle-analyzer` HTML reports provide richer contextual insight |
| `react-window` / `@tanstack/react-virtual` | Dashboard has 6 device cards max. Virtualization is for 100+ item lists. | Lazy loading with `next/dynamic` |
| `scheduler` npm package | Unstable React internal — not public API | `startTransition`, `useTransition` from React |
| Manual `SplitChunksPlugin` webpack config | Next.js manages chunk splitting automatically; manual config overrides cause subtle regressions | Trust Next.js defaults; use `next/dynamic` for explicit splits |
| `react-profiler` npm package | Stale third-party wrapper; React's built-in `<Profiler>` component is sufficient | React DevTools browser extension + built-in `<Profiler>` |
| `performance.mark` / `performance.measure` manually | High implementation overhead; `web-vitals` handles LCP/INP/CLS correctly per spec | `web-vitals` library |

---

## Stack Patterns by Variant

**For bundle analysis (production webpack build):**
- Install `@next/bundle-analyzer` as devDependency
- Chain it in `next.config.ts` before `withSerwist`
- Run `ANALYZE=true npm run build -- --webpack`
- Focus on `client.html` — this shows what users download

**For bundle exploration during development (Turbopack):**
- No install needed
- Run `npx next experimental-analyze`
- Use route filter to isolate dashboard page
- Check import chains for device card components to find unexpected heavy imports

**For Core Web Vitals measurement:**
- Install `web-vitals` as runtime dependency
- Add `useReportWebVitals` call in `app/layout.tsx`
- In dev: log to console
- In production: send to existing Firebase Analytics (already GDPR-consent-gated from Phase 54)

**For interaction optimization (INP):**
- Wrap polling `setState` calls in `startTransition` inside existing `useNetworkData`, `useNetworkData`, etc. hooks
- Use `useDeferredValue` for chart `data` props passed to Recharts
- Disable Recharts `isAnimationActive` when data.length > 300 points (prevents animation janking on updates)

**For code splitting device cards:**
- Create `DashboardCardLoader` as `'use client'` wrapper
- Use `next/dynamic` with `ssr: false` per card (device cards don't render useful SSR HTML — they show loading state until client fetch completes)
- `app/page.tsx` stays Server Component for auth + device config fetching

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@next/bundle-analyzer@16.1.6` | `next@16.1.3` | Match major.minor — both 16.1.x is safe |
| `web-vitals@5.1.0` | React 19.2.3, Next.js 16.1.3 | No peer dep conflicts; fully compatible |
| `next/dynamic` | Next.js 16.1.3, React 19.2.3 | Built-in; `ssr: false` must live in a file with `'use client'` |
| `useTransition` | React 19.2.3 | Built-in; improved scheduling algorithm vs React 18 |
| `withBundleAnalyzer` + `withSerwist` chaining | Both tested patterns | Chain order matters: `withBundleAnalyzer(withSerwist(nextConfig))` |

---

## Sources

- Next.js 16.1 release blog (https://nextjs.org/blog/next-16-1, published 2025-12-18) — `next experimental-analyze`, Turbopack file system caching stable, `next dev --inspect`. HIGH confidence.
- Next.js docs: Package Bundling (https://nextjs.org/docs/app/guides/package-bundling, doc-version 16.1.6, last-updated 2026-02-11) — `@next/bundle-analyzer` config steps, `optimizePackageImports` auto-included packages list. HIGH confidence.
- Next.js docs: Lazy Loading (https://nextjs.org/docs/app/guides/lazy-loading, doc-version 16.1.6, last-updated 2026-02-11) — Server Component + dynamic import limitation ("automatic code splitting is currently not supported"), `ssr: false` must be in Client Component. HIGH confidence.
- Next.js docs: optimizePackageImports (https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports, doc-version 16.1.6) — `lucide-react`, `recharts`, `date-fns` are in auto-optimized default list. HIGH confidence.
- npm registry (verified 2026-02-18): `web-vitals@5.1.0`, `@next/bundle-analyzer@16.1.6`. HIGH confidence.
- React docs: useTransition (https://react.dev/reference/react/useTransition) — React 19 improvements to scheduling algorithm. HIGH confidence.
- React docs: useDeferredValue (https://react.dev/reference/react/useDeferredValue) — defer expensive renders. HIGH confidence.
- WebSearch: next/dynamic vs React.lazy in Next.js App Router 2025 — `next/dynamic` for SSR control, `React.lazy` for nested client components to reduce flicker. MEDIUM confidence.
- Project codebase (directly inspected 2026-02-18): `next.config.ts` (webpack build flag, Serwist, Turbopack), `package.json` (actual versions), `app/page.tsx` (static card imports from Server Component), `NetworkBandwidth.tsx` (Recharts direct import), `app/hooks/` (existing useVisibility, useAdaptivePolling from Phase 57). HIGH confidence.

---

*Stack research for: Next.js 16.1 PWA performance optimization (bundle analysis, code splitting, interaction optimization)*
*Researched: 2026-02-18*
