# Phase 70: Measurement Baseline + Quick Wins - Research

**Researched:** 2026-02-18
**Domain:** Web Performance — Font self-hosting, bundle analysis, Web Vitals pipeline, resource hints
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Web Vitals reported to BOTH browser console (dev debugging) AND existing Phase 54 analytics pipeline (production tracking)
- Web Vitals are always collected — NOT consent-gated (technical performance data, not user behavior analytics)
- Add a new Web Vitals section to the analytics dashboard
- Baseline must be reusable — script that can be re-run after each optimization phase (71–74) to generate a comparison report

### Claude's Discretion

- Font-display strategy (swap vs optional)
- Typeface selection — may propose alternatives to current Google Fonts if better Ember Noir fit exists
- Font weight minimization based on usage audit
- Font subsetting approach
- Baseline storage location and format
- Lighthouse vs bundle-only baseline scope
- Web Vitals dashboard detail level

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MEAS-01 | User can view bundle size analysis report showing per-route JS breakdown | `@next/bundle-analyzer` webpack plugin generates `client.html` treemap; `ANALYZE=true npm run build -- --webpack` |
| MEAS-02 | User can see Lighthouse performance score baseline (LCP, FCP, INP, CLS) | `scripts/baseline.mjs` script captures `npx lighthouse` JSON output; stored in `.baseline/` directory |
| MEAS-03 | User can monitor real-user performance metrics via web-vitals pipeline | `useReportWebVitals` hook from `next/web-vitals` + `/api/vitals` POST route + Firebase RTDB storage |
| MEAS-04 | User can compare before/after metrics after each optimization phase | `scripts/baseline.mjs --compare` flag diffs current run against stored `.baseline/phase-70.json` |
| FONT-01 | User sees fonts load without external network roundtrip | `next/font/google` replaces `@import url(fonts.googleapis.com)` in `globals.css` |
| FONT-02 | User sees zero layout shift from font loading (CLS improvement) | `display: 'swap'` + `adjustFontFallback: true` (default) generates size-adjusted fallback via `size-adjust` CSS |
| FONT-03 | User benefits from preconnect hints for critical external resources | `<link rel="preconnect">` tags added to `app/layout.tsx` for Firebase RTDB + Auth0 domains |

</phase_requirements>

---

## Summary

Phase 70 has three distinct workstreams: (1) font self-hosting, (2) measurement tooling (bundle analysis + Lighthouse baseline script), and (3) Web Vitals real-user monitoring pipeline with dashboard. All three are well-supported by Next.js 16.1 built-in capabilities with minimal new dependencies.

**Font self-hosting** is a zero-risk, build-time change. `next/font/google` downloads Outfit and Space Grotesk from Google at build time and serves them from the same domain. The current CSS `@import url(fonts.googleapis.com...)` must be removed from `globals.css` and replaced with CSS variables emitted by `next/font`. Both Outfit (wght 100–900) and Space Grotesk (wght 300–700) are confirmed variable fonts — a single WOFF2 file covers all weight needs.

**Bundle analysis** requires adding `@next/bundle-analyzer` as a dev dependency and wrapping the existing `next.config.ts` plugin chain. The existing build command already uses `--webpack`, making it compatible with `@next/bundle-analyzer`. A committed baseline script generates JSON snapshots before/after each optimization phase.

**Web Vitals pipeline** uses `useReportWebVitals` from `next/web-vitals` (already available — the `web-vitals@4.2.4` package ships with Next.js 16). A small `'use client'` component in the root layout sends metrics to both `console.log` (dev) and a new `/api/vitals` POST route (production). The route stores snapshots to Firebase RTDB under `vitalsEvents/` using the existing fire-and-forget pattern from `analyticsEventLogger`. The analytics dashboard gets a new Web Vitals section alongside existing stove usage charts.

