# Architecture Patterns: Masonry Dashboard Layout

**Domain:** Dashboard masonry layout integration with existing CVA-based Grid component
**Researched:** 2026-02-17
**Milestone:** Masonry layout for home page dashboard

---

## Recommended Architecture

**Decision: Extend `Grid` with a `masonry` boolean prop using CSS `columns`.**

Do not create a separate `MasonryGrid` component. Do not use a JS-based masonry library.

**Rationale:**
- `app/page.tsx` is a Server Component (`async function Home()`). Any layout component it renders directly must be SSR-safe with no hydration.
- The Grid component is already the authoritative layout primitive. A masonry mode is a layout variant, not a different component.
- CSS `columns` (multi-column layout) is pure CSS, renders identically on server and client, produces zero hydration mismatch.
- With only 6 cards max, the column-flow order (top-to-bottom then next column) is acceptable — the `unifiedDeviceConfigService` already controls ordering via the `order` field.
- CSS Grid `grid-template-rows: masonry` is **experimental** (behind flags, not in any stable browser as of Feb 2026). Do not use it.
- JS-based libraries (`react-masonry-css`, `react-responsive-masonry`) require `'use client'`, DOM measurement via `getBoundingClientRect`, and `useEffect` — all incompatible with the Server Component boundary.

---

## Component Boundaries

| Component | Responsibility | Change Required | Communicates With |
|-----------|---------------|-----------------|-------------------|
| `app/components/ui/Grid.tsx` | Layout container | ADD `masonry?: boolean` prop, branch render | `app/page.tsx` |
| `app/page.tsx` | Dashboard orchestration | CHANGE `<Grid cols={2}>` to `<Grid masonry gap="lg">` | Grid component |
| `app/components/ui/__tests__/Grid.test.tsx` | Grid unit tests | ADD masonry prop rendering tests | Grid component |
| Card wrapper `<div>` in page.tsx | Animation host | ADD `break-inside-avoid mb-*` classes | — |

No new files are required. No new dependencies are required.

---

## Data Flow for Card Ordering

Card ordering is already managed server-side:

```
Firebase (deviceConfig.order) → getVisibleDashboardCards() → visibleCards[] → page.tsx map → Grid
```

CSS `columns` renders items in source order, flowing top-to-bottom within each column. The existing `order` field in `unifiedDeviceConfigService` controls which cards appear and in what sequence. This is sufficient — no client-side reordering is needed.

**Note on layout behavior:** With CSS columns and 2 columns, cards are distributed like this:
- Column 1: card 0, card 2, card 4 (browser places items top-down, then fills next column)
- Column 2: card 1, card 3, card 5

This is different from CSS Grid's row-first placement. If cards have equal heights, the result is visually equivalent to the existing grid. If cards have variable heights (StoveCard vs WeatherCard), CSS columns automatically fills gaps — this is the masonry effect.

---

## Implementation Pattern

### Grid Component Extension

Add `masonry` as a boolean prop to `Grid`. When `masonry` is true, bypass CVA and render CSS multi-column classes instead.

```typescript
// app/components/ui/Grid.tsx — minimal change
export interface GridProps extends HTMLAttributes<HTMLElement>, VariantProps<typeof gridVariants> {
  children: ReactNode;
  as?: ElementType;
  masonry?: boolean;  // NEW
}

export default function Grid({
  cols = 3,
  gap = 'md',
  masonry = false,
  children,
  className = '',
  as: Component = 'div',
  ...props
}: GridProps) {
  if (masonry) {
    // CSS columns layout — SSR-safe, no hydration issues
    const gapClass = {
      none: '',
      sm: 'gap-3 sm:gap-4',
      md: 'gap-4 sm:gap-5 lg:gap-6',
      lg: 'gap-6 sm:gap-8 lg:gap-10',
    }[gap ?? 'md'];

    return (
      <Component
        className={cn('columns-1 sm:columns-2', gapClass, className)}
        {...props}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component className={cn(gridVariants({ cols, gap }), className)} {...props}>
      {children}
    </Component>
  );
}
```

### Card Wrapper Update in page.tsx

