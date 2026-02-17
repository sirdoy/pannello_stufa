# Technology Stack — Masonry Dashboard Layout

**Project:** Pannello Stufa — Home dashboard masonry layout
**Researched:** 2026-02-17
**Confidence:** HIGH

---

## Executive Summary

**NO NEW DEPENDENCIES REQUIRED.** A custom CSS Grid row-span approach using a lightweight
`useMasonryGrid` client hook is the correct solution for this project. It integrates cleanly
with the existing `Grid` component (CVA variant system), respects the Firebase-driven card
order, and requires zero package additions.

Every JS masonry library evaluated either (a) has SSR hydration issues with Next.js App Router,
(b) requires known aspect ratios up front (incompatible with dashboard cards with dynamic content),
(c) is unmaintained, or (d) ignores DOM order (breaking the user-configurable card order from
Firebase). CSS native masonry is 0% browser support in stable releases. CSS columns reorder
items vertically, which breaks the user-controlled left-to-right card order.

The winning approach: CSS Grid with `grid-auto-rows: 1px` on the container and `grid-row: span N`
computed client-side on each card after render. This is the same technique used in production
by Cruip and documented in Andy Barefoot's widely cited CSS-Tricks article. The hook is ~40 lines
of TypeScript and uses `ResizeObserver`, which is already used elsewhere in this project.

---

## Approach Comparison

### Option A — CSS Native Masonry (`grid-template-rows: masonry`)

| Factor | Assessment |
|--------|-----------|
| Browser support | **0% global** (caniuse, Feb 2026). Safari Tech Preview only. Blocked by ongoing spec debate (Firefox: grid-based, Chrome/Apple: `display: masonry`). |
| SSR | Would be pure CSS — no SSR issues if supported. |
| Card order | Preserves DOM order. |
| Integration | Would require no JS. |
| Verdict | **NOT VIABLE for production.** Not available in any stable browser. |