**Primary recommendation:** Use `next/font/google` with `variable: '--font-display'` / `variable: '--font-body'` CSS variable approach to match the existing CSS variable pattern in `globals.css`. Keep `display: 'swap'` (Next.js default) since `adjustFontFallback: true` (also default) generates a `size-adjust` fallback that prevents CLS even during swap.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/font/google` | Built into Next.js 16.1.3 | Self-host Google Fonts at build time | Official Next.js solution; no new dependency; zero CDN roundtrip |
| `next/web-vitals` | Built into Next.js 16.1.3 (web-vitals 4.2.4) | `useReportWebVitals` hook for real-user metrics | Official Next.js API; already installed; supports LCP, INP, CLS, FCP, TTFB |
| `@next/bundle-analyzer` | 16.1.6 (matches Next.js version) | Webpack treemap of per-route JS bundle | Official Next.js plugin; generates `client.html`, `edge.html`, `nodejs.html` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `npx lighthouse` | CLI (no install needed) | Lighthouse JSON baseline capture | Run via `scripts/baseline.mjs` on deployed URL; not in CI (needs browser) |
| Firebase RTDB (already installed) | firebase@12.8.0 | Web Vitals storage via existing `/api/vitals` route | Same pattern as `analyticsEventLogger.ts` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next/font/google` (build-time) | `next/font/local` (manual WOFF2) | `next/font/google` handles download + subsetting automatically; `next/font/local` gives more control but requires manual font file management |
| `@next/bundle-analyzer` (webpack) | `npx next experimental-analyze` (Turbopack) | The Turbopack analyzer (new in 16.1) works without webpack but our build already uses `--webpack` for PWA compatibility; use the webpack plugin |
| Firebase RTDB for Web Vitals | `navigator.sendBeacon` to external service | Project already uses Firebase; no new infra needed |
| `display: 'swap'` | `display: 'optional'` | `optional` gives CLS=0 but may never render the custom font on fast connections; `swap` with `adjustFontFallback` renders the font always with near-zero CLS |

**Installation:**
```bash
npm install --save-dev @next/bundle-analyzer
```
(No other new dependencies — `next/font` and `next/web-vitals` are already included in Next.js 16.1)

---

## Architecture Patterns

### Recommended Project Structure

```
app/
├── _components/
│   └── WebVitals.tsx          # 'use client' — useReportWebVitals hook
├── components/analytics/
│   └── WebVitalsCard.tsx      # New dashboard section (summary cards)
├── api/vitals/
│   └── route.ts               # POST endpoint — stores to Firebase RTDB
└── fonts.ts                   # Centralized font definitions (new)

scripts/
└── baseline.mjs               # Reusable baseline capture + comparison script

.baseline/
└── phase-70.json              # Committed baseline snapshot (Lighthouse + bundle sizes)
```

### Pattern 1: Font Self-Hosting with CSS Variables

**What:** Import fonts via `next/font/google` in a dedicated `app/fonts.ts` module; expose as CSS variables; apply CSS variable classes to `<html>` tag.

**When to use:** When using Tailwind CSS v4 (this project) with existing CSS variable font definitions in `globals.css`.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/font
// app/fonts.ts
import { Outfit, Space_Grotesk } from 'next/font/google';

// Variable fonts — no weight array needed, covers full wght axis
export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',  // matches existing CSS var in globals.css
  display: 'swap',
  preload: true,
  adjustFontFallback: true,    // generates size-adjusted fallback → CLS ≈ 0
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',     // matches existing CSS var in globals.css
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});
```

```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/font#with-tailwind-css
// app/layout.tsx — add font variable classes to <html>
import { outfit, spaceGrotesk } from './fonts';