The card wrapper `<div>` needs two additions:

1. `break-inside-avoid` — prevents a card from splitting across column boundaries
2. `mb-*` — provides vertical spacing between stacked cards in the same column (CSS columns does not use `gap` for row spacing)

```tsx
// app/page.tsx
<div
  key={card.id}
  className="animate-spring-in break-inside-avoid mb-6 sm:mb-8 lg:mb-10"
  style={{ animationDelay: `${index * 100}ms` }}
>
```

Match `mb-*` values to the `gap="lg"` variant: `mb-6 sm:mb-8 lg:mb-10`.

### Usage in page.tsx

```tsx
// Before:
<Grid cols={2} gap="lg">
  {visibleCards.map((card, index) => (
    <div
      key={card.id}
      className="animate-spring-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <DeviceCardErrorBoundary ...>
        <CardComponent />
      </DeviceCardErrorBoundary>
    </div>
  ))}
</Grid>

// After:
<Grid masonry gap="lg">
  {visibleCards.map((card, index) => (
    <div
      key={card.id}
      className="animate-spring-in break-inside-avoid mb-6 sm:mb-8 lg:mb-10"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <DeviceCardErrorBoundary ...>
        <CardComponent />
      </DeviceCardErrorBoundary>
    </div>
  ))}
</Grid>
```

---

## SSR and Hydration Analysis

### Why CSS Columns is Hydration-Safe

CSS `columns` layout is resolved entirely by the browser's CSS engine. The server renders HTML with `columns-1 sm:columns-2` Tailwind classes. The client receives identical HTML and applies identical CSS. There is no JavaScript measurement step, no DOM read after mount, and no layout recalculation — therefore no hydration mismatch is possible.

### Approach Comparison

| Approach | SSR HTML | Client render | Hydration risk | Notes |
|----------|----------|---------------|---------------|-------|
| CSS `columns` (recommended) | Identical | Identical | None | Pure CSS |
| CSS Grid `masonry` value | Regular grid fallback | Regular grid fallback | None | Experimental, no browser support |
| `react-masonry-css` | Single column | Multi-column with JS | HIGH — mismatch inevitable | Requires `'use client'` |
| `react-responsive-masonry` | No columns | Measures and reorders | HIGH — mismatch inevitable | Requires `'use client'` |
| Custom `useMasonry` hook | Grid layout | JS adjusts margins | MEDIUM — brief layout shift | Requires `'use client'` |

### The Server Component Constraint

`app/page.tsx` is an `async` Server Component. It cannot use React hooks. Any layout mechanism that requires client-side measurement must be in a separate `'use client'` component. Adding a client boundary just for masonry layout would force all 6 device card components into the client bundle unnecessarily and destroy the Server Component rendering benefits for the page shell.

CSS `columns` requires no client boundary and no changes to the Server Component/Client Component split.

### Animation Compatibility

The existing `animate-spring-in` with `animationDelay` via inline style is CSS-driven and applies to the item wrapper `<div>`. It is fully compatible with CSS columns — animations fire on the wrapper element regardless of which column the browser places it in.

With CSS columns and 2 columns, animation order follows source order (card 0 at 0ms, card 1 at 100ms, etc.), but visual placement is column-first (card 0 in column 1 top, card 1 in column 2 top). The staggered spring animation still looks correct — each card animates in sequence as the browser renders the page.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate MasonryGrid Component

**What:** Create `app/components/ui/MasonryGrid.tsx` as a new component separate from `Grid`.

**Why bad:** Duplicates the Grid API surface. Callers must choose between two layout primitives for what is semantically the same thing. Future grid features must be maintained in two places.

**Instead:** Add `masonry` boolean prop to existing `Grid`. Masonry is a layout mode, not a different component.

### Anti-Pattern 2: JS-based Library with Client Boundary

**What:** Wrap `<Grid>` in a `'use client'` component that uses `react-masonry-css` or `react-responsive-masonry`.

**Why bad:** Forces client-side JS for layout on a page that is otherwise a Server Component. Creates a client boundary that prevents `getVisibleDashboardCards()` server-side optimization from reaching the grid render. Causes hydration mismatch (server renders one-column, client recalculates positions).