**Sources:** [caniuse — grid-template-rows: masonry](https://caniuse.com/mdn-css_properties_grid-template-rows_masonry),
[Chrome blog: Help us build CSS Masonry](https://developer.chrome.com/blog/masonry-update),
[WebKit blog: CSS masonry syntax](https://webkit.org/blog/16026/css-masonry-syntax/)

---

### Option B — CSS Columns (`column-count: 2`)

| Factor | Assessment |
|--------|-----------|
| Browser support | Universal. |
| SSR | Works — pure CSS. |
| Card order | **BROKEN.** Items flow column-first (top of col 1, top of col 2), not row-first. User's Firebase-ordered cards would appear in wrong visual sequence. |
| Integration | Replaces Grid component CSS entirely. |
| Verdict | **NOT VIABLE.** Card order is a hard requirement. CSS columns cannot produce left-to-right ordering without JS reordering, which defeats the purpose. |

**Source:** [CSS-Tricks: Piecing together masonry approaches](https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/)

---

### Option C — `react-masonry-css` (paulcollett)

| Factor | Assessment |
|--------|-----------|
| Version | 1.0.16 |
| Last published | **5 years ago** (2021). No updates since. |
| Approach | CSS flexbox columns. |
| SSR | Works (CSS-based). |
| Card order | **BROKEN** — same column-first flow as CSS columns. |
| Maintenance | Abandoned. |
| Verdict | **NOT VIABLE.** Unmaintained + breaks card order. |

**Source:** [react-masonry-css npm](https://www.npmjs.com/package/react-masonry-css)

---

### Option D — `react-responsive-masonry`

| Factor | Assessment |
|--------|-----------|
| Version | 2.7.1 |
| Last published | ~1 year ago. |
| Approach | CSS flexbox columns. |
| SSR | Known issues with Next.js App Router ([GitHub issue #127](https://github.com/cedricdelpoux/react-responsive-masonry/issues/127)). |
| Card order | **BROKEN** — column-first flow. |
| Verdict | **NOT VIABLE.** SSR issues + breaks card order. |

**Source:** [react-responsive-masonry npm](https://www.npmjs.com/package/react-responsive-masonry)

---

### Option E — `@masonry-grid/react`

| Factor | Assessment |
|--------|-----------|
| Version | Unknown (npm page not publicly accessible during research). |
| Size | 1.4 kB. |
| SSR | Compatible — CSS variables + transforms, no DOM restructuring. Renders with `opacity: 0` until hydrated. |
| Card order | Preserves DOM order (RegularMasonryGrid). |
| **BLOCKER** | `Frame` component requires explicit `width` and `height` aspect ratio props. Dashboard cards have dynamic content (StoveCard: status, temps, flame; NetworkCard: chart, device list) — **aspect ratios are unknown at render time**. |
| Verdict | **NOT VIABLE.** Requires known aspect ratios, incompatible with content-driven dashboard cards. |

**Source:** [@masonry-grid/react API](https://masonry-grid.js.org/api/react/),
[masonry-grid.js.org](https://masonry-grid.js.org/articles/masonry-grid-a-14-kb-library-that-actually-works/)

---

### Option F — CSS Grid Row Span (Custom Hook) — RECOMMENDED

| Factor | Assessment |
|--------|-----------|
| Dependencies | **Zero new dependencies.** |
| SSR | Safe — server renders standard CSS Grid (`grid-cols-2`), hook enhances client-side. Graceful degradation: without JS, cards render in standard 2-col grid with row alignment. |
| Card order | **Preserves DOM order exactly.** Cards remain in Firebase-ordered sequence. |
| Hydration | No mismatch — hook runs after hydration, modifies inline styles only. |
| Complexity | ~40 lines TypeScript, uses `ResizeObserver` (already in project). |
| Integration | Extends existing `Grid` component with a `masonry` variant. |
| Desktop-only | Can be conditioned on `sm:` breakpoint — mobile keeps standard `grid-cols-1`. |
| Verdict | **RECOMMENDED.** Only viable approach given constraints. |

**How it works:**
1. Container uses `grid-auto-rows: 1px` (1px implicit rows).
2. Each card item gets `grid-row: span N` where `N = Math.ceil(cardHeight / rowGap)`.
3. A `ResizeObserver` recalculates spans whenever content or window size changes.
4. `useEffect` fires after mount (client-only) — server sees standard grid markup.

**Sources:**
- [Andy Barefoot — CSS-Tricks masonry with CSS Grid](https://medium.com/@andybarefoot/a-masonry-style-layout-using-css-grid-8c663d355ebb)
- [CSS-Tricks: Making masonry that works today](https://css-tricks.com/making-a-masonry-layout-that-works-today/)
- [Cruip: True masonry with Next.js](https://cruip.com/how-to-create-a-true-masonry-with-nextjs/)

---

## Recommended Stack Addition

### New Variant in Grid Component

Add a `masonry` variant to the existing `gridVariants` CVA config:

```typescript
// app/components/ui/Grid.tsx — Add masonry variant
cols: {
  // ... existing 1-6 variants
  masonry: 'grid-cols-1 sm:grid-cols-2', // desktop: 2 columns
},
```

Add a `masonry` boolean prop or use `cols="masonry"` to signal the hook to activate.

### New Hook: `useMasonryGrid`

```typescript
// lib/hooks/useMasonryGrid.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Applies CSS Grid row-span masonry to a grid container.
 * Items retain their DOM order (preserves Firebase card ordering).
 * Server renders standard grid; client enhances with spans after hydration.
 *
 * @param enabled - Only activates at desktop breakpoints (pass false for mobile)
 * @param rowHeight - Implicit row height in px (default: 1)
 */
export function useMasonryGrid(enabled = true, rowHeight = 1) {
  const containerRef = useRef<HTMLDivElement>(null);

  const applyMasonry = useCallback(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    // Only activate above sm breakpoint (640px = Tailwind sm)
    if (window.innerWidth < 640) return;

    const rowGap = parseInt(getComputedStyle(container).rowGap) || 24;
    const items = Array.from(container.children) as HTMLElement[];

    items.forEach((item) => {
      const contentHeight = item.getBoundingClientRect().height;
      const spanValue = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
      item.style.gridRowEnd = `span ${spanValue}`;
    });
  }, [enabled, rowHeight]);

  useEffect(() => {
    if (!containerRef.current || !enabled) return;

    applyMasonry();

    const observer = new ResizeObserver(applyMasonry);
    const container = containerRef.current;

    // Observe container and each child for content changes
    observer.observe(container);
    Array.from(container.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [applyMasonry, enabled]);

  return containerRef;
}
```

### Integration with Home Page

```typescript
// app/page.tsx — No change needed (server component)
// The Grid component accepts className for masonry CSS:
<Grid
  cols={2}
  gap="lg"
  className="masonry-grid items-start"
  style={{ gridAutoRows: '1px' }}
>
  {visibleCards.map(...)}
</Grid>
```

Or preferably via a `MasonryGrid` wrapper client component that attaches the hook:

```typescript
// app/components/ui/MasonryGrid.tsx
'use client';

import { useMasonryGrid } from '@/lib/hooks/useMasonryGrid';
import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

interface MasonryGridProps {
  children: ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GAP_MAP = { sm: 16, md: 24, lg: 32 }; // Matches Grid gap variants

export default function MasonryGrid({ children, gap = 'lg', className }: MasonryGridProps) {
  const ref = useMasonryGrid(true, 1);

  return (
    <div
      ref={ref}
      style={{ gridAutoRows: '1px' }}
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 items-start',
        gap === 'sm' && 'gap-3 sm:gap-4',
        gap === 'md' && 'gap-4 sm:gap-5 lg:gap-6',
        gap === 'lg' && 'gap-6 sm:gap-8 lg:gap-10',
        className
      )}
    >
      {children}
    </div>
  );
}
```

---

## What NOT to Add

| Do NOT add | Reason |
|-----------|--------|
| `react-masonry-css` | Abandoned (5 years), breaks card order |
| `react-responsive-masonry` | SSR issues with Next.js App Router, breaks card order |
| `masonry-layout` (Desandro) | jQuery-era jQuery-like JS, not React-native, heavyweight |
| `@masonry-grid/react` | Requires known aspect ratios — incompatible with dynamic-content cards |
| `masonic` | Virtualizes list, overkill for 6 cards, breaks card order |
| CSS columns | Breaks Firebase-ordered card sequence |
| CSS native masonry | 0% stable browser support, spec debate ongoing |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Layout algorithm | CSS Grid row-span hook | CSS columns | Breaks left-to-right card order |
| Implementation | Custom `useMasonryGrid` hook | `react-masonry-css` | Unmaintained + order broken |
| Implementation | Custom `useMasonryGrid` hook | `@masonry-grid/react` | Requires aspect ratios |
| Browser native | N/A (future) | `grid-template-rows: masonry` | 0% stable support |
| Integration | New `MasonryGrid` client component | Modify Grid.tsx server component | Grid.tsx is server-compatible, masonry requires client |

---

## Installation

**No new packages.** Zero additions to `package.json`.

Files to create:
- `lib/hooks/useMasonryGrid.ts` — The masonry hook (~40 lines)
- `app/components/ui/MasonryGrid.tsx` — Client wrapper component

Files to modify:
- `app/page.tsx` — Replace `<Grid cols={2} gap="lg">` with `<MasonryGrid gap="lg">`
- `app/components/ui/__tests__/Grid.test.tsx` — Existing tests unaffected
- `lib/hooks/__tests__/useMasonryGrid.test.ts` — New tests for the hook

---

## SSR Behavior

The home page (`app/page.tsx`) is a server component (`export const dynamic = 'force-dynamic'`).
It renders `<MasonryGrid>` which is a `'use client'` component. Next.js App Router handles this
correctly: the server renders `MasonryGrid` as a static grid (no `gridAutoRows` effect without JS),
and the hook activates after hydration on the client.

There is no hydration mismatch because:
1. `gridAutoRows: '1px'` is set as inline style — server and client agree
2. `grid-row: span N` is applied by `useEffect` (client-only, after hydration)
3. Mobile stays `grid-cols-1` with no masonry (hook guards on `window.innerWidth < 640`)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| CSS native masonry rejection | HIGH | caniuse data: 0% stable support, verified Feb 2026 |
| CSS columns rejection | HIGH | Order problem is fundamental, well-documented |
| JS library rejections | HIGH | npm pages + GitHub issues verified for each |
| Custom hook recommendation | HIGH | Pattern proven by Cruip, CSS-Tricks, Smashing Magazine |
| ResizeObserver availability | HIGH | Already used in project (Phase 57 useAdaptivePolling) |
| SSR safety | HIGH | useEffect is client-only by definition, no hydration mismatch |
| Integration with existing Grid | HIGH | Grid.tsx is simple CVA wrapper, MasonryGrid is additive |

**Overall confidence: HIGH** — No new dependencies, established pattern, zero regression risk to existing Grid component.

---

## Sources

### PRIMARY (HIGH confidence)
- [caniuse: grid-template-rows masonry](https://caniuse.com/mdn-css_properties_grid-template-rows_masonry) — 0% stable support confirmed
- [Chrome Developers: Help us build CSS Masonry](https://developer.chrome.com/blog/masonry-update) — Chrome 140+ flag only
- [WebKit blog: CSS masonry syntax](https://webkit.org/blog/16026/css-masonry-syntax/) — Spec disagreement ongoing
- [react-responsive-masonry GitHub issue #127](https://github.com/cedricdelpoux/react-responsive-masonry/issues/127) — SSR issue with Next.js
- [Cruip: True masonry with Next.js](https://cruip.com/how-to-create-a-true-masonry-with-nextjs/) — Custom hook approach proven
- [CSS-Tricks: Making masonry that works today](https://css-tricks.com/making-a-masonry-layout-that-works-today/) — Grid row-span + JS polyfill
- [CSS-Tricks: Piecing together masonry approaches](https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/) — CSS columns order problem

### SECONDARY (MEDIUM confidence)
- [MDN: Masonry layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) — CSS spec status
- [@masonry-grid/react API](https://masonry-grid.js.org/api/react/) — Frame aspect ratio requirement confirmed
- [LogRocket: Responsive masonry in React](https://blog.logrocket.com/create-responsive-masonry-layouts-react-app/) — Library comparison
- [Smashing Magazine: Native CSS masonry in CSS Grid](https://www.smashingmagazine.com/native-css-masonry-layout-css-grid/) — Technique reference

### TERTIARY (LOW confidence — training data)
- None relied upon for recommendations.

---

## Metadata

**Research date:** 2026-02-17
**Valid until:** 2026-05-17 (90 days — CSS masonry spec unlikely to stabilize sooner)
**Milestone:** Masonry Dashboard Layout
**Dependencies added:** None