export default function RootLayout({ children }) {
  return (
    <html
      lang="it"
      className={`${outfit.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      ...
    </html>
  );
}
```

```css
/* globals.css — REMOVE this line: */
/* @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap'); */

/* Keep CSS vars — they will be populated by next/font at runtime: */
/* --font-display is already defined in @theme block */
/* --font-body is already defined in @theme block */
```

**Critical:** The `--font-display` and `--font-body` CSS variables in `globals.css` @theme already reference the right names. The `variable` option in `next/font` must match these exact names (`'--font-display'`, `'--font-body'`).

### Pattern 2: Web Vitals Component (Client Boundary Isolation)

**What:** Small `'use client'` component containing the `useReportWebVitals` hook. The root layout imports it without itself becoming a client component.

**When to use:** Always — Next.js docs explicitly state this is "the most performant approach."

**Example:**
```tsx
// Source: https://nextjs.org/docs/app/guides/analytics
// app/_components/WebVitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // 1. Console (dev debugging)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vital]', metric.name, metric.value.toFixed(2), metric.rating);
    }

    // 2. Analytics pipeline (production — always, no consent gate)
    if (typeof window !== 'undefined') {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,      // 'good' | 'needs-improvement' | 'poor'
        id: metric.id,
        delta: metric.delta,
        navigationType: metric.navigationType,
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      });

      // sendBeacon preferred — non-blocking, survives page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/vitals', body);
      } else {
        fetch('/api/vitals', { method: 'POST', body, keepalive: true });
      }
    }
  });

  return null; // renders nothing
}
```

```tsx
// app/layout.tsx — add WebVitals inside ClientProviders
import { WebVitals } from './_components/WebVitals';
// <WebVitals /> goes inside <ClientProviders> or directly in <body>
```

### Pattern 3: Bundle Analyzer Plugin Composition

**What:** Wrap existing `next.config.ts` plugin chain with `@next/bundle-analyzer`. The `withBundleAnalyzer` wrapper is only active when `ANALYZE=true`.

**When to use:** Whenever adding a new Next.js plugin to an existing chain with `withSerwist`.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/package-bundling
// next.config.ts
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withSerwist = withSerwistInit({ ... });

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = { ... };

// Apply outermost-first: analyzer wraps serwist wraps config
export default withAnalyzer(withSerwist(nextConfig));
```

**Usage:**
```bash
ANALYZE=true npm run build -- --webpack
# Opens client.html, edge.html, nodejs.html in .next/analyze/
```

### Pattern 4: Baseline Script (Reusable)

**What:** A Node.js script that runs Lighthouse via CLI, captures bundle sizes from the `.next` directory, and writes a JSON snapshot. A `--compare` flag diffs against the stored baseline.

**When to use:** Run once after Phase 70 completes to create baseline; re-run after each of phases 71–74 for comparison.

**Example:**
```javascript
// scripts/baseline.mjs
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASELINE_DIR = '.baseline';
const PHASE = process.env.PHASE || '70';
const OUTPUT = join(BASELINE_DIR, `phase-${PHASE}.json`);
const COMPARE = process.argv.includes('--compare');

async function captureBaseline() {
  const result = {
    phase: PHASE,
    timestamp: new Date().toISOString(),
    // Lighthouse scores (requires deployed URL)
    lighthouse: captureLocalLighthouse(),
    // Bundle sizes from next build output
    bundle: captureBundleSizes(),
  };

  writeFileSync(OUTPUT, JSON.stringify(result, null, 2));
  console.log(`Baseline written to ${OUTPUT}`);

  if (COMPARE) {
    compareWithPhase70(result);
  }
}

function captureBundleSizes() {
  // Parse .next/build-manifest.json for route-by-route JS sizes
  const manifest = JSON.parse(readFileSync('.next/build-manifest.json', 'utf8'));
  return manifest;
}
```

**Storage location:** `.baseline/` directory at project root, committed to git so phases 71–74 can diff against it.

### Pattern 5: Resource Preconnect Hints

**What:** `<link rel="preconnect">` tags in `app/layout.tsx` `<head>` for domains that the browser will connect to during page load.

**Which domains need preconnect:**
- `https://pannellostufa-default-rtdb.europe-west1.firebasedatabase.app` — Firebase RTDB (client SDK connects immediately on load)
- `https://pannellostufa.firebaseapp.com` — Firebase Auth domain
- `https://pannellostufa.eu.auth0.com` — Auth0 (for token refresh/session validation)

**Note:** `api.netatmo.com` does NOT need preconnect — all Netatmo calls are proxied through Next.js API routes (server-side only).

**Example:**
```tsx
// app/layout.tsx — inside <head>
<link rel="preconnect" href="https://pannellostufa-default-rtdb.europe-west1.firebasedatabase.app" />
<link rel="preconnect" href="https://pannellostufa.firebaseapp.com" />
<link rel="preconnect" href="https://pannellostufa.eu.auth0.com" />
```

### Anti-Patterns to Avoid

- **Keeping `@import url(fonts.googleapis.com)` in `globals.css`:** Next.js detects this in lint (`next/google-font-display` rule) and warns; any Google Fonts import bypasses `next/font` self-hosting. The import MUST be removed entirely.
- **Using `next/font` in a non-root component:** Each call to `Outfit()` creates a separate font instance. Define fonts ONCE in `app/fonts.ts`, import the object everywhere else.
- **Consent-gating Web Vitals:** Per user decision, Web Vitals are technical data (not user behavior analytics) and must bypass consent checks. Do NOT wrap in `canTrackAnalytics()` guard.
- **Putting `useReportWebVitals` directly in `app/layout.tsx`:** This forces the layout to become a client component, defeating Server Component benefits. Always isolate in a small `WebVitals.tsx` component.
- **Using `ANALYZE=true npm run build` without `--webpack`:** The project uses Turbopack in dev and webpack in builds. `@next/bundle-analyzer` requires webpack. Always use `npm run build -- --webpack` (the project's existing build script already uses `--webpack`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font self-hosting | Custom download + WOFF2 hosting in `/public/fonts/` | `next/font/google` | Handles subsetting, preloading, `@font-face` generation, fallback metrics, size-adjust CLS prevention automatically |
| Font fallback metrics | Manual `font-family` fallback arrays | `adjustFontFallback: true` (default) | Generates mathematically accurate `size-adjust` CSS — prevents layout shift even during font swap |
| Bundle treemap visualization | Custom webpack stats parser | `@next/bundle-analyzer` | Generates interactive HTML with dependency drill-down; maintained by Vercel |
| Web Vitals collection | Custom PerformanceObserver | `useReportWebVitals` from `next/web-vitals` | Uses web-vitals library (already installed); handles browser compatibility, attribution, metric ID deduplication |

**Key insight:** Next.js 16 ships all the tooling for Phase 70 either built-in or as first-party packages. No third-party solutions needed.

---

## Common Pitfalls

### Pitfall 1: CSS Variable Name Mismatch

**What goes wrong:** `next/font` creates a CSS variable (e.g., `--font-display`), but `globals.css` references a slightly different name. Fonts appear as system fallbacks.

**Why it happens:** The `variable` option in `Outfit({ variable: '--font-display' })` must exactly match the `--font-display` variable referenced in `globals.css @theme`.

**How to avoid:** Audit `globals.css` first. Current definitions are `--font-display: 'Outfit', system-ui, sans-serif` and `--font-body: 'Space Grotesk', system-ui, sans-serif`. The `variable` option must be `'--font-display'` and `'--font-body'` exactly.

**Warning signs:** Browser DevTools shows `font-family: system-ui` instead of Outfit/Space Grotesk.

### Pitfall 2: Google Fonts CSS Import Not Removed

**What goes wrong:** `next/font/google` self-hosts the fonts, but the old `@import url('https://fonts.googleapis.com/...')` in `globals.css` still causes a Google CDN request on cold load — FONT-01 success criterion fails.

**Why it happens:** Developers add `next/font` but forget to remove the legacy CSS import.

**How to avoid:** As part of the implementation, explicitly remove the `@import url(...)` line from `globals.css`. Verify with DevTools Network tab: no requests to `fonts.googleapis.com` or `fonts.gstatic.com`.

**Warning signs:** DevTools Network shows requests to `fonts.googleapis.com` or `fonts.gstatic.com`.

### Pitfall 3: Font Weight Audit — Don't Include Unused Weights

**What goes wrong:** Including all Outfit weights (300–800) when the app only uses 400, 500, 600, 700 increases the WOFF2 file size.

**Why it happens:** Copy-pasting the original Google Fonts URL weight list without auditing actual usage.

**How to avoid:** The font weight usage audit shows:
- `font-medium` (500): 55 uses
- `font-semibold` (600): 47 uses
- `font-bold` (700): 39 uses
- `font-black` (900): 9 uses (via `font-black` class = 900)
- `font-normal` (400): 3 uses (base)
- `font-light` (300): 0 uses in TSX files

For variable fonts (`next/font/google` with no `weight` specified), the ENTIRE wght axis is included in one WOFF2 — no need to specify individual weights. This is actually BETTER: one file covers all weights. If switching to `next/font/local` with specific weights, omit 300 (light — unused).

**Recommendation:** Use variable fonts via `next/font/google` without a `weight` array — best performance, all weights covered.

### Pitfall 4: `@next/bundle-analyzer` TypeScript Import

**What goes wrong:** Default import syntax `import withBundleAnalyzer from '@next/bundle-analyzer'` fails at runtime because the package may not have a default ESM export.

**Why it happens:** `@next/bundle-analyzer` was historically a CommonJS module; newer versions added ESM support but some TypeScript setups need explicit handling.

**How to avoid:** Two safe patterns:

```typescript
// Pattern A: curried call (most compatible)
import withBundleAnalyzer from '@next/bundle-analyzer';
const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
export default withAnalyzer(withSerwist(nextConfig));

// Pattern B: if A fails, use createRequire
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const withBundleAnalyzer = require('@next/bundle-analyzer');
```

**Warning signs:** Build fails with `TypeError: withBundleAnalyzer is not a function`.

### Pitfall 5: Web Vitals API Route Security

**What goes wrong:** `/api/vitals` POST route accepts unauthenticated requests, enabling anyone to spam Firebase RTDB.

**Why it happens:** Web Vitals are sent via `navigator.sendBeacon` which doesn't allow custom auth headers easily.

**How to avoid:** Rate-limit at the route level using the existing `rateLimiterPersistent.ts` pattern, OR accept that since this is a personal app (single user), unauthenticated POST to a path-obscured internal route is acceptable. Add a simple size/shape validation to reject malformed payloads.

**Warning signs:** Unexpectedly high Firebase RTDB write counts.

---

## Code Examples

Verified patterns from official sources:

### Font Import (next/font/google with CSS variables)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/font
// app/fonts.ts
import { Outfit, Space_Grotesk } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  // No weight needed — variable font covers full wght axis automatically
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
});
```

### Root Layout — Apply Font Classes
```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/font#with-tailwind-css
import { outfit, spaceGrotesk } from './fonts';

<html
  lang="it"
  data-scroll-behavior="smooth"
  className={`${outfit.variable} ${spaceGrotesk.variable}`}
  suppressHydrationWarning
>
```

### Tailwind CSS v4 Font Variable Mapping
```css
/* globals.css — REMOVE @import url(googleapis.com...) line */
/* The @theme block already has --font-display and --font-body defined */
/* next/font will inject these CSS variables via the className on <html> */
/* No changes needed to @theme — the variable names match */
```

### Web Vitals Component
```tsx
// Source: https://nextjs.org/docs/app/guides/analytics
// app/_components/WebVitals.tsx
'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Vital] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})`);
    }
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      url: typeof window !== 'undefined' ? window.location.pathname : '/',
      timestamp: new Date().toISOString(),
    });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/vitals', body);
    }
  });
  return null;
}
```

### Web Vitals API Route
```typescript
// app/api/vitals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