**Instead:** CSS `columns` requires no client boundary.

### Anti-Pattern 3: CSS Grid Masonry Value

**What:** Use `grid-template-rows: masonry` via a custom CSS class (e.g., add to `globals.css`).

**Why bad:** Experimental spec, not in any stable browser as of early 2026. It silently falls back to regular grid for all users. Adds dead CSS that provides no benefit in production.

**Instead:** CSS `columns` achieves the visual masonry effect and is universally supported.

### Anti-Pattern 4: Missing `break-inside-avoid`

**What:** Use `overflow-hidden` on card wrappers without `break-inside-avoid`.

**Why bad:** `overflow-hidden` does not prevent column breaks. Without `break-inside-avoid`, cards with tall content (StoveCard with maintenance bar, NetworkCard with bandwidth chart) will visually split across columns — top half in column 1, bottom half in column 2.

**Instead:** Add `break-inside-avoid` (Tailwind utility for `break-inside: avoid`) to every item wrapper `<div>` in the masonry grid.

### Anti-Pattern 5: Using `gap` for Item Spacing in Masonry Mode

**What:** Rely on CSS `gap` for vertical spacing between items in the same column.

**Why bad:** CSS `columns` supports `column-gap` (horizontal gap between columns) but not row gaps between items within a column. The `gap` utility in Tailwind maps to `row-gap` and `column-gap` for CSS Grid, but in a `columns` layout, only the column gap applies. Vertical spacing requires `margin-bottom` on the item wrappers.

**Instead:** Add `mb-*` to item wrapper divs. Remove top-level `gap` from masonry container or accept that only the column-gap portion applies.

---

## Scalability Considerations

| Concern | Current (6 cards) | Future (12+ cards) | Approach |
|---------|-------------------|--------------------|---------|
| Column count | `columns-1 sm:columns-2` | Add `lg:columns-3` | Tailwind utility, no JS |
| Card ordering | Source order (Firebase `order` field) | Source order | No change needed |
| Variable heights | Handled automatically by CSS columns | Same | Scales without JS |
| Animation stagger | 100ms * 6 = 600ms total | May need `--stagger-slow` | CSS token already defined |
| Performance | Zero JS overhead | Zero JS overhead | Pure CSS scales linearly |

---

## Integration Points Summary

| Integration Point | Action | File | Risk |
|-------------------|--------|------|------|
| `Grid` props interface | Add `masonry?: boolean` | `Grid.tsx` | LOW — additive change |
| `Grid` render logic | Branch on `masonry` prop | `Grid.tsx` | LOW — isolated branch |
| `Grid` tests | Add 3-4 masonry variant tests | `Grid.test.tsx` | LOW — existing tests unaffected |
| Dashboard grid | Change `cols={2}` to `masonry` | `app/page.tsx` | LOW — single prop change |
| Card wrapper | Add `break-inside-avoid mb-*` | `app/page.tsx` | LOW — additive class |
| CSS / design system | No changes | — | None |
| New dependencies | None required | — | None |

---

## Sources

- [MDN: CSS Masonry Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) — confirms experimental status, no stable browser support (LOW confidence for production use)
- [Tailwind CSS: Columns utility](https://tailwindcss.com/docs/columns) — `columns-*` utilities exist in Tailwind v4 (HIGH confidence)
- [Cruip: Masonry Layouts with Tailwind CSS](https://cruip.com/masonry-layouts-with-tailwind-css/) — CSS columns approach confirmed SSR-safe (MEDIUM confidence)
- [Cruip: True Masonry with Next.js](https://cruip.com/how-to-create-a-true-masonry-with-nextjs/) — JS hook approach confirmed requires `'use client'` (MEDIUM confidence)
- [Smashing Magazine: Masonry in CSS 2025](https://www.smashingmagazine.com/2025/05/masonry-css-should-grid-evolve-stand-aside-new-module/) — native CSS masonry not production-ready (MEDIUM confidence)
- Codebase: `app/page.tsx`, `app/components/ui/Grid.tsx`, `app/globals.css`, `package.json` — direct analysis (HIGH confidence)