interface VitalPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  url: string;
  timestamp: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as VitalPayload;
    const key = body.timestamp.replace(/[:.]/g, '-');
    const path = getEnvironmentPath(`vitalsEvents/${key}`);
    // Fire-and-forget — same pattern as analyticsEventLogger.ts
    void adminDbSet(path, body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // never fail beacon
  }
}
```

### Bundle Analyzer Config Composition
```typescript
// Source: https://nextjs.org/docs/app/guides/package-bundling
// next.config.ts — add withBundleAnalyzer wrapper
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ...existing config unchanged...
};

export default withAnalyzer(withSerwist(nextConfig));
```

### Preconnect Hints in Layout
```tsx
// app/layout.tsx — inside <head>
{/* Preconnect for critical API domains */}
<link rel="preconnect" href="https://pannellostufa-default-rtdb.europe-west1.firebasedatabase.app" />
<link rel="preconnect" href="https://pannellostufa.firebaseapp.com" />
<link rel="preconnect" href="https://pannellostufa.eu.auth0.com" />
```

### Baseline Script Structure
```javascript
// scripts/baseline.mjs
#!/usr/bin/env node
/**
 * Performance Baseline Script
 * Usage:
 *   PHASE=70 node scripts/baseline.mjs           # capture baseline
 *   PHASE=71 node scripts/baseline.mjs --compare  # compare vs phase 70
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const PHASE = process.env.PHASE ?? '70';
const BASELINE_DIR = '.baseline';
const BASELINE_70 = `${BASELINE_DIR}/phase-70.json`;
const OUTPUT = `${BASELINE_DIR}/phase-${PHASE}.json`;

mkdirSync(BASELINE_DIR, { recursive: true });

function captureBundleSizes() {
  // Parse .next/build-manifest.json for all chunks
  const manifest = JSON.parse(readFileSync('.next/build-manifest.json', 'utf8'));
  // Calculate first-load JS per route
  return summarizeManifest(manifest);
}

function compareBaselines(current) {
  if (!existsSync(BASELINE_70)) {
    console.error('No phase-70 baseline found. Run with PHASE=70 first.');
    return;
  }
  const baseline = JSON.parse(readFileSync(BASELINE_70, 'utf8'));
  // Print delta table: route | before | after | delta%
  printDeltaTable(baseline, current);
}

const data = { phase: PHASE, timestamp: new Date().toISOString(), bundle: captureBundleSizes() };
writeFileSync(OUTPUT, JSON.stringify(data, null, 2));
console.log(`✓ Baseline written: ${OUTPUT}`);

if (process.argv.includes('--compare')) compareBaselines(data);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@import url(fonts.googleapis.com)` in CSS | `next/font/google` self-hosting | Next.js 13.0 (stable 13.2) | No Google CDN roundtrip; automatic preload; fallback size-adjust |
| `pages/_app.js` `reportWebVitals()` export | `useReportWebVitals` hook in App Router | Next.js 13 App Router | Works in Server Component trees via client boundary isolation |
| Manual webpack-bundle-analyzer setup | `@next/bundle-analyzer` plugin | Stable across Next.js 13–16 | One-line plugin composition; generates three HTML reports |
| `font-display: swap` causes CLS | `adjustFontFallback: true` (default) uses `size-adjust` | Next.js 13.2+ | CLS ≈ 0 even with `display: 'swap'` because fallback metrics match custom font |

**Deprecated/outdated:**
- `pages/_app.js` `reportWebVitals()` export: Only works with Pages Router. App Router uses `useReportWebVitals` hook.
- `@next/font` package (external): Merged into `next/font` in Next.js 13.2. No separate installation needed.
- FID (First Input Delay): Replaced by INP (Interaction to Next Paint) as a Core Web Vital. The `web-vitals` library reports INP, not FID. Don't track FID for new baseline.

---

## Recommendations (Claude's Discretion Items)

### Font-Display Strategy: Use `swap` (not `optional`)

**Rationale:** `display: 'optional'` gives CLS=0 but risks the custom font never rendering on fast connections (the browser may commit to the fallback). For a branded PWA with a distinctive Ember Noir aesthetic, the custom fonts are part of the visual identity. `display: 'swap'` with `adjustFontFallback: true` achieves near-zero CLS while guaranteeing the custom font always appears.

**Confidence:** HIGH — `adjustFontFallback: true` is the Next.js default for this reason.

### Typeface Selection: Keep Outfit + Space Grotesk

**Rationale:** Both fonts are variable fonts available via `next/font/google`. Both fit the Ember Noir aesthetic — Outfit is geometric/modern for display, Space Grotesk has technical character for body text. No superior alternative was identified for this specific theme. Swapping typefaces introduces design risk with no performance benefit (both are variable fonts at comparable WOFF2 sizes).

**JetBrains Mono:** Currently referenced in CSS as `--font-mono: 'JetBrains Mono', ui-monospace, monospace` but NOT loaded from Google Fonts (only system/CDN fallback). Usage is limited to network/IP display, scheduler time bar, code blocks — low visibility. **Recommendation:** Leave JetBrains Mono as the system fallback stack for now (the `ui-monospace` fallback renders SF Mono/Cascadia on modern systems). A Phase 70+ decision to self-host JetBrains Mono via `next/font/local` is deferred — it adds complexity for a secondary display use.

### Baseline Storage: `.baseline/` directory with JSON + committed to git

**Rationale:** JSON is diffable in git, human-readable, and easy to parse in the comparison script. Storing in `.baseline/` at project root keeps it separate from `.next/` (gitignored) and `.planning/` (documentation). Committing the baseline file ensures all future phases can access the phase-70 reference without running the build.

**Format:** Each phase generates `phase-NN.json` with structure:
```json
{
  "phase": "70",
  "timestamp": "2026-02-18T...",
  "bundle": {
    "routes": { "/": 120000, "/stove": 185000 },  // First Load JS in bytes
    "shared": 85000
  },
  "lighthouse": {
    "performance": 72,
    "lcp": 2800,
    "fcp": 1200,
    "cls": 0.02,
    "inp": 180,
    "ttfb": 420
  }
}
```

**Lighthouse inclusion:** YES — include Lighthouse scores in the baseline even though they require a manual run against the deployed URL (Vercel preview). The baseline script captures bundle sizes automatically from `.next/build-manifest.json`; Lighthouse scores are added manually or via a separate `--lighthouse` flag.

### Web Vitals Dashboard Detail Level

**Recommendation:** Summary cards (5 metric cards, one per vital) + a 7-day sparkline trend chart per metric. This matches the existing `StatsCards` component pattern and integrates naturally with the existing analytics page layout. Full trend charts with historical data can be added in a future phase once enough data accumulates.

**Dashboard location:** New section at the bottom of `/analytics` page, after the existing stove usage charts. Section heading: "Web Performance". Always visible (not consent-gated — consistent with the always-collected nature of Web Vitals).

---

## Open Questions

1. **Lighthouse Automation**
   - What we know: Lighthouse CLI can run against a URL; generating baselines requires a deployed URL (Vercel preview)
   - What's unclear: Whether to run Lighthouse in CI (GitHub Actions) against Vercel preview deployments
   - Recommendation: For Phase 70, run Lighthouse manually once against the production deployment and record the scores in `.baseline/phase-70.json`. Automate in a future phase if needed.

2. **Web Vitals Historical Display**
   - What we know: The analytics dashboard exists; new section planned; Firebase RTDB stores vitals events
   - What's unclear: How much data will accumulate before a trend chart is meaningful (first day = no history)
   - Recommendation: Show "No data yet" state for trend charts, summary cards show "—" until first vital arrives. Cards appear immediately; charts activate once 7+ days of data exist.

3. **`@next/bundle-analyzer` TypeScript Named Import**
   - What we know: The package exports a function; TypeScript default import works in most cases
   - What's unclear: Whether `@next/bundle-analyzer@16.1.6` has proper ESM named export types
   - Recommendation: Use `import withBundleAnalyzer from '@next/bundle-analyzer'` — if TypeScript complains, add `// @ts-ignore` or use `createRequire` pattern.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (v16.1.6, last updated 2026-02-16): https://nextjs.org/docs/app/getting-started/fonts
- Next.js Font API Reference (v16.1.6): https://nextjs.org/docs/app/api-reference/components/font
- Next.js Analytics Guide (v16.1.6): https://nextjs.org/docs/app/guides/analytics
- Next.js Package Bundling Guide (v16.1.6): https://nextjs.org/docs/app/guides/package-bundling

### Secondary (MEDIUM confidence)
- web-vitals@4.2.4 package.json (installed in project) — confirms `onCLS`, `onFCP`, `onINP`, `onLCP`, `onTTFB` exports
- Space Grotesk Google Fonts page — confirms variable font (wght 300–700)
- Outfit Google Fonts — confirmed via @fontsource-variable/outfit npm listing (wght 100–900 variable)
- Codebase audit: globals.css, layout.tsx, analyticsEventLogger.ts, package.json — all read directly

### Tertiary (LOW confidence)
- GitHub discussions on `@next/bundle-analyzer` TypeScript ESM — recommended workaround patterns (unverified, marked for testing during implementation)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools are official Next.js or already-installed packages; versions verified from node_modules
- Architecture patterns: HIGH — font CSS variable pattern verified against existing globals.css; Web Vitals component pattern from official docs
- Pitfalls: HIGH for font/CSS variable pitfall (code audited directly); MEDIUM for bundle-analyzer TypeScript import (from community discussions)
- Baseline script: MEDIUM — Node.js fs + build-manifest.json parsing is straightforward; exact manifest format verified by pattern but not executed

**Research date:** 2026-02-18
**Valid until:** 2026-04-18 (60 days — stable APIs)
